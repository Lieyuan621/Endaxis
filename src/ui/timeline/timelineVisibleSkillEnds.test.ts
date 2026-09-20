import { describe, expect, it } from 'vitest';
import { timelineVisibleSkillEnds } from './timelineVisibleSkillEnds';

describe('single-track visible skill ends', () => {
  it('clips overlaps without extending gaps or mutating execution intervals', () => {
    const skills = [
      { id: 'a', startFrame: 0, durationFrames: 100 },
      { id: 'b', startFrame: 30, durationFrames: 10 },
      { id: 'c', startFrame: 80, durationFrames: 20 },
    ];
    expect([...timelineVisibleSkillEnds(skills)]).toEqual([
      ['a', 30],
      ['b', 40],
      ['c', 100],
    ]);
    expect(skills[0]!.durationFrames).toBe(100);
  });
  it('sorts prep frames and preserves input order for coincident starts', () => {
    expect([
      ...timelineVisibleSkillEnds([
        { id: 'later', startFrame: 0, durationFrames: 30 },
        { id: 'prep', startFrame: -60, durationFrames: 100 },
        { id: 'same', startFrame: 0, durationFrames: 10 },
      ]),
    ]).toEqual([
      ['prep', 0],
      ['later', 0],
      ['same', 10],
    ]);
  });
  it('keeps other tracks independent and accepts an empty track', () => {
    expect(
      timelineVisibleSkillEnds([{ id: 'a', startFrame: 0, durationFrames: 100 }]).get('a'),
    ).toBe(100);
    expect(
      timelineVisibleSkillEnds([{ id: 'b', startFrame: 10, durationFrames: 5 }]).get('b'),
    ).toBe(15);
    expect(timelineVisibleSkillEnds([]).size).toBe(0);
  });
});
