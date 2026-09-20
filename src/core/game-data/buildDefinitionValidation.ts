/**
 * 轨道内嵌的干员、武器与装备实例和版本化游戏数据之间的严格校验。
 * 调用方必须先完成项目结构校验；本层只处理定义身份、装备约束和跨定义引用。
 */
import type { EndaxisProjectDocument, TrackDocument } from '../project/schema';
import type { ValidationIssue } from '../project/validation';
import type { GearDefinition, GearSlotType, WeaponDefinition } from './equipmentDefinition';
import type { GameDataRepository } from './gameDataRepository';
import type { OperatorDefinition } from './operatorDefinition';
import { listSkillGroupDefinitionBindings } from './operatorSkillDefinitions';

type BuildDefinitionIndex = {
  getOperator(
    slug: string,
  ):
    | (Pick<OperatorDefinition, 'slug' | 'weaponType'> &
        Partial<Pick<OperatorDefinition, 'skillGroups'>>)
    | null;
  getWeapon(slug: string): WeaponDefinition | null;
  getGear(slug: string): GearDefinition | null;
  getGearSet: GameDataRepository['getGearSet'];
};

const trackGearSlotTypes = {
  armor: 'armor',
  gloves: 'gloves',
  accessory1: 'accessory',
  accessory2: 'accessory',
} as const satisfies Record<keyof TrackDocument['gears'], GearSlotType>;
const trackGearSlots = [
  'armor',
  'gloves',
  'accessory1',
  'accessory2',
] as const satisfies readonly (keyof TrackDocument['gears'])[];

function validateDefinitionIdentity(
  requestedSlug: string,
  resolvedSlug: string,
  path: string,
  kind: 'operator' | 'weapon' | 'gear' | 'gear set',
  issues: ValidationIssue[],
): boolean {
  if (resolvedSlug === requestedSlug) return true;
  issues.push({ path, message: `${kind} definition identity mismatch` });
  return false;
}

/** 在数据装配完成后校验项目中全部养成实例及轨道装备约束。 */
export function validateProjectBuildDefinitionReferences(
  project: EndaxisProjectDocument,
  repository: BuildDefinitionIndex,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  project.scenarios.forEach((scenario, scenarioIndex) => {
    const scenarioPath = `$.scenarios[${scenarioIndex}]`;

    scenario.tracks.forEach((track, trackIndex) => {
      if (track === null) return;
      const trackPath = `${scenarioPath}.tracks[${trackIndex}]`;

      const operator = track.operator;
      if (operator !== null) {
        const operatorPath = `${trackPath}.operator`;
        const definition = repository.getOperator(operator.operatorSlug);
        if (definition === null) {
          issues.push({ path: `${operatorPath}.operatorSlug`, message: 'unknown operator' });
        } else if (
          validateDefinitionIdentity(
            operator.operatorSlug,
            definition.slug,
            `${operatorPath}.operatorSlug`,
            'operator',
            issues,
          )
        ) {
          for (let castIndex = 0; castIndex < track.skillCasts.length; castIndex += 1) {
            const cast = track.skillCasts[castIndex]!;
            if (cast.source.kind !== 'operatorSkill') continue;
            const source = cast.source;
            const castPath = `${trackPath}.skillCasts[${castIndex}].source`;
            const group = definition.skillGroups?.find(
              candidate => candidate.key === source.skillGroupKey,
            );
            // 精简索引只提供构筑兼容性时不校验技能引用；正式仓库始终提供技能组。
            if (definition.skillGroups === undefined) continue;
            if (group === undefined) {
              issues.push({
                path: `${castPath}.skillGroupKey`,
                message: `unknown skill group '${source.skillGroupKey}'`,
              });
              continue;
            }
            const skill = listSkillGroupDefinitionBindings(group).find(
              candidate => candidate.skill.key === source.skillKey,
            )?.skill;
            if (skill === undefined) {
              issues.push({
                path: `${castPath}.skillKey`,
                message: `unknown skill '${source.skillKey}'`,
              });
              continue;
            }
          }
          const weapon = track.weapon;
          if (weapon !== null) {
            const weaponDefinition = repository.getWeapon(weapon.weaponSlug);
            if (
              weaponDefinition !== null &&
              weaponDefinition.weaponType !== definition.weaponType
            ) {
              issues.push({
                path: `${trackPath}.weapon.weaponSlug`,
                message: `weapon type '${weaponDefinition.weaponType}' is incompatible with operator weapon type '${definition.weaponType}'`,
              });
            }
          }
        }
      }

      const weapon = track.weapon;
      if (weapon !== null) {
        const weaponPath = `${trackPath}.weapon`;
        const definition = repository.getWeapon(weapon.weaponSlug);
        if (definition === null) {
          issues.push({ path: `${weaponPath}.weaponSlug`, message: 'unknown weapon' });
        } else if (
          validateDefinitionIdentity(
            weapon.weaponSlug,
            definition.slug,
            `${weaponPath}.weaponSlug`,
            'weapon',
            issues,
          )
        ) {
          if (weapon.traitLevels.length !== definition.traits.length) {
            issues.push({
              path: `${weaponPath}.traitLevels`,
              message: `expected ${definition.traits.length} weapon trait levels`,
            });
          } else {
            weapon.traitLevels.forEach((level, index) => {
              const trait = definition.traits[index]!;
              if (level > trait.levelCount) {
                issues.push({
                  path: `${weaponPath}.traitLevels[${index}]`,
                  message: `weapon trait level exceeds maximum ${trait.levelCount}`,
                });
              }
            });
          }
        }
      }

      for (const slot of trackGearSlots) {
        const instance = track.gears[slot];
        if (instance === null) continue;
        const gearPath = `${trackPath}.gears.${slot}`;
        const definition = repository.getGear(instance.gearSlug);
        if (definition === null) {
          issues.push({ path: `${gearPath}.gearSlug`, message: 'unknown gear' });
          continue;
        }
        if (
          !validateDefinitionIdentity(
            instance.gearSlug,
            definition.slug,
            `${gearPath}.gearSlug`,
            'gear',
            issues,
          )
        ) {
          continue;
        }

        const expectedSlotType = trackGearSlotTypes[slot];
        if (definition.slotType !== expectedSlotType) {
          issues.push({
            path: `${gearPath}.gearSlug`,
            message: `gear slot '${definition.slotType}' is incompatible with track slot '${slot}'`,
          });
        }
        if (instance.artificingLevels.length !== definition.traits.length) {
          issues.push({
            path: `${gearPath}.artificingLevels`,
            message: `expected ${definition.traits.length} gear trait levels`,
          });
        } else {
          instance.artificingLevels.forEach((level, index) => {
            const trait = definition.traits[index]!;
            if (level >= trait.levelCount) {
              issues.push({
                path: `${gearPath}.artificingLevels[${index}]`,
                message: `gear trait level exceeds maximum ${trait.levelCount - 1}`,
              });
            }
          });
        }
        if (definition.gearSetSlug !== undefined) {
          const gearSet = repository.getGearSet(definition.gearSetSlug);
          if (gearSet === null) {
            issues.push({
              path: `${gearPath}.gearSlug`,
              message: `unknown gear set '${definition.gearSetSlug}'`,
            });
          } else {
            validateDefinitionIdentity(
              definition.gearSetSlug,
              gearSet.slug,
              `${gearPath}.gearSlug`,
              'gear set',
              issues,
            );
          }
        }
      }
    });
  });

  return issues;
}
