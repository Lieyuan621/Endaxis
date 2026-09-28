import { skillFixture } from '../../test/skillFixture';
import { describe, expect, it } from 'vitest';

import type { SkillGroupDefinition } from '../../core/game-data/operatorDefinition';
import {
  layoutSkillGroupPlacement,
  listSkillGroupLibraryPlacements,
  resolveSkillGroupPlacementSkills,
  skillPlacementDisplayFrames,
} from './skillGroupPlacement';

describe('layoutSkillGroupPlacement', () => {
  it('inherits group names for every replacement independently of skill identity', () => {
    const skill = skillFixture({
      key: 'base',
      timelineBlockFrames: 1,
      scheduledSequences: [],
      actionGraph: { main: { nodes: {} }, macros: {} },
    });
    const group: SkillGroupDefinition = {
      key: 'battle',
      operationType: 'battleSkill',
      nameKey: 'custom.default',
      skills: skill,
      variants: [
        { key: 'inherit', skills: skill },
        { key: 'override', nameKey: 'custom.variant', skills: skill },
      ],
      replacementSkills: [
        { ...skill, key: 'replacement' },
        { ...skill, key: 'inherited' },
      ],
      routedReplacementSkills: [
        {
          skill: { ...skill, key: 'routed' },

          executionSkillKey: 'actual',
        },
      ],
    };
    expect(listSkillGroupLibraryPlacements(group).map(entry => entry.nameKey)).toEqual([
      'custom.default',
      'custom.default',
      'custom.variant',
    ]);
  });

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
    operationType: 'basicAttack',
    skills: [
      skillFixture({
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
      }),
      skillFixture({
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
      }),
    ],
  };
  const [entry] = listSkillGroupLibraryPlacements(group);
  expect(entry?.operationType).toBe('basicAttack');
  expect(entry?.skills.map(skill => skill.key)).toEqual(['attack1', 'attack2']);
  expect(layoutSkillGroupPlacement(resolveSkillGroupPlacementSkills(group))).toEqual({
    offsets: [0, 17],
    durationFrames: 36,
  });
});

it('技能库只投影玩家操作，不要求同组技能采用相同等级来源', () => {
  const base = skillFixture({
    key: 'base',
    timelineBlockFrames: 1,
    scheduledSequences: [],
    actionGraph: { main: { nodes: {} }, macros: {} },
  });
  const group: SkillGroupDefinition = {
    key: 'floating',
    operationType: 'basicAttack',
    skills: skillFixture({
      ...base,
      key: 'floating1',
      skillType: 'basicAttack',
      levelSource: 'battleSkill',
    }),
    variants: [
      {
        key: 'ultimateForm',
        skills: skillFixture({
          ...base,
          key: 'ultimate1',
          skillType: 'basicAttack',
          levelSource: 'ultimate',
        }),
      },
    ],
  };
  const mixed = { ...group, skills: [group.skills, group.variants![0]!.skills].flat() };
  expect(listSkillGroupLibraryPlacements(mixed).map(entry => entry.operationType)).toEqual([
    'basicAttack',
    'basicAttack',
  ]);
  expect(listSkillGroupLibraryPlacements(mixed)[0]).not.toHaveProperty('levelSource');
  const dodge = skillFixture({ ...base, key: 'dodge', skillType: 'dodge' });
  expect(
    listSkillGroupLibraryPlacements({ key: 'dodge', operationType: 'dodge', skills: dodge })[0]
      ?.operationType,
  ).toBe('dodge');
});
