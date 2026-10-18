import { expect, it } from 'vitest';
import { roundHitDamage } from './hitDamageDisplay';

it('单次飘字在单精度边界之后取整，中点取偶数', () => {
  expect([100.4, 100.5, 100.6, 101.5, -101.5].map(roundHitDamage)).toEqual([
    100, 100, 101, 102, 102,
  ]);
  // 单精度转换后恰好落在中点；不能先按 double 舍入。
  expect(roundHitDamage(100.500001)).toBe(100);
  // 累计伤害不能用各次显示整数相加代替。
  expect(roundHitDamage(100.4 + 100.4)).toBe(201);
  expect(roundHitDamage(100.4) + roundHitDamage(100.4)).toBe(200);
});
