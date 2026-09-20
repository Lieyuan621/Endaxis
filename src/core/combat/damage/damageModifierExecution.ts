import type { CombatBuffContainer } from '../buffs/combatBuffs';
import type { CombatVitals } from '../resources/combatVitals';
import type { DamageModifierExternalCondition } from './damageModifiers';
/** 伤害修正的条件与处理器算法；所有本次输入由调用方传入，不保留伤害上下文。 */
import type {
  DamageModifierCondition,
  DamageModifierDefinition,
  DamageModifierNumber,
  DamageProcessorDefinition,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import { compareCombatNumbers } from '../../../../packages/game-data-contract/src/primitives';
import { attributeModifierValues } from '../attributes/combatAttributes';
import type {
  DamageModifierSide,
  DamageProcessTiming,
  PlayerDamageContext,
} from './playerDamageContext';
import type {
  DamageModifierConditionEvaluator,
  DamageModifierConditionProgram,
} from './damageModifiers';

export function applyDamageModifier(
  ownerId: string,
  sourceSkillCastId: number | null,
  definition: DamageModifierDefinition,
  resolveNumber: (value: DamageModifierNumber) => number,
  conditionProgram: DamageModifierConditionProgram | undefined,
  timing: DamageProcessTiming,
  side: DamageModifierSide,
  context: PlayerDamageContext,
  evaluateCondition?: DamageModifierConditionEvaluator,
  recordModifier?: (
    side: import('./damageScale').DamageScaleSide,
    result: import('./damageScale').DamageModifierResult,
  ) => void,
): void {
  if (side !== definition.enabledSide || context.getEntityId(side) !== ownerId) {
    return;
  }
  if (
    conditionProgram !== undefined &&
    !conditionProgram.execute({
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
  if (definition.condition !== undefined) {
    if (evaluateCondition === undefined) {
      throw new Error('conditional damage modifier requires a condition evaluator');
    }
    if (
      !evaluateDamageCondition(
        definition.condition,
        evaluateCondition,
        context,
        sourceSkillCastId,
        resolveNumber,
      )
    )
      return;
  }
  for (const processor of definition.processors) {
    applyProcessor(processor, timing, context, resolveNumber, recordModifier, side);
  }
}

function evaluateDamageCondition(
  condition: DamageModifierCondition,
  evaluateExternal: DamageModifierConditionEvaluator,
  context: PlayerDamageContext,
  sourceSkillCastId: number | null,
  resolveNumber: (value: DamageModifierNumber) => number,
): boolean {
  switch (condition.kind) {
    case 'sourceSkillCastMatch':
      return (
        sourceSkillCastId !== null &&
        sourceSkillCastId > 0 &&
        context.skillCastId === sourceSkillCastId
      );
    case 'buffBlackboardCompare':
      return compareCombatNumbers(
        resolveNumber(condition.left),
        resolveNumber(condition.right),
        condition.operator,
      );
    case 'not':
      return !evaluateDamageCondition(
        condition.condition,
        evaluateExternal,
        context,
        sourceSkillCastId,
        resolveNumber,
      );
    case 'all':
      return condition.conditions.every(child =>
        evaluateDamageCondition(child, evaluateExternal, context, sourceSkillCastId, resolveNumber),
      );
    case 'any':
      return condition.conditions.some(child =>
        evaluateDamageCondition(child, evaluateExternal, context, sourceSkillCastId, resolveNumber),
      );
    default:
      return evaluateExternal(condition, resolveNumber);
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

/** 场景提供查询端口，伤害修正模块统一解释条件；仅主控条件读取控制时间线。 */
export function evaluateDamageModifierEnvironmentCondition(
  condition: DamageModifierExternalCondition,
  operatorBuffs: Pick<CombatBuffContainer<string>, 'matchesEntityTags' | 'getCountByIds'>,
  enemyBuffs: Pick<CombatBuffContainer<string>, 'matchesEntityTags' | 'getCountByIds'>,
  enemyVitals: Pick<CombatVitals, 'health' | 'maxHealth' | 'hasPoise' | 'poise'>,
  damageContext: PlayerDamageContext,
  resolveNumber: (value: DamageModifierNumber) => number,
  readControlled: () => boolean,
): boolean {
  switch (condition.kind) {
    case 'entityTagMatch': {
      const target = condition.target === 'caster' ? operatorBuffs : enemyBuffs;
      return target.matchesEntityTags(condition.tags, condition.tagQueryType);
    }
    case 'casterControlled':
      return readControlled();
    case 'buffIdCountCompare': {
      const target = condition.target === 'caster' ? operatorBuffs : enemyBuffs;
      return compareCombatNumbers(
        target.getCountByIds(condition.buffIds),
        resolveNumber(condition.value),
        condition.operator,
      );
    }
    case 'eventDamageTagsMatch':
      return matchDamageProperties(damageContext.tags, condition.tags, condition.match);
    case 'eventDamageFeaturesMatch':
      return matchDamageProperties(damageContext.features, condition.features, condition.match);
    case 'eventDamageTypesMatch':
      return condition.damageTypes.includes(damageContext.damageType);
    case 'targetHealthCompare': {
      const current =
        condition.valueType === 'ratio'
          ? enemyVitals.health / enemyVitals.maxHealth
          : enemyVitals.health;
      return compareCombatNumbers(current, resolveNumber(condition.value), condition.operator);
    }
    case 'targetPoiseCompare':
      return enemyVitals.hasPoise
        ? compareCombatNumbers(
            enemyVitals.poise,
            resolveNumber(condition.value),
            condition.operator,
          )
        : condition.returnValueIfMissing;
  }
}

function matchDamageProperties<
  T extends PlayerDamageContext['tags'][number] | PlayerDamageContext['features'][number],
>(
  actualValues: readonly T[],
  expectedValues: readonly T[],
  match: 'exact' | 'hasAny' | 'hasAll' | 'exceptAny' | 'exceptAll',
): boolean {
  const actual = new Set(actualValues);
  const hasAny = expectedValues.some(value => actual.has(value));
  const hasAll = expectedValues.every(value => actual.has(value));
  switch (match) {
    case 'exact':
      return actual.size === new Set(expectedValues).size && hasAll;
    case 'hasAny':
      return hasAny;
    case 'hasAll':
      return hasAll;
    case 'exceptAny':
      return !hasAny;
    case 'exceptAll':
      return !hasAll;
  }
}
