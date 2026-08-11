import { describe, expect, it } from 'vitest';
import {
  buildCumulativeDamageSeries,
  buildEnemyEffectGuideTimeline,
  sampleEnemyEffectGuideTimeline,
  sampleStepSeriesAtTime,
} from './timelineGuideData';

describe('timelineGuideData', () => {
  it('samples only points at or before the requested time', () => {
    const points = [
      { time: 2, val: 10 },
      { time: 5, val: 20 },
    ];

    expect(sampleStepSeriesAtTime(points, 1)).toBeNull();
    expect(sampleStepSeriesAtTime(points, 3)?.val).toBe(10);
    expect(sampleStepSeriesAtTime(points, 5)?.val).toBe(20);
  });

  it('builds a sorted cumulative damage series', () => {
    const entries = [
      { time: 3, damage: 20 },
      { time: 1, damage: 10 },
    ];

    expect(
      buildCumulativeDamageSeries(
        entries,
        entry => entry.time,
        entry => entry.damage,
      ),
    ).toEqual([
      { time: 1, total: 10 },
      { time: 3, total: 30 },
    ]);
  });

  it('indexes enemy effects with end-exclusive boundaries and stack aggregation', () => {
    const timeline = buildEnemyEffectGuideTimeline([
      { start: 1, end: 4, typeKey: 'heat_infliction', stacks: 1, icon: '/heat.webp' },
      { start: 2, end: 3, typeKey: 'heat_infliction', stacks: 3, icon: '/heat.webp' },
      {
        start: 2,
        end: 5,
        typeKey: 'reaction:corrosion',
        effect: { kind: 'reaction', reactionType: 'corrosion' },
      },
      { start: 2, end: 5, typeKey: 'hidden', showIcon: false },
    ]);

    expect(sampleEnemyEffectGuideTimeline(timeline, 0).buffs).toEqual([]);
    expect(sampleEnemyEffectGuideTimeline(timeline, 2).buffs).toEqual([
      { typeKey: 'corrosion', stacks: 1, icon: null, disabled: false },
      { typeKey: 'heat_infliction', stacks: 3, icon: '/heat.webp', disabled: false },
    ]);
    expect(sampleEnemyEffectGuideTimeline(timeline, 3).buffs[1]?.stacks).toBe(1);
    expect(sampleEnemyEffectGuideTimeline(timeline, 5).buffs).toEqual([]);
  });

  it('limits displayed effects and reports overflow', () => {
    const timeline = buildEnemyEffectGuideTimeline([
      { start: 0, end: 2, typeKey: 'a' },
      { start: 0, end: 2, typeKey: 'b' },
      { start: 0, end: 2, typeKey: 'c' },
    ]);

    expect(sampleEnemyEffectGuideTimeline(timeline, 1, 2)).toMatchObject({
      buffs: [{ typeKey: 'a' }, { typeKey: 'b' }],
      overflow: 1,
    });
  });
});
