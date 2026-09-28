import type { SkillLevelSource } from '../../../../../packages/game-data-contract/src/primitives.ts';
import type { PassiveSkillLevelSource } from '../../compiler/skills/passiveSkillRequest.ts';
import type { NativeOperatorSkillGroupSource } from './skillGroups.ts';

/** AKEDB CharGrowthTable 的等级组类型；与技能库操作分类无关。
 * 0/NormalAttack、1/NormalSkill、2/UltimateSkill、3/ComboSkill。
 * 依据与版本边界见 combat-spec/docs/character-deck-attributes.md。
 */
const NATIVE_LEVEL_SOURCES: Readonly<Partial<Record<number, SkillLevelSource>>> = {
  0: 'basicAttack',
  1: 'battleSkill',
  2: 'ultimate',
  3: 'comboSkill',
};

export function resolveBasePassiveLevelSource(
  nativeGroups: readonly NativeOperatorSkillGroupSource[],
  passiveSkillId: string,
): PassiveSkillLevelSource {
  const groups = nativeGroups.filter(group => group.skillIds.includes(passiveSkillId));
  if (groups.length > 1) {
    throw new Error(
      `base passive ${JSON.stringify(passiveSkillId)} belongs to multiple native skill groups`,
    );
  }
  const group = groups[0];
  if (!group) return { kind: 'nativeDefault' };
  const levelSource = NATIVE_LEVEL_SOURCES[group.nativeGroupType];
  if (!levelSource) {
    throw new Error(
      `${group.sourcePath}: unsupported native skill level group type ${group.nativeGroupType}`,
    );
  }
  return { kind: 'operatorSkillGroup', levelSource };
}
