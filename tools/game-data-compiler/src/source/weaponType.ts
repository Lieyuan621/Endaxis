import { requireNonNegativeInteger } from './primitives.ts';

/**
 * SparkBuffer `Beyond.GEnums.WeaponType`（type hash `0x8DD3BF94`）的 1.4.4 定义。
 * CharacterTable、CharGrowthTable 与 WeaponBasicTable 引用的是同一个名义枚举。
 */
export const WEAPON_TYPES = [
  'None',
  'Sword',
  'Wand',
  'Claymores',
  'Gun',
  'Lance',
  'Pistol',
] as const;

export type WeaponTypeSource = (typeof WEAPON_TYPES)[number];

/** 严格读取原生枚举数值；未知值不作为可扩展整数继续传播。 */
export function parseWeaponTypeValue(value: unknown, path: string): WeaponTypeSource {
  const index = requireNonNegativeInteger(value, path);
  const result = WEAPON_TYPES[index];
  if (result === undefined) {
    throw new Error(`${path}: unknown WeaponType ${index}`);
  }
  return result;
}
