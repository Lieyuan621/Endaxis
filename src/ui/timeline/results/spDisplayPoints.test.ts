import { describe, expect, it } from 'vitest';
import { spDisplayPoints } from './resourceCurveDisplay';

describe('SP display points', () => {
  it('holds the initial value through prep and the known final value to the axis end', () => {
    expect(spDisplayPoints([{ frame: 0, value: 300 }], -150, 600)).toEqual([
      { frame: -150, value: 300 },
      { frame: 0, value: 300 },
      { frame: 600, value: 300 },
    ]);
  });
  it('places deductions and refunds at their exact frames without changing raw markers', () => {
    const input = [
      { frame: 0, value: 300 },
      { frame: 30, value: 200 },
      { frame: 30, value: 230 },
    ];
    expect(spDisplayPoints(input, -150, 600)).toEqual([
      { frame: -150, value: 300 },
      input[0],
      { frame: 30, value: 300 },
      input[1],
      input[2],
      { frame: 600, value: 230 },
    ]);
    expect(input).toHaveLength(3);
  });
  it('holds during recovery pauses, then slopes only across recorded recovery frames', () => {
    const input = [
      { frame: 30, value: 200 },
      { frame: 61, value: 201, source: 'autoRecovery' as const },
      { frame: 62, value: 202, source: 'autoRecovery' as const },
    ];
    expect(spDisplayPoints(input, 30, 90)).toEqual([
      input[0],
      { frame: 60, value: 200 },
      input[1],
      input[2],
      { frame: 90, value: 202 },
    ]);
  });
  it('preserves actual preparation casts and same-frame ordering', () => {
    expect(
      spDisplayPoints(
        [
          { frame: -150, value: 100 },
          { frame: -60, value: 0 },
          { frame: 0, value: 50 },
        ],
        -150,
        30,
      ),
    ).toEqual([
      { frame: -150, value: 100 },
      { frame: -60, value: 100 },
      { frame: -60, value: 0 },
      { frame: 0, value: 0 },
      { frame: 0, value: 50 },
      { frame: 30, value: 50 },
    ]);
  });
  it('does not invent facts for empty input or move a final point backwards', () => {
    expect(spDisplayPoints([], -150, 30)).toEqual([]);
    expect(spDisplayPoints([{ frame: 60, value: 5 }], 60, 30)).toEqual([{ frame: 60, value: 5 }]);
  });
});
