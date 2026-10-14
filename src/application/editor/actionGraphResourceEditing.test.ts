import { describe, expect, it } from 'vitest';
import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import {
  addResourceNode,
  connectResourceEntry,
  connectResourceNode,
  listResourceGraphEntries,
  removeResourceNode,
  resourceGraph,
} from './actionGraphResourceEditing';

function resource() {
  return {
    actionGraph: {
      main: {
        nodes: {
          first: { action: { kind: 'dealStagger' as const, parameters: { value: 2 } }, next: null },
          second: {
            action: { kind: 'dealStagger' as const, parameters: { value: 3 } },
            next: null,
          },
        },
      },
      macros: {},
    },
    onApply: { $sequence: 'first' },
  };
}

describe('independent resource graph editing', () => {
  it('连接数据节点的行为出口时拒绝跨类型环，删除行为节点同时断开该出口', () => {
    const source: { actionGraph: ActionGraphResourceDefinition } = {
      actionGraph: {
        main: {
          nodes: {
            check: {
              action: {
                kind: 'checkCondition',
                parameters: { condition: { kind: 'conditionNode', nodeId: 'result' } },
              },
              next: null,
            },
            effect: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
          },
          dataNodes: {
            result: {
              type: 'boolean',
              expression: { kind: 'checkActionResult', action: { $sequence: null } },
            },
          },
        },
        macros: {},
      },
    };
    const port = ['expression', 'action', '$sequence'];
    expect(() =>
      connectResourceNode(source, { kind: 'main' }, 'result', port, 'check', 'data'),
    ).toThrow('recursive action graph');
    const connected = connectResourceNode(
      source,
      { kind: 'main' },
      'result',
      port,
      'effect',
      'data',
    );
    const removed = removeResourceNode(connected, { kind: 'main' }, 'effect');
    expect(removed.actionGraph.main.dataNodes).toEqual(source.actionGraph.main.dataNodes);
    expect(connected.actionGraph.main.nodes.effect).toBeDefined();
  });
  it('connects its own entry and nodes without changing the source resource', () => {
    const source = resource();
    const entries = listResourceGraphEntries(source, { kind: 'main' });
    expect(entries.map(item => item.targetId)).toEqual(['first']);
    const connected = connectResourceEntry(source, { kind: 'main' }, entries[0]!.id, 'second');
    expect(connected.onApply.$sequence).toBe('second');
    expect(source.onApply.$sequence).toBe('first');
    const chained = connectResourceNode(connected, { kind: 'main' }, 'first', ['next'], 'second');
    expect(resourceGraph(chained, { kind: 'main' }).nodes.first?.next).toBe('second');
    expect(() =>
      connectResourceNode(chained, { kind: 'main' }, 'second', ['next'], 'first'),
    ).toThrow();
  });

  it('clears resource entries when removing a node and guards missing macro identities', () => {
    const source = resource();
    const removed = removeResourceNode(source, { kind: 'main' }, 'first');
    expect(removed.onApply.$sequence).toBeNull();
    expect(source.onApply.$sequence).toBe('first');
    expect(() => resourceGraph(source, { kind: 'macro', macroId: 'toString' })).toThrow(
      'has no macro',
    );
    const added = addResourceNode(source, { kind: 'main' }, 'third', {
      kind: 'dealStagger',
      parameters: { value: 4 },
    });
    expect(Object.hasOwn(added.actionGraph.main.nodes, 'third')).toBe(true);
  });
});
