/** 单次治疗修正计算；数值在执行时读取，不提前缓存 Buff 黑板结果。 */
import type {
  HealModifierCondition,
  HealModifierDefinition,
  HealModifierNumber,
  HealModifierSide,
  HealProcessTiming,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import { compareCombatNumbers } from '../../mechanics/combatNumbers.ts';
import type { HealCalculationContext } from './healModifiers';

export function applyHealModifier(
  ownerId: string,
  definition: HealModifierDefinition,
  resolveNumber: (value: HealModifierNumber) => number,
  timing: HealProcessTiming,
  side: HealModifierSide,
  context: HealCalculationContext,
): void {
  if (side !== definition.enabledSide || context.getEntityId(side) !== ownerId) return;
  if (
    definition.condition !== undefined &&
    !evaluateHealCondition(definition.condition, context, resolveNumber)
  ) {
    return;
  }
  for (const processor of definition.processors) {
    if (processor.timing !== timing) continue;
    if (processor.kind === 'modifyCalculationResult') {
      context.value *=
        1 + resolveNumber(processor.baseMultiplier) * resolveNumber(processor.multiplierCount);
    } else if (processor.side === 'healer') {
      context.healerOutputIncrease += resolveNumber(processor.addition);
    } else {
      context.receiverTakenIncrease += resolveNumber(processor.addition);
    }
  }
}

function evaluateHealCondition(
  condition: HealModifierCondition,
  context: HealCalculationContext,
  resolveNumber: (value: HealModifierNumber) => number,
): boolean {
  if (condition.kind === 'healTagsMatch') {
    const actual = new Set(context.tags);
    return condition.match === 'hasAny'
      ? condition.tags.some(tagId => actual.has(tagId))
      : condition.tags.every(tagId => actual.has(tagId));
  }
  if (condition.kind === 'buffBlackboardCompare') {
    return compareCombatNumbers(
      resolveNumber(condition.left),
      resolveNumber(condition.right),
      condition.operator,
    );
  }
  const actual =
    condition.valueType === 'current'
      ? context.receiverVitals.health
      : context.receiverVitals.health / context.receiverVitals.maxHealth;
  return compareCombatNumbers(actual, resolveNumber(condition.value), condition.operator);
}
