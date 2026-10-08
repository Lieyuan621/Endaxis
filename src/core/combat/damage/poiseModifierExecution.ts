/** 单次失衡修正计算。定义和本次上下文由调用方传入，算法不保留运行状态。 */
import type {
  PoiseModifierDefinition,
  PoiseModifierNumber,
  PoiseModifierSide,
  PoiseProcessTiming,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import type { PoiseCalculationContext } from './poiseModifiers';

export function applyPoiseModifier(
  ownerId: string,
  definition: Omit<PoiseModifierDefinition, 'condition'>,
  resolveNumber: (value: PoiseModifierNumber) => number,
  timing: PoiseProcessTiming,
  side: PoiseModifierSide,
  context: PoiseCalculationContext,
  condition?: import('../actions/modifierConditionRuntime').ModifierConditionRuntime<
    import('./poiseModifiers').PoiseModifierConditionInput
  >,
): void {
  if (side !== definition.enabledSide || context.getEntityId(side) !== ownerId) return;
  if (
    condition &&
    !condition.execute({
      side,
      attackerId: context.attackerId,
      defenderId: context.defenderId,
      tags: context.tags,
      features: context.features,
    })
  )
    return;
  for (const processor of definition.processors) {
    if (processor.timing !== timing) continue;
    const addition = resolveNumber(processor.addition);
    if (processor.side === 'attacker') context.outputMultiplier += addition;
    else context.takenMultiplier += addition;
  }
}
