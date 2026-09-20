import { createTestBuffReference } from '../buffs/buffTestFixtures';
import { buffReferenceKey } from '../buffs/buffReference';
import { expect, it, vi } from 'vitest';
import { AbilityEventHostLifecycle } from './abilityEventHostLifecycle';
import { AbilityEventDispatcher } from '../events/abilityEventDispatcher';

it('reports failures only after attempting all remaining unregister and child cleanup', () => {
  const host = new AbilityEventHostLifecycle();
  const first = new Error('unregister');
  const second = new Error('child');
  const order: string[] = [];
  host.register({
    dispose: () => {
      throw first;
    },
  });
  host.register({
    dispose: () => {
      order.push('unregister');
    },
  });
  host.onDisable(() => {
    order.push('cleanup');
  });
  host.addChildBuff({
    isRecycled: false,
    reference: createTestBuffReference(),
    finish: () => {
      host.addChildBuff({
        isRecycled: false,
        reference: createTestBuffReference(),
        finish: () => {
          order.push('late');
          return true;
        },
      });
      throw second;
    },
  });
  host.enable();
  let caught: unknown;
  try {
    host.dispose();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(AggregateError);
  expect((caught as AggregateError).errors).toEqual([first, second]);
  expect(order).toEqual(['unregister', 'cleanup', 'late']);
  expect(host.canExecuteAction).toBe(false);
  expect(() => host.dispose()).not.toThrow();
});

it('unregisters then cleans the enabled host, including children created by cleanup', () => {
  const host = new AbilityEventHostLifecycle();
  const order: string[] = [];
  host.register({ dispose: () => order.push('unregister') });
  const late = {
    isRecycled: false,
    reference: createTestBuffReference(),
    finish: vi.fn(() => {
      order.push('late');
      return true;
    }),
  };
  host.addChildBuff({
    isRecycled: false,
    reference: createTestBuffReference(),
    finish: () => {
      order.push('child');
      expect(host.canExecuteAction).toBe(true);
      expect(host.acceptsEvents).toBe(false);
      host.dispose();
      host.addChildBuff(late);
      return true;
    },
  });
  host.onDisable(() => order.push('cleanup'));
  host.enable();
  host.dispose();
  host.dispose();
  expect(order).toEqual(['unregister', 'cleanup', 'child', 'late']);
  expect(late.finish).toHaveBeenCalledWith('other', null);
  expect(host.canExecuteAction).toBe(false);
  expect(() => host.enable()).toThrow('disposed');
  expect(() => host.addChildBuff(late)).toThrow('disposed');
});

it('can release a failed initialization before enable without enabling its actions', () => {
  const host = new AbilityEventHostLifecycle();
  const finish = vi.fn(() => {
    expect(host.canExecuteAction).toBe(false);
    return true;
  });
  host.addChildBuff({ isRecycled: false, reference: createTestBuffReference(), finish });
  host.dispose();
  expect(finish).toHaveBeenCalledOnce();
});

it('stores subscription and child identities without storing their runtime objects', () => {
  const dispatcher = new AbilityEventDispatcher<'changed'>();
  const host = new AbilityEventHostLifecycle();
  const registration = dispatcher.registerAction('changed', 3, () => {});
  const child = {
    isRecycled: false,
    reference: { ownerId: 'owner', instanceId: 7 },
    finish: vi.fn(() => true),
  };
  host.register(registration);
  host.addChildBuff(child);
  host.enable();

  expect(host.runtimeState).toEqual({
    enabled: true,
    disposed: false,
    registrations: [registration.subscriptions],
    childBuffs: [child.reference],
  });
  expect(host.runtimeState.registrations[0]).not.toBe(registration.subscriptions);
  expect(host.runtimeState.childBuffs[0]).toEqual(child.reference);
});

it('forgets a child Buff that finishes while its Ability host remains enabled', () => {
  const host = new AbilityEventHostLifecycle();
  const finish = vi.fn(() => true);
  let notifyFinished: (() => void) | undefined;
  host.addChildBuff({
    isRecycled: false,
    reference: { ownerId: 'owner', instanceId: 7 },
    finish,
    bindFinishedCallback: callback => {
      notifyFinished = callback;
      return { dispose: vi.fn() };
    },
  });

  notifyFinished!();

  expect(host.runtimeState.childBuffs).toEqual([]);
  host.dispose();
  expect(finish).not.toHaveBeenCalled();
});

it('binds restored subscriptions and child Buffs without changing saved data', () => {
  const dispatcher = new AbilityEventDispatcher<'changed'>();
  const original = new AbilityEventHostLifecycle();
  const registration = dispatcher.registerAction('changed', 3, () => {});
  const reference = { ownerId: 'owner', instanceId: 7 };
  original.register(registration);
  original.addChildBuff({ isRecycled: false, reference, finish: () => true });
  original.enable();

  const state = structuredClone({ host: original.runtimeState, events: dispatcher.runtimeState });
  const restoredDispatcher = new AbilityEventDispatcher(state.events);
  const restored = new AbilityEventHostLifecycle(state.host);
  const rebound = restoredDispatcher.bindSubscriptionFor(
    'changed',
    state.host.registrations[0]![0]!,
    () => {},
  );
  restored.bindRestoredRegistration(rebound);
  const finish = vi.fn(() => true);
  restored.bindRestoredChildren(saved =>
    buffReferenceKey(saved) === buffReferenceKey(reference)
      ? { isRecycled: false, reference: saved, finish }
      : undefined,
  );

  expect(restored.acceptsEvents).toBe(true);
  expect(state.host.registrations).toHaveLength(1);
  expect(state.host.childBuffs).toEqual([reference]);
  restored.dispose();
  expect(finish).toHaveBeenCalledWith('other', null);
  expect(state.host).toEqual({
    enabled: false,
    disposed: true,
    registrations: [],
    childBuffs: [],
  });
});
