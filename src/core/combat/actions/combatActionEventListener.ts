/** 图执行的事件订阅生命周期。保存的数据仅含响应进度和订阅引用。 */
import type { CombatEventResponseDefinition } from '../../../../packages/game-data-contract/src/actions';
import type { ActionGraphReference } from '../../../../packages/game-data-contract/src/actionGraph';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { CombatEventListenerState } from '../state/actionState';
import type { AbilityEventRegistration } from '../events/abilityEventDispatcher';
import type {
  CombatEventHandlerRegistration,
  CombatSemanticEventContext,
  CombatSemanticEventRuntime,
} from '../events/combatSemanticEventRuntime';
import { withCombatEventResponseContext } from '../events/abilityEventResponseContext';
import type { CombatExecutionContext } from './combatStep';

export interface EventResponseExecution<State> {
  readonly runtimeState: State;
  reset(context: CombatExecutionContext): void;
  executeInstant(context: CombatExecutionContext): boolean;
}

export class CombatActionEventListener<State> {
  readonly #registrations: AbilityEventRegistration[] = [];

  constructor(
    readonly responses: readonly CombatEventResponseDefinition[],
    readonly runtimeState: CombatEventListenerState<State>,
    readonly operations: CombatOperationExecutor,
    readonly context: CombatOperationContext,
    readonly events: CombatSemanticEventRuntime | undefined,
    readonly ownerOperatorId: string | undefined,
    readonly create: (
      program: ActionGraphReference,
      context: CombatOperationContext,
      index: number,
      saved?: State,
    ) => EventResponseExecution<State>,
  ) {
    if (runtimeState.responses.length !== 0 && runtimeState.responses.length !== responses.length)
      throw new Error('listener data does not match response count');
    if (runtimeState.responses.length) this.#install(true);
  }

  execute(): void {
    if (!this.runtimeState.responses.length) this.#install(false);
  }

  #install(restoring: boolean): void {
    if (!this.events || this.ownerOperatorId === undefined)
      throw new Error('combat event listener requires a semantic event runtime and owner');
    try {
      for (const [index, response] of this.responses.entries()) {
        const context = { ...this.context, event: this.context.event };
        const saved = restoring ? this.runtimeState.responses[index]! : undefined;
        // 每项响应复用一个执行实例；嵌套同步通知必须能看到它正在执行的进度。
        const execution = this.create(response.sequence, context, index, saved?.sequence);
        if (!restoring) execution.reset({});
        const registration = {
          ownerOperatorId: this.ownerOperatorId,
          trigger: response.event,
          ...(response.condition === undefined ? {} : { condition: response.condition }),
          createOperations: () => this.operations,
          createOperationContext: () => context,
          handle: (eventContext: CombatSemanticEventContext) => {
            withCombatEventResponseContext(context, eventContext, () =>
              execution.executeInstant({}),
            );
          },
        };
        const handler: CombatEventHandlerRegistration =
          response.phase === 'dataAction'
            ? { ...registration, phase: 'dataAction', priority: response.priority }
            : { ...registration, phase: 'skill' };
        const installed =
          saved === undefined
            ? this.events.register(handler)
            : this.events.bindRegistration(handler, saved.subscriptions);
        this.#registrations.push(installed);
        if (!restoring)
          this.runtimeState.responses.push({
            sequence: execution.runtimeState,
            subscriptions: installed.subscriptions,
          });
      }
    } catch (error) {
      this.reset();
      throw error;
    }
  }

  end(): void {
    this.reset();
  }

  reset(): void {
    for (const registration of this.#registrations) registration.dispose();
    this.#registrations.length = 0;
    this.runtimeState.responses.length = 0;
  }
}
