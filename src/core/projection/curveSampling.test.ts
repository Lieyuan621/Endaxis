import { describe, expect, it } from 'vitest';
import type { ResourceCurvePoint } from './resourceCurves';
import { sampleStepCurve } from './curveSampling';

const points: readonly ResourceCurvePoint[] = [
  { frame: 0, time: 0, sequence: null, value: 100 },
  { frame: 10, time: 1 / 3, sequence: 4, value: 70 },
  { frame: 15, time: 0.5, sequence: 5, value: 90 },
];

describe('sampleStepCurve', () => {
  it('返回最后一个不晚于采样帧的曲线点值', () => {
    expect(sampleStepCurve(points, 0)).toEqual({ frame: 0, value: 100, known: true });
    expect(sampleStepCurve(points, 9)).toEqual({ frame: 9, value: 100, known: true });
    expect(sampleStepCurve(points, 10)).toEqual({ frame: 10, value: 70, known: true });
    expect(sampleStepCurve(points, 14)).toEqual({ frame: 14, value: 70, known: true });
    expect(sampleStepCurve(points, 999)).toEqual({ frame: 999, value: 90, known: true });
  });

  it('没有早于采样帧的曲线点时返回未知', () => {
    expect(sampleStepCurve([{ frame: 30, time: 1, sequence: 1, value: 50 }], 29)).toEqual({
      frame: 29,
      value: null,
      known: false,
    });
    expect(sampleStepCurve([], 0)).toEqual({ frame: 0, value: null, known: false });
  });

  it('支持准备期负帧，并拒绝非有限帧', () => {
    const prepPoints: readonly ResourceCurvePoint[] = [
      { frame: -5, time: -1 / 6, sequence: null, value: 80 },
      ...points,
    ];
    expect(sampleStepCurve(prepPoints, -3)).toEqual({ frame: -3, value: 80, known: true });
    expect(sampleStepCurve(points, -1)).toEqual({ frame: -1, value: null, known: false });
    expect(() => sampleStepCurve(points, Number.NaN)).toThrow('finite');
  });
});
