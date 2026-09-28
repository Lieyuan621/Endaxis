import { describe, expect, it } from 'vitest';

import {
  parseNativeOperatorSkillGroupSources,
  parseOperatorSkillGroupSources,
  validateOperatorSkillGroups,
  type OperatorSkillIdentitySource,
} from '../src/index.ts';

const SKILLS: readonly OperatorSkillIdentitySource[] = (
  [
    ['basicAttack1', 'attack_1', 'basicAttack'],
    ['basicAttack2', 'attack_2', 'basicAttack'],
    ['finisher', 'power_attack', 'finisher'],
    ['plungingAttack', 'plunging', 'plungingAttack'],
    ['battleSkill', 'normal_skill', 'battleSkill'],
    ['comboSkill', 'combo_skill', 'comboSkill'],
    ['ultimate', 'ultimate_skill', 'ultimate'],
  ] as const
).map(([, key, skillType]) => ({ key, skillType }));

describe('技能库展示分组与原生技能覆盖', () => {
  it('拒绝在展示组和变体中配置原生养成分类', () => {
    expect(() =>
      parseOperatorSkillGroupSources(
        [{ ...group('base', 'basicAttack', ['basic']), nativeGroupType: 0 }],
        'groups',
      ),
    ).toThrow('nativeGroupType');
    expect(() =>
      parseOperatorSkillGroupSources(
        [
          {
            ...group('base', 'basicAttack', ['basic']),
            variants: [{ key: 'other', skillKeys: ['enhanced'], nativeGroupType: 2 }],
          },
        ],
        'groups',
      ),
    ).toThrow('nativeGroupType');
  });

  it('允许展示组跨养成分类重排，但拒绝原生技能重复归属和漏导出', () => {
    const skills: readonly OperatorSkillIdentitySource[] = [
      { key: 'basic', skillType: 'basicAttack' },
      { key: 'enhanced', skillType: 'basicAttack' },
    ];
    const groups = parseOperatorSkillGroupSources(
      [group('sequence', 'basicAttack', ['enhanced', 'basic'])],
      'groups',
    );
    expect(() =>
      validateOperatorSkillGroups(groups, skills, [
        nativeSource(0, ['basic']),
        nativeSource(2, ['enhanced']),
      ]),
    ).not.toThrow();
    expect(() =>
      validateOperatorSkillGroups(groups, skills, [
        nativeSource(0, ['basic']),
        nativeSource(2, ['enhanced', 'basic']),
      ]),
    ).toThrow('duplicate native skill');
    expect(() =>
      validateOperatorSkillGroups(groups, skills, [
        nativeSource(0, ['basic']),
        nativeSource(2, ['enhanced', 'missing']),
      ]),
    ).toThrow('uncovered native skills');
  });

  it('读取基础组与变体的通用递归放置策略，并校验端点和回退预算', () => {
    const placementPolicy = {
      kind: 'recursiveInput',
      firstSkillKey: 'basicAttack1',
      terminalSkillKey: 'basicAttack2',
      maxSegments: 8,
      fallback: 'sequence',
    };
    const source = {
      ...group('basicAttack', 'basicAttack', ['basicAttack1', 'basicAttack2']),
      placementPolicy,
      variants: [
        {
          key: 'alternate',
          nameKey: 'skillNames.enhanced',
          skillKeys: ['basicAttack1', 'basicAttack2'],
          placementPolicy,
        },
      ],
    };
    const parsed = parseOperatorSkillGroupSources([source], 'groups')[0]!;
    expect(parsed.placementPolicy).toEqual(placementPolicy);
    expect(parsed.variants[0]!.placementPolicy).toEqual(placementPolicy);
    expect(() =>
      parseOperatorSkillGroupSources(
        [{ ...source, placementPolicy: { ...placementPolicy, terminalSkillKey: 'missing' } }],
        'groups',
      ),
    ).toThrow('endpoints');
    expect(() =>
      parseOperatorSkillGroupSources(
        [{ ...source, placementPolicy: { ...placementPolicy, maxSegments: 1 } }],
        'groups',
      ),
    ).toThrow('fallback sequence');
  });
  it.each([['operationType', 'passive']])('配置入口拒绝不属于契约的 %s=%s', (field, value) => {
    const groups = operatorGroups();
    groups[0]![field] = value;
    expect(() => parseOperatorSkillGroupSources(groups, 'fixture.skillGroups')).toThrow(
      `fixture.skillGroups[0].${field}: unsupported identity ${JSON.stringify(value)}`,
    );
  });

  it('组和变体拒绝重复声明等级来源', () => {
    const groups = operatorGroups();
    expect(() =>
      parseOperatorSkillGroupSources([{ ...groups[0], levelSource: 'basicAttack' }], 'groups'),
    ).toThrow('levelSource');
    groups[0]!.variants = [
      {
        key: 'bad',
        skillKeys: ['basicAttack1'],
        nameKey: 'skillNames.enhanced',
      },
    ];
    (groups[0]!.variants as Record<string, unknown>[])[0]!.levelSource = 'ultimate';
    expect(() => parseOperatorSkillGroupSources(groups, 'fixture.skillGroups')).toThrow(
      'levelSource',
    );
  });

  it('逐技能读取运行时替换的放置语义，不把 replacement 统一等同于强化', () => {
    const groups = operatorGroups();
    groups[3]!.replacementPlacements = {
      next: 'sequence',
      exit: 'internal',
    };
    expect(parseOperatorSkillGroupSources(groups, 'fixture.skillGroups')[3]).toMatchObject({
      key: 'battleSkill',
      replacementPlacements: {
        next: 'sequence',
        exit: 'internal',
      },
    });

    groups[3]!.replacementPlacements = { bad: 'guessed' };
    expect(() => parseOperatorSkillGroupSources(groups, 'fixture.skillGroups')).toThrow(
      'fixture.skillGroups[3].replacementPlacements.bad: unsupported identity "guessed"',
    );
  });

  it('严格读取原生有序组，并通过佩丽卡式显式分组', () => {
    const growth = growthTable();
    const rawGroups = operatorGroups();
    const groups = parseOperatorSkillGroupSources(rawGroups, 'perlica.skillGroups');
    const nativeGroups = parseNativeOperatorSkillGroupSources(growth, 'chr_test');

    expect(nativeGroups.map(group => [group.nativeGroupType, group.skillIds])).toEqual([
      [0, ['attack_1', 'attack_2', 'power_attack', 'plunging']],
      [1, ['normal_skill']],
      [3, ['combo_skill']],
      [2, ['ultimate_skill']],
    ]);
    expect(() => validateOperatorSkillGroups(groups, SKILLS, nativeGroups)).not.toThrow();
  });

  it('展示配置不携带养成分类，技能覆盖按原生 ID 校验', () => {
    const skills: readonly OperatorSkillIdentitySource[] = [
      { key: 'basic', skillType: 'basicAttack' },
      { key: 'enhanced', skillType: 'basicAttack' },
    ];
    const groups = parseOperatorSkillGroupSources(
      [
        {
          key: 'basicAttack',
          operationType: 'basicAttack',
          skillKeys: ['basic'],
          variants: [
            {
              key: 'enhancedBasicAttack',
              skillKeys: ['enhanced'],
              nameKey: 'skillNames.enhanced',
            },
          ],
        },
      ],
      'fixture.skillGroups',
    );
    expect(() =>
      validateOperatorSkillGroups(groups, skills, [
        nativeSource(0, ['basic']),
        nativeSource(2, ['enhanced']),
      ]),
    ).not.toThrow();
  });

  it('拒绝重复归属和原生组漂移，允许操作类别与执行类别不同', () => {
    const duplicate = operatorGroups();
    duplicate[1]!.operationType = 'basicAttack';
    duplicate[1]!.skillKeys = ['attack_1'];
    expect(() =>
      validateOperatorSkillGroups(
        parseOperatorSkillGroupSources(duplicate, 'fixture.skillGroups'),
        SKILLS,
        parseNativeOperatorSkillGroupSources(growthTable(), 'chr_test'),
      ),
    ).toThrow('assigned more than once');

    const wrongType = operatorGroups();
    wrongType[0]!.operationType = 'battleSkill';
    expect(() =>
      validateOperatorSkillGroups(
        parseOperatorSkillGroupSources(wrongType, 'fixture.skillGroups'),
        SKILLS,
        parseNativeOperatorSkillGroupSources(growthTable(), 'chr_test'),
      ),
    ).not.toThrow();

    const drifted = growthTable();
    drifted.chr_test.skillGroupMap.normal.skillIdList.pop();
    expect(() =>
      validateOperatorSkillGroups(
        parseOperatorSkillGroupSources(operatorGroups(), 'fixture.skillGroups'),
        SKILLS,
        parseNativeOperatorSkillGroupSources(drifted, 'chr_test'),
      ),
    ).toThrow('does not match generated skill sources');
  });

  it('manifest 基础被动可在可放置技能组内被排除，也可来自独立 Passive SkillData', () => {
    const groups = parseOperatorSkillGroupSources(operatorGroups(), 'fixture.skillGroups');
    const nativeGroups = parseNativeOperatorSkillGroupSources(growthTable(), 'chr_test').map(
      group =>
        group.nativeGroupType === 1
          ? { ...group, skillIds: [...group.skillIds, 'passive_0'] }
          : group,
    );

    expect(() =>
      validateOperatorSkillGroups(groups, SKILLS, nativeGroups, {
        basePassiveSkillIds: ['passive_0'],
      }),
    ).not.toThrow();
    expect(() =>
      validateOperatorSkillGroups(
        groups,
        SKILLS,
        parseNativeOperatorSkillGroupSources(growthTable(), 'chr_test'),
        {
          basePassiveSkillIds: ['independent_passive'],
        },
      ),
    ).not.toThrow();
  });

  it('显式的运行时替换技能可注册在组中，且只允许该集合包含原生等级组外的内部技能', () => {
    const skills: readonly OperatorSkillIdentitySource[] = [
      { key: 'native_base', skillType: 'ultimate' },
      { key: 'native_enhanced', skillType: 'ultimate' },
      { key: 'internal_exit', skillType: 'ultimate' },
    ];
    const groups = parseOperatorSkillGroupSources(
      [group('ultimate', 'ultimate', ['native_base', 'native_enhanced', 'internal_exit'])],
      'fixture.skillGroups',
    );
    const nativeGroups = [nativeSource(2, ['native_base', 'native_enhanced'])];

    expect(() =>
      validateOperatorSkillGroups(groups, skills, nativeGroups, {
        runtimeReplacementSkillKeys: ['native_enhanced', 'internal_exit'],
      }),
    ).not.toThrow();
    expect(() => validateOperatorSkillGroups(groups, skills, nativeGroups)).toThrow(
      /missing native skills \["internal_exit"\]/,
    );
  });
});

function operatorGroups(): Array<Record<string, unknown> & { skillKeys: string[] }> {
  return [
    group('basicAttack', 'basicAttack', ['attack_1', 'attack_2']),
    group('finisher', 'finisher', ['power_attack']),
    group('plungingAttack', 'plungingAttack', ['plunging']),
    group('battleSkill', 'battleSkill', ['normal_skill']),
    group('comboSkill', 'comboSkill', ['combo_skill']),
    group('ultimate', 'ultimate', ['ultimate_skill']),
  ];
}

function group(key: string, skillType: string, skillKeys: string[]) {
  return { key, operationType: skillType, skillKeys };
}

function growthTable() {
  return {
    chr_test: {
      skillGroupMap: {
        normal: nativeRow('normal', 0, ['attack_1', 'attack_2', 'power_attack', 'plunging']),
        battle: nativeRow('battle', 1, ['normal_skill']),
        combo: nativeRow('combo', 3, ['combo_skill']),
        ultimate: nativeRow('ultimate', 2, ['ultimate_skill']),
      },
    },
  };
}

function nativeRow(skillGroupId: string, skillGroupType: number, skillIdList: string[]) {
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

function nativeSource(nativeGroupType: number, skillIds: string[]) {
  return {
    sourcePath: 'fixture',
    skillGroupId: `group_${nativeGroupType}`,
    nativeGroupType,
    skillIds,
  };
}
