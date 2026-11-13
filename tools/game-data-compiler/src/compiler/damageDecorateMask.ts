import type { DamageTag } from '../../../../packages/game-data-contract/src/primitives.ts';

// 原生 DamageDecorateMask 单个位；组合掩码由消费者检查，不额外保存派生标记。
const TAG_BITS: readonly (readonly [number, DamageTag])[] = [
  [1, 'poiseBreak'],
  [2, 'ignoreGuardDodge'],
  [4, 'powerAttack'],
  [8, 'fireAbnormalInitial'],
  [16, 'electricAbnormal'],
  [32, 'cryoAbnormal'],
  [64, 'igniteByMud'],
  [128, 'normalAttack'],
  [256, 'normalSkill'],
  [512, 'ultimateSkill'],
  [1024, 'plungingAttack'],
  [2048, 'bomb'],
  [4096, 'canBreakWeakness'],
  [8192, 'comboSkill'],
  [16384, 'crush'],
  [32768, 'airborne'],
  [65536, 'knockDown'],
  [131072, 'dashAttack'],
  [262144, 'ignoreDodgeImmune'],
  [524288, 'ignoreSkillImmune'],
  [1048576, 'natureAbnormal'],
  [2097152, 'normalAttackLastCombo'],
  [4194304, 'fireBurst'],
  [8388608, 'cryoBurst'],
  [16777216, 'electricBurst'],
  [33554432, 'natureBurst'],
  [67108864, 'fireAbnormal'],
  [134217728, 'shatter'],
  [268435456, 'dot'],
  [536870912, 'remainArea'],
  [1073741824, 'fracture'],
  [2147483648, 'talentDamage'],
];

export function projectDamageDecorateMask(mask: number, sourcePath: string): { tags: DamageTag[] } {
  const normalizedMask = mask === -1 ? 0xffffffff : mask;
  const has = (bit: number) => Math.floor(normalizedMask / bit) % 2 === 1;
  if (
    !Number.isSafeInteger(mask) ||
    normalizedMask < 0 ||
    normalizedMask !== TAG_BITS.reduce((sum, [bit]) => sum + (has(bit) ? bit : 0), 0)
  )
    throw new Error(`${sourcePath}: unsupported damage decorate mask ${mask}`);
  return { tags: TAG_BITS.filter(([bit]) => has(bit)).map(([, tag]) => tag) };
}
