/**
 * 标准玩家主动生命伤害的无状态纯公式。
 * 调用方必须传入已完全解析的数据；为便于与运行时轨迹比对，不得改写乘法顺序或精度边界。
 */
import type { DamageType } from '../../game-data/operatorDefinition';

/** 抗性公式准入；新增伤害类型必须明确归属，不自动套用现有抗性公式。 */
const DAMAGE_TYPE_USES_RESISTANCE = {
  physical: true,
  heat: true,
  electric: true,
  cryo: true,
  nature: true,
  ether: true,
  true: false,
  lifeDrain: false,
} as const satisfies Record<DamageType, boolean>;

export type ResistibleDamageType = {
  [K in DamageType]: (typeof DAMAGE_TYPE_USES_RESISTANCE)[K] extends true ? K : never;
}[DamageType];

export function usesDamageResistance(damageType: DamageType): damageType is ResistibleDamageType {
  return DAMAGE_TYPE_USES_RESISTANCE[damageType];
}

const DEFAULT_DEFENSE_EFFICIENCY = 0.01;
const CRITICAL_PROBABILITY_TOLERANCE = 0.00001;

/** 已还原的玩家主动伤害公式使用的完整解析输入。 */
export interface PlayerActiveDamageInput {
  readonly finalAttackValue: number;
  readonly damageType: DamageType;
  readonly criticalRate: number;
  readonly criticalDamageIncrease: number;
  readonly criticalSample: number;
  readonly defense: number;
  readonly resistancePercent: number;
  readonly damageTakenMultiplier: number;
  readonly weaknessDamageMultiplier: number;
  readonly shelterDamageMultiplier: number;
  readonly runtimeExtensionMultiplier: number;
  readonly igniteDamageMultiplier: number;
  readonly appliesIgniteDamageMultiplier: boolean;
  readonly physicalInflictionDamageMultiplier: number;
  readonly appliesPhysicalInflictionDamageMultiplier: boolean;
}

/** 纯生命伤害公式的最终数值及关键中间倍率。 */
export interface PlayerActiveDamageResult {
  readonly value: number;
  readonly isCritical: boolean;
  readonly criticalMultiplier: number;
  readonly defenseMultiplier: number;
  readonly resistanceMultiplier: number;
  readonly weaknessShelterMultiplier: number;
  readonly runtimeExtensionMultiplier: number;
  readonly igniteMultiplier: number;
  readonly physicalInflictionMultiplier: number;
}

export function calculatePlayerActiveDamage(
  input: PlayerActiveDamageInput,
): PlayerActiveDamageResult {
  if (input.damageType === 'lifeDrain') {
    throw new Error('life-drain damage uses a separate native calculation branch');
  }

  const isCritical = isCriticalHit(input.criticalRate, input.criticalSample);
  const criticalMultiplier = isCritical ? 1 + input.criticalDamageIncrease : 1;
  const defenseMultiplier = getDefenseMultiplier(input.damageType, input.defense);
  const resistanceMultiplier = getResistanceMultiplier(
    input.damageType,
    input.resistancePercent,
    input.damageTakenMultiplier,
  );
  const weaknessShelterMultiplier =
    input.weaknessDamageMultiplier * (1 - input.shelterDamageMultiplier);
  const igniteMultiplier = input.appliesIgniteDamageMultiplier ? input.igniteDamageMultiplier : 1;
  const physicalInflictionMultiplier = input.appliesPhysicalInflictionDamageMultiplier
    ? input.physicalInflictionDamageMultiplier
    : 1;

  // 保持原生乘法顺序，便于后续逐项对比浮点轨迹。
  let value = input.weaknessDamageMultiplier * input.finalAttackValue;
  value *= criticalMultiplier;
  value *= defenseMultiplier;
  value *= 1 - input.shelterDamageMultiplier;
  value *= resistanceMultiplier;
  value *= input.runtimeExtensionMultiplier;
  value *= igniteMultiplier;
  value *= physicalInflictionMultiplier;

  return {
    value,
    isCritical,
    criticalMultiplier,
    defenseMultiplier,
    resistanceMultiplier,
    weaknessShelterMultiplier,
    runtimeExtensionMultiplier: input.runtimeExtensionMultiplier,
    igniteMultiplier,
    physicalInflictionMultiplier,
  };
}

export function isCriticalHit(criticalRate: number, sample: number): boolean {
  if (sample < 0 || sample > 1 || Number.isNaN(sample)) {
    throw new RangeError('critical sample must be between 0 and 1');
  }
  return (
    criticalRate > CRITICAL_PROBABILITY_TOLERANCE &&
    criticalRate + CRITICAL_PROBABILITY_TOLERANCE >= sample
  );
}

export function getDefenseMultiplier(damageType: DamageType, defense: number): number {
  if (damageType === 'true') return 1;
  return defense >= -0.00001
    ? 1 / (1 + DEFAULT_DEFENSE_EFFICIENCY * defense)
    : 2 - Math.pow(1 - DEFAULT_DEFENSE_EFFICIENCY, -defense);
}

export function getResistanceMultiplier(
  damageType: DamageType,
  resistancePercent: number,
  damageTakenMultiplier: number,
): number {
  if (!usesDamageResistance(damageType)) return 1;
  return Math.max(0, (1 - resistancePercent / 100) * damageTakenMultiplier);
}
