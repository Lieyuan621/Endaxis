/**
 * 已计算生命伤害与目标生命状态之间的写入边界。
 * 只能在承伤事件完成后的正确阶段调用，避免提前改变后续监听器看到的生命值。
 */
import type { DamageFeature, DamageTag, DamageType } from '../../game-data/operatorDefinition';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatVitals, HealthDamageResult } from '../resources/combatVitals';
import type { CombatSkillCastInfo } from '../state/foundationState';
import type { GameplayTag } from '../tags/gameplayTags';
import type { CombatClock } from '../time/combatClock';
import type { PlayerActiveDamageResult } from './playerActiveDamage';

export const HEALTH_DAMAGE_EVENTS = [
  'beforeTakeDamage',
  'beforeOutputDamage',
  'beforeKillEntity',
  'afterKillEntity',
  'takeDamage',
  'outputDamage',
] as const;
/** 生命伤害写入前后向来源方和目标方发布的事件。 */
export type HealthDamageEvent = (typeof HEALTH_DAMAGE_EVENTS)[number];
/** 生命伤害结算中由攻击来源接收的事件。 */
export type HealthDamageSourceEvent = Extract<
  HealthDamageEvent,
  'beforeOutputDamage' | 'beforeKillEntity' | 'afterKillEntity' | 'outputDamage'
>;
/** 生命伤害结算中由承伤目标接收的事件。 */
export type HealthDamageTargetEvent = Extract<HealthDamageEvent, 'beforeTakeDamage' | 'takeDamage'>;

/** 生命伤害事件共享的伤害包、请求值和实际值。 */
export interface HealthDamageEventPayload {
  /** Endaxis 执行程序的组键，不是原生字段或继承来源；仅输出方携带，不按 skillId 推断。 */
  readonly executingSkillGroupKey?: string;
  /** 来源动作的施法身份；null 表示确实没有继承，undefined 表示生产端尚未接入。 */
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly sourceId: string;
  readonly targetId: string;
  readonly damageType: DamageType;
  readonly tags: readonly DamageTag[];
  readonly gameplayTags?: readonly GameplayTag[];
  readonly features: readonly DamageFeature[];
  readonly result: PlayerActiveDamageResult;
  /** 本次伤害是否派发暴击后续事件；期望模式可为 true，而显示结果仍不是一次实际暴击。 */
  readonly triggersCriticalEffects?: boolean;
}

/** 旧版伤害详情能够直接显示、且已经由本次公式确定的冻结值。 */
export interface HealthDamageReceiptDetail {
  readonly 'damageScale:normal:attacker'?: number;
  readonly 'damageScale:normal:defender'?: number;
  readonly attackDetailRawBase?: number;
  readonly attackDetailArmedBase?: number;
  readonly attackDetailActualBase?: number;
  readonly attackDetailMinimum?: number;
  readonly attackDetailMaximum?: number;
  readonly 'attackDetailSlot:addition'?: number;
  readonly 'attackDetailSlot:multiplier'?: number;
  readonly 'attackDetailSlot:finalAddition'?: number;
  readonly 'attackDetailSlot:finalMultiplier'?: number;
  readonly 'attackDetailSlot:baseAddition'?: number;
  readonly 'attackDetailSlot:baseMultiplier'?: number;
  readonly 'attackDetailSlot:baseFinalAddition'?: number;
  readonly 'attackDetailSlot:baseFinalMultiplier'?: number;
  /** 原生动作明确的暴击许可；缺省不代表禁止，不能用暴击率为零替代。 */
  readonly canCritical?: boolean;
  /** 执行伤害动作的真实 Buff 身份；所属实体不一定是伤害目标。 */
  readonly buffId?: string;
  readonly buffInstanceId?: number;
  readonly buffOwnerId?: string;
  readonly sourceActionId?: string;
  /** 本次伤害的明确爆发分类；来自伤害标签或旧兼容执行器，不通过同帧事件推测。 */
  readonly spellBurstType?: string;
  readonly spellBurstEnhanceFactor?: number;
  readonly skillType?: string;
  readonly attack?: number;
  readonly attackDetailOperatorBase?: number;
  readonly attackDetailWeaponBase?: number;
  readonly attackDetailAttackPercent?: number;
  readonly attackDetailFlatAttack?: number;
  readonly attackDetailMainAttribute?: string;
  readonly attackDetailSecondaryAttribute?: string;
  readonly attackDetailStrength?: number;
  readonly attackDetailAgility?: number;
  readonly attackDetailIntellect?: number;
  readonly attackDetailWill?: number;
  readonly attackDetailStrengthCoefficient?: number;
  readonly attackDetailAgilityCoefficient?: number;
  readonly attackDetailIntellectCoefficient?: number;
  readonly attackDetailWillCoefficient?: number;
  readonly baseDamage?: number;
  readonly finalAttackValue?: number;
  readonly standardCalculation?: boolean;
  readonly skillMultiplierPercent?: number;
  readonly calculationMultiplier?: number;
  readonly damageScaleMultiplier?: number;
  readonly criticalRate?: number;
  readonly criticalDamageIncrease?: number;
  /** 期望伤害中的暴击期望倍率；在公式执行边界冻结，投影层不得重算。 */
  readonly criticalExpectationMultiplier?: number;
  readonly nonCriticalDamage?: number;
  readonly criticalDamage?: number;
  readonly expectedDamage?: number;
  readonly enemyDefense?: number;
  readonly enemyResistancePercent?: number;
  readonly damageTakenMultiplier?: number;
  readonly weaknessDamageMultiplier?: number;
  readonly shelterDamageMultiplier?: number;
  /** 除暴击、防御、抗性与承伤外，本次伤害实际使用的合并倍率。 */
  readonly directDamageMultiplier?: number;
  /** 仅由伤害类型和抗性百分比得到的倍率，不含独立承伤倍率。 */
  readonly resistancePercentMultiplier?: number;
}

/** 在正确事件边界写入一次生命伤害所需的状态和端口。 */
export interface ExecuteHealthDamageInput {
  readonly producedBy?: import('../receipt/combatReceipt').CombatObjectRef;
  readonly executingSkillGroupKey?: HealthDamageEventPayload['executingSkillGroupKey'];
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly sourceId: string;
  readonly targetId: string;
  readonly damageType: DamageType;
  readonly tags: readonly DamageTag[];
  readonly gameplayTags?: readonly GameplayTag[];
  readonly features?: readonly DamageFeature[];
  readonly result: PlayerActiveDamageResult;
  /** 缺省沿用实际暴击结果；期望模式由伤害执行器显式给出确定性的后续效果策略。 */
  readonly triggersCriticalEffects?: boolean;
  /** 伤害详情使用的公式冻结值；只记录已参与本次结算的标量，不在投影层重算规则。 */
  readonly detail?: HealthDamageReceiptDetail;
  readonly appliedDamageModifiers?: readonly import('./damageScale').AppliedDamageModifier[];
  readonly target: CombatVitals;
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  /** 这个步骤在定义里的名字（如果有）。命中点提示用它把伤害日志对应到具体命中点。 */
  readonly stepKey?: string;
  /** 存档中的技能释放身份；命中回执凭它与具体施放对应。 */
  readonly castId?: string;
  /** 存档中的命中身份；命中回执凭它与具体命中点对应。 */
  readonly hitId?: string;
  readonly emitSourceEvent: (
    event: HealthDamageSourceEvent,
    payload: HealthDamageEventPayload,
  ) => void;
  readonly emitTargetEvent: (
    event: HealthDamageTargetEvent,
    payload: HealthDamageEventPayload,
  ) => void;
  /** OnBeforeTake/OutputDamage 之后、生命写入之前执行的目标护盾链。 */
  readonly absorbDamage?: (damageType: DamageType, value: number) => number;
}

/** 在已还原的公式后边界应用解析完成的玩家主动伤害。 */
export function executeHealthDamage(input: ExecuteHealthDamageInput): HealthDamageResult {
  const spellBurstType = spellBurstTypeFromDamageTags(input.tags);
  const beforePayload: HealthDamageEventPayload = {
    sourceId: input.sourceId,
    targetId: input.targetId,
    damageType: input.damageType,
    tags: input.tags,
    gameplayTags: input.gameplayTags ?? [],
    features: input.features ?? [],
    result: input.result,
    triggersCriticalEffects: input.triggersCriticalEffects ?? input.result.isCritical,
  };
  // TakeDamageContext 不含施法身份；只为原生 OutputDamageContext 分支附加来源。
  const sourceBeforePayload = {
    ...beforePayload,
    ...(input.executingSkillGroupKey === undefined
      ? {}
      : { executingSkillGroupKey: input.executingSkillGroupKey }),
    ...(input.skillCastInfo === undefined ? {} : { skillCastInfo: input.skillCastInfo }),
  };

  input.emitTargetEvent('beforeTakeDamage', beforePayload);
  input.emitSourceEvent('beforeOutputDamage', sourceBeforePayload);
  const result =
    input.absorbDamage === undefined
      ? input.result
      : { ...input.result, value: input.absorbDamage(input.damageType, input.result.value) };
  const payload: HealthDamageEventPayload = { ...beforePayload, result };
  const mayKillTarget = input.target.health > 0 && result.value >= input.target.health;
  if (mayKillTarget) input.emitSourceEvent('beforeKillEntity', payload);
  const stateChange = input.target.takeDamage(result.value);
  if (mayKillTarget && stateChange.currentHealth === 0) {
    input.emitSourceEvent('afterKillEntity', payload);
  }
  input.receipt.record({
    ...(input.producedBy === undefined ? {} : { producedBy: input.producedBy }),
    frame: input.clock.frame,
    time: input.clock.time,
    event: 'DamageApplied',
    ...(input.appliedDamageModifiers?.length
      ? { appliedDamageModifiers: input.appliedDamageModifiers }
      : {}),
    sourceId: input.sourceId,
    targetId: input.targetId,
    data: {
      damageType: input.damageType,
      value: result.value,
      damageBeforeAbsorption: input.result.value,
      actualDamage: stateChange.actualDamage,
      remainingHealth: stateChange.currentHealth,
      isCritical: result.isCritical,
      criticalMultiplier: result.criticalMultiplier,
      defenseMultiplier: result.defenseMultiplier,
      resistanceMultiplier: result.resistanceMultiplier,
      weaknessShelterMultiplier: result.weaknessShelterMultiplier,
      runtimeExtensionMultiplier: result.runtimeExtensionMultiplier,
      igniteMultiplier: result.igniteMultiplier,
      physicalInflictionMultiplier: result.physicalInflictionMultiplier,
      ...input.detail,
      ...(spellBurstType === undefined ? {} : { spellBurstType }),
      ...(input.stepKey === undefined ? {} : { stepKey: input.stepKey }),
      ...(input.castId === undefined ? {} : { castId: input.castId }),
      ...(input.hitId === undefined ? {} : { hitId: input.hitId }),
    },
  });
  input.emitTargetEvent('takeDamage', payload);
  input.emitSourceEvent('outputDamage', { ...sourceBeforePayload, result });
  return stateChange;
}

/** 只翻译伤害本身的明确分类，不从元素、技能类型或相邻爆发事件反推。多分类不强选其一。 */
function spellBurstTypeFromDamageTags(tags: readonly DamageTag[]): string | undefined {
  const names: Partial<Record<DamageTag, string>> = {
    fireBurst: 'Fire',
    electricBurst: 'Pulse',
    cryoBurst: 'Cryst',
    natureBurst: 'Natural',
  };
  const types = new Set(tags.flatMap(tag => (names[tag] === undefined ? [] : [names[tag]!])));
  return types.size === 1 ? [...types][0] : undefined;
}
