import { expect, it, vi } from 'vitest';
import type { CompiledEquipmentContribution } from '../../../compiler/compileEquipment';
import { AbilityEventDispatcher } from '../../events/abilityEventDispatcher';
import type { AbilityEventPayloadMap } from '../../events/combatAbilityEvent';
import type { AbilityEvent } from '../../../../../packages/game-data-contract/src/abilityEvents';
import { bindRestoredCombatOperatorEquipment } from './combatOperatorEquipmentRestoration';
import { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import { EquipmentEventRuntime } from '../../abilities/equipmentEventRuntime';

const contribution: CompiledEquipmentContribution = {
  source: { kind: 'weaponTrait', slug: 'weapon', traitKey: 'trait' },
  selectedLevel: 1,
  modifiers: [],
  eventHandlers: [
    {
      key: 'gain',
      abilityEvent: 'skillSpGained',
      sequence: {
        steps: [
          {
            kind: 'changeResource',
            parameters: { resource: 'sp', amount: 1, recipient: 'team' },
          },
        ],
      },
    },
  ],
};

it('恢复装备来源时按原订阅响应，并只解析一次子 Buff', () => {
  const originalDispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>();
  const original = new EquipmentEventRuntime(
    new CombatSemanticEventRuntime(),
    'operator',
    [contribution],
    () => ({ execute: () => true, evaluate: () => true }),
    (_ownerId, event, priority, handle) =>
      originalDispatcher.registerAction(event, priority, published => handle(published)),
  );
  original.enable(0);
  original.addChildBuff(0, {
    isRecycled: false,
    reference: { ownerId: 'operator', instanceId: 8 },
    finish: () => true,
  });
  const copied = structuredClone({
    equipment: original.runtimeState,
    events: originalDispatcher.runtimeState,
  });
  const restoredDispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>(
    copied.events,
  );
  let executions = 0;
  const restored = bindRestoredCombatOperatorEquipment({
    operatorId: 'operator',
    contributions: [contribution],
    state: copied.equipment,
    semanticEvents: new CombatSemanticEventRuntime(),
    createExecutor: () => ({
      execute: () => {
        executions += 1;
        return true;
      },
      evaluate: () => true,
    }),
    registerAbilityEventAction: (_ownerId, event, _priority, handle, subscriptions) => {
      if (subscriptions === undefined) throw new Error('restore requires subscriptions');
      return restoredDispatcher.bindSubscriptionFor(event, subscriptions[0]!, published =>
        handle(published),
      );
    },
  });
  const finish = vi.fn(() => true);
  const resolve = vi.fn((reference: { ownerId: string; instanceId: number }) => ({
    isRecycled: false,
    reference,
    finish,
  }));
  restored.bindRestoredChildren(resolve);
  restoredDispatcher.dispatch(
    {
      event: 'skillSpGained',
      payload: {
        sourceOperatorId: 'operator',
        source: 'skill',
        gainKind: 'gain',
        requestedAmount: 1,
        amount: 1,
      },
    },
    [],
  );

  expect(restored.runtime.runtimeState).toBe(copied.equipment);
  expect(restored.runtime.blackboardFor(0).runtimeState).toBe(
    copied.equipment.contributions.get(0)!.blackboard,
  );
  expect(resolve).toHaveBeenCalledOnce();
  expect(executions).toBe(1);
  restored.runtime.dispose();
  expect(finish).toHaveBeenCalledExactlyOnceWith('other', null);
  original.dispose();
});
