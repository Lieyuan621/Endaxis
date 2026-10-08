/** 单次治疗修正计算；数值在执行时读取，不提前缓存 Buff 黑板结果。 */
import type {
  HealModifierDefinition,
  HealModifierNumber,
  HealModifierSide,
  HealProcessTiming,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import type { HealCalculationContext } from './healModifiers';

export function applyHealModifier(
  ownerId: string,
  definition: Omit<HealModifierDefinition, 'condition'>,
  resolveNumber: (value: HealModifierNumber) => number,
  timing: HealProcessTiming,
  side: HealModifierSide,
  context: HealCalculationContext,
  condition?: import('../actions/modifierConditionRuntime').ModifierConditionRuntime<
    import('./healModifiers').HealModifierConditionInput
  >,
): void {
  if (side !== definition.enabledSide || context.getEntityId(side) !== ownerId) return;
  if (
    condition &&
    !condition.execute({
      side,
      healerId: context.healerId,
      receiverId: context.receiverId,
      tags: context.tags,
    })
  )
    return;
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
