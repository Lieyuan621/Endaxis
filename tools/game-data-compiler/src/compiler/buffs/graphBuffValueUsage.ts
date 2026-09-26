import type { SkillBuffDefinition } from '../../../../../packages/game-data-contract/src/buffs.ts';
/**
 * analyzeBuffDefinitionUsage 的图侧对应：属性、伤害、治疗、护盾、寿命与叠层参数的判断与树版
 * 完全相同；动作入口（scheduledSequences、lifecycleSequences、事件响应、伤害条件程序）改为
 * 沿 Buff 自己的 actionGraph 主图遍历。静态 Buff（StaticBuffDefinition）没有程序字段，只汇总
 * 非程序部分。程序字段存在却找不到图时保守标成未知访问，不静默当成无用途。
 */
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
} from '../../../../../packages/game-data-contract/src/actionGraph.ts';
import type { StaticBuffDefinition } from '../../../../../packages/game-data-contract/src/buffs.ts';
import type {
  DamageModifierCondition,
  DamageModifierNumber,
  HealModifierCondition,
  PoiseModifierCondition,
} from '../../../../../packages/game-data-contract/src/modifiers.ts';
import {
  mergeDefinitionValueUsage,
  type DefinitionUsageContext,
  type DefinitionValueUsage,
} from '../optimization/definitionUsageAnalysis.ts';
import { analyzeGraphSequenceUsage } from '../optimization/graphSequenceOptimization.ts';

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

/** 与 buffValueUsage.ts 的伤害条件分支一一对应；条件本身不含动作程序。 */
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

/** 覆盖动作以外的属性、伤害、治疗、护盾、寿命与叠层参数，动作入口沿本 Buff 的主图遍历。 */
export function analyzeGraphBuffDefinitionUsage(
  value: SkillBuffDefinition | StaticBuffDefinition,
  context?: DefinitionUsageContext,
): DefinitionValueUsage {
  const graph = value.actionGraph?.main;
  const program = (reference: ActionGraphReference | undefined): DefinitionValueUsage => {
    if (reference === undefined) return empty();
    if (graph === undefined) return { ...empty(), unknownAccess: true, mayThrow: true };
    return analyzeGraphSequenceUsage(graph, reference, context);
  };
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
    if (modifier.conditionProgram !== undefined) usages.push(program(modifier.conditionProgram));
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
  for (const item of value.scheduledSequences ?? []) usages.push(program(item.sequence));
  for (const entry of Object.values(value.lifecycleSequences ?? {})) usages.push(program(entry));
  for (const response of value.abilityEventResponses ?? []) usages.push(program(response.sequence));
  for (const response of value.igniteEventResponses ?? []) usages.push(program(response.sequence));
  return mergeDefinitionValueUsage(usages);
}

/** 收集器遍历 Buff 动作入口时与 program 使用同一图来源。 */
export function graphBuffPrograms(value: SkillBuffDefinition | StaticBuffDefinition): {
  readonly graph: ActionGraphResourceDefinition['main'] | undefined;
  readonly entries: ActionGraphReference[];
} {
  const graph = value.actionGraph?.main;
  return {
    graph,
    entries: [
      ...(value.scheduledSequences ?? []).map(item => item.sequence),
      ...Object.values(value.lifecycleSequences ?? {}).flatMap(entry =>
        entry === undefined ? [] : [entry],
      ),
      ...(value.abilityEventResponses ?? []).map(response => response.sequence),
      ...(value.igniteEventResponses ?? []).map(response => response.sequence),
      ...(value.damageModifiers ?? []).flatMap(modifier =>
        modifier.conditionProgram === undefined ? [] : [modifier.conditionProgram],
      ),
    ],
  };
}
