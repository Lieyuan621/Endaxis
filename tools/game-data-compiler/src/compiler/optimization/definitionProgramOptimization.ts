import type { SkillDefinition } from '../../../../../packages/game-data-contract/src/skills.ts';
/** 图资源优化的领域入口。黑板分析使用图模块，不保留树形程序访问器。 */
import type { OperatorDefinition } from '../../../../../packages/game-data-contract/src/operators.ts';
import type {
  DefinitionOptimizationMode,
  DefinitionOptimizationReport,
} from './definitionOptimization.ts';
import type { SkillValueOptimizationReport } from './skillValueOptimization.ts';
import type { EquipmentValueOptimizationReport } from './equipmentValueOptimization.ts';
import type { GraphSharedEntityValueUsage } from './graphValueOptimization.ts';
import {
  createGraphEntityUsageContext,
  pruneUnusedGraphSkillValues,
} from './graphValueOptimization.ts';

import { optimizeResourceGraphs } from './resourceGraphOptimization.ts';
import { prepareActionGraphIdentities } from './actionGraphProjection.ts';
import { extractDefinitionDataNodes } from '../../../../../src/core/action-graph/actionGraphDataNodes.ts';

export interface DefinitionProgramOptimizationReport {
  readonly mode: DefinitionOptimizationMode;
  readonly programs: readonly DefinitionOptimizationReport[];
  readonly before: { readonly steps: number; readonly conditions: number };
  readonly after: { readonly steps: number; readonly conditions: number };
  readonly skillValues: readonly SkillValueOptimizationReport[];
  readonly equipmentValues: readonly EquipmentValueOptimizationReport[];
}

export function optimizeDefinitionResources<T>(
  value: T,
  mode: DefinitionOptimizationMode,
  pruneValues?: (simplified: T) => T,
): {
  readonly value: T;
  readonly report: DefinitionProgramOptimizationReport;
} {
  // 先确定真正被外部配置引用的动作身份；无引用的生成路径不能阻止局部宏提取。
  const result = optimizeResourceGraphs(prepareActionGraphIdentities(value), mode, pruneValues);
  const total = (which: 'before' | 'after') =>
    result.reports.reduce(
      (sum, item) => ({
        steps: sum.steps + item[which].steps,
        conditions: sum.conditions + item[which].conditions,
      }),
      { steps: 0, conditions: 0 },
    );
  return {
    value: mode === 'apply' ? extractDefinitionDataNodes(result.value) : value,
    report: {
      mode,
      programs: result.reports,
      before: total('before'),
      after: total('after'),
      skillValues: [],
      equipmentValues: [],
    },
  };
}

export function optimizeOperatorDefinitionPrograms(
  operator: OperatorDefinition,
  mode: DefinitionOptimizationMode,
  sharedEntityUsage?: GraphSharedEntityValueUsage,
): { readonly operator: OperatorDefinition; readonly report: DefinitionProgramOptimizationReport } {
  const protectedKeys = new Set(
    [...operator.talents, ...operator.potentials].flatMap(
      upgrade =>
        upgrade.modifiers?.flatMap(modifier =>
          modifier.kind === 'patchSkillBlackboard' || modifier.kind === 'patchPassiveBlackboard'
            ? [modifier.blackboardKey]
            : [],
        ) ?? [],
    ),
  );
  const skillValues: SkillValueOptimizationReport[] = [];
  const skill = (value: SkillDefinition) => {
    const pruned = pruneUnusedGraphSkillValues(
      value,
      protectedKeys,
      createGraphEntityUsageContext(operator.abilityEntityDefinitions, sharedEntityUsage),
    );
    skillValues.push(pruned.report);
    return pruned.skill;
  };
  const skills = (values: SkillDefinition | readonly SkillDefinition[]) =>
    'key' in values ? skill(values) : values.map(skill);
  const result = optimizeDefinitionResources(operator, mode, simplified => ({
    ...simplified,
    skillGroups: simplified.skillGroups.map(group => ({
      ...group,
      skills: skills(group.skills),
      ...(group.variants === undefined
        ? {}
        : {
            variants: group.variants.map(variant => ({
              ...variant,
              skills: skills(variant.skills),
            })),
          }),
      ...(group.replacementSkills === undefined
        ? {}
        : { replacementSkills: group.replacementSkills.map(skill) }),
      ...(group.routedReplacementSkills === undefined
        ? {}
        : {
            routedReplacementSkills: group.routedReplacementSkills.map(route => ({
              ...route,
              skill: skill(route.skill),
            })),
          }),
    })),
  }));
  return {
    operator: result.value,
    report: { ...result.report, skillValues },
  };
}
