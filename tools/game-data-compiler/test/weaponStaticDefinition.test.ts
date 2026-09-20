import { compileWeaponContributions } from '../../../src/core/compiler/compileEquipment.ts';
import { describe, expect, it } from 'vitest';

import { compileWeaponStaticDefinitionBatchSource } from '../src/index.ts';

describe('武器静态定义', () => {
  it('使用精确基础攻击节点和 SkillPatch 真实档位生成候选，以一份 Buff 安装保留参数列', () => {
    const result = compileWeaponStaticDefinitionBatchSource(
      { wpn_lance_fixture: weaponFixture() },
      upgradeFixture(),
      { sk_wpn_fixture: passiveFixture() },
      { sk_wpn_fixture: patchFixture() },
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.definitions).toEqual([
      {
        slug: 'wpn_lance_fixture',
        rarity: 6,
        weaponType: 'polearm',
        baseAttackAtLevelNodes: [51, 146, 247, 348, 449, 500],
        traits: [
          {
            key: 'skill1',
            levelCount: 2,
            modifiers: [
              {
                kind: 'attribute',
                attribute: 'will',
                operation: 'flat',
                value: [20, 36],
              },
            ],
          },
        ],
      },
    ]);
    expect(result.runtimeDependencies).toHaveLength(1);
    expect(result.runtimeDependencies[0]).toMatchObject({
      weaponId: 'wpn_lance_fixture',
      traitKey: 'skill1',
      slotIndex: 0,
      skillId: 'sk_wpn_fixture',
      referencedBuffIds: ['buff_wpn_fixture'],
      request: { originKind: 'weapon', skillId: 'sk_wpn_fixture' },
      levels: [1, 2],
      blackboard: { will: [20, 36], duration: [10, 20] },
      startupBuffs: [{ buffId: 'buff_wpn_fixture', blackboardAssignments: { duration: [10, 20] } }],
      toggleBuffs: [],
    });
    const dependency = result.runtimeDependencies[0]!;
    expect(dependency.startupBuffs[0]?.blackboardAssignments.duration).toBe(
      dependency.blackboard.duration,
    );
  });

  it('常量不按补丁档位复制，黑板引用仍保留完整等级列', () => {
    const passive = passiveFixture();
    passive.cardAttributeModifier = {
      isConvertedAttribute: false,
      attributeModifiers: [
        {
          modifyAttributeType: 'Specific',
          attributeType: 'Will',
          formulaItem: 'BaseAddition',
          param: { value: 7, useBlackboardKey: false, blackboardKey: '' },
        },
        {
          modifyAttributeType: 'Specific',
          attributeType: 'Agi',
          formulaItem: 'BaseAddition',
          param: { value: 0, useBlackboardKey: true, blackboardKey: 'will' },
        },
      ],
    };
    const result = compileWeaponStaticDefinitionBatchSource(
      { wpn_lance_fixture: weaponFixture() },
      upgradeFixture(),
      { sk_wpn_fixture: passive },
      { sk_wpn_fixture: patchFixture() },
    );
    expect(result.diagnostics).toEqual([]);
    const definition = result.definitions[0]!;
    const expanded = {
      ...definition,
      traits: definition.traits.map(trait => ({
        ...trait,
        modifiers: trait.modifiers.map(modifier => {
          const value = modifier.value;
          return {
            ...modifier,
            value:
              typeof value === 'number'
                ? Array.from({ length: trait.levelCount }, () => value)
                : value,
          };
        }),
      })),
    };
    for (const level of [1, 2]) {
      const attributes = { main: 'will', secondary: 'agility' } as const;
      expect(compileWeaponContributions(definition, [level], attributes)).toEqual(
        compileWeaponContributions(expanded, [level], attributes),
      );
    }
    expect(result.definitions[0]?.traits[0]).toEqual({
      key: 'skill1',
      levelCount: 2,
      modifiers: [
        { kind: 'attribute', attribute: 'will', operation: 'flat', value: 7 },
        { kind: 'attribute', attribute: 'agility', operation: 'flat', value: [20, 36] },
      ],
    });
  });

  it.each([
    {
      attributeType: 'Will',
      key: 'missing',
      reason: 'missing materialized blackboard value "missing"',
    },
    {
      attributeType: 'Def',
      key: 'will',
      reason: 'CardSkill cannot define GearDefinition.baseDefense',
    },
  ])('共同编译器保留静态阻塞和运行依赖：$reason', ({ attributeType, key, reason }) => {
    const passive = passiveFixture();
    passive.cardAttributeModifier = {
      isConvertedAttribute: false,
      attributeModifiers: [
        {
          modifyAttributeType: 'Specific',
          attributeType,
          formulaItem: 'BaseAddition',
          param: { value: 0, useBlackboardKey: true, blackboardKey: key },
        },
      ],
    };
    const result = compileWeaponStaticDefinitionBatchSource(
      { wpn_lance_fixture: weaponFixture() },
      upgradeFixture(),
      { sk_wpn_fixture: passive },
      { sk_wpn_fixture: patchFixture() },
    );
    expect(result.definitions).toEqual([]);
    expect(result.runtimeDependencies).toHaveLength(1);
    expect(result.diagnostics).toEqual([
      {
        status: 'blocked',
        sourcePath: 'SkillData.sk_wpn_fixture.cardAttributeModifier.attributeModifiers[0]',
        reason,
      },
    ]);
  });

  it('缺少任一正式基础攻击节点时保留运行依赖，但阻止整把武器进入正式候选', () => {
    const upgrade = upgradeFixture();
    upgrade.weapon_upgrade_fixture.list = upgrade.weapon_upgrade_fixture.list.filter(
      row => row.weaponLv !== 60,
    );

    const result = compileWeaponStaticDefinitionBatchSource(
      { wpn_lance_fixture: weaponFixture() },
      upgrade,
      { sk_wpn_fixture: passiveFixture() },
      { sk_wpn_fixture: patchFixture() },
    );

    expect(result.definitions).toEqual([]);
    expect(result.runtimeDependencies).toHaveLength(1);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        status: 'blocked',
        reason: 'WeaponDefinition requires an exact base-attack row at level 60',
      }),
    );
  });

  it.each([3, 4, 5, 6, 2, 7])('星级 %s 按正式契约边界接受或阻断', rarity => {
    const result = compileWeaponStaticDefinitionBatchSource(
      { wpn_lance_fixture: { ...weaponFixture(), rarity } },
      upgradeFixture(),
      { sk_wpn_fixture: passiveFixture() },
      { sk_wpn_fixture: patchFixture() },
    );
    if ([3, 4, 5, 6].includes(rarity)) {
      expect(result.definitions[0]?.rarity).toBe(rarity);
      expect(result.diagnostics.some(item => item.status === 'blocked')).toBe(false);
    } else {
      expect(result.definitions).toEqual([]);
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'blocked',
            sourcePath: 'WeaponBasicTable.wpn_lance_fixture.rarity',
          }),
        ]),
      );
    }
  });

  it('三星武器保留紧凑等级列，但将第二条原生被动定义为 skill3', () => {
    const weapon = {
      ...weaponFixture(),
      rarity: 3,
      weaponSkillList: ['sk_wpn_fixture', 'sk_wpn_fixture_second'],
    };
    const secondPassive = { ...passiveFixture(), skillId: 'sk_wpn_fixture_second' };
    const result = compileWeaponStaticDefinitionBatchSource(
      { wpn_lance_fixture: weapon },
      upgradeFixture(),
      {
        sk_wpn_fixture: passiveFixture(),
        sk_wpn_fixture_second: secondPassive,
      },
      {
        sk_wpn_fixture: patchFixture(),
        sk_wpn_fixture_second: patchFixture(),
      },
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.definitions[0]?.traits.map(trait => trait.key)).toEqual(['skill1', 'skill3']);
    expect(
      result.runtimeDependencies.map(dependency => [dependency.traitKey, dependency.slotIndex]),
    ).toEqual([
      ['skill1', 0],
      ['skill3', 1],
    ]);
  });

  it('固定按原生 ID 排序，且拒绝重复选择身份', () => {
    const table = {
      wpn_lance_z: weaponFixture('wpn_lance_z'),
      wpn_lance_a: weaponFixture('wpn_lance_a'),
    };
    const skillData = { sk_wpn_fixture: passiveFixture() };
    const patch = { sk_wpn_fixture: patchFixture() };
    expect(
      compileWeaponStaticDefinitionBatchSource(
        table,
        upgradeFixture(),
        skillData,
        patch,
      ).definitions.map(definition => definition.slug),
    ).toEqual(['wpn_lance_a', 'wpn_lance_z']);
    expect(() =>
      compileWeaponStaticDefinitionBatchSource(table, upgradeFixture(), skillData, patch, [
        'wpn_lance_a',
        'wpn_lance_a',
      ]),
    ).toThrow('duplicate weapon ID');
  });
});

function weaponFixture(weaponId = 'wpn_lance_fixture'): Record<string, unknown> {
  return {
    breakthroughTemplateId: 'weapon_breakthrough_fixture',
    engName: { id: 1, text: '' },
    levelTemplateId: 'weapon_upgrade_fixture',
    maxLv: 90,
    modelPath: `Gameplay/Prefabs/Weapons/${weaponId}.prefab`,
    potentialUpItemList: [],
    rarity: 6,
    talentTemplateId: 'weapon_potential_fixture',
    weaponDesc: { id: 2, text: '' },
    weaponId,
    weaponPotentialSkill: 'sk_wpn_fixture',
    weaponSkillList: ['sk_wpn_fixture'],
    weaponType: 5,
  };
}

interface UpgradeFixture {
  weapon_upgrade_fixture: { list: Array<Record<string, number>> };
}

function upgradeFixture(): UpgradeFixture {
  return {
    weapon_upgrade_fixture: {
      list: [
        [1, 51],
        [20, 146],
        [40, 247],
        [60, 348],
        [80, 449],
        [90, 500],
      ].map(([weaponLv, baseAtk]) => ({ weaponLv, baseAtk, lvUpExp: 0, lvUpGold: 0 })),
    },
  };
}

function patchFixture() {
  return {
    SkillPatchDataBundle: [
      {
        level: 1,
        blackboard: [
          { key: 'will', value: 20 },
          { key: 'duration', value: 10 },
        ],
      },
      {
        level: 2,
        blackboard: [
          { key: 'will', value: 36 },
          { key: 'duration', value: 20 },
        ],
      },
    ],
  };
}

function passiveFixture(): Record<string, unknown> {
  return {
    actionGroupData: { timelineActions: [], passiveEventActions: [] },
    aiExclusiveFrame: 0,
    attackRangeType: 'Default',
    blackboard: [
      { key: 'will', valueDouble: 0, valueStr: '', isDynamic: false },
      { key: 'duration', valueDouble: 0, valueStr: '', isDynamic: false },
    ],
    buffs: [
      {
        buffId: 'buff_wpn_fixture',
        assignBlackboard: true,
        assignItems: [
          {
            targetKey: 'duration',
            inputValueKey: 'duration',
            useDirectValue: false,
            directValueType: 'Numeric',
            numericValue: 0,
            stringValue: '',
          },
        ],
      },
    ],
    canCastInAir: false,
    canDummyCast: false,
    canMove: false,
    cardAttributeModifier: {
      attributeModifiers: [
        {
          modifyAttributeType: 'Specific',
          attributeType: 'Will',
          formulaItem: 'BaseAddition',
          param: { value: 0, useBlackboardKey: true, blackboardKey: 'will' },
        },
      ],
      isConvertedAttribute: false,
    },
    castData: {},
    castType: 'Passive',
    characterReturnToIdle: false,
    comboSkillUIBigSpriteName: '',
    comboSkillUISpriteName: '',
    dontInterruptCombo: false,
    dummyPositionOffset: {},
    durationFrame: 0,
    exclusiveFrame: 0,
    hittableAttackRange: 0,
    iconBgType: 'Default',
    iconId: '',
    level: 1,
    needEnemyOutOfScreenWarning: false,
    needEnemyOutOfScreenWarningOverrideValue: false,
    offsetRecordFrame: 0,
    overrideHittableObjAttackRange: false,
    overrideNeedEnemyOutOfScreenWarning: false,
    passiveSkillType: 'AddBuff',
    rootMotionCliffCheck: false,
    selectStrategy: {},
    showNotRecommendState: false,
    skillHighlightCondition: {},
    skillId: 'sk_wpn_fixture',
    skillName: '',
    skillSpecification: 'Default',
    skillTags: { predefinedTag: [] },
    smartTargetBuffFindSettings: {},
    smartTargetBuffIds: [],
    smartTargetSelectStrategy: {},
    smartTargetTagQuery: {},
    switchToBuffConfig: {
      condition: {},
      buffs: [],
      buffSource: {},
      targets: {},
      asSkillCast: false,
    },
    switchToCenterBeforeCast: false,
    tagDuringAttach: {},
    toggleBuffs: [],
    uiRangeHints: [],
    useAIExclusiveFrame: false,
  };
}
