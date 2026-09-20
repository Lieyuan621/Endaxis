import { expect, it } from 'vitest';
import { buildBuffStructureMindMap, indexSkillStructureNodes } from '../skillStructureMindMapModel';
import { appendBuffGraphChild } from './buffDamageModifierGraph';
import { pasteBuffGraphNode, moveBuffGraphNode } from './buffGraphOperations';
import {
  replaceStructureValueAtPath,
  resolveStructureValue,
} from '../skillStructureEditorCommands';
import type { SkillBuffDefinition } from '../../../../core/game-data/operatorDefinition';

const node = (doc: SkillBuffDefinition, path: string) => {
  const found = [...indexSkillStructureNodes(buildBuffStructureMindMap('test', doc)).values()].find(
    node => node.sourcePath === path,
  );
  expect(found, path).toBeDefined();
  return found!;
};
it.each(['healModifiers', 'poiseModifiers'] as const)(
  '%s exposes condition/processor ownership and editable empty arrays',
  key => {
    const original: SkillBuffDefinition = { stackingType: 'refresh' };
    const added = appendBuffGraphChild(original, key);
    const member = node(added.root, `${key}[0]`);
    expect(member.children.map(child => child.sourcePath)).toEqual([
      `${key}[0].condition`,
      `${key}[0].processors`,
    ]);
    const conditioned = appendBuffGraphChild(added.root, `${key}[0].condition`);
    expect(node(conditioned.root, `${key}[0].condition`).payloadKind).toBe(
      key === 'healModifiers' ? 'buffHealCondition' : 'buffPoiseCondition',
    );
    const copied = pasteBuffGraphNode(
      conditioned.root,
      node(conditioned.root, `${key}[0].processors`),
      {
        kind: key === 'healModifiers' ? 'buffHealProcessor' : 'buffPoiseProcessor',
        value: resolveStructureValue(conditioned.root, `${key}[0].processors[0]`),
      },
    )!;
    expect(resolveStructureValue(copied.root, `${key}[0].processors`)).toHaveLength(2);
    const moved = moveBuffGraphNode(
      copied.root,
      node(copied.root, `${key}[0].processors[1]`),
      node(copied.root, `${key}[0].processors[0]`),
      'before',
    )!;
    expect(moved.itemPath).toBe(`${key}[0].processors[0]`);
    expect(original[key]).toBeUndefined();
  },
);
it('supports recursive poise all conditions without exposing damage-only operators or accepting heal processors', () => {
  const first = appendBuffGraphChild<SkillBuffDefinition>(
    { stackingType: 'refresh' },
    'poiseModifiers',
  );
  const doc = replaceStructureValueAtPath(first.root, 'poiseModifiers[0].condition', {
    kind: 'all',
    conditions: [{ kind: 'all', conditions: [] }],
  });
  const added = appendBuffGraphChild(doc, 'poiseModifiers[0].condition.conditions[0]');
  expect(added.itemPath).toBe('poiseModifiers[0].condition.conditions[0].conditions[0]');
  expect(resolveStructureValue(added.root, added.itemPath)).toEqual({ kind: 'casterControlled' });
  expect(
    pasteBuffGraphNode(doc, node(doc, 'poiseModifiers[0].processors'), {
      kind: 'buffHealProcessor',
      value: {},
    }),
  ).toBeUndefined();
});
