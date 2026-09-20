import { expect, it } from 'vitest';
import {
  createOperatorLibraryGroup,
  appendEmptyOperatorSkill,
  removeOperatorLibrarySkill,
  updateRoutedSkillOrigin,
  appendEmptyOperatorVariant,
  editOperatorLibrarySkillMember,
} from './operatorLibraryCreation';
import { listSkillGroupDefinitionBindings } from '../../../../core/game-data/operatorSkillDefinitions';
it('copies and reorders all containment kinds without rewriting references or sharing cloned behavior', () => {
  let group = appendEmptyOperatorVariant(createOperatorLibraryGroup({ skillGroups: [] }));
  for (const destination of ['base', 'replacement', 'routedReplacement', { variant: 0 }] as const) {
    group = appendEmptyOperatorSkill(group, destination).group;
  }
  group = { ...group, placementSequenceSkillKeys: ['untouched-reference'] };
  for (const binding of listSkillGroupDefinitionBindings(group)) {
    const copied = editOperatorLibrarySkillMember(group, binding, 'copy');
    const members = listSkillGroupDefinitionBindings(copied).filter(
      item => item.origin === binding.origin,
    );
    expect(members).toHaveLength(2);
    expect(members[0]!.skill).toBe(binding.skill);
    expect(members[1]!.skill.key).not.toBe(binding.skill.key);
    expect(members[1]!.skill.scheduledSequences).not.toBe(binding.skill.scheduledSequences);
    expect(members[1]!.skill.scheduledSequences).toEqual(binding.skill.scheduledSequences);
    if (binding.routedReplacement) {
      expect(members[1]!.routedReplacement!.executionSkillKey).toBe(
        binding.routedReplacement.executionSkillKey,
      );
    }
    const moved = editOperatorLibrarySkillMember(copied, members[1]!, 'up');
    expect(
      listSkillGroupDefinitionBindings(moved).filter(item => item.origin === binding.origin)[0]!
        .skill,
    ).toBe(members[1]!.skill);
    expect(moved.placementSequenceSkillKeys).toBe(group.placementSequenceSkillKeys);
    expect(editOperatorLibrarySkillMember(copied, binding, 'copy')).toBe(copied);
    expect(editOperatorLibrarySkillMember(group, binding, 'up')).toBe(group);
  }
  expect(listSkillGroupDefinitionBindings(group)).toHaveLength(4);
});
it('avoids copy key collisions across containers', () => {
  const initial = appendEmptyOperatorSkill(createOperatorLibraryGroup({ skillGroups: [] })).group;
  const group = {
    ...initial,
    replacementSkills: [
      { key: 'custom-skill-1-copy-1', timelineBlockFrames: 0, scheduledSequences: [] },
    ],
  };
  const binding = listSkillGroupDefinitionBindings(group)[0]!;
  const copied = editOperatorLibrarySkillMember(group, binding, 'copy');
  expect(listSkillGroupDefinitionBindings(copied)[1]!.skill.key).toBe('custom-skill-1-copy-2');
});
it('creates a routed skill without guessing native execution identities or per-skill metadata', () => {
  const group = createOperatorLibraryGroup({ skillGroups: [] });
  const next = appendEmptyOperatorSkill(group, 'routedReplacement');
  const item = next.group.routedReplacementSkills![0]!;
  expect(item.executionSkillGroupKey).toBe('');
  expect(item.executionSkillKey).toBe('');
  expect(item.skill.levelSource).toBeUndefined();
  expect(item.skill.skillType).toBeUndefined();
  expect(next.group.skills).toBe(group.skills);
});
it('keeps empty variants addressable and creates skills with independent metadata', () => {
  const original = createOperatorLibraryGroup({ skillGroups: [] });
  const group = appendEmptyOperatorVariant(original);
  expect(original.variants).toBeUndefined();
  expect(group.variants![0]!.skills).toEqual([]);
  const next = appendEmptyOperatorSkill(group, { variant: 0 });
  const binding = listSkillGroupDefinitionBindings(next.group)[0]!;
  expect(binding.origin).toBe('variant');
  expect(binding.skill.levelSource).toBeUndefined();
  expect(next.group.skills).toBe(group.skills);
  expect(group.variants![0]!.skills).toEqual([]);
  const empty = removeOperatorLibrarySkill(next.group, binding);
  expect(empty.variants).toHaveLength(1);
  expect(empty.variants![0]!.skills).toEqual([]);
});
it('edits only a routed execution origin, preserving the skill and compatibility metadata', () => {
  const skill = { key: 'routed', timelineBlockFrames: 0, scheduledSequences: [] };
  const group = {
    ...createOperatorLibraryGroup({ skillGroups: [] }),
    routedReplacementSkills: [
      {
        skill,
        skillType: 'comboSkill' as const,
        levelSource: 'ultimate' as const,
        executionSkillGroupKey: 'native-group',
        executionSkillKey: 'native-skill',
      },
    ],
  };
  const binding = listSkillGroupDefinitionBindings(group)[0]!;
  const changed = updateRoutedSkillOrigin(group, binding, 'executionSkillKey', 'custom-origin');
  expect(changed.routedReplacementSkills![0]).toEqual({
    ...group.routedReplacementSkills[0],
    executionSkillKey: 'custom-origin',
  });
  expect(changed.routedReplacementSkills![0]!.skill).toBe(skill);
  expect(group.routedReplacementSkills[0]!.executionSkillKey).toBe('native-skill');
  expect(updateRoutedSkillOrigin(changed, binding, 'executionSkillKey', 'stale')).toBe(changed);
});
it('can start with no groups and does not guess per-skill runtime metadata from a group', () => {
  const first = createOperatorLibraryGroup({ skillGroups: [] });
  expect(first.skills).toEqual([]);
  expect(createOperatorLibraryGroup({ skillGroups: [first] }).key).not.toBe(first.key);
  const created = appendEmptyOperatorSkill({ ...first, levelSource: 'ultimate' });
  expect(created.index).toBe(0);
  expect(created.group.skills).toEqual([
    { key: 'custom-skill-1', timelineBlockFrames: 0, scheduledSequences: [] },
  ]);
  expect(first.skills).toEqual([]);
});
it('avoids keys belonging to replacement definitions too', () => {
  const group = createOperatorLibraryGroup({ skillGroups: [] });
  const created = appendEmptyOperatorSkill({
    ...group,
    replacementSkills: [{ key: 'custom-skill-1', timelineBlockFrames: 0, scheduledSequences: [] }],
  });
  expect((created.group.skills as readonly { key: string }[])[0]!.key).toBe('custom-skill-2');
});
it('creates a replacement without changing base skills or inventing selection rules', () => {
  const group = createOperatorLibraryGroup({ skillGroups: [] });
  const next = appendEmptyOperatorSkill(group, 'replacement');
  expect(next.index).toBe(0);
  expect(next.group.skills).toBe(group.skills);
  expect(next.group.replacementSkills).toEqual([
    { key: 'custom-skill-1', timelineBlockFrames: 0, scheduledSequences: [] },
  ]);
  expect(next.group.replacementSkillPlacements).toBeUndefined();
  expect(group.replacementSkills).toBeUndefined();
});
it('removes a replacement by containment, preserving other same-key definitions and references', () => {
  const skill = { key: 'same', timelineBlockFrames: 0, scheduledSequences: [] };
  const group = {
    ...createOperatorLibraryGroup({ skillGroups: [] }),
    skills: [skill],
    replacementSkills: [{ ...skill }],
    placementSequenceSkillKeys: ['same'],
  };
  const binding = listSkillGroupDefinitionBindings(group)[1]!;
  const changed = removeOperatorLibrarySkill(group, binding);
  expect(changed.replacementSkills).toEqual([]);
  expect(changed.skills).toBe(group.skills);
  expect(changed.placementSequenceSkillKeys).toBe(group.placementSequenceSkillKeys);
  expect(group.replacementSkills).toHaveLength(1);
  expect(removeOperatorLibrarySkill(changed, binding)).toBe(changed);
});
