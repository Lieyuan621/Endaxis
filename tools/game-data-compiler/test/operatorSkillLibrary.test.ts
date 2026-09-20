import { describe, expect, it } from 'vitest';

import { compileOperatorSkillLibrarySource } from '../src/index.ts';
import { activeSkillFixture } from './sourceFixtures.ts';

describe('Operator 技能库组装', () => {
  it('主动定义与 CharGrowthTable 原生等级组同时闭合', () => {
    const result = compileOperatorSkillLibrarySource({
      characterId: 'chr_test',
      sourcePath: 'perlica',
      manifestSkills: [
        skill('basicAttack', 'native_attack.json'),
        skill('battleSkill', 'native_battle.json'),
      ],
      manifestSkillGroups: [
        group('basicAttack', 'basicAttack', 'basicAttack', 0, ['native_attack']),
        group('battleSkill', 'battleSkill', 'battleSkill', 1, ['native_battle']),
      ],
      skillDataBySourceFile: {
        'native_attack.json': activeSkillFixture('native_attack'),
        'native_battle.json': activeSkillFixture('native_battle'),
      },
      skillPatchTable: {},
      charGrowthTable: {
        chr_test: {
          skillGroupMap: {
            normal: nativeGroup('normal', 0, ['native_attack']),
            battle: nativeGroup('battle', 1, ['native_battle']),
          },
        },
      },
    });

    expect(result.activeSkills.entries.map(entry => entry.key)).toEqual([
      'native_attack',
      'native_battle',
    ]);
    expect(result.skillGroups.map(group => group.key)).toEqual(['basicAttack', 'battleSkill']);
    expect(result.nativeSkillGroups.map(group => group.nativeGroupType)).toEqual([0, 1]);
  });

  it('原生等级组与配置技能漂移时整体组装失败', () => {
    expect(() =>
      compileOperatorSkillLibrarySource({
        characterId: 'chr_test',
        sourcePath: 'fixture',
        manifestSkills: [skill('basicAttack', 'native_attack.json')],
        manifestSkillGroups: [
          group('basicAttack', 'basicAttack', 'basicAttack', 0, ['native_attack']),
        ],
        skillDataBySourceFile: { 'native_attack.json': activeSkillFixture('native_attack') },
        skillPatchTable: {},
        charGrowthTable: {
          chr_test: {
            skillGroupMap: { normal: nativeGroup('normal', 0, ['different_attack']) },
          },
        },
      }),
    ).toThrow('missing native skills ["native_attack"]');
  });
});

function skill(skillType: string, source: string) {
  return { skillType, levelSource: skillType, source, compile: { kind: 'resolvedSequence' } };
}

function group(
  key: string,
  skillType: string,
  levelSource: string,
  nativeGroupType: number,
  skillKeys: string[],
) {
  return { key, skillType, levelSource, nativeGroupType, skillKeys };
}

function nativeGroup(skillGroupId: string, skillGroupType: number, skillIdList: string[]) {
  return {
    conditionDesc1: {},
    conditionDesc2: {},
    conditionDescInactive1: {},
    conditionDescInactive2: {},
    conditionIcon1: '',
    conditionIcon2: '',
    conditionId1: '',
    conditionId2: '',
    conditionName1: {},
    conditionName2: {},
    conditionPostDesc1: {},
    conditionPostDesc2: {},
    desc: {},
    icon: '',
    name: {},
    skillGroupId,
    skillGroupType,
    skillIdList,
  };
}
