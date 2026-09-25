/**
 * 定义战斗能力系统会发布的事件，以及事件触发动作时如何确定来源和目标。
 *
 * Buff、装备、技能监听和连携条件都从这里选用同一组事件名称。动作环境绑定表说明
 * 每类事件的发布者和对端对象，模拟器据此为后续动作填入正确的施法者、目标和触发者。
 */
import type { ActionSequenceDefinition } from './actions.ts';

/** 监听到能力事件后执行的一项响应。 */
export interface AbilityEventResponse<Event extends AbilityEvent = AbilityEvent> {
  /** 要监听的事件。 */
  event: Event;
  /** 同一事件有多项响应时的执行优先级。 */
  priority: number;
  /** 事件触发后执行的动作序列。 */
  sequence: ActionSequenceDefinition;
}

/** 游戏能力系统中可被数据定义监听的事件名称。 */
export const ABILITY_EVENTS = [
  'enterFight',
  'ownerSwitchToCenter',
  'ownerSwitchToGuard',
  'ownerHpZero',
  'hpChanged',
  'abilityEntitySpawned',
  'abilityEntityFinished',
  'projectileLaunched',
  'beforeHitByProjectile',
  'beforeTakeDamage',
  'beforeCalculateDamage',
  'beforeDamageAction',
  'beforeOutputDamage',
  'beforeTakePhysicalInfliction',
  'afterTakePhysicalInfliction',
  'beforeOutputPhysicalInfliction',
  'afterOutputPhysicalInfliction',
  'beforeOutputKnockDown',
  'afterOutputKnockDown',
  'beforeOutputInfliction',
  'afterOutputInfliction',
  'beforeOutputSpellBurst',
  'beforeTakeSpellInfliction',
  'beforeTakeInfliction',
  'afterTakeInfliction',
  'takeDamage',
  'takeCriticalDamage',
  'outputDamage',
  'outputCriticalDamage',
  'outputKnockDown',
  'outputHeal',
  'receiveHeal',
  'afterAddedShield',
  'poiseZero',
  'poiseKnotBreak',
  'beforeCastSkill',
  'afterSkillApplyCost',
  'skillEnd',
  'beforeOutputBuff',
  'beforeAddedBuff',
  'outputBuff',
  'addedBuff',
  'finishedBuff',
  'buffEndsEarly',
  'buffEnhanceChanged',
  'afterOutputWeaknessTriggered',
  'weaknessSet',
  'customAbilityEvent',
  'afterKillEntity',
  'buffConsumed',
  'buffAbsorbed',
  'skillSpGained',
  'perfectDodge',
] as const;

/** 一种可监听的能力事件名称。 */
export type AbilityEvent = (typeof ABILITY_EVENTS)[number];

/** 动作环境中的事件发布者或事件对端。 */
export type AbilityEventActionContextEndpoint = 'eventSource' | 'eventTarget';
/** 事件的实际触发对象；`null` 表示该事件没有独立触发对象。 */
export type AbilityEventTriggerEndpoint = AbilityEventActionContextEndpoint | null;

/**
 * 已由原生事件发布链证明的动作环境双方身份。
 * InputTarget 是事件动作读取 TargetSource.Target 时得到的对端；Trigger 是实际发布者。
 * 未列出的事件不能用于需要完整动作环境的监听器或连携条件。
 */
export const ABILITY_EVENT_ACTION_CONTEXT_BINDINGS = {
  /** 生命变化由对象自身发布，不把伤害或治疗来源冒充为事件来源。 */
  hpChanged: { inputTarget: 'eventSource', triggerTarget: 'eventSource' },
  /** 投射物是输入目标，闪避中的角色是事件来源和触发者。 */
  beforeHitByProjectile: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 新实体是输入目标，创建它的对象是事件来源和触发者。 */
  abilityEntitySpawned: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 结束的实体是输入目标，结束它的对象是事件来源和触发者。 */
  abilityEntityFinished: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** Buff 来源是输入目标，接收者是事件来源和触发者。 */
  beforeAddedBuff: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** Buff 来源是输入目标，接收者是事件来源和触发者。 */
  addedBuff: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** Buff 接收者是输入目标，输出者是事件来源和触发者。 */
  beforeOutputBuff: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** Buff 接收者是输入目标，输出者是事件来源和触发者。 */
  outputBuff: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 伤害来源是输入目标，承伤者是事件来源和触发者。 */
  beforeTakeDamage: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 伤害目标是输入目标，输出者是事件来源和触发者。 */
  beforeOutputDamage: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 伤害来源是输入目标，承伤者是事件来源和触发者。 */
  takeDamage: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 暴击承伤沿用产生它的 TakeDamageContext：伤害来源是输入目标，承伤者是触发者。 */
  takeCriticalDamage: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 伤害目标是输入目标，输出者是事件来源和触发者。 */
  outputDamage: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 暴击输出沿用产生它的 OutputDamageContext：伤害目标是输入目标，输出者是触发者。 */
  outputCriticalDamage: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 提前结束 Buff 的来源是输入目标，Buff 持有者是事件来源和触发者。 */
  buffEndsEarly: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 异常目标是输入目标，输出者是事件来源和触发者。 */
  beforeOutputInfliction: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 物理异常目标是输入目标，输出者是事件来源和触发者。 */
  beforeOutputPhysicalInfliction: {
    inputTarget: 'eventTarget',
    triggerTarget: 'eventSource',
  },
  /** 物理异常来源是输入目标，接收者是事件来源和触发者。 */
  beforeTakePhysicalInfliction: {
    inputTarget: 'eventSource',
    triggerTarget: 'eventTarget',
  },
  /** 异常来源是输入目标，接收者是事件来源和触发者。 */
  beforeTakeInfliction: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 异常目标是输入目标，输出者是事件来源和触发者。 */
  afterOutputInfliction: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 异常来源是输入目标，接收者是事件来源和触发者。 */
  afterTakeInfliction: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 物理异常来源是输入目标，接收者是事件来源和触发者。 */
  afterTakePhysicalInfliction: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 失衡伤害来源是输入目标，失衡对象是事件来源和触发者。 */
  poiseZero: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 失衡伤害来源是输入目标，失衡对象是事件来源和触发者。 */
  poiseKnotBreak: { inputTarget: 'eventSource', triggerTarget: 'eventTarget' },
  /** 治疗目标是输入目标，治疗者是事件来源和触发者。 */
  outputHeal: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 被消费 Buff 的持有者是输入目标，消费来源是事件来源和触发者。 */
  buffConsumed: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 被吸收 Buff 的持有者是输入目标，吸收来源是事件来源和触发者。 */
  buffAbsorbed: { inputTarget: 'eventTarget', triggerTarget: 'eventSource' },
  /** 弱点所属对象是输入目标，设置弱点的对象是事件来源和触发者。 */
  weaknessSet: {
    inputTarget: 'eventSource',
    triggerTarget: null,
    /** SetWeaknessAction 的发布者就是弱点所属敌人；固定木桩可保留该身份。 */
    fixedStumpInputTarget: 'enemy',
  },
} as const satisfies Partial<
  Record<
    AbilityEvent,
    {
      /** 事件动作读取的对端对象。 */
      readonly inputTarget: AbilityEventActionContextEndpoint;
      /** null 对应 DoesEventHaveTarget=false；不得把 InputTarget 偷填为 trigger。 */
      readonly triggerTarget: AbilityEventTriggerEndpoint;
      /** 固定木桩模型中可明确补入的输入目标。 */
      readonly fixedStumpInputTarget?: 'enemy';
    }
  >
>;

/** 已明确来源、目标和触发者绑定关系的能力事件。 */
export type ActionContextBoundAbilityEvent = keyof typeof ABILITY_EVENT_ACTION_CONTEXT_BINDINGS;

/** 所有已具备完整动作环境绑定的事件名称，供运行时快速检查。 */
export const ACTION_CONTEXT_BOUND_ABILITY_EVENTS = Object.freeze(
  Object.keys(ABILITY_EVENT_ACTION_CONTEXT_BINDINGS) as ActionContextBoundAbilityEvent[],
);
