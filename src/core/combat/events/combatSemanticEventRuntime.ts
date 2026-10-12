import type { AbilityEvent } from '../../../../packages/game-data-contract/src/abilityEvents';
import { conditionInputExpression } from '../../compiler/compiledGraphData';
import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
/**
 * 战斗语义事件的同步分发中心。
 *
 * 伤害、附着和状态运行时只负责报告已经发生的事实；连携、配装和养成能力在这里按
 * `CombatEventTrigger` 订阅。它不执行条件和动作，也不依赖 UI 或项目存档。
 */
import type {
  CombatEventTrigger,
  SkillTriggerScope,
  UpgradeEvent,
} from '../../game-data/operatorDefinition';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { hasElementalAttachmentTag } from '../infliction/elementalInfliction';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { AbilityEventSubscriptionReference } from '../state/foundationState';
import type { AbilityEventRuntimeActionContext } from './abilityEventActionContext';
import type { TrackedAbilityEventRegistration } from './abilityEventDispatcher';
import { withCombatEventResponseContext } from './abilityEventResponseContext';
import type { AbilityResponseEvent, CombatAbilityEvent } from './combatAbilityEvent';

/** 订阅安装到发布实体原有的分发器，不通过另一次 emit 转发。 */
export type RegisterCombatAbilityEvent = <Name extends AbilityEvent>(
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

export type CombatSemanticEvent = AbilityResponseEvent;

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
  readonly condition?: CompiledCondition;
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
      event.payload.executingSkillId === trigger.skillKey
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
      event.payload.sourceId === ownerOperatorId &&
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
  return false;
}

/**
 * 定义侧触发器的订阅层。阶段、优先级、注册顺序与释放统一由 AbilityEventDispatcher 管理。
 * 只筛选原生事件；订阅状态由实体的事件分发器持有。
 */
export class CombatSemanticEventRuntime {
  constructor(
    private readonly registerAbilityEvent?: RegisterCombatAbilityEvent,
    private readonly restored?: {
      readonly bindNative: (
        reference: AbilityEventSubscriptionReference,
        receive: (context: CombatSemanticEventContext) => void,
      ) => TrackedAbilityEventRegistration;
    },
  ) {}

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
            getOperations().evaluate(conditionInputExpression(condition), operationContext),
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
          if (reference.event !== native.event || reference.phase !== phase)
            throw new Error('saved event subscription does not match response');
          if (this.restored === undefined) throw new Error('native event restore port is missing');
          bindings.push(
            this.restored.bindNative(reference, context => execute({ payload: context })),
          );
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
    if (this.registerAbilityEvent === undefined)
      throw new Error(`${event} requires the native ability event subscription port`);
    return this.registerAbilityEvent(
      stored.ownerOperatorId,
      native.scope,
      native.event,
      stored.phase,
      stored.priority ?? 0,
      (event, actionContext) => execute({ payload: { event, actionContext } }),
    );
  }
}

/** 定义筛选只决定订阅哪个原始事件，不在这里构造另一份通知。 */
function eventSubscription(trigger: CombatEventTrigger | UpgradeEvent): {
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
} {
  switch (trigger.kind) {
    case 'abilityEvent':
      return { event: trigger.event, scope: 'operator' };
    case 'elementalInflictionApplied':
      return { event: 'afterOutputInfliction', scope: trigger.scope };
    case 'spGained':
      return { event: 'skillSpGained', scope: 'operator' };
    case 'knockDownOutput':
      return {
        event: 'afterOutputKnockDown',
        scope: 'operator',
      };
    case 'physicalInflictionApplied':
      return { event: 'afterOutputPhysicalInfliction', scope: trigger.scope };
    case 'operatorHit':
      return { event: 'takeDamage', scope: 'operator' };
    case 'enemyDefeated':
      return { event: 'afterKillEntity', scope: trigger.scope };
    case 'skillHit':
    case 'damageTagHit':
      return { event: 'outputDamage', scope: trigger.scope };
    case 'buffOutput':
      return { event: 'outputBuff', scope: 'operator' };
    case 'buffApplied':
      return { event: 'addedBuff', scope: 'operator' };
    case 'elementalAttachmentConsumed':
    case 'buffConsumed':
      return { event: 'buffConsumed', scope: 'operator' };
    case 'operatorHealed':
      return {
        event: trigger.role === 'source' ? 'outputHeal' : 'receiveHeal',
        scope: 'operator',
      };
  }
}
