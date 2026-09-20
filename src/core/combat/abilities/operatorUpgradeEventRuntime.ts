/** 已编译干员养成事件在一场战斗中的注册与执行生命周期。 */
import type { CompiledOperatorUpgradeEventProgram } from '../../compiler/combatProgram';
import type { TrackedAbilityEventRegistration } from '../events/abilityEventDispatcher';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { failAfterAbilityHostCleanup } from './abilityEventHostLifecycle';
import { withCombatEventResponseContext } from '../events/abilityEventResponseContext';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import type {
  CombatSemanticEventContext,
  CombatSemanticEventRuntime,
} from '../events/combatSemanticEventRuntime';
import {
  createOperatorUpgradeEventState,
  type OperatorUpgradeEventState,
} from '../state/abilityState';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';

export interface OperatorUpgradeEventExecutionContext {
  readonly operatorId: string;
  readonly programKey: string;
  readonly event: CombatSemanticEventContext['event'];
}

export type CreateOperatorUpgradeEventExecutor = (
  context: OperatorUpgradeEventExecutionContext,
) => CombatOperationExecutor;

export class OperatorUpgradeEventRuntime {
  readonly #state: OperatorUpgradeEventState;
  readonly #registrations: TrackedAbilityEventRegistration[] = [];

  get runtimeState(): OperatorUpgradeEventState {
    return this.#state;
  }

  constructor(
    semanticEvents: CombatSemanticEventRuntime,
    operatorId: string,
    programs: readonly CompiledOperatorUpgradeEventProgram[],
    createExecutor: CreateOperatorUpgradeEventExecutor,
    state?: OperatorUpgradeEventState,
  ) {
    this.#state = state ?? createOperatorUpgradeEventState();
    const restoring = state !== undefined;
    if (restoring && state.programs.length !== programs.length)
      throw new Error('operator upgrade event state does not match program length');
    try {
      for (const [index, program] of programs.entries()) {
        const saved = this.#state.programs[index];
        if (saved !== undefined && saved.key !== program.key)
          throw new Error(`operator upgrade event '${index}' does not match '${program.key}'`);
        const registration = {
          ownerOperatorId: operatorId,
          trigger: program.event,
          phase: 'dataAction',
          createOperations: (context: CombatSemanticEventContext) =>
            createExecutor({ operatorId, programKey: program.key, event: context.event }),
          handle: (
            context: CombatSemanticEventContext,
            getOperations: () => CombatOperationExecutor,
          ) => this.#execute(program, getOperations(), context),
        } as const;
        const installed = restoring
          ? semanticEvents.bindRegistration(registration, saved!.subscriptions)
          : semanticEvents.register(registration);
        this.#registrations.push(installed);
        if (!restoring)
          this.#state.programs.push({ key: program.key, subscriptions: installed.subscriptions });
      }
    } catch (error) {
      failAfterAbilityHostCleanup(error, [() => this.dispose()]);
    }
  }

  dispose(): void {
    for (const registration of this.#registrations.splice(0)) registration.dispose();
    this.#state.programs.length = 0;
  }

  #execute(
    program: CompiledOperatorUpgradeEventProgram,
    operations: CombatOperationExecutor,
    response: CombatSemanticEventContext,
  ): void {
    const event = response.event;
    const eventBlackboard = {
      ...program.initialBlackboard,
      ...('payload' in event &&
      event.event === 'buffConsumed' &&
      program.event.kind === 'elementalAttachmentConsumed'
        ? { infliction_num: event.payload.layers }
        : {}),
      ...('payload' in event && event.event === 'buffConsumed'
        ? { consumedLayer: event.payload.layers }
        : {}),
    };
    const operationContext: CombatOperationContext = {
      blackboard: new ActionBlackboard(eventBlackboard),
      event,
    };
    withCombatEventResponseContext(operationContext, response, () =>
      new CombatActionSequenceRuntime(operations, operationContext)
        .createSequence(program.sequence)
        .executeInstant({}),
    );
  }
}
