import { expect, it, vi } from 'vitest';
import type {
  CompiledOperatorPassiveProgram,
  ResolvedAbilityEntityDefinition,
} from '../../../compiler/combatProgram';
import { AbilityEventDispatcher } from '../../events/abilityEventDispatcher';
import type { AbilityEventPayloadMap } from '../../events/combatAbilityEvent';
import type { AbilityEvent } from '../../../../../packages/game-data-contract/src/abilityEvents';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../../actions/combatActionSequenceRuntime';
import { createCombatOperationHostState } from '../../state/actionState';
import { CombatOperationPrograms } from '../../actions/combatOperationPrograms';
import { bindRestoredCombatAbilityEntityPassives } from './combatAbilityEntityPassiveRestoration';
import { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import { PassiveAbilityEventRuntime } from '../../abilities/passiveAbilityEventRuntime';
import type { CombatOperationContext } from '../../skills/skillRuntime';

const passive: CompiledOperatorPassiveProgram = {
  key: 'entity-passive',
  initialBlackboard: {},
  enableSequence: { steps: [] },
  abilityEventResponses: [
    {
      event: 'abilityEntityFinished',
      priority: 0,
      sequence: {
        steps: [
          {
            kind: 'modifyActionValue',
            parameters: {
              key: 'count',
              operation: 'add',
              value: { kind: 'constant', value: 1 },
            },
          },
        ],
      },
    },
  ],
};

const definition: ResolvedAbilityEntityDefinition = {
  lifetime: { kind: 'infinite' },
  passiveSkills: [passive],
};

it('恢复能力实体被动时保留实体动作身份和子 Buff 所有权', () => {
  const entity = { kind: 'abilityEntity' as const, instanceId: 7 };
  const entityBlackboard = new ActionBlackboard({ shared: 1 });
  const blackboard = new ActionBlackboard({}, entityBlackboard);
  const operationState = createCombatOperationHostState();
  const originalDispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>();
  const operations = {
    operationHost: { state: operationState, programs: new CombatOperationPrograms() },
    execute: () => true,
    evaluate: () => true,
  };
  const original = new PassiveAbilityEventRuntime(
    operations,
    {
      blackboard,
      actionOwnerId: 'ability-entity:7',
      actionSourceId: 'ability-entity:7',
      actionOwnerAbilityEntity: entity,
      currentTarget: entity,
    },
    passive.abilityEventResponses!,
    (event, priority, handle) =>
      originalDispatcher.registerAction(event, priority, published => handle(published)),
  );
  const enable = new CombatActionSequenceRuntime(operations, { blackboard }).createSequence(
    passive.enableSequence,
  );
  original.recordEnableSequence(enable.runtimeState);
  original.onDisable(() => enable.end({}));
  enable.executeInstant({});
  original.enable();
  original.addChildBuff({
    isRecycled: false,
    reference: { ownerId: 'ability-entity:7', instanceId: 3 },
    finish: () => true,
  });
  const copied = structuredClone({
    entityBlackboard: entityBlackboard.runtimeState,
    passive: original.runtimeState,
    events: originalDispatcher.runtimeState,
  });
  const restoredDispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>(
    copied.events,
  );
  const contexts: CombatOperationContext[] = [];
  const restored = bindRestoredCombatAbilityEntityPassives({
    entity,
    definition,
    states: new Map([[passive.key, copied.passive]]),
    entityBlackboard: ActionBlackboard.bindRuntimeState(copied.entityBlackboard),
    semanticEvents: new CombatSemanticEventRuntime(),
    createOperations: (_program, state) => ({
      operationHost: { state: state.operations, programs: new CombatOperationPrograms() },
      execute: (_step, context) => {
        contexts.push({ ...context! });
        return true;
      },
      evaluate: () => true,
    }),
    register: (event, _priority, handle, subscriptions) => {
      if (subscriptions === undefined) throw new Error('restore requires subscriptions');
      return restoredDispatcher.bindSubscriptionFor(event, subscriptions[0]!, published =>
        handle(published),
      );
    },
  });
  const finish = vi.fn(() => true);
  const resolve = vi.fn(reference => ({ isRecycled: false, reference, finish }));
  copied.passive.host.childBuffs.push(copied.passive.host.childBuffs[0]!);
  expect(() => restored.bindRestoredChildren(resolve)).toThrow(/duplicated/);
  expect(resolve).not.toHaveBeenCalled();
  copied.passive.host.childBuffs.pop();
  restored.bindRestoredChildren(resolve);
  restoredDispatcher.dispatch(
    {
      event: 'abilityEntityFinished',
      payload: { sourceId: 'ability-entity:7', targetId: 'enemy' },
    },
    [],
  );

  expect(contexts[0]).toMatchObject({
    actionOwnerId: 'ability-entity:7',
    actionSourceId: 'ability-entity:7',
    actionOwnerAbilityEntity: entity,
    currentTarget: entity,
  });
  expect(restored.runtimes.get(passive.key)!.runtimeState).toBe(copied.passive);
  restored.dispose();
  expect(finish).toHaveBeenCalledExactlyOnceWith('other', null);
  original.dispose();
});
