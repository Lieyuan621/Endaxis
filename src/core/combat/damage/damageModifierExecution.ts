/** 伤害修正的条件与处理器算法；所有本次输入由调用方传入，不保留伤害上下文。 */
import type {
  DamageModifierDefinition,
  DamageModifierNumber,
  DamageProcessorDefinition,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import { attributeModifierValues } from '../attributes/combatAttributes';
import type {
  DamageModifierSide,
  DamageProcessTiming,
  PlayerDamageContext,
} from './playerDamageContext';
import type { DamageModifierConditionRuntime } from './damageModifiers';

export function applyDamageModifier(
  ownerId: string,
  definition: Omit<DamageModifierDefinition, 'condition'>,
  resolveNumber: (value: DamageModifierNumber) => number,
  condition: DamageModifierConditionRuntime | undefined,
  timing: DamageProcessTiming,
  side: DamageModifierSide,
  context: PlayerDamageContext,
  recordModifier?: (
    side: import('./damageScale').DamageScaleSide,
    result: import('./damageScale').DamageModifierResult,
  ) => void,
): void {
  if (side !== definition.enabledSide || context.getEntityId(side) !== ownerId) {
    return;
  }
  if (
    condition !== undefined &&
    !condition.execute({
      side,
      sourceId: context.sourceId,
      targetId: context.targetId,
      skillCastId: context.skillCastId,
      damageType: context.damageType,
      tags: context.tags,
      gameplayTags: context.gameplayTags,
      features: context.features,
    })
  )
    return;
  for (const processor of definition.processors) {
    applyProcessor(processor, timing, context, resolveNumber, recordModifier, side);
  }
}

function applyProcessor(
  processor: DamageProcessorDefinition,
  timing: DamageProcessTiming,
  context: PlayerDamageContext,
  resolveNumber: (value: DamageModifierNumber) => number,
  recordModifier?: (
    side: import('./damageScale').DamageScaleSide,
    result: import('./damageScale').DamageModifierResult,
  ) => void,
  modifierSide: DamageModifierSide = 'attacker',
): void {
  if (context.damageType === 'lifeDrain') return;
  switch (processor.kind) {
    case 'multiplyValue':
      if (
        timing === processor.timing &&
        processor.targetHealthTypes.includes(context.targetHealthType)
      ) {
        context.multiplyCalculationValue(processor.scale);
        recordModifier?.(modifierSide, { kind: 'multiplyValue', multiplier: processor.scale });
      }
      return;
    case 'damageScale':
      if (timing === 'afterCalculation' && context.targetHealthType === 'normal') {
        const addition = resolveNumber(processor.addition);
        context.damageScales.modify(processor.side, processor.zone, addition);
        recordModifier?.(processor.side, { kind: 'damageScale', zone: processor.zone, addition });
      }
      return;
    case 'instantAttribute':
      if (timing === 'beforeCalculation' && context.targetHealthType === 'normal') {
        const values =
          'slot' in processor.values
            ? attributeModifierValues(processor.values.slot, resolveNumber(processor.values.value))
            : processor.values;
        context.addInstantAttributeModifier(processor.targetSide, {
          attribute: processor.attribute,
          values,
          timing: processor.attributeTiming,
        });
        for (const [slot, value] of Object.entries(values)) {
          const neutral = slot === 'finalMultiplier' || slot === 'baseFinalMultiplier' ? 1 : 0;
          if (value !== neutral)
            recordModifier?.(processor.targetSide, {
              kind: 'attribute',
              attribute: processor.attribute,
              slot: slot as import('../attributes/combatAttributes').AttributeModifierSlot,
              value,
            });
        }
      }
  }
}
