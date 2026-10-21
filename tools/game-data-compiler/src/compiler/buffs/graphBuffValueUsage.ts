import { GameplayTagRegistry } from '../../../../../src/core/combat/tags/gameplayTags.ts';
import type { DefinitionExternalValueRead } from '../optimization/definitionUsageAnalysis.ts';
import type {
  ActionGraphStep,
  OperatorBuffDefinitions,
  SkillBuffDefinition,
} from '../intermediateDefinitions.ts';
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

/** 动作图之外的参数读取；这些值可能在注册、叠层或计算伤害时使用。 */
export function analyzeGraphBuffParameters(
  value: SkillBuffDefinition | StaticBuffDefinition,
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
    for (const processor of modifier.processors) {
      switch (processor.kind) {
        case 'modifyPoiseScalar':
          usages.push(keys(processor.values.value));
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
  return mergeDefinitionValueUsage(usages);
}

export function analyzeGraphBuffDefinitionUsage(
  value: SkillBuffDefinition | StaticBuffDefinition,
  context?: DefinitionUsageContext,
): DefinitionValueUsage {
  const { graph, entries } = graphBuffPrograms(value);
  return mergeDefinitionValueUsage([
    analyzeGraphBuffParameters(value),
    ...entries.map(reference =>
      graph === undefined
        ? { ...empty(), unknownAccess: true, mayThrow: true }
        : analyzeGraphSequenceUsage(graph, reference, context),
    ),
  ]);
}

/** Buff 的动作入口只在这里枚举，供用途分析和跨资源收集共用。 */
export function graphBuffPrograms(value: SkillBuffDefinition | StaticBuffDefinition): {
  readonly graph: ActionGraphResourceDefinition['main'] | undefined;
  readonly entries: ActionGraphReference[];
} {
  const graph = value.actionGraph?.main;
  return {
    graph,
    entries: [
      ...(value.scheduledSequences ?? []).map(item => item.sequence),
      ...Object.values(value.lifecycleSequences ?? {}).flatMap(entry => entry ?? []),
      ...(value.abilityEventResponses ?? []).map(response => response.sequence),
      ...(value.igniteEventResponses ?? []).flatMap(response => response.sequences),
      ...[
        ...(value.damageModifiers ?? []),
        ...(value.healModifiers ?? []),
        ...(value.poiseModifiers ?? []),
      ].flatMap(modifier => (modifier.condition === undefined ? [] : [modifier.condition])),
    ],
  };
}

/** 按原查询筛选可能读到本实例的键；宿主身份和事件实例未知时不排除。 */
export function externalBuffValueKeys(
  definition: SkillBuffDefinition | StaticBuffDefinition,
  id: string | undefined,
  reads: readonly DefinitionExternalValueRead[],
): ReadonlySet<string> {
  const tags = new GameplayTagRegistry();
  return new Set(
    reads.flatMap(read => {
      if (read.kind === 'abilityEntity') return [];
      if (read.kind === 'eventBuff') return [read.key];
      const query = read.query;
      const matches =
        query.kind === 'id'
          ? id === undefined || query.buffIds.includes(id)
          : tags.query(definition.applyTags ?? [], query.buffTags, query.tagQueryType);
      return matches ? [read.key] : [];
    }),
  );
}

/** 接收方和外部观察者都不使用的参数可以省略；未知接收方不作推断。 */
export function createBuffAssignmentPruner(
  definitions: OperatorBuffDefinitions,
  externalReads: readonly DefinitionExternalValueRead[],
  context?: DefinitionUsageContext,
): (action: ActionGraphStep, initialValues: Readonly<Record<string, unknown>>) => ActionGraphStep {
  const usages = new Map<string, ReadonlySet<string> | undefined>();
  const needed = (id: string): ReadonlySet<string> | undefined => {
    if (usages.has(id)) return usages.get(id);
    const definition = definitions[id];
    if (!definition) return undefined;
    const usage = analyzeGraphBuffDefinitionUsage(definition, context);
    const result = usage.unknownAccess
      ? undefined
      : new Set([
          ...usage.reads,
          ...usage.writes,
          ...externalBuffValueKeys(definition, id, externalReads),
        ]);
    usages.set(id, result);
    return result;
  };
  return (action, initialValues) => {
    if (action.kind !== 'applyBuff' && action.kind !== 'aura') return action;
    let changed = false;
    const buffs = action.parameters.buffs.map(entry => {
      if (typeof entry.buffId !== 'string' || entry.keywordEnhancements?.length) return entry;
      const keys = needed(entry.buffId);
      if (keys === undefined) return entry;
      const numeric = Object.fromEntries(
        Object.entries(entry.blackboardAssignments ?? {}).filter(([key, operand]) => {
          // 不省略可能缺键或触发其他求值的输入。
          const safe =
            typeof operand === 'number' ||
            Array.isArray(operand) ||
            ('kind' in operand &&
              (operand.kind === 'constant' ||
                (operand.kind === 'blackboard' && Object.hasOwn(initialValues, operand.key))));
          return keys.has(key) || !safe;
        }),
      );
      const strings = Object.fromEntries(
        Object.entries(entry.stringBlackboardAssignments ?? {}).filter(([key]) => keys.has(key)),
      );
      const copied = Object.fromEntries(
        Object.entries(entry.copiedBlackboardAssignments ?? {}).filter(
          ([key, source]) => keys.has(key) || !Object.hasOwn(initialValues, source),
        ),
      );
      if (
        Object.keys(numeric).length === Object.keys(entry.blackboardAssignments ?? {}).length &&
        Object.keys(strings).length ===
          Object.keys(entry.stringBlackboardAssignments ?? {}).length &&
        Object.keys(copied).length === Object.keys(entry.copiedBlackboardAssignments ?? {}).length
      )
        return entry;
      changed = true;
      const {
        blackboardAssignments,
        stringBlackboardAssignments,
        copiedBlackboardAssignments,
        ...rest
      } = entry;
      return {
        ...rest,
        ...(Object.keys(numeric).length ? { blackboardAssignments: numeric } : {}),
        ...(Object.keys(strings).length ? { stringBlackboardAssignments: strings } : {}),
        ...(Object.keys(copied).length ? { copiedBlackboardAssignments: copied } : {}),
      };
    });
    return changed ? { ...action, parameters: { ...action.parameters, buffs } } : action;
  };
}
