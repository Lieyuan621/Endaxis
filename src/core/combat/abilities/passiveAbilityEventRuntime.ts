import type { CompiledOperatorPassiveProgram } from '../../compiler/combatProgram';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { hasActiveCombatOperationState } from '../actions/combatOperationHostInspection';
import type { BuffApplicationHandle } from '../buffs/combatBuffs';
import type { AbilityEventRuntimeActionContext } from '../events/abilityEventActionContext';
import type {
  AbilityEventRegistration,
  TrackedAbilityEventRegistration,
} from '../events/abilityEventDispatcher';
import { withAbilityEventResponseContext } from '../events/abilityEventResponseContext';
import type { CombatAbilityEvent } from '../events/combatAbilityEvent';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import {
  createPassiveAbilityEventState,
  type PassiveAbilityEventState,
} from '../state/abilityState';
import type { ActionSequenceState } from '../state/actionState';
import type { AbilityEventSubscriptionReference } from '../state/foundationState';
import {
  AbilityEventHostLifecycle,
  failAfterAbilityHostCleanup,
} from './abilityEventHostLifecycle';

export type RegisterPassiveAbilityEventAction = (
  event: NonNullable<CompiledOperatorPassiveProgram['abilityEventResponses']>[number]['event'],
  priority: number,
  handle: (
    published: CombatAbilityEvent<
      NonNullable<CompiledOperatorPassiveProgram['abilityEventResponses']>[number]['event']
    >,
    context?: AbilityEventRuntimeActionContext,
  ) => void,
  subscriptions?: readonly AbilityEventSubscriptionReference[],
) => AbilityEventRegistration;

/** 原生被动 Skill 的事件序列宿主；黑板和子 Buff 所有权由被动实例提供。 */
export class PassiveAbilityEventRuntime {
  readonly #state: PassiveAbilityEventState;
  readonly #lifecycle: AbilityEventHostLifecycle;
  #disposed = false;

  get runtimeState(): PassiveAbilityEventState {
    return this.#state;
  }

  constructor(
    operations: CombatOperationExecutor,
    ownerContext: CombatOperationContext,
    responses: NonNullable<CompiledOperatorPassiveProgram['abilityEventResponses']>,
    register: RegisterPassiveAbilityEventAction,
    state?: PassiveAbilityEventState,
  ) {
    this.#state =
      state ??
      createPassiveAbilityEventState(
        ownerContext.blackboard.runtimeState,
        operations.operationHost?.state,
      );
    this.#lifecycle = new AbilityEventHostLifecycle(this.#state.host);
    if (this.#state.blackboard !== ownerContext.blackboard.runtimeState)
      throw new Error('passive event host must bind its saved blackboard');
    if (
      operations.operationHost?.state !== undefined &&
      operations.operationHost.state !== this.#state.operations
    )
      throw new Error('passive event host must bind its saved operation state');
    if (
      operations.operationHost === undefined &&
      hasActiveCombatOperationState(this.#state.operations)
    )
      throw new Error('restored passive event host has active operations without a bound executor');
    if (this.#state.host.disposed) throw new Error('cannot restore a disposed passive event host');
    if (this.#state.responses.length !== 0 && this.#state.responses.length !== responses.length)
      throw new Error('passive event response state does not match program length');
    const restoring = this.#state.responses.length !== 0;
    try {
      for (const [index, response] of responses.entries()) {
        // 一个原生监听持有一个 SequenceAction；不能每次通知重新创建并丢失重入状态。
        const context: CombatOperationContext = {
          ...ownerContext,
          canExecuteAction: () =>
            this.#lifecycle.canExecuteAction && ownerContext.canExecuteAction?.() !== false,
          addAbilityChildBuff: child => this.addChildBuff(child),
        };
        const sequence = new CombatActionSequenceRuntime(operations, context).createSequence(
          response.sequence,
          context,
          restoring ? this.#state.responses[index] : undefined,
        );
        if (!restoring) sequence.reset({});
        const registration = register(
          response.event,
          response.priority,
          (published, targets) => {
            if (!this.#lifecycle.acceptsEvents) return;
            withAbilityEventResponseContext(context, published, targets, () => {
              sequence.executeInstant({});
            });
          },
          restoring ? this.#state.host.registrations[index] : undefined,
        );
        if (restoring) {
          if (!isTrackedRegistration(registration)) {
            registration.dispose();
            throw new Error('restored passive event registration has no subscription references');
          }
          this.#lifecycle.bindRestoredRegistration(registration);
        } else {
          this.#lifecycle.register(registration);
          this.#state.responses.push(sequence.runtimeState);
        }
      }
    } catch (error) {
      failAfterAbilityHostCleanup(error, [() => this.dispose()]);
    }
  }

  /** 注册早于初始化，但原生 Ability 在启动 Buff 安装完成后才允许执行响应。 */
  enable(): void {
    if (this.#disposed) throw new Error('cannot enable a disposed passive event host');
    this.#lifecycle.enable();
  }

  addChildBuff(child: BuffApplicationHandle): void {
    this.#lifecycle.addChildBuff(child);
  }

  /** 所有目标 Buff 容器恢复后接回该被动已持有的子实例。 */
  bindRestoredChildren(
    resolve: (reference: BuffApplicationHandle['reference']) => BuffApplicationHandle | undefined,
  ): void {
    this.#lifecycle.bindRestoredChildren(resolve);
  }

  /** 装配层创建常驻启用序列后，把实际进度接入同一被动数据。 */
  recordEnableSequence(state: ActionSequenceState): void {
    if (this.#state.enableSequence !== null && this.#state.enableSequence !== state)
      throw new Error('passive enable sequence state is already bound');
    this.#state.enableSequence = state;
  }

  onDisable(cleanup: () => void): void {
    this.#lifecycle.onDisable(cleanup);
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#lifecycle.dispose();
  }
}

function isTrackedRegistration(
  registration: AbilityEventRegistration,
): registration is TrackedAbilityEventRegistration {
  return 'subscriptions' in registration;
}
