import type { DamageTag } from '../../game-data/operatorDefinition';

// 原生 DamageEnums 的组合掩码；只在读取时分类，不向伤害包追加组合标记。
const PHYSICAL_INFLICTION_TAGS: ReadonlySet<DamageTag> = new Set([
  'crush',
  'airborne',
  'knockDown',
  'fracture',
]);
const IGNITE_DAMAGE_TAGS: ReadonlySet<DamageTag> = new Set([
  'fireAbnormalInitial',
  'electricAbnormal',
  'cryoAbnormal',
  'natureAbnormal',
  'fireBurst',
  'cryoBurst',
  'electricBurst',
  'natureBurst',
  'fireAbnormal',
  'shatter',
]);

export function isPhysicalInflictionDamage(tags: readonly DamageTag[]): boolean {
  return tags.some(tag => PHYSICAL_INFLICTION_TAGS.has(tag));
}

export function isIgniteDamage(tags: readonly DamageTag[]): boolean {
  return tags.some(tag => IGNITE_DAMAGE_TAGS.has(tag));
}
