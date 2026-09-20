import { expect, it } from 'vitest';
import { poiseProgressPoints } from './resourceCurveDisplay';
import type { PoiseCurve } from '../../../core/projection/poiseCurves';

it('displays buildup from zero to full and returns to zero after native recovery', () => {
  const curve: PoiseCurve = {
    resource: 'poise',
    maxValue: 300,
    points: [300, 240, 0, 300].map((value, i) => ({
      frame: i * 30 - 30,
      time: i - 1,
      sequence: i === 0 ? null : i,
      value,
    })),
  };
  const result = poiseProgressPoints(curve);
  expect(result.map(point => point.value)).toEqual([0, 60, 300, 0]);
  expect(result.map(({ value: _value, ...identity }) => identity)).toEqual(
    curve.points.map(({ value: _value, ...identity }) => identity),
  );
  expect(curve.points.map(point => point.value)).toEqual([300, 240, 0, 300]);
});
