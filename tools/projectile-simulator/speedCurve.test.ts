import { expect, it } from 'vitest';
import { timeForTravelDistance } from './speedCurve';

it('integrates a held value through a jump without smearing the discontinuity', () => {
  const input = {
    speed: 10,
    distance: 3,
    curveTimeScaleSeconds: 1,
    maxSeconds: 1,
    curve: [
      { time: 0, value: 1, inTangent: 0, outTangent: Infinity },
      { time: 0.12345, value: 2, inTangent: Infinity, outTangent: 0 },
    ],
  };
  const expected = 0.12345 + (3 - 10 * 0.12345) / 20;
  expect(timeForTravelDistance({ ...input, stepSeconds: 0.2 })).toBeCloseTo(expected, 9);
  expect(timeForTravelDistance(input)).toBeCloseTo(expected, 9);
});

it('normalizes curve time using the supplied scale, matching an analytic acceleration', () => {
  // v(t) = 20 * (1 + t / 2), so s(t) = 20t + 5t².
  const input = {
    speed: 20,
    distance: 30,
    curveTimeScaleSeconds: 2,
    maxSeconds: 2,
    curve: [
      { time: 0, value: 1, inTangent: 1, outTangent: 1 },
      { time: 1, value: 2, inTangent: 1, outTangent: 1 },
    ],
  };
  expect(timeForTravelDistance(input)).toBeCloseTo(Math.sqrt(10) - 2, 9);
  expect(timeForTravelDistance({ ...input, maxSeconds: 0.5 })).toBeUndefined();
});

it('rejects enabled weights that are missing', () => {
  expect(() =>
    timeForTravelDistance({
      speed: 20,
      distance: 3,
      curveTimeScaleSeconds: 5,
      maxSeconds: 1,
      curve: [{ time: 0, value: 1, inTangent: 0, outTangent: 0, weightedMode: 2 }],
    }),
  ).toThrow('valid enabled weights');
});

it('inverts weighted time before integrating a curve with an analytic distance', () => {
  // Bezier x(u)=u³, y(u)=3u²-2u³; integral v(t)dt = 9/5 t^(5/3)-t².
  const time = 0.125;
  const input = {
    speed: 1,
    distance: (9 / 5) * time ** (5 / 3) - time ** 2,
    curveTimeScaleSeconds: 1,
    maxSeconds: 1,
    curve: [
      { time: 0, value: 0, inTangent: 0, outTangent: 0, weightedMode: 2, outWeight: 0 },
      { time: 1, value: 1, inTangent: 0, outTangent: 0, weightedMode: 1, inWeight: 1 },
    ],
  };
  expect(timeForTravelDistance(input)).toBeCloseTo(time, 5);
  expect(timeForTravelDistance({ ...input, stepSeconds: 1 / 6000 })).toBeCloseTo(time, 6);
});
