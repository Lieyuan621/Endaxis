import type { SkillBuffDefinition } from '../intermediateDefinitions.ts';
/**
 * 汇总 Buff 属性、修正器、护盾和生命周期读取的变量，供生成阶段裁剪无用初值。
 * 此时数据输入尚未提取为节点，动作入口沿 Buff 自己的主图遍历；没有图的静态 Buff 只汇总
 * 处理器参数。存在动作入口却缺少图时保守保留变量，不能误判为没有读取。
 */
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
} from '../intermediateDefinitions.ts';
import type { StaticBuffDefinition } from '../intermediateDefinitions.ts';
import type { DamageModifierNumber } from '../../../../../packages/game-data-contract/src/modifiers.ts';
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
    if (modifier.condition !== undefined) usages.push(program(modifier.condition));
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
    if (modifier.condition !== undefined) usages.push(program(modifier.condition));
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
    if (modifier.condition !== undefined) usages.push(program(modifier.condition));
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
      ...[
        ...(value.damageModifiers ?? []),
        ...(value.healModifiers ?? []),
        ...(value.poiseModifiers ?? []),
      ].flatMap(modifier => (modifier.condition === undefined ? [] : [modifier.condition])),
    ],
  };
}
