/** 数据图引用的查询与拓扑检查；不把节点展开回内联表达式。 */
import type {
  ActionGraphDefinition,
  ActionGraphDataNode,
} from '../../../packages/game-data-contract/src/actionGraph.ts';

export interface GraphDataReference {
  readonly kind: 'valueNode' | 'conditionNode' | 'stringNode';
  readonly nodeId: string;
}
export function isGraphDataReference(value: unknown): value is GraphDataReference {
  return (
    value !== null &&
    typeof value === 'object' &&
    'kind' in value &&
    (value.kind === 'valueNode' || value.kind === 'conditionNode' || value.kind === 'stringNode')
  );
}
export function graphDataReferenceType(reference: GraphDataReference): ActionGraphDataNode['type'] {
  return reference.kind === 'valueNode'
    ? 'number'
    : reference.kind === 'conditionNode'
      ? 'boolean'
      : 'string';
}
export function graphDataNode(
  graph: ActionGraphDefinition,
  id: string,
  type: ActionGraphDataNode['type'],
): ActionGraphDataNode {
  const node = graph.dataNodes?.[id];
  if (!node) throw new Error(`missing ${type} data node: ${id}`);
  if (node.type !== type) throw new Error(`data node ${id}: expected ${type}, got ${node.type}`);
  return node;
}
/** 转接节点只沿引用寻址；返回操作本身，操作的子输入仍是引用。 */
export function graphDataExpression(
  graph: ActionGraphDefinition,
  id: string,
  type: ActionGraphDataNode['type'],
): ActionGraphDataNode['expression'] {
  const seen = new Set<string>();
  while (true) {
    if (seen.has(id)) throw new Error(`recursive data graph: ${id}`);
    seen.add(id);
    const expression = graphDataNode(graph, id, type).expression;
    if (!isGraphDataReference(expression)) return expression;
    if (graphDataReferenceType(expression) !== type)
      throw new Error(`data node ${id}: expected ${type}`);
    id = expression.nodeId;
  }
}
/** 枚举当前图输入中的连线；独立资源的连线由其自己的图负责。 */
export function visitGraphDataReferences(
  value: unknown,
  visit: (reference: GraphDataReference) => void,
): void {
  if (!value || typeof value !== 'object' || 'actionGraph' in value) return;
  if (isGraphDataReference(value)) {
    visit(value);
    return;
  }
  for (const child of Object.values(value)) visitGraphDataReferences(child, visit);
}
export function validateGraphDataReferences(graph: ActionGraphDefinition): void {
  const visiting = new Set<string>();
  const complete = new Set<string>();
  const visit = (reference: GraphDataReference): void => {
    const node = graphDataNode(graph, reference.nodeId, graphDataReferenceType(reference));
    if (complete.has(reference.nodeId)) return;
    if (visiting.has(reference.nodeId))
      throw new Error(`recursive data graph: ${reference.nodeId}`);
    visiting.add(reference.nodeId);
    visitGraphDataReferences(node.expression, visit);
    visiting.delete(reference.nodeId);
    complete.add(reference.nodeId);
  };
  for (const node of Object.values(graph.nodes)) visitGraphDataReferences(node.action, visit);
  for (const [nodeId, node] of Object.entries(graph.dataNodes ?? {}))
    visit({
      kind:
        node.type === 'boolean'
          ? 'conditionNode'
          : node.type === 'string'
            ? 'stringNode'
            : 'valueNode',
      nodeId,
    });
}
