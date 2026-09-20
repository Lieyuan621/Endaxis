/** 将 Buff 生命周期与周期触发进度共同保存，验证结束分支、暂停分支和同步结束顺序。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { createBuffLifecycleState } from '../state/instanceState';
import {
  advanceBuffTriggers,
  finishBuffLifecycle,
  tickBuffLifecycle,
  type BuffFinishHost,
} from './buffLifecycleExecution';

function createSession() {
  return new StateStepper(
    {
      life: {
        ...createBuffLifecycleState(),
        enabled: true,
        started: true,
        remainingDuration: 0.25,
      },
      trigger: { intervalSeconds: 0.1, remainingSeconds: 0.1, remainingCount: -1 },
      events: [] as string[],
    },
    (step, input: 'tick' | 'pause' | 'resume' | 'finish') => {
      const state = step.state;
      const host: BuffFinishHost = {
        addExtendTags: () => {
          state.events.push('extended');
        },
        finishAction: () => {
          state.events.push(`finish:${state.life.enabled}`);
        },
        endDuringEnable: () => {
          state.events.push('actionEnd');
        },
        finishChildren: () => {
          state.events.push(`children:${state.life.finished}`);
        },
        removeExtendTags: () => {},
        refreshStacking: () => {},
        unregisterModifiers: () => {
          state.events.push('unregister');
        },
        notifyFinished: () => {
          state.events.push(`notify:${state.life.finishing}`);
        },
      };
      if (input === 'pause') state.life.timePaused = true;
      else if (input === 'resume') state.life.timePaused = false;
      else if (input === 'finish') finishBuffLifecycle(state.life, 'other', host);
      else
        tickBuffLifecycle(state.life, 0.1, {
          trigger: delta =>
            advanceBuffTriggers(state.trigger, delta, {
              isEnabled: () => state.life.enabled,
              trigger: () => {
                state.events.push('trigger');
              },
            }),
          tickDuringEnable: () => {},
          canTimedGrow: () => false,
          growTimed: () => false,
          finishLifetime: () => {
            finishBuffLifecycle(state.life, 'lifetime', host);
          },
        });
    },
  );
}

describe('Buff lifecycle data', () => {
  it('restores trigger phase and remaining duration after finishing another branch', () => {
    const session = createSession();
    session.step('tick');
    const running = session.save();
    session.step('finish');
    const finished = session.save();
    expect(session.read().events).toEqual([
      'trigger',
      'finish:true',
      'actionEnd',
      'children:true',
      'unregister',
      'notify:false',
    ]);
    session.restore(running);
    session.step('pause');
    const paused = session.read();
    session.step('tick');
    expect(session.read()).toEqual(paused);
    session.step('resume');
    session.step('tick');
    session.step('tick');
    expect(session.read().life.finishReason).toBe('lifetime');
    const fresh = createSession();
    fresh.step('tick');
    fresh.step('tick');
    fresh.step('tick');
    expect(session.read()).toEqual(fresh.read());
    session.restore(finished);
    const before = session.read();
    session.step('tick');
    expect(session.read()).toEqual(before);
  });

  it('keeps a synchronous nested finish from running cleanup twice', () => {
    const state = createBuffLifecycleState();
    state.enabled = true;
    let finishes = 0;
    const host: BuffFinishHost = {
      addExtendTags: () => {},
      finishAction: () => {
        finishes++;
        expect(finishBuffLifecycle(state, 'early', host)).toBe(false);
      },
      endDuringEnable: () => {},
      finishChildren: () => {},
      removeExtendTags: () => {},
      refreshStacking: () => {},
      unregisterModifiers: () => {},
      notifyFinished: () => {},
    };
    expect(finishBuffLifecycle(state, 'other', host)).toBe(true);
    expect(finishes).toBe(1);
    expect(state.finishReason).toBe('other');
  });
});
