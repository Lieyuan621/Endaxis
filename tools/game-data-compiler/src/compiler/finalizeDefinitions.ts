/** 将资源投影转换为正式定义。可选优化完成后，始终将表达式转换为图节点。 */
import type {
  OperatorBuffDefinitions,
  EquipmentContributionDefinition,
  GearSetDefinition,
  WeaponDefinition,
  IntermediateDefinition,
  SkillDefinition,
  OperatorDefinition,
} from './intermediateDefinitions.ts';
import { pruneUnusedGraphEquipmentContributionBlackboard } from './optimization/graphValueOptimization.ts';
import type * as Contract from '../../../../packages/game-data-contract/src/index.ts';
import type {
  DefinitionOptimizationMode,
  DefinitionOptimizationReport,
} from './optimization/definitionOptimization.ts';
import type { SkillValueOptimizationReport } from './optimization/skillValueOptimization.ts';
import type { EquipmentValueOptimizationReport } from './optimization/equipmentValueOptimization.ts';
import type { GraphSharedEntityValueUsage } from './optimization/graphValueOptimization.ts';
import {
  createGraphEntityUsageContext,
  pruneUnusedGraphSkillValues,
} from './optimization/graphValueOptimization.ts';

import { optimizeResourceGraphs } from './optimization/resourceGraphOptimization.ts';
import { prepareActionGraphIdentities } from './optimization/actionGraphProjection.ts';
import { extractDefinitionDataNodes } from './extractGraphDataNodes.ts';

export interface DefinitionProgramOptimizationReport {
  readonly mode: DefinitionOptimizationMode;
  readonly programs: readonly DefinitionOptimizationReport[];
  readonly before: { readonly steps: number; readonly conditions: number };
  readonly after: { readonly steps: number; readonly conditions: number };
  readonly skillValues: readonly SkillValueOptimizationReport[];
  readonly equipmentValues: readonly EquipmentValueOptimizationReport[];
}

export function finalizeDefinitionResources<T>(
  value: IntermediateDefinition<T>,
  mode: DefinitionOptimizationMode,
  pruneValues?: (simplified: IntermediateDefinition<T>) => IntermediateDefinition<T>,
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
    value: extractDefinitionDataNodes<T>(result.value),
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

export function finalizeOperatorDefinition(
  operator: OperatorDefinition,
  mode: DefinitionOptimizationMode,
  sharedEntityUsage?: GraphSharedEntityValueUsage,
): {
  readonly operator: Contract.OperatorDefinition;
  readonly report: DefinitionProgramOptimizationReport;
} {
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
  const result = finalizeDefinitionResources<Contract.OperatorDefinition>(
    operator,
    mode,
    simplified => ({
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
    }),
  );
  return {
    operator: result.value,
    report: { ...result.report, skillValues },
  };
}

export function finalizeCommonBuffDefinitions(
  definitions: OperatorBuffDefinitions,
  mode: DefinitionOptimizationMode = 'apply',
) {
  const result = finalizeDefinitionResources<Contract.OperatorBuffDefinitions>(definitions, mode);
  return { definitions: result.value, report: result.report };
}

function prune<T extends EquipmentContributionDefinition>(
  value: T,
  mode: DefinitionOptimizationMode,
  id: string,
  path: string,
) {
  const result = pruneUnusedGraphEquipmentContributionBlackboard(value, {
    mode,
    definitionId: id,
    path,
  });
  // 裁剪结果省略 blackboard 表示整块删除；不能从旧对象复活或以 undefined 写回。
  // 未改动时保留输入引用身份。
  if (result.contribution === value) return { value, report: result.report };
  const { blackboard: _originalBlackboard, ...rest } = value;
  return {
    value: { ...rest, ...result.contribution },
    report: result.report,
  };
}

export function finalizeWeaponDefinition(
  definition: WeaponDefinition,
  mode: DefinitionOptimizationMode = 'apply',
) {
  const equipmentValues: EquipmentValueOptimizationReport[] = [];
  const optimized = finalizeDefinitionResources<Contract.WeaponDefinition>(
    definition,
    mode,
    simplified => ({
      ...simplified,
      traits: simplified.traits.map((trait, index) => {
        const result = prune(trait, 'apply', `${definition.slug}:${trait.key}`, `traits[${index}]`);
        equipmentValues.push(result.report);
        return result.value;
      }),
    }),
  );
  if (mode === 'off') {
    definition.traits.forEach((trait, index) =>
      equipmentValues.push(
        prune(trait, mode, `${definition.slug}:${trait.key}`, `traits[${index}]`).report,
      ),
    );
  }
  return {
    definition: optimized.value,
    report: { ...optimized.report, mode, equipmentValues },
  };
}

export function finalizeGearSetDefinition(
  definition: GearSetDefinition,
  mode: DefinitionOptimizationMode = 'apply',
) {
  const equipmentValues: EquipmentValueOptimizationReport[] = [];
  const optimized = finalizeDefinitionResources<Contract.GearSetDefinition>(
    definition,
    mode,
    simplified => {
      const result = prune(simplified, 'apply', definition.slug, 'contribution');
      equipmentValues.push(result.report);
      return result.value;
    },
  );
  if (mode === 'off')
    equipmentValues.push(prune(definition, mode, definition.slug, 'contribution').report);
  return {
    definition: optimized.value,
    report: { ...optimized.report, mode, equipmentValues },
  };
}
