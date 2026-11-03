import type { AttributeModifier } from '../../../packages/game-data-contract/src/modifiers.ts';
import { CombatAttributeSet, attributeModifierValues } from '../combat/attributes/combatAttributes';

/** 出生面板使用与战斗 Buff 相同的八槽聚合核心，不维护另一套属性公式。 */
export function applyEnemyBirthAttribute(
  attribute: string,
  value: number,
  modifiers: readonly AttributeModifier[],
): number {
  const selected = modifiers.filter(modifier => modifier.attribute === attribute);
  if (!selected.length) return value;
  const attributes = new CombatAttributeSet<string>();
  // 这些属性的原生元数据下限为零，其余出生面板属性无上下限。
  attributes.define(
    attribute,
    value,
    ['MaxHp', 'BreakingAttackDamageTakenScalar', 'PoiseRecTimeScalar'].includes(attribute)
      ? { minimum: 0 }
      : {},
  );
  return attributes.getWithAdditionalModifiers(
    attribute,
    selected.map(modifier => attributeModifierValues(modifier.slot, modifier.value)),
  );
}
