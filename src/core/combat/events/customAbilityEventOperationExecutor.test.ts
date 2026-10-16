import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CustomAbilityEventOperationExecutor } from './customAbilityEventOperationExecutor';
import type { CombatOperationExecutor } from '../skills/skillRuntime';

describe('CustomAbilityEventOperationExecutor', () => {
  it('snapshots receivers before synchronous callbacks and skips source lookup for an empty group', () => {
    const receivers = [
      { kind: 'abilityEntity' as const, instanceId: 2 },
      { kind: 'abilityEntity' as const, instanceId: 3 },
    ];
    const queryTargets = vi.fn((query: { kind: string }) =>
      query.kind === 'context' ? receivers : [{ kind: 'operator' as const, operatorId: 'si' }],
    );
    const emit = vi.fn((_ownerId: string, _payload: unknown) => {
      receivers.length = 0;
    });
    const executor = new CustomAbilityEventOperationExecutor({
      sourceId: 'si',
      queryTargets,
      emit,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const step = {
      kind: 'triggerCustomAbilityEvent' as const,
      parameters: {
        eventName: 'yichuline1',
        eventParam: 0,
        target: { kind: 'context' as const, key: 'moying1' },
        source: { kind: 'source' as const },
      },
    };
    const context = { blackboard: new ActionBlackboard() };
    expect(executor.execute(step, context)).toBe(true);
    expect(emit.mock.calls.map(args => args[0])).toEqual(['ability-entity:2', 'ability-entity:3']);
    expect(emit).toHaveBeenLastCalledWith('ability-entity:3', {
      sourceId: 'si',
      targetId: 'ability-entity:3',
      eventName: 'yichuline1',
      eventParam: 0,
    });
    queryTargets.mockClear();
    expect(executor.execute(step, context)).toBe(true);
    expect(queryTargets).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it('publishes the strict caster-to-caster payload synchronously', () => {
    const emit = vi.fn();
    const delegate: CombatOperationExecutor = {
      execute: () => false,
      evaluate: () => false,
    };
    const executor = new CustomAbilityEventOperationExecutor({
      sourceId: 'liino',
      emit,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'triggerCustomAbilityEvent',
          parameters: {
            eventName: 'liino_comboskill_end',
            eventParam: 0,
            target: 'caster',
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(emit).toHaveBeenCalledWith('liino', {
      sourceId: 'liino',
      targetId: 'liino',
      eventName: 'liino_comboskill_end',
      eventParam: 0,
    });
  });

  it('preserves an AbilityEntity ActionOwner as the event source', () => {
    const emit = vi.fn();
    const executor = new CustomAbilityEventOperationExecutor({
      sourceId: 'arcane',
      emit,
      delegate: { execute: () => false, evaluate: () => false },
    });

    expect(
      executor.execute(
        {
          kind: 'triggerCustomAbilityEvent',
          parameters: {
            eventName: 'lizhiyan_combo_normal_end',
            eventParam: 0,
            target: 'caster',
            source: 'currentAbilityEntity',
          },
        },
        {
          blackboard: new ActionBlackboard(),
          actionOwnerAbilityEntity: { kind: 'abilityEntity', instanceId: 7 },
        },
      ),
    ).toBe(true);
    expect(emit).toHaveBeenCalledWith('arcane', {
      sourceId: 'ability-entity:7',
      targetId: 'arcane',
      eventName: 'lizhiyan_combo_normal_end',
      eventParam: 0,
    });
  });
});
