/** 原生普通飘字：转单精度后取最近整数，中点取偶数。只用于单次命中展示。 */
export function roundHitDamage(value: number): number {
  const magnitude = Math.abs(Math.fround(value));
  const integer = Math.floor(magnitude);
  return magnitude - integer === 0.5 ? integer + (integer % 2) : Math.round(magnitude);
}
