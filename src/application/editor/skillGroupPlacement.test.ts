import { describe, expect, it } from 'vitest';
import { layoutSkillGroupPlacement, skillPlacementDisplayFrames } from './skillGroupPlacement';

describe('layoutSkillGroupPlacement', () => {
  it('shares the chain offsets and preview span without changing individual block widths', () => {
    const skills = [16, 18, 26, 44].map(timelineBlockFrames => ({ timelineBlockFrames }));
    expect(layoutSkillGroupPlacement(skills)).toEqual({
      offsets: [0, 17, 36, 63],
      durationFrames: 108,
    });
    expect(skills.map(skill => skill.timelineBlockFrames)).toEqual([16, 18, 26, 44]);
  });

  it('covers the final input boundary while preserving empty and zero-width layouts', () => {
    expect(layoutSkillGroupPlacement([])).toEqual({ offsets: [], durationFrames: 0 });
    expect(layoutSkillGroupPlacement([{ timelineBlockFrames: 16 }])).toEqual({
      offsets: [0],
      durationFrames: 17,
    });
    expect(skillPlacementDisplayFrames(0)).toBe(0);
    expect(
      layoutSkillGroupPlacement([{ timelineBlockFrames: 0 }, { timelineBlockFrames: 16 }]),
    ).toEqual({ offsets: [0, 0], durationFrames: 17 });
  });
});
