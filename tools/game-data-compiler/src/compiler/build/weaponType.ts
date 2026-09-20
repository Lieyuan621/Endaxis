import type { WeaponTypeSource } from '../../source/weaponType.ts';
import type { OperatorWeaponType } from '../../../../../packages/game-data-contract/src/primitives.ts';

const PROJECTED_WEAPON_TYPES: Readonly<Partial<Record<WeaponTypeSource, OperatorWeaponType>>> = {
  Sword: 'sword',
  Wand: 'arts-unit',
  Claymores: 'greatsword',
  Lance: 'polearm',
  Pistol: 'handcannon',
};

/**
 * 将同一个原生 WeaponType 投影为 OperatorDefinition 与 WeaponDefinition 共用的兼容性身份。
 * 原生 None/Gun 当前没有对应的 Next 类型，遇到时必须回到数据证据补边界。
 */
export function projectWeaponType(weaponType: WeaponTypeSource, path: string): OperatorWeaponType {
  const result = PROJECTED_WEAPON_TYPES[weaponType];
  if (result === undefined) {
    throw new Error(`${path}: WeaponType ${weaponType} has no supported Next projection`);
  }
  return result;
}
