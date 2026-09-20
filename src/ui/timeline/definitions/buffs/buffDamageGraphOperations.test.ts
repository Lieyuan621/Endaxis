import { expect, it } from 'vitest';
import {
  buildActionSequenceMindMap,
  indexSkillStructureNodes,
} from '../skillStructureMindMapModel';
import {
  pasteBuffGraphNode,
  moveBuffGraphNode,
  type BuffGraphClipboard,
} from './buffGraphOperations';
import type { ActionSequenceDefinition } from '../../../../core/game-data/operatorDefinition';
import { resolveStructureValue } from '../skillStructureEditorCommands';

const prefix = 'steps[0].parameters.definition.damageModifiers';
const fixture = (): ActionSequenceDefinition => ({
  steps: [
    {
      kind: 'applyBuff',
      parameters: {
        target: 'enemy',
        buffId: 'inline',
        definition: {
          stackingType: 'refresh',
          damageModifiers: [
            {
              enabledSide: 'attacker',
              condition: {
                kind: 'all',
                conditions: [{ kind: 'casterControlled' }, { kind: 'any', conditions: [] }],
              },
              processors: [
                { kind: 'damageScale', side: 'attacker', zone: 'normal', addition: 1 },
                { kind: 'damageScale', side: 'attacker', zone: 'normal', addition: 2 },
              ],
            },
            { enabledSide: 'defender', processors: [] },
          ],
        },
      },
    },
  ],
});
function node(document: ActionSequenceDefinition, path: string) {
  const found = [...indexSkillStructureNodes(buildActionSequenceMindMap(document)).values()].find(
    node => node.sourcePath === path,
  );
  expect(found, path).toBeDefined();
  return found!;
}

it('pastes deep copies into the matching collection and optional condition port only', () => {
  const original = fixture();
  const source = resolveStructureValue(original, `${prefix}[0]`);
  const clipboard: BuffGraphClipboard = { kind: 'buffDamageModifier', value: source };
  const result = pasteBuffGraphNode(original, node(original, prefix), clipboard)!;
  expect(result.itemPath).toBe(`${prefix}[2]`);
  expect(resolveStructureValue(result.root, result.itemPath)).toEqual(source);
  expect(resolveStructureValue(result.root, result.itemPath)).not.toBe(source);
  expect(resolveStructureValue(original, prefix)).toHaveLength(2);
  expect(
    pasteBuffGraphNode(original, node(original, `${prefix}[1].processors`), clipboard),
  ).toBeUndefined();
  const condition = { kind: 'buffDamageCondition', value: { kind: 'casterControlled' } } as const;
  const conditionPath = `${prefix}[1].condition`;
  const target = node(original, conditionPath);
  const added = pasteBuffGraphNode(original, target, condition)!;
  expect(resolveStructureValue(added.root, conditionPath)).toEqual(condition.value);
  // Even a stale empty-port handle cannot overwrite an existing condition.
  expect(pasteBuffGraphNode(added.root, target, condition)).toBeUndefined();
  const all = node(original, `${prefix}[0].condition`);
  const child = pasteBuffGraphNode(original, all, condition)!;
  expect(child.itemPath).toBe(`${prefix}[0].condition.conditions[2]`);
});

it('reorders processors, permits an empty source array, and rejects recursive or cross-type moves', () => {
  const original = fixture();
  const first = node(original, `${prefix}[0].processors[0]`);
  const second = node(original, `${prefix}[0].processors[1]`);
  const reordered = moveBuffGraphNode(original, first, second, 'after')!;
  expect(resolveStructureValue(reordered.root, `${prefix}[0].processors`)).toMatchObject([
    { addition: 2 },
    { addition: 1 },
  ]);
  expect(reordered.itemPath).toBe(`${prefix}[0].processors[1]`);
  const moved = moveBuffGraphNode(
    original,
    first,
    node(original, `${prefix}[1].processors`),
    'inside',
  )!;
  expect(resolveStructureValue(moved.root, `${prefix}[1].processors`)).toHaveLength(1);
  const emptied = moveBuffGraphNode(
    moved.root,
    node(moved.root, first.sourcePath),
    node(moved.root, `${prefix}[1].processors`),
    'inside',
  )!;
  expect(resolveStructureValue(emptied.root, `${prefix}[0].processors`)).toEqual([]);
  const all = node(original, `${prefix}[0].condition`);
  expect(
    moveBuffGraphNode(original, all, node(original, `${prefix}[1].condition`), 'inside'),
  ).toBeUndefined();
  const any = node(original, `${prefix}[0].condition.conditions[1]`);
  const conditionMoved = moveBuffGraphNode(
    original,
    any,
    node(original, `${prefix}[1].condition`),
    'inside',
  )!;
  expect(resolveStructureValue(conditionMoved.root, `${prefix}[1].condition`)).toEqual({
    kind: 'any',
    conditions: [],
  });
  expect(
    resolveStructureValue(conditionMoved.root, `${prefix}[0].condition.conditions`),
  ).toHaveLength(1);
  expect(moveBuffGraphNode(original, any, any, 'inside')).toBeUndefined();
  expect(moveBuffGraphNode(original, first, all, 'inside')).toBeUndefined();
  expect(resolveStructureValue(original, `${prefix}[0].processors`)).toHaveLength(2);
});
