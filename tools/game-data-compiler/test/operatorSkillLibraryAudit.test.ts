import { describe, expect, it } from 'vitest';

import { auditOperatorSkillLibraries, auditOperatorSourceClosures } from '../src/index.ts';
import { activeSkillFixture } from './sourceFixtures.ts';
import { parseOperatorSkillGroupValidationOptions } from '../src/domains/operator/skillGroups.ts';

describe('Operator 技能库批量审计', () => {
  it('内部运行技能例外与正式生成共用读取器；不再误报等级组外的已声明技能', () => {
    const base = operator('internal', 'chr_internal', 'native_exit.json');
    base.skills.push({ ...base.skills[0]!, source: 'native_main.json' });
    base.skillGroups[0]!.skillKeys.push('native_main');
    const run = (extra: object) =>
      auditOperatorSkillLibraries(
        { operators: [{ ...base, ...extra }] },
        {
          'native_exit.json': activeSkillFixture('native_exit'),
          'native_main.json': activeSkillFixture('native_main'),
        },
        {},
        { chr_internal: { skillGroupMap: { normal: nativeGroup('normal', ['native_main']) } } },
      );
    expect(run({}).blockedCount).toBe(1);
    expect(run({ runtimeReplacementSkillKeys: ['native_exit'] }).supportedCount).toBe(1);
    expect(run({ runtimeReplacementSkillKeys: ['unknown'] }).entries[0]!.error).toContain(
      'unknown IDs',
    );
    expect(
      run({ runtimeReplacementSkillKeys: ['native_exit', 'native_exit'] }).entries[0]!.error,
    ).toContain('distinct');
    const values = {
      routingOnlyNativeSkillIds: ['route'],
      simulationEquivalentNativeSkillIds: ['equivalent'],
      basePassiveSkillIds: ['passive'],
      routedSkillKeys: ['routed'],
      runtimeReplacementSkillKeys: ['native_internal'],
    };
    expect(parseOperatorSkillGroupValidationOptions(values, 'operator')).toEqual(values);
  });
  it('继续审计后续干员，并分别报告 supported 与 blocked', () => {
    const report = auditOperatorSkillLibraries(
      {
        operators: [
          operator('valid', 'chr_valid', 'native_valid.json'),
          operator('drifted', 'chr_drifted', 'actual_drifted.json'),
        ],
      },
      {
        'native_valid.json': activeSkillFixture('native_valid'),
        'actual_drifted.json': activeSkillFixture('actual_drifted'),
      },
      {},
      {
        chr_valid: { skillGroupMap: { normal: nativeGroup('normal', ['native_valid']) } },
        chr_drifted: { skillGroupMap: { normal: nativeGroup('normal', ['expected_drifted']) } },
      },
    );

    expect(report).toMatchObject({
      operatorCount: 2,
      supportedCount: 1,
      blockedCount: 1,
      skillCount: 2,
      entries: [
        { slug: 'valid', status: 'supported', definitionCount: 1 },
        { slug: 'drifted', status: 'blocked', definitionCount: 0 },
      ],
    });
    expect(report.entries[1]!.error).toContain('missing native skills ["actual_drifted"]');
  });

  it('完整来源闭包将单个干员的来源错误保留为阻塞诊断', () => {
    const report = auditOperatorSourceClosures({
      manifest: { operators: [operator('missing-character', 'chr_missing', 'native_valid.json')] },
      skillDataBySourceFile: { 'native_valid.json': activeSkillFixture('native_valid') },
      skillDataById: { native_valid: activeSkillFixture('native_valid') },
      buffDataById: {},
      projectileDataById: {},
      abilityEntityDataById: {},
      gameplayTagPaths: [],
      skillPatchTable: {},
      characterTable: {},
      charGrowthTable: {},
      characterPotentialTable: {},
      potentialTalentEffectTable: {},
      skillConditionTable: {},
    });

    expect(report).toMatchObject({ operatorCount: 1, supportedCount: 0, blockedCount: 1 });
    expect(report.entries[0]!.error).toContain('CharacterTable.chr_missing: expected object');
  });
});

function operator(slug: string, charId: string, source: string) {
  return {
    slug,
    gameId: slug.replaceAll('-', '_').toUpperCase(),
    exportName: `${slug.replaceAll('-', '_')}GeneratedSource`,
    charId,
    skills: [{ skillType: 'basicAttack', levelSource: 'basicAttack', source }],
    skillGroups: [
      {
        key: 'basicAttack',
        skillType: 'basicAttack',
        levelSource: 'basicAttack',
        nativeGroupType: 0,
        skillKeys: [source.slice(0, -'.json'.length)],
      },
    ],
  };
}

function nativeGroup(skillGroupId: string, skillIdList: string[]) {
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
    skillGroupType: 0,
    skillIdList,
  };
}
