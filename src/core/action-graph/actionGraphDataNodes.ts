/** 条件与数值的数据节点编辑。只处理当前资源，不沿控制连线展开或合并不同调用。 */
import type {
  ActionGraphDefinition,
  ActionGraphDataNode,
  ActionGraphResourceDefinition,
} from '../../../packages/game-data-contract/src/actionGraph.ts';
import { COMBAT_CONDITION_KINDS } from '../../../packages/game-data-contract/src/conditions.ts';
import { createGraphDataResolver } from './actionGraphData.ts';

const conditionKinds = new Set<string>(COMBAT_CONDITION_KINDS);
/** 在来源优化结束后逐资源建立数据节点；不把不同资源的节点混到一起。 */
export function extractDefinitionDataNodes<T>(definition: T): T {
  function visit(value: unknown): unknown {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
      const items = value.map(visit);
      return items.every((item, i) => item === value[i]) ? value : items;
    }
    const entries = Object.entries(value);
    const next = entries.map(
      ([key, item]) =>
        [
          key,
          key === 'actionGraph'
            ? extractResourceDataNodes(visit(item) as ActionGraphResourceDefinition)
            : visit(item),
        ] as const,
    );
    return next.every(([, item], i) => item === entries[i]![1]) ? value : Object.fromEntries(next);
  }
  return visit(definition) as T;
}
export function expressionType(value: unknown): 'number' | 'boolean' | null {
  if (!value || typeof value !== 'object' || !('kind' in value)) return null;
  if (value.kind === 'constant')
    return 'value' in value && typeof value.value === 'boolean' ? 'boolean' : 'number';
  if (value.kind === 'blackboard' || value.kind === 'parameter' || value.kind === 'valueNode')
    return 'number';
  if (value.kind === 'conditionNode' || conditionKinds.has(String(value.kind))) return 'boolean';
  return null;
}

/** 内联表达式提升成独立节点；已有 ID 不变，常量保留在输入端。 */
export function extractGraphDataNodes(graph: ActionGraphDefinition): ActionGraphDefinition {
  const dataNodes = { ...graph.dataNodes };
  let serial = 1;
  function visit(value: unknown): unknown {
    if (!value || typeof value !== 'object' || 'actionGraph' in value) return value;
    if ('kind' in value && (value.kind === 'conditionNode' || value.kind === 'valueNode'))
      return value;
    if (Array.isArray(value)) {
      const items = value.map(visit);
      return items.every((item, i) => item === value[i]) ? value : items;
    }
    const type = expressionType(value);
    if (type && 'kind' in value && value.kind === 'constant') return value;
    const result = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, visit(child)]),
    );
    if (!type)
      return Object.entries(result).every(
        ([key, item]) => item === (value as Record<string, unknown>)[key],
      )
        ? value
        : result;
    let id: string;
    do {
      id = `data_${serial++}`;
    } while (Object.hasOwn(dataNodes, id));
    dataNodes[id] = { type, expression: result } as ActionGraphDataNode;
    return { kind: type === 'boolean' ? 'conditionNode' : 'valueNode', nodeId: id };
  }
  const nodes = Object.fromEntries(
    Object.entries(graph.nodes).map(([id, node]) => [
      id,
      (() => {
        const action = visit(node.action) as typeof node.action;
        return action === node.action ? node : { ...node, action };
      })(),
    ]),
  );
  return Object.entries(nodes).every(([id, node]) => node === graph.nodes[id])
    ? graph
    : { ...graph, nodes, dataNodes };
}

export function extractResourceDataNodes(
  resource: ActionGraphResourceDefinition,
): ActionGraphResourceDefinition {
  const main = extractGraphDataNodes(resource.main);
  const macros = Object.fromEntries(
    Object.entries(resource.macros).map(([id, macro]) => {
      const graph = extractGraphDataNodes(macro.graph);
      return [id, graph === macro.graph ? macro : { ...macro, graph }];
    }),
  );
  return main === resource.main &&
    Object.entries(macros).every(([id, macro]) => macro === resource.macros[id])
    ? resource
    : { main, macros };
}

export interface DataInput {
  readonly path: readonly string[];
  readonly type: 'number' | 'boolean';
  readonly source: string | null;
  readonly value: unknown;
}
export function dataNodeInputs(node: ActionGraphDataNode): readonly DataInput[] {
  return listDataInputs(
    Object.fromEntries(Object.entries(node.expression).filter(([key]) => key !== 'kind')),
  );
}
export function listDataInputs(value: unknown): readonly DataInput[] {
  const inputs: DataInput[] = [];
  function visit(value: unknown, path: readonly string[]) {
    if (!value || typeof value !== 'object' || 'actionGraph' in value) return;
    const type = expressionType(value);
    if (type) {
      inputs.push({ path, type, source: 'nodeId' in value ? String(value.nodeId) : null, value });
      return;
    }
    for (const [key, child] of Object.entries(value)) visit(child, [...path, key]);
  }
  visit(value, []);
  return inputs;
}

export function dataNodeHasEffects(graph: ActionGraphDefinition, id: string): boolean {
  if (graph.dataNodes?.[id]?.type !== 'boolean') return false;
  const expression = createGraphDataResolver(graph).node(id, 'boolean');
  function visit(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    if (
      'kind' in value &&
      (value.kind === 'probability' || value.kind === 'buffBlackboardValueCompare')
    )
      return true;
    return Object.values(value).some(visit);
  }
  return graph.dataNodes?.[id]?.type === 'boolean' && visit(expression);
}
