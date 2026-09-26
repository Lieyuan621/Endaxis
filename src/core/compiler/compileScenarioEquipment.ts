/**
 * 把场景轨道上的装备 Build 引用解析为按干员归属的定义贡献。
 * 这里只连接已有装备 DSL，不计算面板，也不安装运行时事件监听器。
 */
import {
  compileModifierContribution,
  type CompiledEquipmentContribution,
  type CompiledEquipmentModifierContribution,
} from './compileEquipment';

import type { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import type { GearDefinition } from '../game-data/equipmentDefinition';
import {
  compileGearContributions,
  compileGearSetContribution,
  compileWeaponContributions,
  compileWeaponBuffDefinitions,
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
  readonly buffDefinitions?: ReturnType<typeof compileWeaponBuffDefinitions>;
}

/** 面板编译只解析装备的静态修正，不要求装备 SkillData 或 BuffData 已装载。 */
export function compileResolvedScenarioEquipmentModifiers(
  builds: readonly ResolvedScenarioBuild[],
): readonly {
  operatorId: string;
  contributions: readonly CompiledEquipmentModifierContribution[];
}[] {
  return builds.map(({ track, operator, weapon, gears, activeGearSets }) => {
    const attributes = { main: operator.mainAttribute, secondary: operator.secondaryAttribute };
    const contributions: CompiledEquipmentModifierContribution[] = [];
    if (weapon !== null) {
      const { definition, instance } = weapon;
      if (instance.traitLevels.length !== definition.traits.length) {
        throw new RangeError(
          `weapon '${definition.slug}' expects ${definition.traits.length} trait levels, got ${instance.traitLevels.length}`,
        );
      }
      definition.traits.forEach((trait, index) =>
        contributions.push(
          compileModifierContribution(
            trait,
            instance.traitLevels[index]!,
            trait.levelCount,
            { kind: 'weaponTrait', slug: definition.slug, traitKey: trait.key },
            `weapon '${definition.slug}'.traits[${index}]`,
            attributes,
          ),
        ),
      );
    }
    for (const gear of gears) {
      const { definition, instance } = gear;
      if (instance.artificingLevels.length !== definition.traits.length) {
        throw new RangeError(
          `gear '${definition.slug}' expects ${definition.traits.length} artificing levels, got ${instance.artificingLevels.length}`,
        );
      }
      definition.traits.forEach((trait, index) =>
        contributions.push(
          compileModifierContribution(
            trait,
            instance.artificingLevels[index]! + 1,
            trait.levelCount,
            { kind: 'gearTrait', slug: definition.slug, traitKey: trait.key },
            `gear '${definition.slug}'.traits[${index}]`,
            attributes,
          ),
        ),
      );
    }
    for (const definition of activeGearSets) {
      contributions.push(
        compileModifierContribution(
          definition,
          1,
          1,
          { kind: 'gearSet', slug: definition.slug },
          `gear set '${definition.slug}'`,
          attributes,
        ),
      );
    }
    return { operatorId: track.id, contributions };
  });
}

/** 从已解析构筑编译武器、装备词条与三件套贡献，不再访问项目定义引用。 */
export function compileResolvedScenarioEquipment(
  builds: readonly ResolvedScenarioBuild[],
  programs: ActionGraphDefinitionRepository,
): readonly CompiledScenarioOperatorEquipment[] {
  return builds.map(({ track, operator, weapon, gears, activeGearSets }) => {
    const attributes = { main: operator.mainAttribute, secondary: operator.secondaryAttribute };
    const contributions: CompiledEquipmentContribution[] = [];

    if (weapon !== null) {
      contributions.push(
        ...compileWeaponContributions(
          weapon.definition,
          weapon.instance.traitLevels,
          attributes,
          programs,
        ),
      );
    }

    for (const gear of gears) {
      contributions.push(
        ...compileGearContributions(
          gear.definition as GearDefinition,
          gear.instance.artificingLevels,
          attributes,
        ),
      );
    }
    for (const gearSet of activeGearSets) {
      contributions.push(compileGearSetContribution(gearSet, attributes, programs));
    }
    return {
      operatorId: track.id,
      contributions,
      ...(weapon === null
        ? {}
        : {
            buffDefinitions: compileWeaponBuffDefinitions(weapon.definition, programs),
          }),
    };
  });
}

/** 按轨道顺序解析并编译上场干员的武器、装备词条与三件套贡献。 */
export function compileScenarioEquipment(
  scenario: ScenarioDocument,
  index: ScenarioBuildIndex,
  programs: ActionGraphDefinitionRepository,
): readonly CompiledScenarioOperatorEquipment[] {
  return compileResolvedScenarioEquipment(resolveScenarioBuilds(scenario, index), programs);
}
