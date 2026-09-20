import { expect, it } from 'vitest';
import { buildSkillInputWindowGraph } from './skillInputWindowGraph';
import type { SkillDefinition } from '../../../../core/game-data/operatorDefinition';
import { resolveStructureValue } from '../skillStructureEditorCommands';
it('preserves distinct mapping/permission paths and explicit null routes', () => {
  const skill: SkillDefinition = {
    key: 'test',
    timelineBlockFrames: 0,
    scheduledSequences: [],
    inputWindows: {
      commandMappings: [{ startFrame: 1, endFrame: 4, input: 'basicAttack', targetSkillId: null }],
      allowedNextSkills: [{ startFrame: 2, endFrame: 5, skillIds: ['native-next'] }],
    },
  };
  const root = buildSkillInputWindowGraph(skill);
  expect(root.children.map(x => x.sourcePath)).toEqual([
    'inputWindows.commandMappings',
    'inputWindows.allowedNextSkills',
  ]);
  root.children.forEach(group =>
    group.children.forEach(child =>
      expect(resolveStructureValue(skill, child.sourcePath)).toBeDefined(),
    ),
  );
  expect(skill.inputWindows!.commandMappings![0]!.targetSkillId).toBeNull();
  expect(root.children[0]!.children[0]!.canDelete).toBe(true);
});
it('does not invent absent windows', () => {
  const root = buildSkillInputWindowGraph({
    key: 'test',
    timelineBlockFrames: 0,
    scheduledSequences: [],
  });
  expect(root.children).toEqual([]);
  expect(root.canAddChild).toBe('lifecycle');
});
