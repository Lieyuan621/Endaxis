import { expect, it } from 'vitest';
import { calculateTrajectory } from './simulate';

it('sweeps a fast projectile through a small sphere without requiring a sample inside it', () => {
  const result = calculateTrajectory({
    position: [0, 1, 0],
    velocity: [100, 0, 0],
    durationSeconds: 1,
    stepSeconds: 0.1,
    target: { center: [5, 1, 0], radius: 0.1 },
  });
  expect(result.targetEntries).toHaveLength(1);
  expect(result.targetEntries[0]!.seconds).toBeCloseTo(0.049, 8);
  expect(result.targetEntries[0]!.frame).toBe(2);
});

it('calculates ballistic ground time and reports no contact when the target is missed', () => {
  const result = calculateTrajectory({
    position: [0, 5, 0],
    velocity: [3, 0, 0],
    acceleration: [0, -10, 0],
    durationSeconds: 2,
    groundY: 0,
    target: { center: [20, 1, 0], radius: 1 },
  });
  expect(result.ground!.seconds).toBeCloseTo(1, 8);
  expect(result.ground!.frame).toBe(30);
  expect(result.ground!.position[0]).toBeCloseTo(3, 8);
  expect(result.targetEntries).toEqual([]);
});

it('reports separate entries when the path crosses the same target again', () => {
  const result = calculateTrajectory({
    position: [0, 1, 0],
    velocity: [2, 0, 0],
    acceleration: [-2, 0, 0],
    durationSeconds: 2,
    target: { center: [0.75, 1, 0], radius: 0.1 },
  });
  expect(result.targetEntries).toHaveLength(2);
  expect(result.targetEntries[0]!.seconds).toBeLessThan(1);
  expect(result.targetEntries[1]!.seconds).toBeGreaterThan(1);
});
