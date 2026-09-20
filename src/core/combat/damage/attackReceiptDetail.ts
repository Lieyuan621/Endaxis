import type { HealthDamageReceiptDetail } from './healthDamage';
import type { OperatorAttribute } from '../../game-data/operatorDefinition';
import type { ResolvedOperatorPanel } from '../../compiler/resolveOperatorPanel';
import type { CombatAttributeSet } from '../attributes/combatAttributes';
import { ATTRIBUTE_MODIFIER_SLOTS, attributeModifierValues } from '../attributes/combatAttributes';
import { ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE } from '../attributes/operatorAttackAttributes';
import type { AttackReceiptSnapshot } from '../state/foundationState';
export type { AttackReceiptSnapshot } from '../state/foundationState';

/** 攻击公式真正读取的属性，用于实时与快照伤害的直接来源采集。 */
export function attackReceiptAttributes(
  detail: AttackReceiptSnapshot | undefined,
): readonly string[] {
  const result = ['Atk'];
  if (detail === undefined) return result;
  for (const attribute of Object.keys(
    ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE,
  ) as OperatorAttribute[]) {
    if (detail.coefficients[attribute] !== 0) result.push(attribute);
    if (Math.floor(detail.attributes[attribute]) !== 0)
      result.push(ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE[attribute]);
  }
  return result;
}

export function captureAttackReceiptSnapshot(
  panel: ResolvedOperatorPanel,
  attributes: CombatAttributeSet<string>,
  attack: number,
): AttackReceiptSnapshot | undefined {
  if (panel.attackDetail === undefined) return undefined;
  const keys = Object.keys(ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE) as OperatorAttribute[];
  const modifiers = attributeModifierValues('addition', 0);
  const totals = { ...modifiers };
  for (const modifier of attributes.runtimeState.modifiers) {
    if (modifier.attribute !== 'Atk') continue;
    for (const slot of ATTRIBUTE_MODIFIER_SLOTS) {
      if (slot === 'baseFinalMultiplier' || slot === 'finalMultiplier')
        totals[slot] *= modifier.values[slot];
      else totals[slot] += modifier.values[slot];
    }
  }
  const definition = attributes.runtimeState.definitions.get('Atk');
  totals.baseAddition += definition?.otherAttributeBaseAddition ?? 0;
  totals.baseFinalMultiplier *= definition?.otherAttributeBaseFinalMultiplier ?? 1;
  totals.finalMultiplier *= definition?.otherAttributeFinalMultiplier ?? 1;
  return {
    ...panel.attackDetail,
    panelAttack: attack,
    mainAttribute: panel.mainAttribute,
    secondaryAttribute: panel.secondaryAttribute,
    attributes: Object.fromEntries(
      keys.map(key => [key, Math.floor(attributes.get(key))]),
    ) as Record<OperatorAttribute, number>,
    coefficients: Object.fromEntries(
      keys.map(key => [key, attributes.get(ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE[key])]),
    ) as Record<OperatorAttribute, number>,
    attackPercent: totals.baseMultiplier,
    flatAttack: totals.baseFinalAddition,
    runtimeBase: {
      raw: attributes.runtimeState.rawValues.get('Atk') ?? panel.attackBeforeAttributeScalar,
      armed: attributes.getArmed('Atk'),
      value: attributes.get('Atk'),
      minimum: definition?.minimum,
      maximum: definition?.maximum,
      modifiers: totals,
    },
  };
}

/** 仅当明细与本次实际攻击完全对应时冻结，不能拿静态构筑冒充动态属性。 */
export function freezeAttackReceiptDetail(
  attack: number,
  detail: AttackReceiptSnapshot | undefined,
): HealthDamageReceiptDetail {
  if (detail === undefined || Math.abs(detail.panelAttack - attack) > Number.EPSILON) return {};
  return {
    ...(detail.runtimeBase === undefined
      ? {}
      : {
          attackDetailRawBase: detail.runtimeBase.raw,
          attackDetailArmedBase: detail.runtimeBase.armed,
          attackDetailActualBase: detail.runtimeBase.value,
          ...(detail.runtimeBase.minimum === undefined
            ? {}
            : { attackDetailMinimum: detail.runtimeBase.minimum }),
          ...(detail.runtimeBase.maximum === undefined
            ? {}
            : { attackDetailMaximum: detail.runtimeBase.maximum }),
          ...Object.fromEntries(
            ATTRIBUTE_MODIFIER_SLOTS.map(slot => [
              `attackDetailSlot:${slot}`,
              detail.runtimeBase!.modifiers[slot],
            ]),
          ),
        }),
    attackDetailOperatorBase: detail.operatorBaseAttack,
    attackDetailWeaponBase: detail.weaponBaseAttack,
    attackDetailAttackPercent: detail.attackPercent,
    attackDetailFlatAttack: detail.flatAttack,
    attackDetailMainAttribute: detail.mainAttribute,
    attackDetailSecondaryAttribute: detail.secondaryAttribute,
    attackDetailStrength: detail.attributes.strength,
    attackDetailAgility: detail.attributes.agility,
    attackDetailIntellect: detail.attributes.intellect,
    attackDetailWill: detail.attributes.will,
    attackDetailStrengthCoefficient: detail.coefficients.strength,
    attackDetailAgilityCoefficient: detail.coefficients.agility,
    attackDetailIntellectCoefficient: detail.coefficients.intellect,
    attackDetailWillCoefficient: detail.coefficients.will,
  };
}
