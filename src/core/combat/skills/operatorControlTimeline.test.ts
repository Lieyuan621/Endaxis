import { describe, expect, it } from 'vitest';
import {
  isOperatorControlledAt,
  resolveControlledOperator,
  type OperatorControlTimeline,
} from './operatorControlTimeline';

const timeline: OperatorControlTimeline = {
  segments: [
    { startFrame: 0, operatorId: 'operator:1' },
    { startFrame: 30, operatorId: 'operator:2' },
    { startFrame: 90, operatorId: null },
  ],
};

describe('operatorControlTimeline', () => {
  it('uses the segment whose start frame is the latest one not after the query frame', () => {
    expect(resolveControlledOperator(timeline, 0)).toBe('operator:1');
    expect(resolveControlledOperator(timeline, 29)).toBe('operator:1');
    expect(resolveControlledOperator(timeline, 30)).toBe('operator:2');
    expect(resolveControlledOperator(timeline, 89)).toBe('operator:2');
    expect(resolveControlledOperator(timeline, 90)).toBeNull();
  });

  it('returns null before the first segment and for an empty timeline', () => {
    expect(
      resolveControlledOperator({ segments: [{ startFrame: 10, operatorId: 'operator:1' }] }, 9),
    ).toBeNull();
    expect(resolveControlledOperator({ segments: [] }, 0)).toBeNull();
  });

  it('checks control using the same inclusive frame boundary', () => {
    expect(isOperatorControlledAt(timeline, 'operator:1', 29)).toBe(true);
    expect(isOperatorControlledAt(timeline, 'operator:1', 30)).toBe(false);
    expect(isOperatorControlledAt(timeline, 'operator:2', 30)).toBe(true);
  });
});
