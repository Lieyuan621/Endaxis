import { describe, expect, it } from 'vitest';
import type { ActionGraphNode } from '../../../../packages/game-data-contract/src/actionGraph.ts';
import { createActionGraphBuilder } from '../../src/compiler/actions/actionGraphBuilder.ts';
import { deduplicateActionGraph } from '../../src/compiler/optimization/actionGraphDeduplication.ts';

describe('同一资源的分支去重', () => {
  it('单节点、嵌套分支和相同尾部均合并，只忽略节点标识', () => {
    const builder = createActionGraphBuilder();
    const make = () =>
      builder.node({
        kind: 'conditional',
        parameters: { condition: { kind: 'combatActive' } },
        whenTrue: builder.node({ kind: 'finishTimeline', parameters: {} }),
      });
    const first = make(),
      second = make();
    const source = builder.finish();
    const result = deduplicateActionGraph(source, [first, second]);
    expect(result.entries[0]).toEqual(result.entries[1]);
    expect(Object.keys(result.graph.nodes)).toHaveLength(2);
    expect(Object.keys(source.nodes)).toHaveLength(4);
    expect(deduplicateActionGraph(result.graph, result.entries).graph).toBe(result.graph);
  });

  it('参数、动作身份或后续流程不同的节点不会合并', () => {
    const builder = createActionGraphBuilder();
    const first = builder.node({
      kind: 'dealDamage',
      key: 'first',
      parameters: { damageType: 'physical', attackScale: 1, tags: [] },
    });
    const second = builder.node({
      kind: 'dealDamage',
      key: 'second',
      parameters: { damageType: 'physical', attackScale: 1, tags: [] },
    });
    const third = builder.node({
      kind: 'dealDamage',
      key: 'first',
      parameters: { damageType: 'physical', attackScale: 2, tags: [] },
    });
    const fourth = builder.node(
      {
        kind: 'dealDamage',
        key: 'first',
        parameters: { damageType: 'physical', attackScale: 1, tags: [] },
      },
      second,
    );
    const result = deduplicateActionGraph(builder.finish(), [first, second, third, fourth]);
    expect(new Set(result.entries.map(entry => entry.$sequence)).size).toBe(4);
  });

  it('相同形状的外部资源仍然独立，不改写其节点引用', () => {
    const builder = createActionGraphBuilder();
    const make = (id: string) => {
      const child = createActionGraphBuilder();
      const entry = child.node({ kind: 'finishTimeline', parameters: {} });
      return builder.node({
        kind: 'callResource',
        resource: { id, entry, actionGraph: { main: child.finish(), macros: {} } },
      });
    };
    const first = make('first'),
      second = make('second'),
      repeated = make('first');
    const result = deduplicateActionGraph(builder.finish(), [first, second, repeated]);
    expect(result.entries[0]).not.toEqual(result.entries[1]);
    expect(result.entries[0]).toEqual(result.entries[2]);
    expect(Object.keys(result.graph.nodes)).toHaveLength(2);
  });

  it('长链不递归展开，去重后保留完整链长', () => {
    const nodes: Record<string, ActionGraphNode> = {};
    for (const prefix of ['a', 'b'])
      for (let i = 0; i < 10000; i++)
        nodes[`${prefix}${i}`] = {
          action: { kind: 'finishTimeline', parameters: {} },
          next: i === 9999 ? null : `${prefix}${i + 1}`,
        };
    const result = deduplicateActionGraph({ nodes }, [{ $sequence: 'a0' }, { $sequence: 'b0' }]);
    expect(Object.keys(result.graph.nodes)).toHaveLength(10000);
    expect(result.entries[0]).toEqual(result.entries[1]);
  });

  it('缺失引用和环显式报错，不留下半成品引用', () => {
    const node: ActionGraphNode = {
      action: { kind: 'finishTimeline', parameters: {} },
      next: 'missing',
    };
    expect(() => deduplicateActionGraph({ nodes: { a: node } }, [{ $sequence: 'a' }])).toThrow(
      'missing graph node',
    );
    expect(() =>
      deduplicateActionGraph({ nodes: { a: { ...node, next: 'a' } } }, [{ $sequence: 'a' }]),
    ).toThrow('cyclic graph node');
  });
});
