/**
 * 汇总 Buff 从自身黑板或宿主实体板读取的键。
 * 这里只分析用途，不删除 Buff 初值或动作。即使 Buff 有同名初值，也先保留宿主上的键，
 * 避免把共享实体板、子作用域和生命周期写入误当成互不相关的数据。
 */
import type { SkillBuffDefinition } from '../../../../../packages/game-data-contract/src/buffs.ts';
import type {
  DamageModifierCondition,
  DamageModifierNumber,
  HealModifierCondition,
  PoiseModifierCondition,
} from '../../../../../packages/game-data-contract/src/modifiers.ts';
import {
  analyzeSequenceUsage,
  mergeDefinitionValueUsage,
  type DefinitionUsageContext,
  type DefinitionValueUsage,
} from '../optimization/definitionUsageAnalysis.ts';

const empty = () => mergeDefinitionValueUsage([]);
const keys = (...values: readonly (DamageModifierNumber | undefined)[]): DefinitionValueUsage => ({
  ...empty(),
  reads: new Set(
    values.flatMap(value =>
      value !== undefined && typeof value !== 'number' ? [value.blackboardKey] : [],
    ),
  ),
});
const unknown = (_value: never): DefinitionValueUsage => ({
  ...empty(),
  unknownAccess: true,
  mayThrow: true,
  observable: true,
});

function damageCondition(value: DamageModifierCondition): DefinitionValueUsage {
  switch (value.kind) {
    case 'not':
      return damageCondition(value.condition);
    case 'all':
    case 'any':
      return mergeDefinitionValueUsage(value.conditions.map(damageCondition));
    case 'buffBlackboardCompare':
      return keys(value.left, value.right);
    case 'buffIdCountCompare':
    case 'targetHealthCompare':
    case 'targetPoiseCompare':
      return keys(value.value);
    case 'entityTagMatch':
    case 'casterControlled':
    case 'eventDamageTagsMatch':
    case 'eventDamageFeaturesMatch':
    case 'eventDamageTypesMatch':
    case 'sourceSkillCastMatch':
      return empty();
    default:
      return unknown(value);
  }
}

function healCondition(value: HealModifierCondition): DefinitionValueUsage {
  switch (value.kind) {
    case 'targetHealthCompare':
      return keys(value.value);
    case 'buffBlackboardCompare':
      return keys(value.left, value.right);
    case 'healTagsMatch':
      return empty();
    default:
      return unknown(value);
  }
}

function poiseCondition(value: PoiseModifierCondition): DefinitionValueUsage {
  switch (value.kind) {
    case 'all':
      return mergeDefinitionValueUsage(value.conditions.map(poiseCondition));
    case 'casterControlled':
    case 'eventDamageTagsMatch':
      return empty();
    default:
      return unknown(value);
  }
}

/** 覆盖动作以外的属性、伤害、治疗、护盾、寿命与叠层参数，不靠字段名搜索推测用途。 */
export function analyzeBuffDefinitionUsage(
  value: SkillBuffDefinition,
  context?: DefinitionUsageContext,
): DefinitionValueUsage {
  const usages: DefinitionValueUsage[] = [
    keys(
      value.priority,
      value.durationSeconds,
      value.addingCooldownSeconds,
      value.triggerIntervalSeconds,
      value.maxTriggerCount,
      value.maxStackCount,
    ),
  ];
  for (const modifier of value.attributeModifiers ?? []) usages.push(keys(modifier.value));
  for (const modifier of value.damageModifiers ?? []) {
    if (modifier.condition !== undefined) usages.push(damageCondition(modifier.condition));
    if (modifier.conditionProgram !== undefined)
      usages.push(analyzeSequenceUsage(modifier.conditionProgram, context));
    for (const processor of modifier.processors) {
      switch (processor.kind) {
        case 'damageScale':
          usages.push(keys(processor.addition));
          break;
        case 'instantAttribute':
          if ('slot' in processor.values) usages.push(keys(processor.values.value));
          break;
        default:
          usages.push(unknown(processor));
      }
    }
  }
  for (const modifier of value.healModifiers ?? []) {
    if (modifier.condition !== undefined) usages.push(healCondition(modifier.condition));
    for (const processor of modifier.processors) {
      switch (processor.kind) {
        case 'modifyCalculationResult':
          usages.push(keys(processor.baseMultiplier, processor.multiplierCount));
          break;
        case 'modifyHealingIncrease':
          usages.push(keys(processor.addition));
          break;
        default:
          usages.push(unknown(processor));
      }
    }
  }
  for (const modifier of value.poiseModifiers ?? []) {
    if (modifier.condition !== undefined) usages.push(poiseCondition(modifier.condition));
    for (const processor of modifier.processors) {
      switch (processor.kind) {
        case 'modifyPoiseScalar':
          usages.push(keys(processor.addition));
          break;
        default:
          usages.push(unknown(processor.kind));
      }
    }
  }
  for (const shield of value.shields ?? []) {
    if (typeof shield.value === 'object' && 'attribute' in shield.value)
      usages.push(keys(shield.value.multiplier, shield.value.addition));
    else usages.push(keys(shield.value));
    usages.push(keys(shield.absorbCount));
    for (const absorption of shield.damageAbsorptions)
      usages.push(keys(absorption.ratio, absorption.scale));
  }
  if (value.sustainedProtection !== undefined)
    usages.push(
      keys(value.sustainedProtection.superArmor, value.sustainedProtection.impactResistance),
    );
  for (const enhancement of value.keywordEnhancements ?? [])
    usages.push(keys(enhancement.initialValue, enhancement.value));
  for (const item of value.scheduledSequences ?? [])
    usages.push(analyzeSequenceUsage(item.sequence, context));
  for (const program of Object.values(value.lifecycleSequences ?? {}))
    if (program !== undefined) usages.push(analyzeSequenceUsage(program, context));
  for (const response of value.abilityEventResponses ?? [])
    usages.push(analyzeSequenceUsage(response.sequence, context));
  for (const response of value.igniteEventResponses ?? [])
    usages.push(analyzeSequenceUsage(response.sequence, context));
  return mergeDefinitionValueUsage(usages);
}
