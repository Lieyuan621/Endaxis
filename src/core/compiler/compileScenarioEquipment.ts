/**
 * 把场景轨道上的装备 Build 引用解析为按干员归属的定义贡献。
 * 这里只连接已有装备 DSL，不计算面板，也不安装运行时事件监听器。
 */
import type { CompiledEquipmentContribution } from './compileEquipment';
import {
  compileGearContributions,
  compileGearSetContribution,
  compileWeaponContributions,
} from './compileEquipment';
import type { ScenarioDocument } from '../project/schema';
import {
  resolveScenarioBuilds,
  type ResolvedScenarioBuild,
  type ScenarioBuildIndex,
} from './resolveScenarioBuilds';

export interface CompiledScenarioOperatorEquipment {
  readonly operatorId: string;
  readonly contributions: readonly CompiledEquipmentContribution[];
}

/** 从已解析构筑编译武器、装备词条与三件套贡献，不再访问项目定义引用。 */
export function compileResolvedScenarioEquipment(
  builds: readonly ResolvedScenarioBuild[],
): readonly CompiledScenarioOperatorEquipment[] {
  return builds.map(({ track, operator, weapon, gears, activeGearSets }) => {
    const attributes = { main: operator.mainAttribute, secondary: operator.secondaryAttribute };
    const contributions: CompiledEquipmentContribution[] = [];

    if (weapon !== null) {
      contributions.push(
        ...compileWeaponContributions(weapon.definition, weapon.instance.traitLevels, attributes),
      );
    }

    for (const gear of gears) {
      contributions.push(
        ...compileGearContributions(gear.definition, gear.instance.artificingLevels, attributes),
      );
    }
    for (const gearSet of activeGearSets) {
      contributions.push(compileGearSetContribution(gearSet, attributes));
    }
    return { operatorId: track.id, contributions };
  });
}

/** 按轨道顺序解析并编译上场干员的武器、装备词条与三件套贡献。 */
export function compileScenarioEquipment(
  scenario: ScenarioDocument,
  index: ScenarioBuildIndex,
): readonly CompiledScenarioOperatorEquipment[] {
  return compileResolvedScenarioEquipment(resolveScenarioBuilds(scenario, index));
}
