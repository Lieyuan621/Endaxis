import { describe, it, expect } from 'vitest';
import { buildOperatorUpgradeGraph, buildOperatorRuntimeGraph } from './operatorUpgradeGraph';
import { indexSkillStructureNodes } from '../skillStructureMindMapModel';
import {
  resolveStructureValue,
  replaceStructureValueAtPath,
} from '../skillStructureEditorCommands';
import { perlica } from '../../../../data/operators/perlica.generated';
describe('upgrade structure projection', () => {
  it('projects role events without converting them into upgrade events', () => {
    const document = {
      passives: [{ key: 'passive', enableSequence: { steps: [] } }],
      handlers: [
        { key: 'handler', event: 'deckAttributesChanged' as const, sequence: { steps: [] } },
      ],
    };
    const root = buildOperatorRuntimeGraph(document);
    expect(root.children.map(n => n.sourcePath)).toEqual(['passives', 'handlers']);
    for (const node of indexSkillStructureNodes(root).values()) {
      expect(resolveStructureValue(document, node.sourcePath)).toBeDefined();
    }
    expect(root.children[1]!.children[0]!.kind).toBe('角色监听');
    expect(document.handlers[0]!.event).toBe('deckAttributesChanged');
  });
  it('projects all real upgrade sequences onto their real document paths', () => {
    for (const upgrade of [...perlica.talents, ...perlica.potentials]) {
      const graph = buildOperatorUpgradeGraph(upgrade, '效果');
      const nodes = [...indexSkillStructureNodes(graph).values()];
      expect(new Set(nodes.map(n => n.id)).size).toBe(nodes.length);
      for (const node of nodes) {
        if (node.kind === '结构端口') continue;
        expect(resolveStructureValue(upgrade, node.sourcePath), node.sourcePath).toBeDefined();
        if (node.payloadKind === 'combatStep') {
          const next = replaceStructureValueAtPath(upgrade, node.sourcePath, { kind: 'test' });
          expect(resolveStructureValue(next, node.sourcePath)).toEqual({ kind: 'test' });
          expect(resolveStructureValue(upgrade, node.sourcePath)).not.toEqual({ kind: 'test' });
        }
      }
    }
  });
  it('keeps construction and runtime ownership distinct, and preserves recursive conditions', () => {
    const graph = buildOperatorUpgradeGraph(
      {
        levels: 1,
        modifiers: [
          {
            kind: 'addConditionalDamage',
            values: 1,
            condition: { kind: 'not', condition: { kind: 'combatActive' } },
          },
        ],
      },
      '潜能 1',
    );
    expect(graph.children.map(n => n.sourcePath)).toEqual([
      'modifiers',
      'initializationSequence',
      'eventHandlers',
      'passiveSkills',
    ]);
    const nodes = [...indexSkillStructureNodes(graph).values()];
    expect(nodes.find(n => n.sourcePath === 'modifiers[0].condition.condition')?.payloadKind).toBe(
      'combatCondition',
    );
    expect(graph.canDelete).toBe(false);
  });
});
