import { describe, expect, it } from 'vitest';
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
