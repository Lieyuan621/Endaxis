/** 将资源投影转换为正式定义。可选优化完成后，始终将表达式转换为图节点。 */
import type {
  OperatorBuffDefinitions,
  EquipmentContributionDefinition,
  GearSetDefinition,
  WeaponDefinition,
  IntermediateDefinition,
  OperatorDefinition,
} from './intermediateDefinitions.ts';
import { pruneUnusedGraphEquipmentContributionBlackboard } from './optimization/graphValueOptimization.ts';
import type * as Contract from '../../../../packages/game-data-contract/src/index.ts';
import type {
  DefinitionOptimizationMode,
  DefinitionOptimizationReport,
} from './optimization/definitionOptimization.ts';
import type { ResourceValueOptimizationReport } from './optimization/resourceValueOptimization.ts';
import type { EquipmentValueOptimizationReport } from './optimization/equipmentValueOptimization.ts';
import type { GraphSharedEntityValueUsage } from './optimization/graphValueOptimization.ts';
import { createGraphEntityUsageContext } from './optimization/graphValueOptimization.ts';

import { optimizeResourceGraphs } from './optimization/resourceGraphOptimization.ts';
import { prepareActionGraphIdentities } from './optimization/actionGraphProjection.ts';
import { extractDefinitionDataNodes } from './extractGraphDataNodes.ts';

export interface DefinitionProgramOptimizationReport {
  readonly mode: DefinitionOptimizationMode;
  readonly programs: readonly DefinitionOptimizationReport[];
  readonly before: { readonly steps: number; readonly conditions: number };
  readonly after: { readonly steps: number; readonly conditions: number };
  readonly resourceValues: readonly ResourceValueOptimizationReport[];
  readonly equipmentValues: readonly EquipmentValueOptimizationReport[];
}

export function finalizeDefinitionResources<T>(
  value: IntermediateDefinition<T>,
  mode: DefinitionOptimizationMode,
  pruneValues?: (simplified: IntermediateDefinition<T>) => IntermediateDefinition<T>,
  resourceValues?: Parameters<typeof optimizeResourceGraphs>[3],
): {
  readonly value: T;
  readonly report: DefinitionProgramOptimizationReport;
} {
  // 先确定真正被外部配置引用的动作身份；无引用的生成路径不能阻止局部宏提取。
  const result = optimizeResourceGraphs(
    prepareActionGraphIdentities(value),
    mode,
    pruneValues,
    resourceValues,
  );
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
      resourceValues: result.resourceValues,
      equipmentValues: [],
    },
  };
}

export function finalizeOperatorDefinition(
  operator: OperatorDefinition,
  mode: DefinitionOptimizationMode,
  sharedEntityUsage?: GraphSharedEntityValueUsage,
  commonBuffDefinitions: OperatorBuffDefinitions = {},
): {
  readonly operator: Contract.OperatorDefinition;
  readonly report: DefinitionProgramOptimizationReport;
} {
  const skillInitialKeys = new Map<string, Set<string>>();
  const passiveInitialKeys = new Map<string, Set<string>>();
  for (const upgrade of [...operator.talents, ...operator.potentials]) {
    for (const modifier of upgrade.modifiers ?? []) {
      if (modifier.kind !== 'patchSkillBlackboard' && modifier.kind !== 'patchPassiveBlackboard')
        continue;
      const keysByResource =
        modifier.kind === 'patchSkillBlackboard' ? skillInitialKeys : passiveInitialKeys;
      const resourceId =
        modifier.kind === 'patchSkillBlackboard' ? modifier.skillKey : modifier.passiveSkillKey;
      const keys = keysByResource.get(resourceId) ?? new Set<string>();
      keys.add(modifier.blackboardKey);
      keysByResource.set(resourceId, keys);
    }
  }
  const result = finalizeDefinitionResources<Contract.OperatorDefinition>(
    operator,
    mode,
    undefined,
    {
      skillInitialKeys,
      passiveInitialKeys,
      sharedUsage: sharedEntityUsage,
      usageContext: createGraphEntityUsageContext(
        operator.abilityEntityDefinitions,
        sharedEntityUsage,
        { ...commonBuffDefinitions, ...operator.buffDefinitions },
      ),
    },
  );
  return { operator: result.value, report: result.report };
}

export function finalizeCommonBuffDefinitions(
  definitions: OperatorBuffDefinitions,
  mode: DefinitionOptimizationMode = 'apply',
  sharedUsage?: GraphSharedEntityValueUsage,
) {
  const result = finalizeDefinitionResources<{ buffDefinitions: Contract.OperatorBuffDefinitions }>(
    { buffDefinitions: definitions },
    mode,
    undefined,
    {
      sharedUsage,
      usageContext: createGraphEntityUsageContext(undefined, sharedUsage),
    },
  );
  return { definitions: result.value.buffDefinitions, report: result.report };
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

function recordEquipmentReport(
  reports: EquipmentValueOptimizationReport[],
  report: EquipmentValueOptimizationReport,
) {
  const index = reports.findIndex(item => item.path === report.path);
  if (index < 0) reports.push(report);
  else
    reports[index] = {
      ...report,
      removedInitialKeys: [...reports[index]!.removedInitialKeys, ...report.removedInitialKeys],
    };
}

export function finalizeWeaponDefinition(
  definition: WeaponDefinition,
  mode: DefinitionOptimizationMode = 'apply',
  sharedUsage?: GraphSharedEntityValueUsage,
) {
  const equipmentValues: EquipmentValueOptimizationReport[] = [];
  const optimized = finalizeDefinitionResources<Contract.WeaponDefinition>(
    definition,
    mode,
    simplified => ({
      ...simplified,
      traits: simplified.traits.map((trait, index) => {
        const result = prune(trait, 'apply', `${definition.slug}:${trait.key}`, `traits[${index}]`);
        recordEquipmentReport(equipmentValues, result.report);
        return result.value;
      }),
    }),
    { sharedUsage, usageContext: createGraphEntityUsageContext(undefined, sharedUsage) },
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
  sharedUsage?: GraphSharedEntityValueUsage,
) {
  const equipmentValues: EquipmentValueOptimizationReport[] = [];
  const optimized = finalizeDefinitionResources<Contract.GearSetDefinition>(
    definition,
    mode,
    simplified => {
      const result = prune(simplified, 'apply', definition.slug, 'contribution');
      recordEquipmentReport(equipmentValues, result.report);
      return result.value;
    },
    { sharedUsage, usageContext: createGraphEntityUsageContext(undefined, sharedUsage) },
  );
  if (mode === 'off')
    equipmentValues.push(prune(definition, mode, definition.slug, 'contribution').report);
  return {
    definition: optimized.value,
    report: { ...optimized.report, mode, equipmentValues },
  };
}
