import { expect, it, vi } from 'vitest';
import type { CompiledOperatorPassiveProgram } from '../../../compiler/combatProgram';
import { AbilityEventDispatcher } from '../../events/abilityEventDispatcher';
import type { AbilityEventPayloadMap } from '../../events/combatAbilityEvent';
import type { AbilityEvent } from '../../../../../packages/game-data-contract/src/abilityEvents';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../../actions/combatActionSequenceRuntime';
import { createCombatOperationHostState } from '../../state/actionState';
import { bindRestoredCombatOperatorPassives } from './combatOperatorPassiveRestoration';
import { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import { PassiveAbilityEventRuntime } from '../../abilities/passiveAbilityEventRuntime';
import type { CombatOperationExecutor } from '../../skills/skillRuntime';
import { CombatOperationPrograms } from '../../actions/combatOperationPrograms';

const program: CompiledOperatorPassiveProgram = {
  key: 'passive',
  initialBlackboard: { count: 0 },
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

function executor(
  state: ReturnType<typeof createCombatOperationHostState>,
  onExecute: CombatOperationExecutor['execute'],
): CombatOperationExecutor {
  return {
    operationHost: { state, programs: new CombatOperationPrograms() },
    execute: onExecute,
    evaluate: () => true,
  };
}

it('恢复干员被动时保留黑板、启用序列、订阅和子 Buff 所有权', () => {
  const originalDispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>();
  const operatorBlackboard = new ActionBlackboard({ shared: 1 });
  const blackboard = new ActionBlackboard(program.initialBlackboard, operatorBlackboard);
  const operationState = createCombatOperationHostState();
  const originalOperations = executor(operationState, () => true);
  const original = new PassiveAbilityEventRuntime(
    originalOperations,
    { blackboard, actionOwnerId: 'operator', actionSourceId: 'operator' },
    program.abilityEventResponses!,
    (event, priority, handle) =>
      originalDispatcher.registerAction(event, priority, published => handle(published)),
  );
  const originalEnable = new CombatActionSequenceRuntime(originalOperations, {
    blackboard,
  }).createSequence(program.enableSequence);
  original.recordEnableSequence(originalEnable.runtimeState);
  original.onDisable(() => originalEnable.end({}));
  originalEnable.executeInstant({});
  original.enable();
  original.addChildBuff({
    isRecycled: false,
    reference: { ownerId: 'operator', instanceId: 4 },
    finish: () => true,
  });
  const copied = structuredClone({
    operatorBlackboard: operatorBlackboard.runtimeState,
    passive: original.runtimeState,
    events: originalDispatcher.runtimeState,
  });
  const restoredDispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>(
    copied.events,
  );
  const restoredOperatorBlackboard = ActionBlackboard.bindRuntimeState(copied.operatorBlackboard);
  let executions = 0;
  const restored = bindRestoredCombatOperatorPassives({
    operatorId: 'operator',
    programs: [program],
    states: new Map([['passive', copied.passive]]),
    operatorBlackboard: restoredOperatorBlackboard,
    semanticEvents: new CombatSemanticEventRuntime(),
    createOperations: (_program, state) =>
      executor(state.operations, () => {
        executions += 1;
        return true;
      }),
    register: (event, _priority, handle, subscriptions) => {
      if (subscriptions === undefined) throw new Error('restore requires subscriptions');
      return restoredDispatcher.bindSubscriptionFor(event, subscriptions[0]!, published =>
        handle(published),
      );
    },
  });
  const finish = vi.fn(() => true);
  restored.bindRestoredChildren(reference => ({ isRecycled: false, reference, finish }));
  restoredDispatcher.dispatch(
    {
      event: 'abilityEntityFinished',
      payload: { sourceId: 'operator', targetId: 'ability-entity:1' },
    },
    [],
  );

  const runtime = restored.runtimes.get('passive')!;
  expect(runtime.runtimeState).toBe(copied.passive);
  expect(runtime.runtimeState.blackboard.entity).toBe(copied.operatorBlackboard);
  expect(runtime.runtimeState.enableSequence).toBe(copied.passive.enableSequence);
  expect(executions).toBe(1);
  expect(copied.events.nextRegistrationId).toBe(originalDispatcher.runtimeState.nextRegistrationId);
  restored.dispose();
  expect(finish).toHaveBeenCalledExactlyOnceWith('other', null);
  original.dispose();
});
