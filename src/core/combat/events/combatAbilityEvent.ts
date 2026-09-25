import type { AbilityEvent } from '../../../../packages/game-data-contract/src/abilityEvents';
import type { GameplayTag } from '../../../../packages/game-data-contract/src/gameplayTags';
import type {
  InflictionElement,
  PhysicalInflictionType,
  SpGainKind,
  SpGainSource,
} from '../../game-data/operatorDefinition';
import type { BuffApplicationHandle, BuffAppliedEvent } from '../buffs/buffOperationExecutor';
import type { CombatBuff } from '../buffs/combatBuffs';
import type { HealthDamageEventPayload } from '../damage/healthDamage';
import type { PlayerDamageContext } from '../damage/playerDamageContext';
import type { ElementalInflictionEventPayload } from '../infliction/elementalInflictionOperationExecutor';
import type {
  BuffFinishReason,
  CombatSkillCastInfo,
  SkillCastEventData,
} from '../state/foundationState';
import {
  type AbilityEntityPair,
  type AbilityOriginPayload,
  type AbilityResponseEventName,
} from '../state/foundationState';
import type { AbilityEventFromMap } from './abilityEventDispatcher';

/** 已发布的强类型事件，或仅供兼容路由识别的手工语义标记；不是外部数据解析器。 */
type AbilityEventCandidate = CombatAbilityEvent | { readonly kind: string; readonly event?: never };

export type SpellBurstAbilityEvent = CombatAbilityEvent<'beforeOutputSpellBurst'> & {
  readonly kind?: never;
};
export type CharacterInflictionAbilityEvent = CombatAbilityEvent<'beforeTakeSpellInfliction'> & {
  readonly kind?: never;
};
export function spellBurstAbilityEvent(
  event: AbilityEventCandidate,
): SpellBurstAbilityEvent | undefined {
  if (!('event' in event) || event.event !== 'beforeOutputSpellBurst') return undefined;
  return event;
}
/** 角色承术与敌人附着四阶段分开；允许原载荷未提供元素。 */
export function characterInflictionAbilityEvent(
  event: AbilityEventCandidate,
): CharacterInflictionAbilityEvent | undefined {
  if (!('event' in event) || event.event !== 'beforeTakeSpellInfliction') return undefined;
  return event;
}

export type SkillAbilityEvent = CombatAbilityEvent<
  'beforeCastSkill' | 'afterSkillApplyCost' | 'skillEnd'
> & { readonly kind?: never };
/** 当前施法身份和继承来源相互独立；保留原始挂载端口，不重建技能对象。 */
export function skillAbilityEvent(event: AbilityEventCandidate): SkillAbilityEvent | undefined {
  if (
    !('event' in event) ||
    (event.event !== 'beforeCastSkill' &&
      event.event !== 'afterSkillApplyCost' &&
      event.event !== 'skillEnd')
  )
    return undefined;
  return event;
}

export type LifecycleAbilityEvent = CombatAbilityEvent<
  | 'enterFight'
  | 'ownerSwitchToCenter'
  | 'ownerSwitchToGuard'
  | 'ownerHpZero'
  | 'hpChanged'
  | 'abilityEntitySpawned'
  | 'abilityEntityFinished'
> & { readonly kind?: never };
/** 生命周期只识别原始发布身份，不合并事件或重建出生/结束时的实体关系。 */
export function lifecycleAbilityEvent(
  event: AbilityEventCandidate,
): LifecycleAbilityEvent | undefined {
  if (!('event' in event)) return undefined;
  switch (event.event) {
    case 'enterFight':
    case 'ownerSwitchToCenter':
    case 'ownerSwitchToGuard':
    case 'ownerHpZero':
    case 'hpChanged':
    case 'abilityEntitySpawned':
    case 'abilityEntityFinished': {
      return event;
    }
    default:
      return undefined;
  }
}

export type WeaknessAbilityEvent = CombatAbilityEvent<
  'weaknessSet' | 'afterOutputWeaknessTriggered'
> & { readonly kind?: never };
export type CustomAbilityEvent = CombatAbilityEvent<'customAbilityEvent'> & {
  readonly kind?: never;
};
/** 设置与触发是两个原生事件；此处仅识别，不互相转换。 */
export function weaknessAbilityEvent(
  event: AbilityEventCandidate,
): WeaknessAbilityEvent | undefined {
  if (
    !('event' in event) ||
    (event.event !== 'weaknessSet' && event.event !== 'afterOutputWeaknessTriggered')
  )
    return undefined;
  return event;
}
/** 自定义事件的名称和参数保持原值，不推测名称语义。 */
export function customAbilityEvent(event: AbilityEventCandidate): CustomAbilityEvent | undefined {
  if (!('event' in event) || event.event !== 'customAbilityEvent') return undefined;
  return event;
}

export type PoiseAbilityEvent = CombatAbilityEvent<'poiseZero' | 'poiseKnotBreak'> & {
  readonly kind?: never;
};
export type ShieldAbilityEvent = CombatAbilityEvent<'afterAddedShield'> & { readonly kind?: never };
/** 失衡事件保留发布端载荷，不压平来源、目标或施法信息。 */
export function poiseAbilityEvent(event: AbilityEventCandidate): PoiseAbilityEvent | undefined {
  if (!('event' in event) || (event.event !== 'poiseZero' && event.event !== 'poiseKnotBreak'))
    return undefined;
  return event;
}
/** 护盾新增量与当前值保持独立；识别事件不重新计算或复制它们。 */
export function shieldAbilityEvent(event: AbilityEventCandidate): ShieldAbilityEvent | undefined {
  if (!('event' in event) || event.event !== 'afterAddedShield') return undefined;
  return event;
}

/**
 * 发布和消费共用的事件载荷。事件身份在外层，载荷不再另造 kind 或重命名字段。
 * 原生依据：combo-event-gates-and-pending、origin-skill-event-context、buff-ability-event-actions。
 * 对象由发布者持有；同步修改端口和嵌套对象仍是原始引用，不序列化/复制。
 */
export type NativeKillEvent = CombatAbilityEvent<'afterKillEntity'> & { readonly kind?: never };

/** 击杀沿用结算载荷与发布对象，不经 Buff 专用事件适配。 */
export function killAbilityEvent(event: AbilityEventCandidate): NativeKillEvent | undefined {
  return 'event' in event && event.event === 'afterKillEntity' ? event : undefined;
}

/** 附着四阶段使用生产者的完整载荷，保留 isExtra 与施法来源，不压平为第二套事件。 */
export type InflictionAbilityEvent = CombatAbilityEvent<
  | 'beforeOutputInfliction'
  | 'beforeTakeInfliction'
  | 'afterOutputInfliction'
  | 'afterTakeInfliction'
> & { readonly kind?: never };
export function inflictionAbilityEvent(
  event: AbilityEventCandidate,
): InflictionAbilityEvent | undefined {
  if (!('event' in event)) return undefined;
  switch (event.event) {
    case 'beforeOutputInfliction':
    case 'beforeTakeInfliction':
    case 'afterOutputInfliction':
    case 'afterTakeInfliction':
      return event;
    default:
      return undefined;
  }
}

/** 仅返回事件实际携带的目标；无目标事件不得补造敌人或自身。 */
export function abilityEventTargetId(event: CombatAbilityEvent): string | undefined {
  return 'targetId' in event.payload ? event.payload.targetId : undefined;
}
export function abilityEventSourceId(event: CombatAbilityEvent): string {
  return 'sourceId' in event.payload ? event.payload.sourceId : event.payload.sourceOperatorId;
}

/** 实际 AbilitySystem 的只读 reset 端口；不是另一个可配置事件。 */
export interface AbilityResetReference {
  /** 运行时对象身份，用于保存回收订阅的目标；事件查询不应把它当作伤害目标。 */
  readonly instanceId: number;
  onReset(callback: () => void): { readonly registrationId: number; dispose(): void };
}

/** 出生实例的只读生命周期端口；reset不是可配置的公共事件。 */
export interface AbilityEntitySpawnedPayload extends AbilityOriginPayload {
  readonly entity: AbilityResetReference;
}

/** 原生 163 的发射来源、原始施法信息和实际投射物对象；不伪造逻辑实体 ID。 */
export interface ProjectileLaunchedPayload {
  readonly sourceId: string;
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly entity: AbilityResetReference;
}

/** 投射物命中闪避角色前的原生上下文；它不等同于伤害包。 */
export interface ProjectileHitAbilityEventPayload extends AbilityOriginPayload {
  readonly isInPerfectDodgeCooldown: boolean;
  readonly ignoreImmuneLevel: number;
}

export interface AbilityPhysicalInflictionPayload extends AbilityOriginPayload {
  readonly type?: PhysicalInflictionType;
  readonly attachBuffToCurrentSkill?: (buff: BuffApplicationHandle) => void;
}

export interface AbilityKnockDownPayload extends AbilityOriginPayload {
  readonly fromAirborne: boolean;
}

export interface AbilitySpellInflictionPayload extends AbilityOriginPayload {
  readonly element?: InflictionElement;
}

export interface AbilitySpellBurstPayload extends AbilityOriginPayload {
  readonly burstType: string;
}

/** 运行时实例的事件读取端口；仍传同一对象，不复制黑板或携带容器操作权限。 */
export type EventBuffInstance = Pick<
  CombatBuff<string>,
  'instanceId' | 'blackboard' | 'isFinished'
>;

/** 输出后携带实际实例；跟踪者只取得身份读取与回收订阅权限。 */
export interface AbilityOutputBuffPayload extends BuffAppliedEvent {
  readonly buff: EventBuffInstance &
    Pick<CombatBuff<string>, 'affixSkillCastId' | 'skillCastInfo'> & {
      onRecycled(callback: () => void): { readonly registrationId: number; dispose(): void };
    };
}

export interface AbilityFinishedBuffPayload extends AbilityOriginPayload {
  readonly buff: EventBuffInstance;
  readonly buffId: string;
  readonly buffTags: readonly GameplayTag[];
  readonly reason: BuffFinishReason;
}

export interface AbilityConsumedBuffPayload extends AbilityOriginPayload {
  readonly buff: EventBuffInstance;
  readonly buffId: string;
  readonly buffTags: readonly GameplayTag[];
  readonly layers: number;
  readonly blackboardValues?: Readonly<Record<string, string | number | null>>;
}

/** OnBuffEnhanceChanged 在 Buff owner 上广播，不具有动作目标。 */
export interface AbilityBuffEnhancePayload {
  readonly sourceId: string;
  /** 原生 BuffContext 保留实际实例，结束后仍可读取，不能重新查询活动 Buff。 */
  readonly buff: CombatBuff<string>;
  readonly buffId: string;
  readonly buffTags: readonly GameplayTag[];
  /** 正向为本次施加来源，负向为结束/减层来源；不回退 Buff 初始来源。 */
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly layerCount: number;
  readonly reason?: BuffFinishReason;
}

export interface AbilitySkillPayload extends SkillCastEventData {
  readonly attachBuffToCurrentSkill?: (buff: BuffApplicationHandle) => void;
}

export interface AbilityHealPayload extends AbilityEntityPair {
  readonly requestedHealing: number;
  readonly actualHealing: number;
  readonly overhealing: number;
  readonly tags: readonly GameplayTag[];
}

export interface AbilityShieldPayload extends AbilityEntityPair {
  readonly gainedValue: number;
  readonly currentValue: number;
}

export interface AbilityCustomPayload extends AbilityEntityPair {
  readonly eventName: string;
  readonly eventParam: number;
}

/** OnObtainAtb 的来源/方式及请求量/实增量；skillSpGained 是历史契约名称，不限定 Skill/Gain。 */
export interface AbilitySpGainPayload {
  readonly sourceOperatorId: string;
  readonly source: SpGainSource;
  readonly gainKind: SpGainKind;
  readonly requestedAmount: number;
  readonly amount: number;
}

export type SpGainAbilityEvent = CombatAbilityEvent<'skillSpGained'> & { readonly kind?: never };
export function spGainAbilityEvent(event: AbilityEventCandidate): SpGainAbilityEvent | undefined {
  return 'event' in event && event.event === 'skillSpGained' ? event : undefined;
}

/** 每个公共事件只在此关联一种载荷；不按 Buff/技能/装备重新定义范围。 */
export interface AbilityEventPayloadMap {
  projectileLaunched: ProjectileLaunchedPayload;
  beforeHitByProjectile: ProjectileHitAbilityEventPayload;
  enterFight: AbilityOriginPayload;
  ownerSwitchToCenter: AbilityOriginPayload;
  ownerSwitchToGuard: AbilityOriginPayload;
  ownerHpZero: AbilityOriginPayload;
  hpChanged: AbilityOriginPayload;
  abilityEntitySpawned: AbilityEntitySpawnedPayload;
  abilityEntityFinished: AbilityOriginPayload;
  // 准备阶段传递可变伤害包，结算阶段传递结算结果；不能裁成相似的只读字段集合。
  beforeTakeDamage: HealthDamageEventPayload | ExternalOperatorHitPayload;
  beforeCalculateDamage: PlayerDamageContext;
  beforeDamageAction: PlayerDamageContext;
  beforeOutputDamage: HealthDamageEventPayload;
  takeDamage: HealthDamageEventPayload | ExternalOperatorHitPayload;
  takeCriticalDamage: HealthDamageEventPayload;
  outputDamage: HealthDamageEventPayload;
  outputCriticalDamage: HealthDamageEventPayload;
  beforeTakePhysicalInfliction: AbilityPhysicalInflictionPayload;
  afterTakePhysicalInfliction: AbilityPhysicalInflictionPayload;
  beforeOutputPhysicalInfliction: AbilityPhysicalInflictionPayload;
  afterOutputPhysicalInfliction: AbilityPhysicalInflictionPayload;
  beforeOutputKnockDown: AbilityKnockDownPayload;
  afterOutputKnockDown: AbilityKnockDownPayload;
  outputKnockDown: AbilityEntityPair;
  beforeOutputInfliction: ElementalInflictionEventPayload;
  afterOutputInfliction: ElementalInflictionEventPayload;
  beforeTakeSpellInfliction: AbilitySpellInflictionPayload;
  beforeTakeInfliction: ElementalInflictionEventPayload;
  afterTakeInfliction: ElementalInflictionEventPayload;
  beforeOutputSpellBurst: AbilitySpellBurstPayload;
  outputHeal: AbilityHealPayload;
  receiveHeal: AbilityHealPayload;
  afterAddedShield: AbilityShieldPayload;
  poiseZero: AbilityOriginPayload;
  poiseKnotBreak: AbilityOriginPayload;
  beforeCastSkill: AbilitySkillPayload;
  afterSkillApplyCost: AbilitySkillPayload;
  skillEnd: AbilitySkillPayload;
  beforeOutputBuff: BuffAppliedEvent;
  beforeAddedBuff: BuffAppliedEvent;
  outputBuff: AbilityOutputBuffPayload;
  addedBuff: BuffAppliedEvent;
  finishedBuff: AbilityFinishedBuffPayload;
  buffEndsEarly: AbilityFinishedBuffPayload;
  buffEnhanceChanged: AbilityBuffEnhancePayload;
  afterOutputWeaknessTriggered: AbilityEntityPair;
  weaknessSet: { readonly sourceId: string };
  customAbilityEvent: AbilityCustomPayload;
  afterKillEntity: HealthDamageEventPayload;
  buffConsumed: AbilityConsumedBuffPayload;
  buffAbsorbed: AbilityConsumedBuffPayload;
  skillSpGained: AbilitySpGainPayload;
  perfectDodge: AbilityOriginPayload;
}

/** 按事件名索引，保留 event 与 payload 的关联；新增公共事件必须补齐载荷定义。 */
export type CombatAbilityEvent<Event extends AbilityEvent = AbilityEvent> = AbilityEventFromMap<
  Event,
  AbilityEventPayloadMap
>;

/** 内部强类型事件的来源读取；不解析任意对象，不回退动作宿主或外层事件。 */
export function abilityEventSkillCastInfo(
  event: CombatAbilityEvent,
): CombatSkillCastInfo | null | undefined {
  return 'skillCastInfo' in event.payload ? event.payload.skillCastInfo : undefined;
}
/** 保留统一事件与载荷的关联；kind 仅用于和手工语义标记进行类型判别。 */
export type AbilityResponseEvent = CombatAbilityEvent<AbilityResponseEventName> & {
  readonly kind?: never;
};

/** 四个施加阶段共用 AddBuffContext 数据，但必须保留各自的事件身份。 */
export type BuffApplicationAbilityEvent = CombatAbilityEvent<
  'beforeOutputBuff' | 'beforeAddedBuff' | 'addedBuff' | 'outputBuff'
> & { readonly kind?: never };

export function buffApplicationEvent(
  event: CombatAbilityEvent,
): BuffApplicationAbilityEvent | undefined {
  switch (event.event) {
    case 'beforeOutputBuff':
    case 'beforeAddedBuff':
    case 'addedBuff':
    case 'outputBuff':
      return event;
    default:
      return undefined;
  }
}

/** Buff 通知共用身份与数据读取；结束与消耗的不同字段仍由事件名判别。 */
export type BuffAbilityEvent =
  | BuffApplicationAbilityEvent
  | (CombatAbilityEvent<
      'finishedBuff' | 'buffEndsEarly' | 'buffConsumed' | 'buffAbsorbed' | 'buffEnhanceChanged'
    > & {
      readonly kind?: never;
    });

export function buffAbilityEvent(event: CombatAbilityEvent): BuffAbilityEvent | undefined {
  switch (event.event) {
    case 'finishedBuff':
    case 'buffEndsEarly':
    case 'buffConsumed':
    case 'buffAbsorbed':
    case 'buffEnhanceChanged':
      return event;
    default:
      return buffApplicationEvent(event);
  }
}

/** 两侧成功治疗通知共享载荷结构，但发布者与事件身份保持独立。 */
export type HealAbilityEvent = CombatAbilityEvent<'outputHeal' | 'receiveHeal'> & {
  readonly kind?: never;
};
export function healAbilityEvent(event: AbilityEventCandidate): HealAbilityEvent | undefined {
  return 'event' in event && (event.event === 'outputHeal' || event.event === 'receiveHeal')
    ? event
    : undefined;
}

/** 准备阶段保留可变伤害包，结算阶段保留结果，禁止裁成只读字段副本。 */
export type DamageAbilityEvent = CombatAbilityEvent<
  | 'beforeDamageAction'
  | 'beforeCalculateDamage'
  | 'beforeOutputDamage'
  | 'beforeTakeDamage'
  | 'takeDamage'
  | 'takeCriticalDamage'
  | 'outputDamage'
  | 'outputCriticalDamage'
> & { readonly kind?: never };
export function damageAbilityEvent(event: AbilityEventCandidate): DamageAbilityEvent | undefined {
  if (!('event' in event)) return undefined;
  switch (event.event) {
    case 'beforeDamageAction':
    case 'beforeCalculateDamage':
    case 'beforeOutputDamage':
    case 'beforeTakeDamage':
    case 'takeDamage':
    case 'takeCriticalDamage':
    case 'outputDamage':
    case 'outputCriticalDamage':
      return event;
    default:
      return undefined;
  }
}

/** 极限闪避标记声明的可闪避受击：只通知监听器，不写入生命或伤害结果。 */
export interface ExternalOperatorHitPayload {
  readonly external: true;
  readonly sourceId: 'enemy';
  readonly targetId: string;
  readonly damageType?: import('../../game-data/operatorDefinition').DamageType;
  readonly tags: readonly import('../../game-data/operatorDefinition').DamageTag[];
  readonly features: readonly import('../../game-data/operatorDefinition').DamageFeature[];
  readonly result?: never;
  readonly skillCastInfo?: never;
}

/** 通用物理异常与控制组件专属通知保留不同载荷，不混成同一种“击倒”。 */
export type PhysicalAbilityEvent = CombatAbilityEvent<
  | 'beforeTakePhysicalInfliction'
  | 'beforeOutputPhysicalInfliction'
  | 'afterTakePhysicalInfliction'
  | 'afterOutputPhysicalInfliction'
> & { readonly kind?: never };
export type KnockDownAbilityEvent = CombatAbilityEvent<
  'beforeOutputKnockDown' | 'afterOutputKnockDown'
> & { readonly kind?: never };
export function physicalAbilityEvent(
  event: AbilityEventCandidate,
): PhysicalAbilityEvent | undefined {
  if (!('event' in event)) return undefined;
  switch (event.event) {
    case 'beforeTakePhysicalInfliction':
    case 'beforeOutputPhysicalInfliction':
    case 'afterTakePhysicalInfliction':
    case 'afterOutputPhysicalInfliction':
      return event;
    default:
      return undefined;
  }
}
export function knockDownAbilityEvent(
  event: AbilityEventCandidate,
): KnockDownAbilityEvent | undefined {
  if (
    !('event' in event) ||
    (event.event !== 'beforeOutputKnockDown' && event.event !== 'afterOutputKnockDown')
  )
    return undefined;
  return event;
}

/** 正向增强尝试固定+1（包括满层），结束/减层为负数；不是当前总层数或统一的实际层差。 */
export type BuffEnhanceAbilityEvent = CombatAbilityEvent<'buffEnhanceChanged'> & {
  readonly kind?: never;
};
export function buffEnhanceAbilityEvent(
  event: AbilityEventCandidate,
): BuffEnhanceAbilityEvent | undefined {
  if (!('event' in event) || event.event !== 'buffEnhanceChanged') return undefined;
  return event;
}
