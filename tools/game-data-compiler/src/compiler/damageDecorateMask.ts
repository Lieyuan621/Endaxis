import type {
  DamageFeature,
  DamageTag,
} from '../../../../packages/game-data-contract/src/primitives.ts';

// 原生 DamageDecorate 的单个位与公共语义一一对应；产生伤害和检查条件共用。
// physicalInfliction 是派生分类，不能替代任何单个位的条件。
const TAG_BITS: readonly (readonly [number, DamageTag])[] = [
  [128, 'normalAttack'],
  [2097152, 'normalAttackLastCombo'],
  [4, 'powerAttack'],
  [1024, 'plungingAttack'],
  [131072, 'dashAttack'],
  [256, 'normalSkill'],
  [512, 'ultimateSkill'],
  [8192, 'comboSkill'],
  [4194304, 'fireBurst'],
  [8388608, 'cryoBurst'],
  [16777216, 'electricBurst'],
  [33554432, 'natureBurst'],
  [67108864, 'fireAbnormal'],
  [134217728, 'cryoAbnormal'],
];
const FEATURE_BITS: readonly (readonly [number, DamageFeature])[] = [
  [4096, 'canBreakWeakness'],
  [268435456, 'dot'],
  [536870912, 'remainArea'],
  [16384, 'crush'],
  [32768, 'airborne'],
  [65536, 'knockDown'],
  [1073741824, 'fracture'],
  [134217728, 'shatter'],
  [2147483648, 'talentDamage'],
];
const KNOWN_BITS = [...new Set([...TAG_BITS, ...FEATURE_BITS].map(([bit]) => bit))];

export function projectDamageDecorateMask(
  mask: number,
  sourcePath: string,
): {
  tags: DamageTag[];
  features: DamageFeature[];
} {
  // 不用 JS 的有符号 32 位运算，避免最高位被截断。
  const has = (bit: number) => Math.floor(mask / bit) % 2 === 1;
  if (
    !Number.isSafeInteger(mask) ||
    mask < 0 ||
    mask !== KNOWN_BITS.reduce((sum, bit) => sum + (has(bit) ? bit : 0), 0)
  ) {
    throw new Error(`${sourcePath}: unsupported damage decorate mask ${mask}`);
  }
  return {
    tags: TAG_BITS.filter(([bit]) => has(bit)).map(([, tag]) => tag),
    features: FEATURE_BITS.filter(([bit]) => has(bit)).map(([, feature]) => feature),
  };
}
