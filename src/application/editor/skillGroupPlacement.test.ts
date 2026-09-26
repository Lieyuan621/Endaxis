import { describe, expect, it } from 'vitest';

import type { SkillGroupDefinition } from '../../core/game-data/operatorDefinition';
import {
  layoutSkillGroupPlacement,
  listSkillGroupLibraryPlacements,
  resolveSkillGroupPlacementSkills,
  skillPlacementDisplayFrames,
} from './skillGroupPlacement';

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

it('图技能组仅凭技能元数据决定技能库与放置链', () => {
  const group: SkillGroupDefinition = {
    key: 'basicAttack',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    skills: [
      {
        key: 'attack1',
        levelSource: 'basicAttack',
        timelineBlockFrames: 16,
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'shared' } }],
        actionGraph: {
          main: {
            nodes: {
              shared: { action: { kind: 'dealStagger', parameters: { value: 1 } }, next: null },
            },
          },
          macros: {},
        },
      },
      {
        key: 'attack2',
        levelSource: 'basicAttack',
        timelineBlockFrames: 18,
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'shared' } }],
        actionGraph: {
          main: {
            nodes: {
              shared: { action: { kind: 'dealStagger', parameters: { value: 1 } }, next: null },
            },
          },
          macros: {},
        },
      },
    ],
  };
  const [entry] = listSkillGroupLibraryPlacements(group);
  expect(entry?.skills.map(skill => skill.key)).toEqual(['attack1', 'attack2']);
  expect(layoutSkillGroupPlacement(resolveSkillGroupPlacementSkills(group))).toEqual({
    offsets: [0, 17],
    durationFrames: 36,
  });
});
