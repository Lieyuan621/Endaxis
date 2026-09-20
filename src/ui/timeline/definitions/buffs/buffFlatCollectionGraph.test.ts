import { expect, it } from 'vitest';
import { BUFF_FLAT_COLLECTIONS, type BuffFlatCollectionKey } from './buffFlatCollectionGraph';
import { appendBuffGraphChild } from './buffDamageModifierGraph';
import {
  buildActionSequenceMindMap,
  indexSkillStructureNodes,
} from '../skillStructureMindMapModel';
import { pasteBuffGraphNode, moveBuffGraphNode } from './buffGraphOperations';
import { resolveStructureValue } from '../skillStructureEditorCommands';
import type { ActionSequenceDefinition } from '../../../../core/game-data/operatorDefinition';

it.each(Object.keys(BUFF_FLAT_COLLECTIONS) as BuffFlatCollectionKey[])(
  '%s supports nested add/copy/sort with distinct payload identity',
  key => {
    const original: ActionSequenceDefinition = {
      steps: [
        {
          kind: 'applyBuff',
          parameters: { buffId: 'test', target: 'caster', definition: { stackingType: 'refresh' } },
        },
      ],
    };
    const path = `steps[0].parameters.definition.${key}`;
    const find = (document: ActionSequenceDefinition, path: string) => {
      const result = [
        ...indexSkillStructureNodes(buildActionSequenceMindMap(document)).values(),
      ].find(node => node.sourcePath === path);
      expect(result, path).toBeDefined();
      return result!;
    };
    expect(find(original, path).canAddChild).toBe('buffMember');
    const added = appendBuffGraphChild(original, path);
    const member = find(added.root, added.itemPath);
    expect(member).toMatchObject({
      payloadKind: BUFF_FLAT_COLLECTIONS[key].payload,
      children: [],
      canDelete: true,
      canMove: true,
    });
    const value = resolveStructureValue(added.root, added.itemPath);
    const copied = pasteBuffGraphNode(added.root, find(added.root, path), {
      kind: BUFF_FLAT_COLLECTIONS[key].payload,
      value,
    })!;
    expect(resolveStructureValue(copied.root, path)).toHaveLength(2);
    expect(resolveStructureValue(copied.root, copied.itemPath)).not.toBe(value);
    const moved = moveBuffGraphNode(
      copied.root,
      find(copied.root, copied.itemPath),
      member,
      'before',
    )!;
    expect(moved.itemPath).toBe(`${path}[0]`);
    const other = key === 'attributeModifiers' ? 'skillSlotReplacements' : 'attributeModifiers';
    expect(
      pasteBuffGraphNode(added.root, find(added.root, path.replace(key, other)), {
        kind: BUFF_FLAT_COLLECTIONS[key].payload,
        value,
      }),
    ).toBeUndefined();
    expect(resolveStructureValue(original, path)).toBeUndefined();
  },
);
