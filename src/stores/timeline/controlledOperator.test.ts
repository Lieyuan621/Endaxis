import { describe, it, expect } from 'vitest';
import {
  buildControlledOperatorSegments,
  resolveControlledOperatorAt,
} from '@/stores/timeline/controlledOperator';
import type { SwitchEvent } from '@/simulation/compiler/types';

const sw = (time: number, characterId: string, id = `sw_${time}_${characterId}`): SwitchEvent => ({
  id,
  time,
  characterId,
});

describe('resolveControlledOperatorAt', () => {
  it('returns the initial operator at every time when there are no switches', () => {
    expect(resolveControlledOperatorAt('amiya', [], 0)).toBe('amiya');
    expect(resolveControlledOperatorAt('amiya', [], 9999)).toBe('amiya');
  });

  it('returns null when the first track has no operator and no switch applies', () => {
    expect(resolveControlledOperatorAt(null, [], 5)).toBeNull();
    expect(resolveControlledOperatorAt(null, [sw(10, 'chen')], 5)).toBeNull();
  });

  it('switches control at (and after) the switch time, inclusive', () => {
    const events = [sw(10, 'chen')];
    expect(resolveControlledOperatorAt('amiya', events, 9.99)).toBe('amiya');
    expect(resolveControlledOperatorAt('amiya', events, 10)).toBe('chen'); // boundary: effective at time
    expect(resolveControlledOperatorAt('amiya', events, 50)).toBe('chen');
  });

  it('resolves piecewise across multiple unsorted switches', () => {
    const events = [sw(30, 'yvonne'), sw(10, 'chen'), sw(20, 'amiya')];
    expect(resolveControlledOperatorAt('amiya', events, 0)).toBe('amiya');
    expect(resolveControlledOperatorAt('amiya', events, 10)).toBe('chen');
    expect(resolveControlledOperatorAt('amiya', events, 19)).toBe('chen');
    expect(resolveControlledOperatorAt('amiya', events, 20)).toBe('amiya');
    expect(resolveControlledOperatorAt('amiya', events, 29)).toBe('amiya');
    expect(resolveControlledOperatorAt('amiya', events, 30)).toBe('yvonne');
  });

  it('breaks same-time ties in favor of the last switch in array order', () => {
    const events = [sw(10, 'chen', 'a'), sw(10, 'yvonne', 'b')];
    expect(resolveControlledOperatorAt('amiya', events, 10)).toBe('yvonne');
  });

  it('falls back to the initial operator for a non-finite time', () => {
    expect(resolveControlledOperatorAt('amiya', [sw(10, 'chen')], NaN)).toBe('amiya');
  });

  it('ignores switch events with a non-finite time', () => {
    const events = [{ id: 'bad', time: NaN, characterId: 'chen' } as SwitchEvent, sw(10, 'yvonne')];
    expect(resolveControlledOperatorAt('amiya', events, 5)).toBe('amiya');
    expect(resolveControlledOperatorAt('amiya', events, 10)).toBe('yvonne');
  });
});

describe('buildControlledOperatorSegments', () => {
  it('starts with the initial operator at time 0', () => {
    expect(buildControlledOperatorSegments('amiya', [])).toEqual([
      { startTime: 0, operatorId: 'amiya' },
    ]);
    expect(buildControlledOperatorSegments(null, [])).toEqual([{ startTime: 0, operatorId: null }]);
  });

  it('appends one time-ascending segment per switch event', () => {
    const events = [sw(30, 'yvonne'), sw(10, 'chen')];
    expect(buildControlledOperatorSegments('amiya', events)).toEqual([
      { startTime: 0, operatorId: 'amiya' },
      { startTime: 10, operatorId: 'chen' },
      { startTime: 30, operatorId: 'yvonne' },
    ]);
  });
});
