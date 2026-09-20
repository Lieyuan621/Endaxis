/** 单次失衡修正计算。定义和本次上下文由调用方传入，算法不保留运行状态。 */
import type {
  PoiseModifierCondition,
  PoiseModifierDefinition,
  PoiseModifierNumber,
  PoiseModifierSide,
  PoiseProcessTiming,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import type { PoiseCalculationContext } from './poiseModifiers';

export function applyPoiseModifier(
  ownerId: string,
  definition: PoiseModifierDefinition,
  resolveNumber: (value: PoiseModifierNumber) => number,
  timing: PoiseProcessTiming,
  side: PoiseModifierSide,
  context: PoiseCalculationContext,
): void {
  if (side !== definition.enabledSide || context.getEntityId(side) !== ownerId) return;
  if (definition.condition !== undefined && !evaluateCondition(definition.condition, context))
    return;
  for (const processor of definition.processors) {
    if (processor.timing !== timing) continue;
    const addition = resolveNumber(processor.addition);
    if (processor.side === 'attacker') context.outputMultiplier += addition;
    else context.takenMultiplier += addition;
  }
}

function evaluateCondition(
  condition: PoiseModifierCondition,
  context: PoiseCalculationContext,
): boolean {
  if (condition.kind === 'casterControlled') return context.isAttackerControlled;
  if (condition.kind === 'all')
    return condition.conditions.every(child => evaluateCondition(child, context));
  const actual = new Set(context.tags);
  return condition.match === 'hasAny'
    ? condition.tags.some(tag => actual.has(tag))
    : condition.tags.every(tag => actual.has(tag));
}
