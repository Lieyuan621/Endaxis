import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CustomAbilityEventOperationExecutor } from './customAbilityEventOperationExecutor';
import type { CombatOperationExecutor } from '../skills/skillRuntime';

describe('CustomAbilityEventOperationExecutor', () => {
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
