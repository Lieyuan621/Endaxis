/** 合并同一张图内完全相同的分支；只共享定义，不创建宏或跨资源共享节点。 */
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphReference,
} from '../../../../../packages/game-data-contract/src/actionGraph.ts';

export function deduplicateActionGraph(
  graph: ActionGraphDefinition,
  entries: readonly ActionGraphReference[],
): { graph: ActionGraphDefinition; entries: readonly ActionGraphReference[] } {
  const canonical = new Map<string, string>();
  const signatures = new Map<string, string>();
  const nodes: Record<string, ActionGraphNode> = {};
  const active = new Set<string>();

  // 外部资源是独立单元，不改写其内部引用；调用比较保留资源 id 和完整定义。
  function mapReferences(value: unknown, map: (id: string) => string): unknown {
    if (!value || typeof value !== 'object' || 'actionGraph' in value) return value;
    if ('$sequence' in value && Object.keys(value).length === 1) {
      const id = (value as ActionGraphReference).$sequence;
      const next = id === null ? null : map(id);
      return next === id ? value : { $sequence: next };
    }
    if (Array.isArray(value)) {
      const items = value.map(item => mapReferences(item, map));
      return items.every((item, i) => item === value[i]) ? value : items;
    }
    const fields = Object.entries(value).map(
      ([key, item]) => [key, key === 'nodeBindings' ? item : mapReferences(item, map)] as const,
    );
    return fields.every(([key, item]) => (value as Record<string, unknown>)[key] === item)
      ? value
      : Object.fromEntries(fields);
  }

  function signature(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(signature).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => `${JSON.stringify(key)}:${signature(item)}`)
        .join(',')}}`;
    }
    return `${typeof value}:${typeof value === 'number' && Object.is(value, -0) ? '-0' : (JSON.stringify(value) ?? String(value))}${typeof value === 'number' && !Number.isFinite(value) ? String(value) : ''}`;
  }

  // 显式栈按子节点在前的顺序处理，长链不占用 JavaScript 调用栈。
  for (const entry of entries) {
    if (entry.$sequence === null) continue;
    const stack = [{ id: entry.$sequence, ready: false }];
    while (stack.length) {
      const frame = stack.pop()!;
      if (canonical.has(frame.id)) continue;
      const source = graph.nodes[frame.id];
      if (!source) throw new Error(`missing graph node: ${frame.id}`);
      if (!frame.ready) {
        if (active.has(frame.id)) throw new Error(`cyclic graph node: ${frame.id}`);
        active.add(frame.id);
        stack.push({ id: frame.id, ready: true });
        const dependencies = new Set<string>();
        if (source.next !== null) dependencies.add(source.next);
        mapReferences(source.action, id => {
          dependencies.add(id);
          return id;
        });
        for (const id of dependencies) stack.push({ id, ready: false });
        continue;
      }
      active.delete(frame.id);
      const action = mapReferences(source.action, id =>
        canonical.get(id)!,
      ) as ActionGraphNode['action'];
      const next = source.next === null ? null : canonical.get(source.next)!;
      const node = action === source.action && next === source.next ? source : { action, next };
      const key = signature(node);
      const existing = signatures.get(key);
      canonical.set(frame.id, existing ?? frame.id);
      if (existing === undefined) {
        signatures.set(key, frame.id);
        nodes[frame.id] = node;
      }
    }
  }
  const rewritten = entries.map(entry => {
    const id = entry.$sequence === null ? null : canonical.get(entry.$sequence)!;
    return id === entry.$sequence ? entry : { $sequence: id };
  });
  const unchanged =
    Object.keys(nodes).length === Object.keys(graph.nodes).length &&
    Object.entries(nodes).every(([id, node]) => graph.nodes[id] === node);
  return {
    graph: unchanged ? graph : { nodes },
    entries: rewritten.every((entry, i) => entry === entries[i]) ? entries : rewritten,
  };
}
