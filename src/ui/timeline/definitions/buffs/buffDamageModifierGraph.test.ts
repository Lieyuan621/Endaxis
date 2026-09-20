import { expect, it } from 'vitest';
import { buildBuffDamageModifierGraph, appendBuffGraphChild } from './buffDamageModifierGraph';
import {
  buildActionSequenceMindMap,
  indexSkillStructureNodes,
} from '../skillStructureMindMapModel';
import type { SkillBuffDefinition } from '../../../../core/game-data/operatorDefinition';

it('adds through real nested paths without replacing existing conditions or changing sibling data', () => {
  const original = {
    nested: { definition: { stackingType: 'refresh' } as SkillBuffDefinition },
    other: 7,
  };
  const added = appendBuffGraphChild(original, 'nested.definition.damageModifiers');
  expect(added.itemPath).toBe('nested.definition.damageModifiers[0]');
  expect(original.nested.definition.damageModifiers).toBeUndefined();
  const prefix = added.itemPath;
  const condition = appendBuffGraphChild(added.root, `${prefix}.condition`);
  expect(condition.root.nested.definition.damageModifiers![0]!.condition).toEqual({
    kind: 'casterControlled',
  });
  expect(appendBuffGraphChild(condition.root, `${prefix}.condition`).root).toBe(condition.root);
  const program = appendBuffGraphChild(condition.root, `${prefix}.conditionProgram`);
  expect(program.root.nested.definition.damageModifiers![0]!.condition).toEqual({
    kind: 'casterControlled',
  });
  expect(program.root.nested.definition.damageModifiers![0]!.conditionProgram).toEqual({
    steps: [],
  });
  const processor = appendBuffGraphChild(program.root, `${prefix}.processors`);
  expect(processor.root.nested.definition.damageModifiers![0]!.processors).toHaveLength(2);
  expect(processor.root.other).toBe(7);
  const branch = { condition: { kind: 'all', conditions: [] } };
  expect(appendBuffGraphChild(branch, 'condition').root.condition.conditions).toEqual([
    { kind: 'casterControlled' },
  ]);
});

it('preserves modifier ownership, recursive condition paths, processors and conflicting draft branches', () => {
  const modifiers: NonNullable<SkillBuffDefinition['damageModifiers']> = [
    {
      enabledSide: 'attacker',
      condition: {
        kind: 'all',
        conditions: [
          { kind: 'not', condition: { kind: 'casterControlled' } },
          { kind: 'any', conditions: [] },
        ],
      },
      conditionProgram: { steps: [] },
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'normal',
          addition: { blackboardKey: 'dmg' },
        },
      ],
    },
  ];
  const before = structuredClone(modifiers);
  const root = buildBuffDamageModifierGraph(modifiers, (sequence, path) => ({
    ...buildActionSequenceMindMap(sequence),
    id: path,
    sourcePath: path,
  }));
  const member = root.children[0]!;
  expect(member.sourcePath).toBe('damageModifiers[0]');
  expect(member.relationToParent).toBe('member');
  expect(member.children.map(node => node.sourcePath)).toEqual([
    'damageModifiers[0].condition',
    'damageModifiers[0].conditionProgram',
    'damageModifiers[0].processors',
  ]);
  const paths = [...indexSkillStructureNodes(root).values()].map(node => node.sourcePath);
  expect(paths).toContain('damageModifiers[0].condition.conditions[0].condition');
  expect(paths).toContain('damageModifiers[0].condition.conditions[1]');
  expect(paths).toContain('damageModifiers[0].processors[0]');
  expect(member.children[1]).toMatchObject({
    kind: '伤害条件程序',
    canDelete: true,
    canMove: false,
    canCopy: false,
    canAddChild: 'step',
  });
  expect(modifiers).toEqual(before);
  expect(
    buildBuffDamageModifierGraph([], () => {
      throw new Error('unused');
    }).children,
  ).toEqual([]);
});
