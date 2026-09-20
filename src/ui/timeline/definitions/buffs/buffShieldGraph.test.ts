import { expect, it } from 'vitest';
import { appendBuffGraphChild } from './buffDamageModifierGraph';
import {
  buildActionSequenceMindMap,
  indexSkillStructureNodes,
} from '../skillStructureMindMapModel';
import { moveBuffGraphNode, pasteBuffGraphNode } from './buffGraphOperations';
import {
  replaceStructureValueAtPath,
  resolveStructureValue,
} from '../skillStructureEditorCommands';
import type { ActionSequenceDefinition } from '../../../../core/game-data/operatorDefinition';

it('keeps shields in the graph and absorption parameters in their Inspector', () => {
  const original: ActionSequenceDefinition = {
    steps: [
      {
        kind: 'applyBuff',
        parameters: { target: 'caster', buffId: 'shield', definition: { stackingType: 'refresh' } },
      },
    ],
  };
  const prefix = 'steps[0].parameters.definition.shields';
  const find = (doc: ActionSequenceDefinition, path: string) => {
    const result = [...indexSkillStructureNodes(buildActionSequenceMindMap(doc)).values()].find(
      node => node.sourcePath === path,
    );
    expect(result, path).toBeDefined();
    return result!;
  };
  const added = appendBuffGraphChild(original, prefix);
  const member = find(added.root, added.itemPath);
  expect(member.payloadKind).toBe('buffShield');
  expect(member.children).toEqual([]);
  const absorption = {
    root: replaceStructureValueAtPath(added.root, `${prefix}[0].damageAbsorptions`, [
      { damageType: 'physical', ratio: 1, scale: 1 },
    ]),
    itemPath: `${prefix}[0].damageAbsorptions[0]`,
  };
  expect(resolveStructureValue(absorption.root, absorption.itemPath)).toEqual({
    damageType: 'physical',
    ratio: 1,
    scale: 1,
  });
  const copy = pasteBuffGraphNode(absorption.root, find(absorption.root, prefix), {
    kind: 'buffShield',
    value: resolveStructureValue(absorption.root, added.itemPath),
  })!;
  expect(resolveStructureValue(copy.root, prefix)).toHaveLength(2);
  expect(resolveStructureValue(copy.root, `${prefix}[1].damageAbsorptions`)).toHaveLength(1);
  expect(
    pasteBuffGraphNode(copy.root, find(copy.root, prefix), {
      kind: 'buffDamageModifier',
      value: {},
    }),
  ).toBeUndefined();
  const moved = moveBuffGraphNode(
    copy.root,
    find(copy.root, copy.itemPath),
    find(copy.root, added.itemPath),
    'before',
  )!;
  expect(moved.itemPath).toBe(added.itemPath);
  expect(resolveStructureValue(original, prefix)).toBeUndefined();
});
