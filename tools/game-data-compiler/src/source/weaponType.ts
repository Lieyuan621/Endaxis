import { requireNonNegativeInteger, requireNamedOrInteger } from './primitives.ts';

/**
 * SparkBuffer `Beyond.GEnums.WeaponType`（type hash `0x8DD3BF94`）的定义（1.6.3 复核未变）。
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

/** CheckWeaponTypeCondition.WeaponTypeMask；位号来自同一 WeaponType 枚举。 */
export function parseWeaponTypeMask(value: unknown, path: string): readonly WeaponTypeSource[] {
  const input = requireNamedOrInteger(value, path);
  let mask = 0;
  if (typeof input === 'number') {
    if (input !== -1 && (input < 0 || input > 126 || (input & 1) !== 0))
      throw new Error(`${path}: unknown weapon type mask ${input}`);
    mask = input;
  } else {
    for (const part of input.split(',')) {
      const name = part.trim();
      if (name === 'None') continue;
      if (name === 'All') {
        mask = -1;
        continue;
      }
      const index = WEAPON_TYPES.findIndex(type => type === name);
      if (index <= 0) throw new Error(`${path}: unknown weapon type ${name}`);
      mask |= 1 << index;
    }
  }
  return WEAPON_TYPES.filter((_, index) => (mask & (1 << index)) !== 0);
}
