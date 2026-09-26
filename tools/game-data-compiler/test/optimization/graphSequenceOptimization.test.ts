import { describe, expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';
import type { CombatCondition } from '../../../../packages/game-data-contract/src/conditions.ts';
import { optimizeActionGraphDefinition } from '../../src/compiler/optimization/graphSequenceOptimization.ts';

const literal = (value: number) => ({ kind: 'constant' as const, value });
const constant = (value: boolean): CombatCondition => ({ kind: 'constant', value });
const assign = (key: string, value: number): ActionGraphStep => ({
  kind: 'modifyActionValue',
  parameters: { key, operation: 'assign', value: literal(value) },
});
const damage = (key?: string): ActionGraphStep => ({
  ...(key === undefined ? {} : { key }),
  kind: 'dealDamage',
  parameters: { damageType: 'physical', attackScale: literal(1), tags: [] },
});
const guard = (
  condition: CombatCondition,
  whenTrue: ActionGraphReference,
  whenFalse?: ActionGraphReference,
): ActionGraphStep => ({
  kind: 'conditional',
  parameters: { condition },
  whenTrue,
  ...(whenFalse === undefined ? {} : { whenFalse }),
});

/** 手工节点表夹具：chain 按顺序链接动作，id 形如 `${kind}_N`；node 支持共享/成环等原始接线。 */
function fixture() {
  const nodes: Record<string, ActionGraphNode> = {};
  let counter = 0;
  const chain = (...actions: ActionGraphStep[]): ActionGraphReference => {
    let next: string | null = null;
    for (const action of [...actions].reverse()) {
      const id = `${action.kind}_${++counter}`;
      nodes[id] = { action, next };
      next = id;
    }
    return { $sequence: next };
  };
  const node = (id: string, action: ActionGraphStep, next: string | null) => {
    nodes[id] = { action, next };
  };
  return { nodes, chain, node };
}

function optimize(graph: ActionGraphDefinition, entry: ActionGraphReference) {
  return optimizeActionGraphDefinition(graph, entry, { mode: 'apply', definitionId: 'fixture' });
}

describe('图侧序列优化', () => {
  it('报告模式保持原对象，关闭模式不报告改动，应用保留节点 key 且不修改输入', () => {
    const f = fixture();
    const whenTrue = f.chain(damage('original/steps/1'));
    const entry = f.chain(
      guard(
        { kind: 'actionValueCompare', left: literal(1), operator: 'equal', right: literal(1) },
        whenTrue,
      ),
    );
    const graph: ActionGraphDefinition = { nodes: f.nodes };
    const before = structuredClone(f.nodes);

    const reported = optimizeActionGraphDefinition(graph, entry, {
      mode: 'report',
      definitionId: 'fixture',
    });
    expect(reported.graph).toBe(graph);
    expect(reported.entry).toBe(entry);
    expect(reported.report.before).toEqual({ steps: 2, conditions: 1 });
    expect(reported.report.after).toEqual({ steps: 1, conditions: 0 });
    expect(reported.report.changes.map(change => change.rule)).toEqual([
      'constant-condition',
      'true-guard',
    ]);
    expect(reported.report.changes.map(change => change.path)).toEqual([
      'entry[0]→conditional_2.parameters.condition',
      'entry[0]→conditional_2',
    ]);

    const applied = optimize(graph, entry);
    expect(applied.entry.$sequence).toBe(whenTrue.$sequence);
    expect(Object.keys(applied.graph.nodes)).toEqual([whenTrue.$sequence]);
    expect(applied.graph.nodes[whenTrue.$sequence!]).toBe(f.nodes[whenTrue.$sequence!]!);
    expect(applied.graph.nodes[whenTrue.$sequence!]!.action).toMatchObject({
      kind: 'dealDamage',
      key: 'original/steps/1',
    });
    expect(f.nodes).toEqual(before);
    expect(optimize(applied.graph, applied.entry).report.changes).toEqual([]);
    expect(
      optimizeActionGraphDefinition(graph, entry, { mode: 'off', definitionId: 'fixture' }).report
        .changes,
    ).toEqual([]);
  });

  it('短路之前的随机抽样保留，之后的条件从不会求值', () => {
    const f = fixture();
    const condition: CombatCondition = {
      kind: 'all',
      conditions: [
        { kind: 'probability', probability: literal(1) },
        constant(false),
        {
          kind: 'actionValueCompare',
          left: { kind: 'blackboard', key: 'missing' },
          operator: 'equal',
          right: literal(0),
        },
      ],
    };
    const entry = f.chain(guard(condition, f.chain(assign('never', 1))));
    const result = optimize({ nodes: f.nodes }, entry);

    expect(result.report.changes.map(change => change.rule)).toEqual(['short-circuit-condition']);
    const head = result.graph.nodes[result.entry.$sequence!]!;
    expect(head.action.kind).toBe('conditional');
    const conditional = head.action as Extract<ActionGraphStep, { kind: 'conditional' }>;
    expect(conditional.parameters.condition).toEqual({
      kind: 'all',
      conditions: [{ kind: 'probability', probability: literal(1) }, constant(false)],
    });
    // 化简结果不是恒值，whenTrue 链原样保留。
    expect(conditional.whenTrue).toEqual({ $sequence: 'modifyActionValue_1' });
    expect(conditional.whenFalse).toBeUndefined();
  });

  it('保留空恒真守卫的已执行状态，不能改为空序列', () => {
    const f = fixture();
    const entry = f.chain(guard(constant(true), { $sequence: null }));
    const graph: ActionGraphDefinition = { nodes: f.nodes };
    const result = optimize(graph, entry);
    expect(result.graph).toBe(graph);
    expect(result.entry).toBe(entry);
    expect(result.report.retained).toEqual([
      {
        definitionId: 'fixture',
        path: 'entry[0]→conditional_1',
        reason: 'sequence-lifetime',
      },
    ]);
  });

  it('alwaysNext 的恒真条件清空未达分支引用，但保留 else 字段存在性', () => {
    const f = fixture();
    const innerWhenTrue = f.chain(assign('never', 1));
    const whenTrue = f.chain(guard(constant(false), innerWhenTrue));
    const whenFalse = f.chain(assign('unused', 1));
    const conditional: ActionGraphStep = {
      kind: 'conditional',
      parameters: { condition: constant(true), alwaysNext: true },
      whenTrue,
      whenFalse,
    };
    const after = assign('after', 2);
    const entry = f.chain(conditional, after);
    const result = optimize({ nodes: f.nodes }, entry);

    expect(
      result.report.changes.filter(change => change.rule === 'unreachable-branch'),
    ).toHaveLength(2);
    const ids = Object.keys(result.graph.nodes);
    expect(ids).toHaveLength(3);
    // 两个分支内的赋值节点都被剔除。
    expect(ids).not.toContain(innerWhenTrue.$sequence);
    expect(ids).not.toContain(whenFalse.$sequence);
    const head = result.graph.nodes[result.entry.$sequence!]!;
    const applied = head.action as Extract<ActionGraphStep, { kind: 'conditional' }>;
    expect(applied.kind).toBe('conditional');
    expect(applied.parameters.alwaysNext).toBe(true);
    // whenFalse 字段仍在，只是引用被清空。
    expect(applied.whenFalse).toEqual({ $sequence: null });
    const appliedBody = result.graph.nodes[applied.whenTrue.$sequence!]!.action as Extract<
      ActionGraphStep,
      { kind: 'conditional' }
    >;
    expect(appliedBody.whenTrue).toEqual({ $sequence: null });
    // 后续节点保留原 id。
    expect(head.next).not.toBeNull();
    expect(result.graph.nodes[head.next!]!.action).toBe(after);
  });

  it('未执行分支的伤害准备和具名步骤保留', () => {
    for (const step of [
      {
        key: 'linked-step',
        kind: 'modifyActionValue',
        parameters: { key: 'value', operation: 'assign', value: literal(3) },
      } as ActionGraphStep,
      {
        kind: 'dealDamage' as const,
        parameters: {
          damageType: 'physical' as const,
          attackScale: { kind: 'blackboard' as const, key: 'snapshot' },
          takeAttackSnapshot: true,
          tags: [],
        },
      } as ActionGraphStep,
    ]) {
      const f = fixture();
      const entry = f.chain(guard(constant(false), f.chain(step)));
      const graph: ActionGraphDefinition = { nodes: f.nodes };
      const result = optimize(graph, entry);
      expect(result.graph).toBe(graph);
      expect(result.entry).toBe(entry);
      expect(result.report.retained[0]?.reason).toBe('preparation-or-identity');
    }
  });

  it('递归合并仅自动伤害身份不同的纯查询分支', () => {
    const f = fixture();
    const body = (branch: 'whenTrue' | 'whenFalse'): ActionGraphReference =>
      f.chain(
        { kind: 'applyElementalInfliction', parameters: { element: 'heat', isExtra: false } },
        {
          key: `fixture:/scheduledSequences/0/sequence/steps/0/${branch}/steps/1`,
          kind: 'dealDamage',
          parameters: { damageType: 'heat', attackScale: literal(3), tags: ['ultimateSkill'] },
        },
        assign('hits', 1),
      );
    const outerWhenTrue = body('whenTrue');
    const innerWhenTrue = body('whenTrue');
    const innerWhenFalse = body('whenFalse');
    const inner: ActionGraphStep = {
      kind: 'conditional',
      parameters: {
        condition: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['bleed'],
          operator: 'greaterOrEqual',
          value: literal(1),
        },
        alwaysNext: true,
      },
      whenTrue: innerWhenTrue,
      whenFalse: innerWhenFalse,
    };
    const outerWhenFalse = f.chain(inner);
    const entry = f.chain({
      kind: 'conditional',
      parameters: {
        condition: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Status/Immobilized/Frozen'],
        },
        alwaysNext: true,
      },
      whenTrue: outerWhenTrue,
      whenFalse: outerWhenFalse,
    });
    const result = optimize({ nodes: f.nodes }, entry);

    expect(
      result.report.changes.filter(change => change.rule === 'equivalent-branches'),
    ).toHaveLength(2);
    // 合并后 conditional 节点被公共链替代，链上是附着、伤害、赋值三个动作。
    let cursor: string | null = result.entry.$sequence;
    const kinds: string[] = [];
    while (cursor !== null) {
      const node: ActionGraphNode = result.graph.nodes[cursor]!;
      kinds.push(node.action.kind);
      cursor = node.next;
    }
    expect(kinds).toEqual(['applyElementalInfliction', 'dealDamage', 'modifyActionValue']);
    const damageNode = Object.values(result.graph.nodes).find(
      node => node.action.kind === 'dealDamage',
    )!;
    expect(damageNode.action).toMatchObject({
      key: 'fixture:/scheduledSequences/0/sequence/steps/0/whenFalse/steps/1',
    });
  });

  it('不把显式伤害身份、随机条件或可能短路的 alwaysNext 分支误合并', () => {
    const buffCondition: CombatCondition = {
      kind: 'buffIdStackCompare',
      target: 'enemy',
      buffIds: ['bleed'],
      operator: 'greaterOrEqual',
      value: literal(1),
    };
    const stopping = fixture();
    const stoppingEntry = stopping.chain({
      kind: 'conditional',
      parameters: { condition: buffCondition, alwaysNext: true },
      whenTrue: stopping.chain(guard(constant(false), stopping.chain(assign('never', 1)))),
      whenFalse: stopping.chain(guard(constant(false), stopping.chain(assign('never', 1)))),
    });
    const stoppingResult = optimize({ nodes: stopping.nodes }, stoppingEntry);
    const stoppingHead = stoppingResult.graph.nodes[stoppingResult.entry.$sequence!]!.action;
    expect(stoppingHead.kind).toBe('conditional');

    for (const build of [
      (f: ReturnType<typeof fixture>) =>
        f.chain({
          kind: 'conditional',
          parameters: { condition: buffCondition },
          whenTrue: f.chain(damage('explicit-true')),
          whenFalse: f.chain(damage('explicit-false')),
        }),
      (f: ReturnType<typeof fixture>) =>
        f.chain({
          kind: 'conditional',
          parameters: { condition: { kind: 'probability', probability: literal(0.5) } },
          whenTrue: f.chain(assign('same', 1)),
          whenFalse: f.chain(assign('same', 1)),
        }),
      (f: ReturnType<typeof fixture>) =>
        f.chain({
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'required' },
              operator: 'greaterOrEqual',
              right: literal(1),
            },
          },
          whenTrue: f.chain(assign('same', 1)),
          whenFalse: f.chain(assign('same', 1)),
        }),
    ]) {
      const f = fixture();
      const entry = build(f);
      const graph: ActionGraphDefinition = { nodes: f.nodes };
      const result = optimize(graph, entry);
      expect(result.graph).toBe(graph);
      expect(result.entry).toBe(entry);
    }
  });

  it.each([false, true])('switch 的所有候选等价时合并为一次候选匹配，alwaysNext=%s', alwaysNext => {
    const f = fixture();
    const common = (option: number): ActionGraphReference =>
      f.chain(
        {
          key: `fixture:/scheduledSequences/0/sequence/steps/0/options[${option}]/sequence/steps/0`,
          kind: 'dealDamage',
          parameters: { damageType: 'physical', attackScale: literal(1), tags: [] },
        },
        assign('hit', 1),
      );
    const entry = f.chain(
      {
        kind: 'switch',
        parameters: { choice: { kind: 'blackboard', key: 'choice' }, alwaysNext },
        options: [0, 1, 2].map(value => ({ value: literal(value), sequence: common(value) })),
      },
      assign('after', 2),
    );
    const result = optimize({ nodes: f.nodes }, entry);

    expect(
      result.report.changes.filter(change => change.rule === 'equivalent-branches'),
    ).toHaveLength(1);
    const head = result.graph.nodes[result.entry.$sequence!]!.action as Extract<
      ActionGraphStep,
      { kind: 'conditional' }
    >;
    expect(head.kind).toBe('conditional');
    expect(head.parameters.alwaysNext).toBe(alwaysNext ? true : undefined);
    expect(head.parameters.condition).toMatchObject({ kind: 'any' });
    expect(head.whenFalse).toBeUndefined();
    // 公共链保留原选项节点 id（interning 复用），伤害 key 取字典序最小的 options[0]。
    const bodyHead = result.graph.nodes[head.whenTrue.$sequence!]!;
    expect(bodyHead.action).toMatchObject({
      kind: 'dealDamage',
      key: 'fixture:/scheduledSequences/0/sequence/steps/0/options[0]/sequence/steps/0',
    });
    expect(result.graph.nodes[bodyHead.next!]!.action).toMatchObject({
      kind: 'modifyActionValue',
    });
  });

  it('有具名身份或候选效果不同时不合并 switch', () => {
    const named = fixture();
    const namedSwitch: ActionGraphStep = {
      key: 'named-switch',
      kind: 'switch',
      parameters: { choice: literal(0), alwaysNext: false },
      options: [0, 1].map(value => ({
        value: literal(value),
        sequence: named.chain(assign('x', 1)),
      })),
    };
    const namedEntry = named.chain(namedSwitch);
    const namedGraph: ActionGraphDefinition = { nodes: named.nodes };
    const namedResult = optimize(namedGraph, namedEntry);
    expect(namedResult.graph).toBe(namedGraph);
    expect(namedGraph.nodes[namedEntry.$sequence!]!.action).toBe(namedSwitch);

    const different = fixture();
    const differentEntry = different.chain({
      kind: 'switch',
      parameters: { choice: literal(0), alwaysNext: false },
      options: [0, 1].map(value => ({
        value: literal(value),
        sequence: different.chain(assign('x', value)),
      })),
    });
    const differentGraph: ActionGraphDefinition = { nodes: different.nodes };
    const differentResult = optimize(differentGraph, differentEntry);
    expect(differentResult.graph).toBe(differentGraph);
    expect(differentResult.entry).toBe(differentEntry);
  });

  it('递归处理 once body、listenForCombatEvents 响应与 jumpTimeline 条件', () => {
    const f = fixture();
    const onceBody = f.chain(guard(constant(true), f.chain(assign('inner', 1))));
    const responseSequence = f.chain(guard(constant(true), f.chain(assign('response', 1))));
    const entry = f.chain(
      { kind: 'once', parameters: {}, body: onceBody },
      {
        kind: 'listenForCombatEvents',
        parameters: {
          responses: [
            {
              key: 'onHit',
              event: { kind: 'operatorHit' },
              condition: {
                kind: 'actionValueCompare',
                left: literal(2),
                operator: 'greater',
                right: literal(1),
              },
              sequence: responseSequence,
            },
          ],
        },
      },
      {
        kind: 'jumpTimeline',
        parameters: {
          destinationFrame: 30,
          condition: {
            kind: 'actionValueCompare',
            left: literal(1),
            operator: 'notEqual',
            right: literal(1),
          },
        },
      },
    );
    const result = optimize({ nodes: f.nodes }, entry);
    const paths = result.report.changes.map(change => `${change.rule}@${change.path}`);
    expect(paths).toEqual([
      'true-guard@entry[0]→once_7.body→conditional_2',
      'true-guard@entry[0]→listenForCombatEvents_6.parameters.responses[0].sequence→conditional_4',
      'constant-condition@entry[0]→listenForCombatEvents_6.parameters.responses[0].condition',
      'constant-condition@entry[0]→jumpTimeline_5.parameters.condition',
    ]);
    const once = result.graph.nodes[result.entry.$sequence!]!.action as Extract<
      ActionGraphStep,
      { kind: 'once' }
    >;
    // true-guard 内联后 once body 直接指向原赋值节点。
    expect(once.body).toEqual({ $sequence: 'modifyActionValue_1' });
    const listener = result.graph.nodes[result.graph.nodes[result.entry.$sequence!]!.next!]!
      .action as Extract<ActionGraphStep, { kind: 'listenForCombatEvents' }>;
    expect(listener.parameters.responses[0]!.condition).toEqual(constant(true));
  });

  it('true-guard 内联共享尾部节点时 copy-on-write，原引用方不受影响', () => {
    const f = fixture();
    // tail 同时是守卫 A 内联链的尾部和守卫 B 的 whenTrue。
    f.node('tail', assign('shared', 1), null);
    f.node('damageA', damage(), 'tail');
    const tagCondition: CombatCondition = {
      kind: 'entityTagMatch',
      target: 'enemy',
      tagQueryType: 'hasAny',
      tags: ['Status/Immobilized/Frozen'],
    };
    const guardB = guard(tagCondition, { $sequence: 'tail' });
    f.node('guardB', guardB, 'after');
    f.node('guardA', guard(constant(true), { $sequence: 'damageA' }), 'guardB');
    f.node('after', assign('after', 2), null);
    const graph: ActionGraphDefinition = { nodes: f.nodes };
    const result = optimize(graph, { $sequence: 'guardA' });

    expect(result.report.changes.map(change => change.rule)).toEqual(['true-guard']);
    // 原尾部节点保留且接线不变，守卫 B 仍引用它。
    expect(result.graph.nodes.tail).toBe(f.nodes.tail!);
    expect(result.graph.nodes.tail!.next).toBeNull();
    expect(result.graph.nodes.guardB).toBe(f.nodes.guardB!);
    // 内联副本的尾部接到守卫 B，是新建节点而不是改写原 tail。
    const head = result.graph.nodes[result.entry.$sequence!]!;
    const inlinedTail = result.graph.nodes[head.next!]!;
    expect(inlinedTail).not.toBe(f.nodes.tail!);
    expect(inlinedTail.action).toBe(f.nodes.tail!.action);
    expect(inlinedTail.next).toBe('guardB');
    // damageA 原节点已无引用方，被剔除；内联副本是新建节点。
    expect(result.graph.nodes.damageA).toBeUndefined();
    expect(head.action).toBe(f.nodes.damageA!.action);
  });

  it('next 成环或嵌套引用成环时不死循环并保守保留', () => {
    const f = fixture();
    f.node('loop', assign('value', 1), 'loop');
    const cyclicGraph: ActionGraphDefinition = { nodes: { ...f.nodes } };
    const cyclicEntry = { $sequence: 'loop' };
    const cyclicResult = optimize(cyclicGraph, cyclicEntry);
    expect(cyclicResult.graph).toBe(cyclicGraph);
    expect(cyclicResult.entry).toBe(cyclicEntry);

    const g = fixture();
    const tagCondition: CombatCondition = {
      kind: 'entityTagMatch',
      target: 'enemy',
      tagQueryType: 'hasAny',
      tags: ['Status/Immobilized/Frozen'],
    };
    g.node('c1', guard(tagCondition, { $sequence: 'c2' }), null);
    g.node('c2', guard(tagCondition, { $sequence: 'c1' }), null);
    const nestedGraph: ActionGraphDefinition = { nodes: { ...g.nodes } };
    const nestedResult = optimize(nestedGraph, { $sequence: 'c1' });
    expect(nestedResult.graph).toBe(nestedGraph);
  });

  it('未被任何入口或引用到达的节点从新 nodes 表剔除，报告模式保留', () => {
    const f = fixture();
    f.node('orphan', assign('orphan', 9), null);
    const entry = f.chain(assign('kept', 1));
    const graph: ActionGraphDefinition = { nodes: f.nodes };

    const applied = optimize(graph, entry);
    // 无结构改动时图原样返回，孤儿节点属于既有图内容，不在本步清理。
    expect(applied.graph).toBe(graph);

    const guarded = fixture();
    guarded.node('orphan', assign('orphan', 9), null);
    const guardedEntry = guarded.chain(guard(constant(true), guarded.chain(assign('kept', 1))));
    const guardedGraph: ActionGraphDefinition = { nodes: guarded.nodes };
    const rewritten = optimize(guardedGraph, guardedEntry);
    expect(Object.keys(rewritten.graph.nodes)).not.toContain('orphan');
    const reported = optimizeActionGraphDefinition(guardedGraph, guardedEntry, {
      mode: 'report',
      definitionId: 'fixture',
    });
    expect(reported.graph).toBe(guardedGraph);
  });

  it('usage 报告沿图遍历汇总读写并保持输出结构', () => {
    const f = fixture();
    const entry = f.chain(assign('value', 2), assign('value', 3));
    const result = optimize({ nodes: f.nodes }, entry);
    expect(result.report.usage).toEqual({
      reads: ['value'],
      writes: ['value'],
      externalReads: [],
      unknownAccess: false,
    });
    expect(result.report.before).toEqual({ steps: 2, conditions: 0 });
    expect(result.report.after).toEqual({ steps: 2, conditions: 0 });
  });
});
