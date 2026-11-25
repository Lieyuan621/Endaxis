import { expect, it } from 'vitest';
import { firstBezierSphereEntry, firstBezierGroundEntry } from './bezier.ts';

it('recovers the analytic contact progress of a straight cubic', () => {
  expect(
    firstBezierSphereEntry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ],
      [3, 0, 0],
      0.2,
    ),
  ).toBeCloseTo(2.8 / 3, 10);
});

it('accounts for curved control points and does not invent contact with an unrelated sphere', () => {
  const curve = [
    [0, 0, 0],
    [0, 3, 0],
    [3, 3, 0],
    [3, 0, 0],
  ] as const;
  const progress = firstBezierSphereEntry(curve, [3, 0, 0], 0.2)!;
  expect(progress).toBeGreaterThan(0.97);
  expect(firstBezierSphereEntry(curve, [0, 0, 5], 0.2)).toBeUndefined();
});

it('finds ground contact before a cubic rises again', () => {
  expect(firstBezierGroundEntry([1, -1, -1, 1], 0)).toBeCloseTo((3 - Math.sqrt(3)) / 6, 12);
  expect(firstBezierGroundEntry([1, 2 / 3, 1 / 3, 0], 0.25)).toBeCloseTo(0.75, 12);
  expect(firstBezierGroundEntry([0, 1, 1, 0], 0.2)).toBe(0);
  expect(firstBezierGroundEntry([1, 2, 2, 1], 0)).toBeUndefined();
});
