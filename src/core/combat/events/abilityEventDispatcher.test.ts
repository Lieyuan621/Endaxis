import { describe, expect, it } from 'vitest';
import { AbilityEventDispatcher } from './abilityEventDispatcher';

describe('AbilityEventDispatcher', () => {
  it('复制目录后按原编号恢复回调，保留顺序且旧句柄不影响新目录', () => {
    const original = new AbilityEventDispatcher<'hit', { hit: number }>();
    const first = original.registerAction('hit', 5, () => {});
    const second = original.registerAction('hit', 5, () => {});
    const saved = structuredClone({
      state: original.runtimeState,
      references: [...first.subscriptions, ...second.subscriptions],
    });
    expect(saved.references[0]!.state).toBe(saved.state);
    const restored = new AbilityEventDispatcher<'hit', { hit: number }>(saved.state);
    expect(() => restored.dispatch({ event: 'hit', payload: 3 }, [])).toThrow('is not bound');
    const calls: string[] = [];
    // 绑定顺序与注册顺序相反，不能因此改变原来的执行顺序。
    restored.bindSubscription(saved.references[1]!, () => calls.push('second'));
    const rebound = restored.bindSubscription(saved.references[0]!, event =>
      calls.push(`first:${event.payload}`),
    );
    expect(saved.state.nextRegistrationId).toBe(2);
    expect(() => restored.bindSubscription(saved.references[0]!, () => {})).toThrow(
      'already bound',
    );
    expect(() => restored.bindSubscription(first.subscriptions[0]!, () => {})).toThrow(
      'another state',
    );
    first.dispose();
    restored.dispatch({ event: 'hit', payload: 3 }, []);
    expect(calls).toEqual(['first:3', 'second']);
    rebound.dispose();
    expect(() => restored.bindSubscription(saved.references[0]!, () => {})).toThrow('is missing');
    calls.length = 0;
    restored.dispatch({ event: 'hit', payload: 4 }, []);
    expect(calls).toEqual(['second']);
  });

  it('持久订阅与临时监听共享阶段，并在阶段开始时取得快照', () => {
    const dispatcher = new AbilityEventDispatcher<'hit', { hit: number }>();
    const calls: string[] = [];
    const event = { event: 'hit' as const, payload: 1 };
    dispatcher.registerCallback('hit', context => {
      expect(context).toBe(event);
      calls.push('callback');
      dispatcher.registerListener('hit', 'skill', current => {
        expect(current).toBe(event);
        calls.push('skill-late');
      });
    });
    dispatcher.registerAction('hit', 20, () => calls.push('action'));
    const skill = dispatcher.registerListener('hit', 'skill', () => calls.push('skill'));
    const combo = dispatcher.registerListener('hit', 'combo', current => {
      expect(current).toBe(event);
      calls.push('combo');
    });
    dispatcher.dispatch(event, []);
    expect(calls).toEqual(['callback', 'action', 'skill', 'skill-late', 'combo']);
    skill.dispose();
    combo.dispose();
    skill.dispose();
    calls.length = 0;
    dispatcher.dispatch(event, []);
    expect(calls).toEqual(['callback', 'action', 'skill-late', 'skill-late']);
  });

  it('uses the confirmed callback, data-action, skill, and combo phase order', () => {
    const events: string[] = [];
    const dispatcher = new AbilityEventDispatcher<'hit', { hit: number }>();
    dispatcher.registerCallback('hit', () => events.push('callback'));
    dispatcher.registerAction('hit', 10, () => events.push('action-low'));
    dispatcher.registerAction('hit', 20, () => events.push('action-high'));

    dispatcher.dispatch(
      { event: 'hit', payload: 1 },
      [
        { onAbilityEvent: () => events.push('skill-1') },
        { onAbilityEvent: () => events.push('skill-2') },
      ],
      { onAbilityEvent: () => events.push('combo') },
    );

    expect(events).toEqual([
      'callback',
      'action-high',
      'action-low',
      'skill-1',
      'skill-2',
      'combo',
    ]);
  });

  it('dispatches from snapshots when a callback mutates registration', () => {
    const events: string[] = [];
    const dispatcher = new AbilityEventDispatcher<'event'>();
    dispatcher.registerCallback('event', () => {
      events.push('first');
      dispatcher.registerCallback('event', () => events.push('late'));
    });

    dispatcher.dispatch({ event: 'event', payload: undefined }, []);
    dispatcher.dispatch({ event: 'event', payload: undefined }, []);

    expect(events).toEqual(['first', 'first', 'late']);
  });

  it('keeps a disposed callback in the current snapshot and removes it from later events', () => {
    const events: string[] = [];
    const dispatcher = new AbilityEventDispatcher<'event'>();
    let secondRegistration: { dispose(): void };
    dispatcher.registerCallback('event', () => {
      events.push('first');
      secondRegistration.dispose();
    });
    secondRegistration = dispatcher.registerCallback('event', () => events.push('second'));

    dispatcher.dispatch({ event: 'event', payload: undefined }, []);
    dispatcher.dispatch({ event: 'event', payload: undefined }, []);

    expect(events).toEqual(['first', 'second', 'first']);
  });

  it('disposes registered actions idempotently', () => {
    const events: string[] = [];
    const dispatcher = new AbilityEventDispatcher<'event'>();
    const registration = dispatcher.registerAction('event', 10, () => events.push('action'));

    dispatcher.dispatch({ event: 'event', payload: undefined }, []);
    registration.dispose();
    registration.dispose();
    dispatcher.dispatch({ event: 'event', payload: undefined }, []);

    expect(events).toEqual(['action']);
  });

  it('uses descending priority and stable registration order for equal priorities', () => {
    const events: string[] = [];
    const dispatcher = new AbilityEventDispatcher<'event'>();
    dispatcher.registerAction('event', -1, () => events.push('low'));
    dispatcher.registerAction('event', 7, () => events.push('equal:first'));
    dispatcher.registerAction('event', 7, () => events.push('equal:second'));
    dispatcher.registerAction('event', 20, () => events.push('high'));

    dispatcher.dispatch({ event: 'event', payload: undefined }, []);

    expect(events).toEqual(['high', 'equal:first', 'equal:second', 'low']);
  });
});
