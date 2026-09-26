/** 数据连接的绑定与校验。只绑定表达式定义，不读取战斗状态，也不缓存求值结果。 */
import type {
  ActionGraphDefinition,
  ActionGraphDataNode,
} from '../../../packages/game-data-contract/src/actionGraph.ts';

export function createGraphDataResolver(graph: ActionGraphDefinition) {
  const resolved = new Map<string, unknown>();
  const visiting = new Set<string>();
  function node(id: string, type: ActionGraphDataNode['type']): unknown {
    if (!graph.dataNodes || !Object.hasOwn(graph.dataNodes, id))
      throw new Error(`missing ${type} data node: ${id}`);
    const definition = graph.dataNodes[id]!;
    if (definition.type !== type)
      throw new Error(`data node ${id}: expected ${type}, got ${definition.type}`);
    if (resolved.has(id)) return resolved.get(id);
    if (visiting.has(id)) throw new Error(`recursive data graph: ${id}`);
    visiting.add(id);
    const result = bind(definition.expression);
    visiting.delete(id);
    resolved.set(id, result);
    return result;
  }
  function bind(value: unknown): unknown {
    if (value === null || typeof value !== 'object' || 'actionGraph' in value) return value;
    if ('kind' in value && (value.kind === 'conditionNode' || value.kind === 'valueNode')) {
      if (
        !('nodeId' in value) ||
        typeof value.nodeId !== 'string' ||
        Object.keys(value).length !== 2
      )
        throw new Error('invalid data node reference');
      return node(value.nodeId, value.kind === 'conditionNode' ? 'boolean' : 'number');
    }
    if (Array.isArray(value)) {
      const result = value.map(bind);
      return result.every((v, i) => v === value[i]) ? value : result;
    }
    const entries = Object.entries(value);
    const result = entries.map(([key, item]) => [key, bind(item)] as const);
    return result.every(([, item], i) => item === entries[i]![1])
      ? value
      : Object.fromEntries(result);
  }
  return { bind, node };
}

/** 编译与既有领域校验消费绑定后的表达式；多个输入共用定义对象，仍分别按需执行。 */
export function resolveGraphData(graph: ActionGraphDefinition): ActionGraphDefinition {
  const resolver = createGraphDataResolver(graph);
  for (const [id, node] of Object.entries(graph.dataNodes ?? {})) {
    if (!id || (node.type !== 'number' && node.type !== 'boolean'))
      throw new Error(`invalid data node: ${id}`);
    resolver.node(id, node.type);
  }
  // 带随机或写值副作用的表达式只允许一个消费者。它仍在原调用位置和
  // 短路分支中求值，不能用“共享节点”悄悄增加一次抽样或黑板写入。
  const uses = new Map<string, number>();
  function references(value: unknown): void {
    if (!value || typeof value !== 'object' || 'actionGraph' in value) return;
    if (
      'kind' in value &&
      (value.kind === 'conditionNode' || value.kind === 'valueNode') &&
      'nodeId' in value
    ) {
      const id = String(value.nodeId);
      uses.set(id, (uses.get(id) ?? 0) + 1);
      return;
    }
    Object.values(value).forEach(references);
  }
  Object.values(graph.nodes).forEach(node => references(node.action));
  Object.values(graph.dataNodes ?? {}).forEach(node => references(node.expression));
  function hasEffects(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    if (
      'kind' in value &&
      (value.kind === 'probability' || value.kind === 'buffBlackboardValueCompare')
    )
      return true;
    return Object.values(value).some(hasEffects);
  }
  for (const [id, count] of uses) {
    const node = graph.dataNodes?.[id];
    if (node && count > 1 && hasEffects(resolver.node(id, node.type)))
      throw new Error(`data node ${id}: 有副作用的条件不能连接到多个输入，请创建独立条件`);
  }
  return {
    nodes: Object.fromEntries(
      Object.entries(graph.nodes).map(([id, node]) => [
        id,
        {
          ...node,
          action: resolver.bind(node.action) as typeof node.action,
        },
      ]),
    ),
  };
}
