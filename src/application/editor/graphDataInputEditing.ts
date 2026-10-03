/** A single immutable graph change; hosts retain their normal validation and undo boundary. */
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { DataInput } from '../../core/action-graph/actionGraphDataNodes';

export function setGraphDataInput(
  graph: ActionGraphDefinition,
  owner: 'action' | 'data',
  id: string,
  input: DataInput,
  source: string | null,
  constant?: number | boolean | string,
): ActionGraphDefinition {
  const target = owner === 'action' ? graph.nodes[id]?.action : graph.dataNodes?.[id]?.expression;
  if (target === undefined) throw new Error('数据输入所属节点不存在');
  if (source !== null && graph.dataNodes?.[source]?.type !== input.type)
    throw new Error('数据引脚类型不一致');
  if (
    source === null &&
    (typeof constant !== input.type ||
      (typeof constant === 'number' && !Number.isFinite(constant)) ||
      (typeof constant === 'string' && !constant.length))
  )
    throw new Error('断开连接前请选择合法的内联常量；不会自动补零、false 或空字符串。');
  const value =
    source === null
      ? input.type === 'string'
        ? constant
        : { kind: 'constant', value: constant }
      : {
          kind:
            input.type === 'string'
              ? 'stringNode'
              : input.type === 'boolean'
                ? 'conditionNode'
                : 'valueNode',
          nodeId: source,
        };
  function replace(current: unknown, path: readonly string[]): unknown {
    if (!path.length) return value;
    const [key, ...rest] = path;
    if (key === '__proto__' || key === 'prototype' || key === 'constructor')
      throw new Error('不能编辑对象原型字段');
    if (Array.isArray(current)) {
      if (!/^(0|[1-9]\d*)$/.test(key!) || Number(key) >= current.length)
        throw new Error('数组输入位置不存在');
      const next = [...current];
      next[Number(key)] = replace(current[Number(key)], rest);
      return next;
    }
    const record =
      current && typeof current === 'object' ? (current as Record<string, unknown>) : {};
    return { ...record, [key!]: replace(record[key!], rest) };
  }
  const changed = replace(target, input.path);
  // Sources belong to the graph, not this consumer. Never delete a shared source here.
  return owner === 'action'
    ? {
        ...graph,
        nodes: {
          ...graph.nodes,
          [id]: { ...graph.nodes[id]!, action: changed as (typeof graph.nodes)[string]['action'] },
        },
      }
    : {
        ...graph,
        dataNodes: {
          ...graph.dataNodes,
          [id]: { ...graph.dataNodes![id]!, expression: changed } as NonNullable<
            typeof graph.dataNodes
          >[string],
        },
      };
}
