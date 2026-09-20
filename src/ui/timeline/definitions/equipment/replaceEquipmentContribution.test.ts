import { expect, it } from 'vitest';
import type { EquipmentContributionDefinition } from '../../../../core/game-data/equipmentDefinition';
import { replaceEquipmentContribution } from './replaceEquipmentContribution';
import { createEmptyProject } from '../../../../core/project/createProject';
import { ProjectEditorSession } from '../../../../application/editor/projectEditorSession';
import {
  deriveProjectGearSetTemplate,
  getProjectDefinitionLibrary,
  replaceProjectGearSetTemplateDefinition,
} from '../../../../core/project/projectDefinitionLibrary';
import {
  parseProjectDocument,
  serializeProjectDocument,
} from '../../../../core/project/serialization';

const contribution = {
  modifiers: [],
  eventHandlers: [],
  buffDefinitions: {},
  blackboard: { custom: 1 },
  enableSequence: { steps: [] },
  initializationSequence: { steps: [] },
} satisfies Required<EquipmentContributionDefinition>;

it('removes every absent contribution field while retaining host metadata', () => {
  const host = { ...contribution, key: 'trait', levelCount: 3, display: { kind: 'test' } };
  const next = replaceEquipmentContribution(host, {});
  expect(next).toEqual({ key: 'trait', levelCount: 3, display: { kind: 'test' } });
  expect(host.initializationSequence).toEqual({ steps: [] });
  expect(replaceEquipmentContribution(next, contribution)).toEqual(host);
});

it('does not restore stale host identity when undoing a graph edit', () => {
  const current = { ...contribution, slug: 'current', displayName: 'New name' };
  const oldGraphSnapshot = { modifiers: [], slug: 'old', displayName: 'Old name' };
  expect(replaceEquipmentContribution(current, oldGraphSnapshot)).toEqual({
    slug: 'current',
    displayName: 'New name',
    modifiers: [],
  });
});

it('treats explicitly undefined values as absence but retains present empty values', () => {
  expect(
    replaceEquipmentContribution(contribution, {
      initializationSequence: undefined,
      blackboard: {},
      modifiers: [],
    }),
  ).toEqual({ blackboard: {}, modifiers: [] });
});

it('persists deletion through project save/reload and one project undo/redo transaction', () => {
  const project = deriveProjectGearSetTemplate(createEmptyProject({ createdWith: 'test' }), {
    id: 'project:gearSet:qa',
    name: 'QA',
    baseTemplateId: 'base-set',
    definition: { slug: 'base-set', ...contribution },
  });
  const session = new ProjectEditorSession(project);
  const original = getProjectDefinitionLibrary(project).gearSets['project:gearSet:qa']!.definition;
  const edited = replaceEquipmentContribution(original, {});
  session.commit('saveProjectGearSetTemplate', current =>
    replaceProjectGearSetTemplateDefinition(current, original.slug, edited),
  );
  const saved = session.snapshot.project;
  const loaded = parseProjectDocument(serializeProjectDocument(saved));
  expect(loaded.ok).toBe(true);
  if (!loaded.ok) throw new Error('saved project must load');
  expect(getProjectDefinitionLibrary(loaded.value).gearSets[original.slug]!.definition).toEqual(
    edited,
  );
  expect(edited).not.toHaveProperty('initializationSequence');
  expect(saved.scenarios).toBe(project.scenarios);
  expect(session.undo()).toBe(true);
  expect(session.snapshot.project).toBe(project);
  expect(session.redo()).toBe(true);
  expect(session.snapshot.project).toBe(saved);
});
