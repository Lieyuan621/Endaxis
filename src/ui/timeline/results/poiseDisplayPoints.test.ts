import { expect, it } from 'vitest';
import { poiseDisplayPoints } from './resourceCurveDisplay';

it('holds buildup until the hit, jumps vertically and extends the last known value', () => {
  const input = [
    { frame: -30, value: 0 },
    { frame: 66, value: 10 },
  ];
  expect(poiseDisplayPoints(input, 300)).toEqual([
    input[0],
    { frame: 66, value: 0 },
    input[1],
    { frame: 300, value: 10 },
  ]);
  expect(input).toHaveLength(2);
});
it('preserves ordered same-frame changes and holds full buildup until recovery', () => {
  const input = [
    { frame: 0, value: 0 },
    { frame: 30, value: 100 },
    { frame: 30, value: 300 },
    { frame: 90, value: 0 },
  ];
  expect(poiseDisplayPoints(input, 90)).toEqual([
    input[0],
    { frame: 30, value: 0 },
    input[1],
    input[2],
    { frame: 90, value: 300 },
    input[3],
  ]);
});
it('does not invent a state for an empty curve or an endpoint earlier than existing facts', () => {
  expect(poiseDisplayPoints([], 100)).toEqual([]);
  expect(poiseDisplayPoints([{ frame: 100, value: 20 }], 50)).toEqual([{ frame: 100, value: 20 }]);
});
