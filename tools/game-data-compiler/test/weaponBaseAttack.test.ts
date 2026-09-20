import { describe, expect, it } from 'vitest';

import { parseWeaponBaseAttackSources, resolveWeaponBaseAttackModifier } from '../src/index.ts';

describe('武器基础攻击成长', () => {
  it('按 WeaponBasicTable 声明的模板读取精确等级，并产生 Atk/BaseAddition', () => {
    const [weapon] = parseFixture();
    expect(weapon).toMatchObject({
      weaponId: 'wpn_funnel_0009',
      levelTemplateId: 'weapon_upgrade_curve_6star_1',
      maximumLevel: 90,
    });
    expect(resolveWeaponBaseAttackModifier(weapon!, 90)).toEqual({
      sourcePath: 'WeaponUpgradeTemplateTable.weapon_upgrade_curve_6star_1.list[2]',
      weaponId: 'wpn_funnel_0009',
      weaponLevel: 90,
      modifyAttributeType: 'Specific',
      attributeType: 'Atk',
      formulaItem: 'BaseAddition',
      value: 495,
    });
    expect(resolveWeaponBaseAttackModifier(weapon!, 21)).toBeNull();
  });

  it('按原生 float 保存运行值，同时保留 JSON 导出值', () => {
    const upgrade = upgradeTable();
    upgrade.weapon_upgrade_curve_6star_1.list[0]!.baseAtk = 123.456;
    const [weapon] = parseFixture(upgrade);
    expect(weapon!.upgradeLevels[0]).toMatchObject({
      exportedBaseAttack: 123.456,
      baseAttack: Math.fround(123.456),
    });
  });

  it('拒绝重复等级、缺少武器最高等级行和未知字段', () => {
    const duplicate = upgradeTable();
    duplicate.weapon_upgrade_curve_6star_1.list[1]!.weaponLv = 1;
    expect(() => parseFixture(duplicate)).toThrow('duplicate weapon level 1');

    const missingMaximum = upgradeTable();
    missingMaximum.weapon_upgrade_curve_6star_1.list.pop();
    expect(() => parseFixture(missingMaximum)).toThrow('weapon maxLv 90 has no upgrade row');

    const drifted = upgradeTable();
    drifted.weapon_upgrade_curve_6star_1.list[0]!.futureField = true;
    expect(() => parseFixture(drifted)).toThrow('unexpected fields');
  });
});

function parseFixture(upgrade: UpgradeTableFixture = upgradeTable()) {
  return parseWeaponBaseAttackSources({ wpn_funnel_0009: weaponBasicRow() }, upgrade, [
    'wpn_funnel_0009',
  ]);
}

function weaponBasicRow(): Record<string, unknown> {
  return {
    breakthroughTemplateId: 'weapon_breakthrough_456star_A_1',
    engName: { id: 1292383372425698509, text: '' },
    levelTemplateId: 'weapon_upgrade_curve_6star_1',
    maxLv: 90,
    modelPath: 'Gameplay/Prefabs/Weapons/wpn_funnel_0009.prefab',
    potentialUpItemList: [],
    rarity: 6,
    talentTemplateId: 'wpn_potential_456star',
    weaponDesc: { id: 120079700415210874, text: '' },
    weaponId: 'wpn_funnel_0009',
    weaponPotentialSkill: 'sk_wpn_funnel_0009',
    weaponSkillList: ['wpn_attr_wisd_high', 'wpn_sp_attr_magicdam_high', 'sk_wpn_funnel_0009'],
    weaponType: 2,
  };
}

interface UpgradeTableFixture {
  weapon_upgrade_curve_6star_1: {
    list: Record<string, unknown>[];
  };
}

function upgradeTable(): UpgradeTableFixture {
  return {
    weapon_upgrade_curve_6star_1: {
      list: [
        { baseAtk: 50, lvUpExp: 10, lvUpGold: 0, weaponLv: 1 },
        { baseAtk: 145, lvUpExp: 2360, lvUpGold: 240, weaponLv: 20 },
        { baseAtk: 495, lvUpExp: 0, lvUpGold: 0, weaponLv: 90 },
      ],
    },
  };
}
