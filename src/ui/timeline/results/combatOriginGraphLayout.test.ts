import { expect, it } from 'vitest';
import { CombatReceiptCollector } from '../../../core/combat/receipt/combatReceipt';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import { layoutCombatOriginGraph } from './combatOriginGraphLayout';

it('合法 DAG 的分支和三条平行关系也必须能布局，不能只覆盖成环用例', () => {
  const c = new CombatReceiptCollector();
  const entity = { kind: 'abilityEntity' as const, instanceId: 1 };
  const owner = { kind: 'operator' as const, operatorId: 'owner' };
  c.record({
    event: 'AbilityEntitySpawned',
    frame: 0,
    time: 0,
    subject: entity,
    producedBy: owner,
    runtimeSource: owner,
    sourceId: 'owner',
  });
  c.record({
    event: 'DamageApplied',
    frame: 1,
    time: 1,
    producedBy: entity,
    runtimeSource: { kind: 'operator', operatorId: 'other' },
  });
  const graph = layoutCombatOriginGraph(new CombatObjectOrigins(c.entries), 1, 'all');
  expect(graph.nodes).toHaveLength(4);
  expect(graph.edges).toHaveLength(5);
  expect(graph.routes).toHaveLength(5);
  expect(new Set(graph.routes.map(route => route.path)).size).toBe(5);
  for (const edge of graph.edges)
    expect(graph.nodes[edge.from]!.x).toBeLessThan(graph.nodes[edge.to]!.x);
  for (const route of graph.routes) expect(route.path).not.toMatch(/NaN|Infinity/);
});

it.each(['buffChanges', 'all'] as const)(
  '%s：同帧 B 的早期来源不能跳到 A 被 B 后续增强的状态',
  filter => {
    const c = new CombatReceiptCollector();
    const first = { kind: 'buff' as const, ownerId: 'enemy', instanceId: 1 };
    const second = { ...first, instanceId: 2 };
    c.record({ event: 'BuffCreated', frame: 0, time: 0, subject: first });
    c.record({
      event: 'BuffApplied',
      frame: 0,
      time: 0,
      targetId: 'enemy',
      data: { instanceId: 1, layers: 1 },
    });
    c.record({ event: 'BuffCreated', frame: 0, time: 0, subject: second, producedBy: first });
    c.record({
      event: 'BuffApplied',
      frame: 0,
      time: 0,
      targetId: 'enemy',
      producedBy: first,
      data: { instanceId: 2, layers: 1 },
    });
    c.record({
      event: 'BuffStackChanged',
      frame: 0,
      time: 0,
      targetId: 'enemy',
      producedBy: second,
      data: { instanceId: 1, previousLayers: 1, layers: 2, delta: 1 },
    });
    c.record({ event: 'DamageApplied', frame: 0, time: 0, producedBy: first });
    const graph = layoutCombatOriginGraph(new CombatObjectOrigins(c.entries), 5, filter);
    const states = graph.nodes.map(node => node.object.fact?.sequence);
    expect(states).toEqual(expect.arrayContaining([1, 3, 4, 5]));
    // 同一实例的两个状态分别参与布局；被多条关系引用的早期状态仍只画一次。
    const firstStates = graph.nodes.filter(node => node.object.fact?.data?.instanceId === 1);
    expect(firstStates.map(node => node.object.fact?.sequence).sort((a, b) => a! - b!)).toEqual([
      1, 4,
    ]);
    expect(firstStates[0]!.object).not.toBe(firstStates[1]!.object);
    expect([firstStates[0]!.x, firstStates[0]!.y]).not.toEqual([
      firstStates[1]!.x,
      firstStates[1]!.y,
    ]);
    expect(graph.nodes.filter(node => node.object.fact?.sequence === 1)).toHaveLength(1);
    const bIndex = states.indexOf(3);
    expect(
      graph.edges.filter(edge => edge.from === bIndex).map(edge => states[edge.to]),
    ).not.toContain(4);
    const visit = (node: number, path = new Set<number>()) => {
      expect(path.has(node)).toBe(false);
      for (const edge of graph.edges.filter(edge => edge.from === node))
        visit(edge.to, new Set([...path, node]));
    };
    visit(0);
    expect(graph.routes).toHaveLength(graph.edges.length);
    expect(new Set(graph.routes.map(route => route.path)).size).toBe(graph.edges.length);
    for (const node of graph.nodes) {
      expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
    }
    for (const route of graph.routes) expect(route.path).not.toMatch(/NaN|Infinity/);
  },
);

it('同帧一层到二层到三层按回执串联，选中二层不含三层', () => {
  const c = new CombatReceiptCollector();
  const buff = { kind: 'buff' as const, ownerId: 'enemy', instanceId: 1 };
  c.record({ event: 'BuffCreated', frame: 0, time: 0, subject: buff });
  c.record({
    event: 'BuffApplied',
    frame: 0,
    time: 0,
    targetId: 'enemy',
    data: { instanceId: 1, buffId: 'attachment', layers: 1 },
  });
  for (const layers of [2, 3])
    c.record({
      event: 'BuffStackChanged',
      frame: 0,
      time: 0,
      targetId: 'enemy',
      sourceId: `source-${layers}`,
      data: { instanceId: 1, buffId: 'attachment', previousLayers: layers - 1, layers, delta: 1 },
    });
  const origins = new CombatObjectOrigins(c.entries);
  const graph = layoutCombatOriginGraph(origins, 3, 'buffChanges', 128, buff);
  const transitions = graph.edges
    .filter(edge => edge.relation === 'previousState')
    .map(edge => [
      graph.nodes[edge.from]!.object.fact!.data!.layers,
      graph.nodes[edge.to]!.object.fact!.data!.layers,
    ]);
  expect(transitions).toEqual([
    [3, 2],
    [2, 1],
  ]);
  const earlier = layoutCombatOriginGraph(origins, 2, 'buffChanges', 128, buff);
  expect(earlier.nodes[0]!.object.fact!.data!.layers).toBe(2);
  expect(earlier.nodes.some(node => node.object.fact?.sequence === 3)).toBe(false);
});

it('转化产物追溯被消耗附着和实际叠层，不展开截止后的增层', () => {
  const c = new CombatReceiptCollector();
  const attachment = { kind: 'buff' as const, ownerId: 'enemy', instanceId: 1 };
  const output = { ...attachment, instanceId: 2 };
  c.record({ event: 'BuffCreated', frame: 0, time: 0, subject: attachment });
  c.record({
    event: 'BuffStackChanged',
    frame: 1,
    time: 1,
    sourceId: 'provider',
    targetId: 'enemy',
    data: { instanceId: 1, previousLayers: 1, layers: 2, delta: 1 },
  });
  c.record({ event: 'BuffCreated', frame: 2, time: 2, subject: output });
  c.record({
    event: 'ElementalAttachmentConverted',
    frame: 2,
    time: 2,
    targetId: 'enemy',
    data: { consumedInstanceId: 1, outputInstanceId: 2, consumedLayers: 2 },
  });
  c.record({
    event: 'BuffStackChanged',
    frame: 3,
    time: 3,
    targetId: 'enemy',
    data: { instanceId: 2, previousLayers: 1, layers: 2, delta: 1 },
  });
  const origins = new CombatObjectOrigins(c.entries);
  const graph = layoutCombatOriginGraph(origins, 3, 'buffChanges', 128, output);
  expect(graph.edges.map(edge => edge.relation)).toEqual(
    expect.arrayContaining(['convertedBy', 'consumedBuff', 'previousState']),
  );
  expect(graph.nodes.map(node => node.object.ref)).toContainEqual(attachment);
  expect(
    graph.nodes.some(node => node.object.ref.kind === 'receipt' && node.object.ref.sequence === 4),
  ).toBe(false);
  expect(
    layoutCombatOriginGraph(origins, 2, 'buffChanges', 128, output).edges.some(
      edge => edge.relation === 'convertedBy',
    ),
  ).toBe(false);
});

it('从指定 Buff 实例开始追溯，不依赖命中或同名 Buff', () => {
  const c = new CombatReceiptCollector();
  const first = { kind: 'buff' as const, ownerId: 'enemy', instanceId: 1 };
  const second = { ...first, instanceId: 2 };
  c.record({
    event: 'BuffCreated',
    frame: 0,
    time: 0,
    subject: first,
    producedBy: { kind: 'action', ownerId: 'a', actionId: 'skill-a' },
    data: { buffId: 'same' },
  });
  c.record({
    event: 'BuffCreated',
    frame: 1,
    time: 1,
    subject: second,
    producedBy: { kind: 'action', ownerId: 'b', actionId: 'skill-b' },
    data: { buffId: 'same' },
  });
  const origins = new CombatObjectOrigins(c.entries);
  for (const [root, owner] of [
    [first, 'a'],
    [second, 'b'],
  ] as const) {
    const graph = layoutCombatOriginGraph(origins, 1, 'buffChanges', 128, root);
    expect(graph.nodes[0]!.object.ref).toEqual(root);
    expect(graph.nodes.filter(node => node.object.ref.kind === 'buff')).toHaveLength(1);
    expect(
      graph.nodes.filter(node => node.object.ref.kind === 'operator').map(node => node.object.ref),
    ).toEqual([{ kind: 'operator', operatorId: owner }]);
  }
});

it('将同实例的修正收进 Buff 节点，同名不同实例保持独立且不丢失提供者', () => {
  const c = new CombatReceiptCollector();
  const buffs = [1, 2].map(instanceId => ({ kind: 'buff' as const, ownerId: 'enemy', instanceId }));
  for (const subject of buffs)
    c.record({ event: 'BuffCreated', frame: 0, time: 0, subject, data: { buffId: 'same' } });
  c.record({
    event: 'DamageApplied',
    frame: 1,
    time: 1,
    appliedDamageModifiers: [buffs[0]!, buffs[0]!, buffs[1]!].map(buff => ({
      kind: 'damageScale',
      buff,
      buffId: 'same',
      sourceId: 'support',
      sourceActionId: 'skill',
      side: 'attacker',
      zone: 'normal',
      addition: 0.2,
    })),
  });
  for (const filter of ['buffChanges', 'all', 'modifiedBy'] as const) {
    const graph = layoutCombatOriginGraph(new CombatObjectOrigins(c.entries), 2, filter);
    expect(graph.nodes.some(node => node.object.ref.kind === 'modifier')).toBe(false);
    const buffNodes = graph.nodes.filter(node => node.object.ref.kind === 'buff');
    expect(buffNodes.map(node => node.modifiers.length)).toEqual([2, 1]);
    expect(
      graph.edges.filter(edge => edge.from === 0 && edge.relation === 'modifiedBy'),
    ).toHaveLength(2);
    expect(graph.edges.filter(edge => edge.relation === 'providedBy')).toHaveLength(2);
    expect(
      graph.nodes.some(
        node => node.object.ref.kind === 'operator' && node.object.ref.operatorId === 'support',
      ),
    ).toBe(true);
  }
});

it('includes actual modifiers and their operator in the default graph without treating them as producers', () => {
  const c = new CombatReceiptCollector();
  c.record({
    event: 'DamageApplied',
    frame: 0,
    time: 0,
    producedBy: { kind: 'action', ownerId: 'attacker', actionId: 'attack' },
    appliedDamageModifiers: [
      {
        kind: 'damageScale',
        buffId: 'support-buff',
        sourceId: 'support',
        sourceActionId: 'support-skill',
        side: 'attacker',
        zone: 'normal',
        addition: 0.2,
      },
    ],
  });
  const origins = new CombatObjectOrigins(c.entries);
  const graph = layoutCombatOriginGraph(origins, 0, 'buffChanges');
  expect(graph.edges.map(edge => edge.relation)).toEqual(
    expect.arrayContaining(['producedBy', 'modifiedBy', 'providedBy', 'ownedBy']),
  );
  expect(graph.nodes.map(node => node.object.ref)).toContainEqual({
    kind: 'operator',
    operatorId: 'support',
  });
  const production = layoutCombatOriginGraph(origins, 0, 'producedBy');
  expect(production.nodes.some(node => node.object.ref.kind === 'modifier')).toBe(false);
  expect(production.nodes.map(node => node.object.ref)).not.toContainEqual({
    kind: 'operator',
    operatorId: 'support',
  });
});

it('does not expand downstream events from an upstream cast or Buff, even in all-relations mode', () => {
  const c = new CombatReceiptCollector();
  const action = { kind: 'action' as const, ownerId: 'operator-a', actionId: 'cast' };
  const buff = { kind: 'buff' as const, ownerId: 'enemy', instanceId: 1 };
  c.record({
    event: 'SkillStarted',
    frame: 0,
    time: 0,
    sourceId: 'operator-a',
    data: { castId: 'cast' },
  });
  c.record({ event: 'BuffCreated', frame: 0, time: 0, subject: buff, producedBy: action });
  c.record({
    event: 'BuffConsumed',
    frame: 0,
    time: 0,
    targetId: 'enemy',
    data: { instanceId: 1, layers: 3, castId: 'cast' },
  });
  c.record({ event: 'DamageApplied', frame: 0, time: 0, producedBy: buff });
  for (const filter of ['buffChanges', 'all'] as const) {
    const graph = layoutCombatOriginGraph(new CombatObjectOrigins(c.entries), 3, filter);
    expect(graph.nodes.filter(node => node.object.fact?.event === 'BuffConsumed')).toHaveLength(0);
    expect(graph.edges.some(edge => ['castEvent', 'buffEvent'].includes(edge.relation))).toBe(
      false,
    );
    expect(graph.nodes.map(node => node.object.ref)).toContainEqual(action);
    for (const edge of graph.edges) {
      expect(graph.nodes[edge.to]!.x).toBeGreaterThan(graph.nodes[edge.from]!.x);
    }
  }
});

it('共用上游对象保留多种关系，但自身引用不画成来源环', () => {
  const c = new CombatReceiptCollector();
  const entity = { kind: 'abilityEntity' as const, instanceId: 1 };
  c.record({
    event: 'AbilityEntitySpawned',
    frame: 0,
    time: 0,
    subject: entity,
    producedBy: entity,
  });
  c.record({
    event: 'DamageApplied',
    frame: 1,
    time: 1,
    producedBy: entity,
    runtimeSource: entity,
  });
  const graph = layoutCombatOriginGraph(new CombatObjectOrigins(c.entries), 1, 'all');
  expect(graph.nodes).toHaveLength(2);
  expect(graph.edges).toEqual([
    { from: 0, to: 1, relation: 'producedBy' },
    { from: 0, to: 1, relation: 'runtimeSource' },
  ]);
  expect(graph.nodes[1]!.x).toBeGreaterThan(graph.nodes[0]!.x);
});

it('ends an action chain at its actual owner without mixing modifier provenance', () => {
  const c = new CombatReceiptCollector();
  c.record({
    event: 'DamageApplied',
    frame: 0,
    time: 0,
    producedBy: { kind: 'action', ownerId: 'operator-a', actionId: 'skill' },
    runtimeSource: { kind: 'operator', operatorId: 'operator-b' },
  });
  const origins = new CombatObjectOrigins(c.entries);
  const graph = layoutCombatOriginGraph(origins, 0, 'producedBy');
  expect(graph.nodes.map(n => n.object.ref)).toEqual([
    { kind: 'receipt', sequence: 0 },
    { kind: 'action', ownerId: 'operator-a', actionId: 'skill' },
    { kind: 'operator', operatorId: 'operator-a' },
  ]);
  expect(graph.edges.map(e => e.relation)).toEqual(['producedBy', 'ownedBy']);
  expect(layoutCombatOriginGraph(origins, 0, 'producedBy', 2).limited).toBe(true);
});

it('does not expand a future birth when inspecting an earlier hit', () => {
  const c = new CombatReceiptCollector();
  const entity = { kind: 'abilityEntity' as const, instanceId: 1 };
  c.record({ event: 'DamageApplied', frame: 0, time: 0, producedBy: entity });
  c.record({
    event: 'AbilityEntitySpawned',
    frame: 0,
    time: 0,
    subject: entity,
    producedBy: { kind: 'action', ownerId: 'later', actionId: 'later' },
  });
  const graph = layoutCombatOriginGraph(new CombatObjectOrigins(c.entries), 0, 'all');
  expect(graph.nodes).toHaveLength(2);
  expect(graph.edges).toHaveLength(1);
});

it('places shared sources after their longest dependency path and separates parallel routes', () => {
  const c = new CombatReceiptCollector();
  const entity = { kind: 'abilityEntity' as const, instanceId: 1 };
  const owner = { kind: 'operator' as const, operatorId: 'owner' };
  c.record({
    event: 'AbilityEntitySpawned',
    frame: 0,
    time: 0,
    subject: entity,
    producedBy: owner,
  });
  c.record({ event: 'DamageApplied', frame: 1, time: 1, producedBy: entity, runtimeSource: owner });
  const graph = layoutCombatOriginGraph(new CombatObjectOrigins(c.entries), 1, 'all');
  for (const edge of graph.edges) {
    expect(graph.nodes[edge.to]!.x).toBeGreaterThan(graph.nodes[edge.from]!.x);
  }
  expect(new Set(graph.routes.map(route => route.path)).size).toBe(graph.edges.length);
  for (const node of graph.nodes) {
    expect(node.y).toBeGreaterThanOrEqual(0);
    expect(node.y + 88).toBeLessThanOrEqual(graph.height);
  }
});
