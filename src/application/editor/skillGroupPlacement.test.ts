import { expect, it } from 'vitest';
import { skillFixture } from '../../test/skillFixture';
import { perlica } from '../../data/operators/perlica.generated';
import type { SkillGroupDefinition } from '../../core/game-data/operatorDefinition';
import {
  layoutSkillGroupPlacement,
  listSkillGroupLibraryPlacements,
  resolveSkillGroupPlacementSkills,
  skillPlacementDisplayFrames,
} from './skillGroupPlacement';

it('技能库按引用组织操作及名称，执行等级仍属于技能', () => {
  const skills = [
    skillFixture({
      scheduledSequences: [],
      actionGraph: { main: { nodes: {} }, macros: {} },
      key: 'base',
      levelSource: 'battleSkill',
      timelineBlockFrames: 16,
    }),
    skillFixture({
      scheduledSequences: [],
      actionGraph: { main: { nodes: {} }, macros: {} },
      key: 'next',
      levelSource: 'ultimate',
      timelineBlockFrames: 18,
    }),
    skillFixture({
      scheduledSequences: [],
      actionGraph: { main: { nodes: {} }, macros: {} },
      key: 'internal',
      timelineBlockFrames: 100,
    }),
  ];
  const group: SkillGroupDefinition = {
    key: 'floating',
    operationType: 'basicAttack',
    nameKey: 'default',
    skillIds: ['base', 'next'],
    variants: [
      { key: 'inherit', skillIds: ['base'] },
      { key: 'override', nameKey: 'variant', skillIds: ['next'] },
    ],
  };
  const owner = { ...perlica, skills, skillGroups: [group] };
  const entries = listSkillGroupLibraryPlacements(group, owner);
  expect(entries.map(entry => entry.nameKey)).toEqual(['default', 'default', 'variant']);
  expect(entries.every(entry => entry.operationType === 'basicAttack')).toBe(true);
  expect(entries[0]).not.toHaveProperty('levelSource');
  expect(entries[0]!.skills).toEqual(skills.slice(0, 2));
  expect(layoutSkillGroupPlacement(resolveSkillGroupPlacementSkills(group, owner))).toEqual({
    offsets: [0, 17],
    durationFrames: 36,
  });
  expect(resolveSkillGroupPlacementSkills(group, owner, 'override')).toEqual([skills[1]]);
  expect(() => resolveSkillGroupPlacementSkills(group, owner, undefined, 'internal')).toThrow();
  expect(() => listSkillGroupLibraryPlacements(group, { ...owner, skills: [] })).toThrow();
});

it('放置边界覆盖最后一帧，但不改变技能宽度或把零宽内部动作扩成一帧', () => {
  const skills = [16, 18, 26, 44].map(timelineBlockFrames => ({ timelineBlockFrames }));
  expect(layoutSkillGroupPlacement(skills)).toEqual({
    offsets: [0, 17, 36, 63],
    durationFrames: 108,
  });
  expect(skills.map(skill => skill.timelineBlockFrames)).toEqual([16, 18, 26, 44]);
  expect(layoutSkillGroupPlacement([])).toEqual({ offsets: [], durationFrames: 0 });
  expect(skillPlacementDisplayFrames(0)).toBe(0);
  expect(
    layoutSkillGroupPlacement([{ timelineBlockFrames: 0 }, { timelineBlockFrames: 16 }]),
  ).toEqual({ offsets: [0, 0], durationFrames: 17 });
});
