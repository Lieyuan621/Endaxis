import { describe, expect, it } from 'vitest';

import { parseWeaponTypeValue, projectWeaponType } from '../../src/index.ts';

describe('公共 WeaponType 身份与投影', () => {
  it('将原生武器类型投影为构筑兼容性身份', () => {
    expect(
      projectWeaponType(parseWeaponTypeValue(2, 'weapon.weaponType'), 'weapon.weaponType'),
    ).toBe('funnel');
  });

  it('保留已定义但尚无 Next 投影的原生成员，并拒绝未知枚举值', () => {
    expect(parseWeaponTypeValue(4, 'weapon.weaponType')).toBe('Gun');
    expect(() => projectWeaponType('Gun', 'weapon.weaponType')).toThrow(
      'has no supported Next projection',
    );
    expect(() => parseWeaponTypeValue(7, 'weapon.weaponType')).toThrow('unknown WeaponType 7');
  });
});
