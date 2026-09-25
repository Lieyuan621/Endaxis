/**
 * 战斗语义事件的同步分发中心。
 *
 * 伤害、附着和状态运行时只负责报告已经发生的事实；连携、配装和养成能力在这里按
 * `CombatEventTrigger` 订阅。它不执行条件和动作，也不依赖 UI 或项目存档。
 */
import type {
  CombatCondition,
  CombatEventTrigger,
  SkillTriggerScope,
  UpgradeEvent,
} from '../../game-data/operatorDefinition';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { hasElementalAttachmentTag } from '../infliction/elementalInfliction';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type {
  AbilityEventState,
  AbilityEventSubscriptionReference,
} from '../state/foundationState';
import type { AbilityEventRuntimeActionContext } from './abilityEventActionContext';
import {
  AbilityEventDispatcher,
  type AbilityEventFromMap,
  type TrackedAbilityEventRegistration,
} from './abilityEventDispatcher';
import { withCombatEventResponseContext } from './abilityEventResponseContext';
import type { AbilityResponseEvent, CombatAbilityEvent } from './combatAbilityEvent';

/** 订阅安装到发布实体原有的分发器，不通过另一次 emit 转发。 */
export type RegisterCombatAbilityEvent = <
  Name extends import('../../../../packages/game-data-contract/src/abilityEvents').AbilityEvent,
>(
  ownerId: string,
  scope: SkillTriggerScope,
  event: Name,
  phase: CombatEventPhase,
  priority: number,
  handle: (
    event: CombatAbilityEvent<Name>,
    actionContext?: AbilityEventRuntimeActionContext,
  ) => void,
) => TrackedAbilityEventRegistration;

/** 手工动作的兼容标记，不是原生组件通知，不携带 fromAirborne 或施法来源。 */
export interface ManualAirborneOutputEvent {
  readonly kind: 'airborneOutput';
  readonly sourceOperatorId: string;
  readonly targetId: string;
}

export interface ManualKnockDownOutputEvent {
  readonly kind: 'knockDownOutput';
  readonly sourceOperatorId: string;
  readonly targetId: string;
}

export type CombatSemanticEvent =
  ManualAirborneOutputEvent | ManualKnockDownOutputEvent | AbilityResponseEvent;

/** 旧倒地触发器接收后置通知或手工标记；前置通知不在此端口内。 */
export type KnockDownOutputEvent =
  | (CombatAbilityEvent<'afterOutputKnockDown'> & { readonly kind?: never })
  | ManualKnockDownOutputEvent;

export function isKnockDownOutputEvent(event: CombatSemanticEvent): event is KnockDownOutputEvent {
  return (
    event.kind === 'knockDownOutput' || ('event' in event && event.event === 'afterOutputKnockDown')
  );
}

export interface CombatSemanticEventContext {
  readonly event: CombatSemanticEvent;
  readonly actionContext?: AbilityEventRuntimeActionContext;
}

export type CombatSemanticEventHandler = (context: CombatSemanticEventContext) => void;

/**
 * 与原生 AbilitySystem.TriggerEvent 已确认的派发阶段一致。
 * 阶段顺序属于战斗规则，不能由各功能模块自行决定。
 */
export const COMBAT_EVENT_PHASES = ['callback', 'dataAction', 'skill', 'combo'] as const;
export type CombatEventPhase = (typeof COMBAT_EVENT_PHASES)[number];

interface CombatEventHandlerRegistrationBase {
  readonly ownerOperatorId: string;
  readonly trigger: CombatEventTrigger | UpgradeEvent;
  readonly condition?: CombatCondition;
  /** 带条件的监听器必须提供与普通动作相同的条件执行链。 */
  readonly createOperations?: (context: CombatSemanticEventContext) => CombatOperationExecutor;
  /** 技能临时监听器复用本次释放黑板；常驻监听器省略时使用事件私有黑板。 */
  readonly createOperationContext?: (context: CombatSemanticEventContext) => CombatOperationContext;
  readonly handle: (
    context: CombatSemanticEventContext,
    getOperations: () => CombatOperationExecutor,
  ) => void;
}

export type CombatEventHandlerRegistration = CombatEventHandlerRegistrationBase &
  (
    | {
        readonly phase: 'dataAction';
        /** 原生数据动作按高优先级先执行；未配置时使用 0。 */
        readonly priority?: number;
      }
    | {
        readonly phase: Exclude<CombatEventPhase, 'dataAction'>;
        readonly priority?: never;
      }
  );

function includesValue<T>(filter: T | readonly T[], value: T): boolean {
  return Array.isArray(filter) ? filter.includes(value) : filter === value;
}

function matchesScope(
  scope: SkillTriggerScope,
  ownerOperatorId: string,
  sourceOperatorId: string,
): boolean {
  return scope === 'team' || ownerOperatorId === sourceOperatorId;
}

function matches(
  registration: CombatEventHandlerRegistrationBase,
  event: CombatSemanticEvent,
): boolean {
  const { ownerOperatorId, trigger } = registration;
  if (trigger.kind === 'abilityEvent') {
    // Owner routing is enforced by the native entity subscription, not a second
    // source/target interpretation of the payload in each listener host.
    return 'event' in event && event.event === trigger.event;
  }
  if (trigger.kind === 'buffConsumed') {
    return (
      'event' in event &&
      event.event === 'buffConsumed' &&
      event.payload.sourceId === ownerOperatorId &&
      (trigger.buffIds === undefined || trigger.buffIds.includes(event.payload.buffId))
    );
  }
  if (trigger.kind === 'buffApplied') {
    return (
      'event' in event && event.event === 'addedBuff' && event.payload.targetId === ownerOperatorId
    );
  }
  if (trigger.kind === 'buffOutput') {
    return (
      'event' in event && event.event === 'outputBuff' && event.payload.sourceId === ownerOperatorId
    );
  }
  if (trigger.kind === 'enemyDefeated') {
    return (
      'event' in event &&
      event.event === 'afterKillEntity' &&
      matchesScope(trigger.scope, ownerOperatorId, event.payload.sourceId)
    );
  }
  if (trigger.kind === 'operatorHealed') {
    return (
      'payload' in event &&
      (trigger.role === 'source'
        ? event.event === 'outputHeal' && event.payload.sourceId === ownerOperatorId
        : event.event === 'receiveHeal' && event.payload.targetId === ownerOperatorId)
    );
  }
  if (trigger.kind === 'damageTagHit') {
    return (
      'payload' in event &&
      event.event === 'outputDamage' &&
      matchesScope(trigger.scope, ownerOperatorId, event.payload.sourceId) &&
      event.payload.tags.includes(trigger.tag)
    );
  }
  if (trigger.kind === 'operatorHit') {
    return (
      'payload' in event &&
      event.event === 'takeDamage' &&
      event.payload.targetId === ownerOperatorId
    );
  }
  if (trigger.kind === 'skillHit') {
    return (
      'payload' in event &&
      event.event === 'outputDamage' &&
      matchesScope(trigger.scope, ownerOperatorId, event.payload.sourceId) &&
      event.payload.executingSkillGroupKey === trigger.skillGroupKey
    );
  }
  if (trigger.kind === 'physicalInflictionApplied') {
    return (
      'payload' in event &&
      event.event === 'afterOutputPhysicalInfliction' &&
      matchesScope(trigger.scope, ownerOperatorId, event.payload.sourceId) &&
      event.payload.type !== undefined &&
      includesValue(trigger.types, event.payload.type)
    );
  }
  if (trigger.kind === 'knockDownOutput' && 'payload' in event) {
    return event.event === 'afterOutputKnockDown' && event.payload.sourceId === ownerOperatorId;
  }
  if (trigger.kind === 'spGained') {
    return (
      'payload' in event &&
      event.event === 'skillSpGained' &&
      event.payload.sourceOperatorId === ownerOperatorId &&
      (trigger.source === undefined || trigger.source === event.payload.source) &&
      (trigger.gainKind === undefined || trigger.gainKind === event.payload.gainKind)
    );
  }
  if (trigger.kind === 'elementalInflictionApplied') {
    return (
      'payload' in event &&
      event.event === 'afterOutputInfliction' &&
      matchesScope(trigger.scope, ownerOperatorId, event.payload.sourceId) &&
      includesValue(trigger.elements, event.payload.element)
    );
  }
  if (trigger.kind === 'elementalAttachmentConsumed') {
    return (
      'payload' in event &&
      event.event === 'buffConsumed' &&
      event.payload.sourceId === ownerOperatorId &&
      hasElementalAttachmentTag(event.payload.buffTags)
    );
  }
  if (trigger.kind !== event.kind) return false;
  switch (trigger.kind) {
    case 'airborneOutput':
      return event.kind === 'airborneOutput' && event.sourceOperatorId === ownerOperatorId;
    case 'knockDownOutput':
      return event.kind === 'knockDownOutput' && event.sourceOperatorId === ownerOperatorId;
  }
}

/**
 * 定义侧触发器的订阅层。阶段、优先级、注册顺序与释放统一由 AbilityEventDispatcher 管理。
 * 语义事件名与原生事件名的迁移尚未完成；本层不再自行实现第二套阶段循环。
 */
export class CombatSemanticEventRuntime {
  constructor(
    private readonly registerAbilityEvent?: RegisterCombatAbilityEvent,
    private readonly restored?: {
      readonly state: AbilityEventState<NonNullable<CombatSemanticEvent['kind']>>;
      /** 环境解析原生事件目录，并补回当前事件的目标上下文。 */
      readonly bindNative: (
        reference: AbilityEventSubscriptionReference,
        receive: (context: CombatSemanticEventContext) => void,
      ) => TrackedAbilityEventRegistration;
    },
  ) {
    this.#dispatcher = new AbilityEventDispatcher(restored?.state);
  }

  readonly #dispatcher: AbilityEventDispatcher<
    NonNullable<CombatSemanticEvent['kind']>,
    Record<NonNullable<CombatSemanticEvent['kind']>, CombatSemanticEventContext>
  >;

  /** 仅包含手工语义事件；实体原生事件由战斗环境的事件目录持有。 */
  get runtimeState() {
    return this.#dispatcher.runtimeState;
  }

  register(registration: CombatEventHandlerRegistration): TrackedAbilityEventRegistration {
    return this.#install(registration);
  }

  /** 给保存的订阅接回响应逻辑，不重新申请编号或执行响应序列。 */
  bindRegistration(
    registration: CombatEventHandlerRegistration,
    subscriptions: readonly AbilityEventSubscriptionReference[],
  ): TrackedAbilityEventRegistration {
    return this.#install(registration, subscriptions);
  }

  #install(
    registration: CombatEventHandlerRegistration,
    subscriptions?: readonly AbilityEventSubscriptionReference[],
  ): TrackedAbilityEventRegistration {
    if (registration.ownerOperatorId.length === 0) {
      throw new TypeError('semantic event owner must not be empty');
    }
    if (registration.condition !== undefined && registration.createOperations === undefined) {
      throw new TypeError('conditional semantic event handler requires an operation executor');
    }
    const stored = { ...registration };
    const execute = ({
      payload: context,
    }: {
      readonly payload: CombatSemanticEventContext;
    }): void => {
      if (!matches(stored, context.event)) return;
      let operations: CombatOperationExecutor | undefined;
      const getOperations = (): CombatOperationExecutor => {
        if (operations !== undefined) return operations;
        if (stored.createOperations === undefined) {
          throw new Error('semantic event handler has no operation executor');
        }
        operations = stored.createOperations(context);
        return operations;
      };
      if (stored.condition !== undefined) {
        const operationContext = stored.createOperationContext?.(context) ?? {
          blackboard: new ActionBlackboard(),
          event: context.event,
        };
        const condition = stored.condition;
        // 投影出的前置条件与响应动作使用同一宿主许可；不能在禁用后仍求值黑板。
        if (operationContext.canExecuteAction?.() === false) return;
        if (
          !withCombatEventResponseContext(operationContext, context, () =>
            getOperations().evaluate(condition, operationContext),
          )
        )
          return;
      }
      stored.handle(context, getOperations);
    };
    const event = stored.trigger.kind;
    const native = eventSubscription(stored.trigger);
    if (subscriptions !== undefined) {
      const phase = stored.phase === 'dataAction' ? 'action' : stored.phase;
      const bindings: TrackedAbilityEventRegistration[] = [];
      try {
        for (const reference of subscriptions) {
          const manual = reference.state === this.#dispatcher.runtimeState;
          const expectedEvent = manual
            ? native.kind === 'entity'
              ? native.legacyEvent
              : native.event
            : native.kind === 'entity'
              ? native.event
              : undefined;
          if (
            expectedEvent === undefined ||
            reference.event !== expectedEvent ||
            reference.phase !== phase
          )
            throw new Error('saved event subscription does not match response');
          if (manual) bindings.push(this.#dispatcher.bindSubscription(reference, execute));
          else {
            if (this.restored === undefined)
              throw new Error('native event restore port is missing');
            bindings.push(
              this.restored.bindNative(reference, context => execute({ payload: context })),
            );
          }
        }
        return {
          subscriptions,
          dispose: () => bindings.forEach(binding => binding.dispose()),
        };
      } catch (error) {
        // 恢复在候选数据图中进行；失败后撤销候选绑定，整场入口必须丢弃该候选图。
        bindings.forEach(binding => binding.dispose());
        throw error;
      }
    }
    if (native.kind === 'entity') {
      if (this.registerAbilityEvent === undefined)
        throw new Error(`${event} requires the native ability event subscription port`);
      const registration = this.registerAbilityEvent(
        stored.ownerOperatorId,
        native.scope,
        native.event,
        stored.phase,
        stored.priority ?? 0,
        (event, actionContext) => execute({ payload: { event, actionContext } }),
      );
      if (native.legacyEvent === undefined) return registration;
      // 旧定义还接收手工输出标记；订阅两种身份，不把组件事件复制成标记。
      try {
        const legacy = this.#registerLegacy(native.legacyEvent, stored, execute);
        return {
          subscriptions: [...registration.subscriptions, ...legacy.subscriptions],
          dispose: () => {
            registration.dispose();
            legacy.dispose();
          },
        };
      } catch (error) {
        registration.dispose();
        throw error;
      }
    }
    return this.#registerLegacy(native.event, stored, execute);
  }

  #registerLegacy(
    event: NonNullable<CombatSemanticEvent['kind']>,
    stored: CombatEventHandlerRegistration,
    execute: (event: { readonly payload: CombatSemanticEventContext }) => void,
  ): TrackedAbilityEventRegistration {
    switch (stored.phase) {
      case 'callback':
        return this.#dispatcher.registerCallback(event, execute);
      case 'dataAction':
        return this.#dispatcher.registerAction(event, stored.priority ?? 0, execute);
      case 'skill':
      case 'combo':
        return this.#dispatcher.registerListener(event, stored.phase, execute);
    }
  }

  emit(event: CombatSemanticEvent): void {
    if ('event' in event)
      throw new Error('entity events must be published by their entity dispatcher');
    // 当前仍有旧语义生产者；迁移为原生事件后删除此发布端，订阅层不能重建原生载荷。
    this.#dispatcher.dispatch(
      { event: event.kind, payload: { event } } as AbilityEventFromMap<
        NonNullable<CombatSemanticEvent['kind']>,
        Record<NonNullable<CombatSemanticEvent['kind']>, CombatSemanticEventContext>
      >,
      [],
    );
  }
}

/** 定义筛选只决定订阅哪个原始事件，不在这里构造另一份通知。 */
function eventSubscription(trigger: CombatEventTrigger | UpgradeEvent):
  | {
      readonly kind: 'entity';
      readonly event:
        | 'afterOutputInfliction'
        | 'skillSpGained'
        | 'afterKillEntity'
        | 'afterOutputKnockDown'
        | 'takeDamage'
        | 'afterOutputPhysicalInfliction'
        | 'outputDamage'
        | 'outputBuff'
        | 'beforeAddedBuff'
        | 'addedBuff'
        | 'buffConsumed'
        | 'outputHeal'
        | 'receiveHeal';
      readonly scope: SkillTriggerScope;
      readonly legacyEvent?: 'knockDownOutput';
    }
  | { readonly kind: 'legacy'; readonly event: NonNullable<CombatSemanticEvent['kind']> } {
  switch (trigger.kind) {
    case 'abilityEvent':
      return { kind: 'entity', event: trigger.event, scope: 'operator' };
    case 'elementalInflictionApplied':
      return { kind: 'entity', event: 'afterOutputInfliction', scope: trigger.scope };
    case 'spGained':
      return { kind: 'entity', event: 'skillSpGained', scope: 'operator' };
    case 'knockDownOutput':
      return {
        kind: 'entity',
        event: 'afterOutputKnockDown',
        scope: 'operator',
        legacyEvent: 'knockDownOutput',
      };
    case 'physicalInflictionApplied':
      return { kind: 'entity', event: 'afterOutputPhysicalInfliction', scope: trigger.scope };
    case 'operatorHit':
      return { kind: 'entity', event: 'takeDamage', scope: 'operator' };
    case 'enemyDefeated':
      return { kind: 'entity', event: 'afterKillEntity', scope: trigger.scope };
    case 'skillHit':
    case 'damageTagHit':
      return { kind: 'entity', event: 'outputDamage', scope: trigger.scope };
    case 'buffOutput':
      return { kind: 'entity', event: 'outputBuff', scope: 'operator' };
    case 'buffApplied':
      return { kind: 'entity', event: 'addedBuff', scope: 'operator' };
    case 'elementalAttachmentConsumed':
    case 'buffConsumed':
      return { kind: 'entity', event: 'buffConsumed', scope: 'operator' };
    case 'operatorHealed':
      return {
        kind: 'entity',
        event: trigger.role === 'source' ? 'outputHeal' : 'receiveHeal',
        scope: 'operator',
      };
    default:
      return { kind: 'legacy', event: trigger.kind };
  }
}
