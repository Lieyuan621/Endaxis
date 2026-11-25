import { expect, test } from 'vitest';
import { firstRayCapsuleEntry } from './capsule';

test('vertical capsule intersects its side and caps, and rejects a side miss', () => {
  const capsule = { centerX: 0, centerZ: 3, bottomY: 0.5, topY: 1.5, radius: 0.5 };
  expect(firstRayCapsuleEntry({ ...capsule, origin: [0, 1, 0], direction: [0, 0, 2] })).toBeCloseTo(
    2.5,
  );
  expect(
    firstRayCapsuleEntry({ ...capsule, origin: [0, 3, 3], direction: [0, -1, 0] }),
  ).toBeCloseTo(1);
  expect(
    firstRayCapsuleEntry({ ...capsule, origin: [1, 1, 0], direction: [0, 0, 1] }),
  ).toBeUndefined();
  expect(firstRayCapsuleEntry({ ...capsule, origin: [0, 1, 3], direction: [0, 1, 0] })).toBe(0);
});
