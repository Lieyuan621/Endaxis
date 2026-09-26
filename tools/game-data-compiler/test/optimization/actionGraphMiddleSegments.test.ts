import { describe, expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';
import { deduplicateActionGraph } from '../../src/compiler/optimization/actionGraphDeduplication.ts';
import { extractActionGraphMiddleSegments } from '../../src/compiler/optimization/actionGraphMiddleSegments.ts';

function fixture(length = 8, prefixes = ['a', 'b']) {
  const nodes: Record<string, ActionGraphNode> = {};
  const entries: ActionGraphReference[] = [];
  for (const prefix of prefixes) {
    entries.push({ $sequence: `${prefix}0` });
    for (let i = 0; i < length; i++) {
      nodes[`${prefix}${i}`] = {
        action: {
          kind: 'modifyActionValue',
          key: `action-${i}`,
          parameters: {
            key: `counter-${i}`,
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: i + 1 === length ? `${prefix}-end` : `${prefix}${i + 1}`,
      };
    }
    nodes[`${prefix}-end`] = {
      action: { kind: 'finishTimeline', key: `${prefix}-end`, parameters: {} },
      next: null,
    };
  }
  return { graph: { nodes }, entries };
}

describe('同步直线中间段宏提取', () => {
  it('相同中间流程合为一份，保留两个调用及各自后续和节点身份', () => {
    const source = fixture();
    const original = structuredClone(source);
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    expect(result.entries).toBe(source.entries);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        status: 'accepted',
        starts: ['a0', 'b0'],
        nodeCount: 8,
        continuations: ['a-end', 'b-end'],
        netNodeReduction: 6,
      }),
    ]);
    expect(result.candidates[0]!.savedBytes).toBeGreaterThan(0);
    expect(Object.keys(result.macros)).toEqual(['middle_1']);
    expect(Object.keys(result.graph.nodes)).toHaveLength(4);
    expect(Object.keys(result.macros.middle_1!.graph.nodes)).toHaveLength(8);
    expect(result.macros.middle_1!.graph.nodes.n8!.next).toBeNull();
    for (const prefix of ['a', 'b']) {
      expect(result.graph.nodes[`${prefix}0`]).toEqual({
        action: {
          kind: 'callMacro',
          macroId: 'middle_1',
          nodeBindings: Object.fromEntries(
            Array.from({ length: 8 }, (_, index) => [`n${index + 1}`, `${prefix}${index}`]),
          ),
        },
        next: `${prefix}-end`,
      });
    }
    expect(source).toEqual(original);
  });

  it('展开两次调用仍保留完整动作次数、原顺序和分别返回的位置', () => {
    const source = fixture();
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    function trace(graph: ActionGraphDefinition, start: string): string[] {
      const events: string[] = [];
      let id: string | null = start;
      while (id !== null) {
        const node: ActionGraphNode = graph.nodes[id]!;
        if (node.action.kind === 'callMacro') {
          const macro = result.macros[node.action.macroId]!;
          events.push(...trace(macro.graph, macro.entry.$sequence!));
        } else events.push(node.action.key!);
        id = node.next;
      }
      return events;
    }
    for (const entry of source.entries)
      expect(trace(result.graph, entry.$sequence!)).toEqual(trace(source.graph, entry.$sequence!));
    expect(source.entries.flatMap(entry => trace(result.graph, entry.$sequence!))).toHaveLength(18);
  });

  it('去重之后只有一份的公共尾段不再提取宏', () => {
    const source = fixture();
    source.graph.nodes['b-end'] = source.graph.nodes['a-end']!;
    const deduplicated = deduplicateActionGraph(source.graph, source.entries);
    const result = extractActionGraphMiddleSegments(deduplicated.graph, deduplicated.entries);
    expect(result.graph).toBe(deduplicated.graph);
    expect(result.macros).toEqual({});
  });

  it('不同节点指向相同后续也不能包装成宏', () => {
    const source = fixture();
    source.graph.nodes.b7 = { ...source.graph.nodes.b7!, next: 'a-end' };
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    expect(result.graph).toBe(source.graph);
    expect(result.candidates).toContainEqual(
      expect.objectContaining({ reason: 'sameContinuation' }),
    );
  });

  it('终止尾段没有执行出口，不提取', () => {
    const source = fixture();
    source.graph.nodes.a7 = { ...source.graph.nodes.a7!, next: null };
    source.graph.nodes.b7 = { ...source.graph.nodes.b7!, next: null };
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    expect(result.graph).toBe(source.graph);
    expect(result.candidates).toContainEqual(
      expect.objectContaining({ reason: 'terminalSegment' }),
    );
  });

  it.each([fixture(7), fixture(8, ['only'])])('小段或单实例保持原图', source => {
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    expect(result.graph).toBe(source.graph);
    expect(result.macros).toEqual({});
  });

  it('黑板输入和动作身份参与精确匹配，不自动参数化', () => {
    for (const difference of ['input', 'key'] as const) {
      const source = fixture();
      const action = source.graph.nodes.b4!.action;
      if (action.kind !== 'modifyActionValue') throw new Error('unexpected fixture action');
      source.graph.nodes.b4 = {
        ...source.graph.nodes.b4!,
        action:
          difference === 'input'
            ? {
                ...action,
                parameters: { ...action.parameters, value: { kind: 'constant', value: 2 } },
              }
            : { ...action, key: 'different-action-identity' },
      };
      const result = extractActionGraphMiddleSegments(source.graph, source.entries);
      expect(result.graph).toBe(source.graph);
      expect(result.macros).toEqual({});
    }
  });

  it.each(['entry', 'branch'])('外部通过 %s 进入内部节点时，不能截走被引用的节点', mode => {
    const source = fixture();
    if (mode === 'entry') source.entries.push({ $sequence: 'a4' }, { $sequence: 'b4' });
    else {
      source.graph.nodes.root = {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'combatActive' } },
          whenTrue: { $sequence: 'a4' },
          whenFalse: { $sequence: 'b4' },
        },
        next: null,
      };
      source.entries.push({ $sequence: 'root' });
    }
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    expect(result.graph).toBe(source.graph);
    expect(result.macros).toEqual({});
  });

  const excludedActions: readonly ActionGraphStep[] = [
    { kind: 'once', parameters: {}, body: { $sequence: null } },
    {
      kind: 'withActionBlackboardScope',
      parameters: { initialValues: {}, inheritParent: true },
      body: { $sequence: null },
    },
    { kind: 'finishTimeline', parameters: {} },
    {
      kind: 'launchProjectile',
      parameters: { finish: 1, recycleDelaySeconds: 2 },
      callbacks: [
        {
          event: 'finish',
          skill: {
            skillId: 'callback',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 30,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 0,
              cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
            },
            scheduledSequences: [],
            actionGraph: { main: { nodes: {} }, macros: {} },
          },
        },
      ],
    },
    {
      kind: 'callResource',
      resource: {
        id: 'external',
        entry: { $sequence: null },
        actionGraph: { main: { nodes: {} }, macros: {} },
      },
    },
  ];
  it.each(excludedActions)('不能跨越 $kind 边界', action => {
    const source = fixture(9);
    for (const prefix of ['a', 'b'])
      source.graph.nodes[`${prefix}4`] = { ...source.graph.nodes[`${prefix}4`]!, action };
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    expect(result.graph).toBe(source.graph);
    expect(result.macros).toEqual({});
  });

  it('提取候选互相覆盖时，不重复计入节点收益', () => {
    const source = fixture(10);
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    const accepted = result.candidates.filter(candidate => candidate.status === 'accepted');
    expect(accepted).toHaveLength(1);
    expect(accepted[0]!.nodeCount).toBe(10);
    expect(result.candidates.some(candidate => candidate.reason === 'overlap')).toBe(true);
    expect(
      Object.keys(result.graph.nodes).length +
        Object.keys(result.macros.middle_1!.graph.nodes).length,
    ).toBe(Object.keys(source.graph.nodes).length - accepted[0]!.netNodeReduction);
  });

  it('字段插入顺序不影响匹配和确定性结果', () => {
    const source = fixture();
    for (let i = 0; i < 8; i++) {
      const node = source.graph.nodes[`b${i}`]!;
      if (node.action.kind !== 'modifyActionValue') throw new Error('unexpected fixture action');
      source.graph.nodes[`b${i}`] = {
        next: node.next,
        action: {
          parameters: {
            value: node.action.parameters.value,
            operation: node.action.parameters.operation,
            key: node.action.parameters.key,
          },
          key: node.action.key,
          kind: node.action.kind,
        },
      };
    }
    const first = extractActionGraphMiddleSegments(source.graph, source.entries);
    const second = extractActionGraphMiddleSegments(source.graph, source.entries);
    expect(first).toEqual(second);
    expect(Object.keys(first.macros)).toHaveLength(1);
  });

  it('字符串内的分隔符不能与数组的不同输入发生签名碰撞', () => {
    const source = fixture();
    for (const prefix of ['a', 'b']) {
      source.graph.nodes[`${prefix}4`] = {
        ...source.graph.nodes[`${prefix}4`]!,
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: prefix === 'a' ? ['x,string:y'] : ['x', 'y'] },
            desiredKey: 'input',
            outputKey: 'output',
          },
        },
      };
    }
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    expect(result.graph).toBe(source.graph);
    expect(result.macros).toEqual({});
  });

  it('节点身份映射抵消了体积收益时不提取', () => {
    const source = fixture();
    for (let index = 0; index < source.entries.length; index++) {
      const id = source.entries[index]!.$sequence!;
      const longId = `${id}-${'x'.repeat(4000)}`;
      source.graph.nodes[longId] = source.graph.nodes[id]!;
      delete source.graph.nodes[id];
      source.entries[index] = { $sequence: longId };
    }
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    expect(result.graph).toBe(source.graph);
    expect(result.candidates).toContainEqual(
      expect.objectContaining({ reason: 'insufficientByteSavings' }),
    );
    expect(result.macros).toEqual({});
  });

  it('重叠候选移除已占用位置后，剩余两个位置仍能提取，报告字节收益与实际一致', () => {
    const source = fixture(16, ['a', 'b', 'c', 'd']);
    for (const prefix of ['a', 'b', 'c', 'd']) {
      for (let index = 8; index < 16; index++) {
        const node = source.graph.nodes[`${prefix}${index}`]!;
        if (node.action.kind !== 'modifyActionValue') throw new Error('unexpected fixture action');
        const key =
          prefix === 'a' || prefix === 'b'
            ? `large-${'x'.repeat(500)}-${index}`
            : `${prefix}-${index}`;
        source.graph.nodes[`${prefix}${index}`] = { ...node, action: { ...node.action, key } };
      }
    }
    const result = extractActionGraphMiddleSegments(source.graph, source.entries);
    const accepted = result.candidates.filter(candidate => candidate.status === 'accepted');
    expect(accepted).toHaveLength(2);
    expect(accepted.map(candidate => candidate.starts)).toEqual([
      ['a0', 'b0'],
      ['c0', 'd0'],
    ]);
    expect(accepted.map(candidate => candidate.nodeCount)).toEqual([16, 8]);
    const actualSavings =
      Buffer.byteLength(JSON.stringify({ nodes: source.graph.nodes, macros: {} })) -
      Buffer.byteLength(JSON.stringify({ nodes: result.graph.nodes, macros: result.macros }));
    expect(accepted.reduce((sum, candidate) => sum + candidate.savedBytes, 0)).toBe(actualSavings);
    expect(actualSavings).toBeGreaterThan(0);
  });
});
