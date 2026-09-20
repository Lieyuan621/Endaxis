import { freezeAttackReceiptDetail, type AttackReceiptSnapshot } from './attackReceiptDetail';
import type { HealthDamageReceiptDetail } from './healthDamage';
import type { PlayerActiveDamageInput, PlayerActiveDamageResult } from './playerActiveDamage';

/** 冻结法术爆发和 Buff 倍率伤害已参与结算的值；不重新结算或推进随机流。 */
export function freezeAttackScaledDamageReceiptDetail(
  input: PlayerActiveDamageInput,
  damage: PlayerActiveDamageResult,
  attack: number,
  scale: number,
  attackDetail: AttackReceiptSnapshot | undefined,
): HealthDamageReceiptDetail {
  const nonCriticalDamage = damage.value / damage.criticalMultiplier;
  const criticalExpectationMultiplier =
    1 + Math.min(Math.max(input.criticalRate, 0), 1) * input.criticalDamageIncrease;
  return {
    ...freezeAttackReceiptDetail(attack, attackDetail),
    attack,
    baseDamage: attack * scale,
    finalAttackValue: input.finalAttackValue,
    standardCalculation: true,
    skillMultiplierPercent: scale * 100,
    calculationMultiplier: 1,
    damageScaleMultiplier: 1,
    criticalRate: input.criticalRate,
    criticalDamageIncrease: input.criticalDamageIncrease,
    criticalExpectationMultiplier,
    nonCriticalDamage,
    criticalDamage: nonCriticalDamage * (1 + input.criticalDamageIncrease),
    expectedDamage: nonCriticalDamage * criticalExpectationMultiplier,
    enemyDefense: input.defense,
    enemyResistancePercent: input.resistancePercent,
    damageTakenMultiplier: input.damageTakenMultiplier,
    directDamageMultiplier:
      damage.weaknessShelterMultiplier *
      damage.runtimeExtensionMultiplier *
      damage.igniteMultiplier *
      damage.physicalInflictionMultiplier,
    resistancePercentMultiplier:
      input.damageType === 'true' ? 1 : Math.max(0, 1 - input.resistancePercent / 100),
    weaknessDamageMultiplier: input.weaknessDamageMultiplier,
    shelterDamageMultiplier: input.shelterDamageMultiplier,
  };
}
