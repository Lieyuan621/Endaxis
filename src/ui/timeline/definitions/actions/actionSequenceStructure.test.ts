import { expect, it } from 'vitest';
import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
} from '../../../../core/game-data/operatorDefinition';
import { perlica } from '../../../../data/operators/perlica.generated';
import {
  buildActionSequenceMindMap,
  buildSkillStructureMindMap,
  indexSkillStructureNodes,
} from '../skillStructureMindMapModel';
import {
  appendCombatStepInStructure,
  duplicateCombatStepInStructure,
  moveCombatStepInStructure,
  moveStructureArrayItem,
  removeCombatStepInStructure,
  replaceStructureValueAtPath,
  resolveStructureValue,
} from '../skillStructureEditorCommands';

const step: CombatStepDefinition = { kind: 'finishActionOwnerAbilityEntity', parameters: {} };
const branch: CombatStepDefinition = {
  kind: 'conditional',
  parameters: { condition: { kind: 'all', conditions: [] } },
  whenTrue: { steps: [step] },
};

it('exposes inline Buff ports at the real document path in both sequence and skill hosts', () => {
  const sequence: ActionSequenceDefinition = {
    steps: [
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'qa',
          target: 'caster',
          definition: { stackingType: 'refresh', durationSeconds: 5 },
        },
      },
    ],
  };
  const standalone = buildActionSequenceMindMap(sequence);
  const buff = [...indexSkillStructureNodes(standalone).values()].find(
    node => node.sourcePath === 'steps[0].parameters.definition',
  );
  expect(buff).toMatchObject({ kind: '内联 Buff 定义', relationToParent: 'port' });
  const embedded = buildSkillStructureMindMap(
    { key: 'qa', timelineBlockFrames: 0, scheduledSequences: [{ startFrame: 0, sequence }] },
    { blackboard: '', availability: '', sequence: '' },
  );
  const inlinePath = 'scheduledSequences[0].sequence.steps[0].parameters.definition';
  const nodes = [...indexSkillStructureNodes(embedded).values()];
  expect(nodes.find(node => node.sourcePath === inlinePath)).toMatchObject({
    kind: '内联 Buff 定义',
    relationToParent: 'port',
  });
  expect(nodes.find(node => node.sourcePath === `${inlinePath}.attributeModifiers`)).toMatchObject({
    canAddChild: 'buffMember',
  });
  expect(nodes.find(node => node.sourcePath === `${inlinePath}.damageModifiers`)).toMatchObject({
    canAddChild: 'buffMember',
  });
});

it('moves a preceding root step into the following branch without losing the destination', () => {
  const original = { steps: [step, branch] };
  const moved = moveStructureArrayItem(original, 'steps[0]', 'steps[1].whenTrue.steps');
  expect(moved.itemPath).toBe('steps[0].whenTrue.steps[1]');
  expect(moved.root.steps).toHaveLength(1);
  expect(resolveStructureValue(moved.root, moved.itemPath)).toEqual(step);
  expect(original.steps).toHaveLength(2);
  expect(() => moveStructureArrayItem(original, 'steps[1]', 'steps[1].whenTrue.steps')).toThrow(
    'own subtree',
  );
});

it('projects a sequence directly, preserving the same child ports as a skill sequence', () => {
  const sequence = { steps: [branch] };
  const root = buildActionSequenceMindMap(sequence, '启用行为');
  expect(root).toMatchObject({
    label: '启用行为',
    sourcePath: '',
    canAddChild: 'step',
    acceptsChildKind: 'combatStep',
  });
  expect(root.relationToParent).toBeUndefined();
  const nodes = [...indexSkillStructureNodes(root).values()];
  expect(nodes.some(node => node.sourcePath.startsWith('.'))).toBe(false);
  expect(nodes.find(node => node.sourcePath === 'steps[0].whenFalse')).toMatchObject({
    relationToParent: 'port',
    canAddChild: 'step',
  });
  expect(nodes.find(node => node.sourcePath === 'steps[0].parameters.condition')).toMatchObject({
    payloadKind: 'combatCondition',
    canDelete: false,
  });
  const skill = buildSkillStructureMindMap(
    { key: 'reference', timelineBlockFrames: 0, scheduledSequences: [{ startFrame: 0, sequence }] },
    { blackboard: '黑板', availability: '条件', sequence: '序列' },
  );
  const prefix = 'scheduledSequences[0].sequence.';
  const embedded = [...indexSkillStructureNodes(skill).values()].filter(node =>
    node.sourcePath.startsWith(prefix),
  );
  expect(
    nodes.slice(1).map(node => ({
      path: node.sourcePath,
      kind: node.kind,
      payload: node.payloadKind,
      relation: node.relationToParent,
    })),
  ).toEqual(
    embedded.map(node => ({
      path: node.sourcePath.slice(prefix.length),
      kind: node.kind,
      payload: node.payloadKind,
      relation: node.relationToParent,
    })),
  );
});

it('edits root steps and absent branches with the existing immutable structure commands', () => {
  const original: ActionSequenceDefinition = { steps: [branch] };
  const added = appendCombatStepInStructure(original, '', step);
  expect(added.stepPath).toBe('steps[1]');
  expect(resolveStructureValue(added.root, added.stepPath)).toEqual(step);
  const copied = duplicateCombatStepInStructure(added.root, 'steps[0]', value =>
    structuredClone(value),
  );
  expect(copied.stepPath).toBe('steps[1]');
  const moved = moveCombatStepInStructure(copied.root, 'steps[2]', -1);
  expect(moved.stepPath).toBe('steps[1]');
  expect(moved.root.steps.map(s => s.kind)).toEqual(['conditional', step.kind, 'conditional']);
  const removed = removeCombatStepInStructure(moved.root, 'steps[2]');
  const falseBranch = appendCombatStepInStructure(removed, 'steps[0].whenFalse', step);
  expect(falseBranch.stepPath).toBe('steps[0].whenFalse.steps[0]');
  const updated = replaceStructureValueAtPath(falseBranch.root, 'steps[0].parameters.condition', {
    kind: 'any',
    conditions: [],
  });
  expect(resolveStructureValue(updated, 'steps[0].parameters.condition')).toEqual({
    kind: 'any',
    conditions: [],
  });
  expect(original).toEqual({ steps: [branch] });
  expect(original.steps).toHaveLength(1);
  expect(branch.whenFalse).toBeUndefined();
  expect(() => removeCombatStepInStructure(original, 'costs[0]')).toThrow('not a combat-step path');
});

it('supports adding the first step and removing the last without a wrapper definition', () => {
  const added = appendCombatStepInStructure({ steps: [] }, '', step);
  expect(added.stepPath).toBe('steps[0]');
  expect(removeCombatStepInStructure(added.root, added.stepPath)).toEqual({ steps: [] });
});

it('resolves actual Perlica upgrade sequence member paths against the native sequence itself', () => {
  const sequences = [...perlica.talents, ...perlica.potentials].flatMap(upgrade => [
    ...(upgrade.initializationSequence ? [upgrade.initializationSequence] : []),
    ...(upgrade.eventHandlers ?? []).map(handler => handler.sequence),
    ...(upgrade.passiveSkills ?? []).flatMap(passive =>
      passive.enableSequence ? [passive.enableSequence] : [],
    ),
  ]);
  expect(sequences.length).toBeGreaterThan(0);
  for (const sequence of sequences) {
    for (const node of indexSkillStructureNodes(buildActionSequenceMindMap(sequence)).values()) {
      if (node.payloadKind !== undefined)
        expect(resolveStructureValue(sequence, node.sourcePath), node.sourcePath).toBeDefined();
    }
  }
});
