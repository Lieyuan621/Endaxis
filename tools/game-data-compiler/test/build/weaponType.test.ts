import { describe, expect, it } from 'vitest';

import { parseWeaponTypeValue, projectWeaponType } from '../../src/index.ts';

describe('公共 WeaponType 身份与投影', () => {
  it('用同一原生枚举投影干员和武器兼容性身份', () => {
    expect(
      projectWeaponType(parseWeaponTypeValue(1, 'character.weaponType'), 'character.weaponType'),
    ).toBe('sword');
    expect(
      projectWeaponType(parseWeaponTypeValue(2, 'weapon.weaponType'), 'weapon.weaponType'),
    ).toBe('arts-unit');
    expect(
      projectWeaponType(parseWeaponTypeValue(6, 'weapon.weaponType'), 'weapon.weaponType'),
    ).toBe('handcannon');
  });

  it('保留已定义但尚无 Next 投影的原生成员，并拒绝未知枚举值', () => {
    expect(parseWeaponTypeValue(4, 'weapon.weaponType')).toBe('Gun');
    expect(() => projectWeaponType('Gun', 'weapon.weaponType')).toThrow(
      'has no supported Next projection',
    );
    expect(() => parseWeaponTypeValue(7, 'weapon.weaponType')).toThrow('unknown WeaponType 7');
  });
});
