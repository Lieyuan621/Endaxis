import type {
  SkillDefinition,
  SkillDefinitionProperties,
} from '../../packages/game-data-contract/src/skills';
import type { SkillLevelSource, SkillType } from '../../packages/game-data-contract/src/primitives';

/** 小型测试技能可只声明关注的行为；默认时长覆盖全部静态调度。正式数据不使用此工厂。 */
export type SkillFixtureProperties = Omit<
  SkillDefinitionProperties,
  'nativeSkillType' | 'naturalDurationFrames' | 'exclusiveFrame' | 'offsetRecordFrame'
> &
  Partial<
    Pick<
      SkillDefinitionProperties,
      'nativeSkillType' | 'naturalDurationFrames' | 'exclusiveFrame' | 'offsetRecordFrame'
    >
  > & {
    skillType?: SkillType;
    levelSource?: SkillLevelSource;
  };

export function skillFixture(input: SkillFixtureProperties): SkillDefinition {
  const { skillType = 'basicAttack', levelSource = 'basicAttack', ...fields } = input;
  const nativeTypes = {
    basicAttack: 'attack',
    plungingAttack: 'attack',
    finisher: 'breakingAttack',
    battleSkill: 'normalSkill',
    comboSkill: 'comboSkill',
    ultimate: 'ultimateSkill',
    dodge: 'dodge',
  } as const;
  const properties: SkillDefinitionProperties = {
    nativeSkillType: nativeTypes[skillType],
    naturalDurationFrames: Math.max(
      1,
      ...input.scheduledSequences.map(item => (item.endFrame ?? item.startFrame) + 1),
    ),
    exclusiveFrame: 0,
    offsetRecordFrame: 0,
    ...fields,
  };
  return skillType === 'dodge'
    ? { ...properties, skillType }
    : { ...properties, skillType, levelSource };
}
