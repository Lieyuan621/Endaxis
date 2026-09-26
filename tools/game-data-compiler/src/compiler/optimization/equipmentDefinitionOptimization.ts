/** 公共 Buff、武器词条和套装分别优化自己的资源图，不建立装备总图。 */
import type { OperatorBuffDefinitions } from '../../../../../packages/game-data-contract/src/buffs.ts';
import type {
  EquipmentContributionDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../../../../packages/game-data-contract/src/equipment.ts';
import type { DefinitionOptimizationMode } from './definitionOptimization.ts';
import { optimizeDefinitionResources } from './definitionProgramOptimization.ts';
import { pruneUnusedGraphEquipmentContributionBlackboard } from './graphValueOptimization.ts';
import type { EquipmentValueOptimizationReport } from './equipmentValueOptimization.ts';

export function optimizeCommonBuffDefinitions(
  definitions: OperatorBuffDefinitions,
  mode: DefinitionOptimizationMode = 'apply',
) {
  const result = optimizeDefinitionResources(definitions, mode);
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

export function optimizeWeaponDefinitionPrograms(
  definition: WeaponDefinition,
  mode: DefinitionOptimizationMode = 'apply',
) {
  const equipmentValues: EquipmentValueOptimizationReport[] = [];
  const optimized = optimizeDefinitionResources(definition, mode, simplified => ({
    ...simplified,
    traits: simplified.traits.map((trait, index) => {
      const result = prune(trait, 'apply', `${definition.slug}:${trait.key}`, `traits[${index}]`);
      equipmentValues.push(result.report);
      return result.value;
    }),
  }));
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

export function optimizeGearSetDefinitionPrograms(
  definition: GearSetDefinition,
  mode: DefinitionOptimizationMode = 'apply',
) {
  const equipmentValues: EquipmentValueOptimizationReport[] = [];
  const optimized = optimizeDefinitionResources(definition, mode, simplified => {
    const result = prune(simplified, 'apply', definition.slug, 'contribution');
    equipmentValues.push(result.report);
    return result.value;
  });
  if (mode === 'off')
    equipmentValues.push(prune(definition, mode, definition.slug, 'contribution').report);
  return {
    definition: optimized.value,
    report: { ...optimized.report, mode, equipmentValues },
  };
}
