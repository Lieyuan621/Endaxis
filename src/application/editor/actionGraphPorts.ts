import type {
  ActionGraphNode,
  ActionGraphDataNode,
} from '../../../packages/game-data-contract/src/actionGraph';

/** 求值转接节点只有行为调用出口，没有行为输入或顺序 next。 */
export function listDataActionPorts(node: ActionGraphDataNode): readonly GraphPort[] {
  return node.type === 'boolean' && node.expression.kind === 'checkActionResult'
    ? [
        {
          path: ['expression', 'action', '$sequence'],
          label: 'action',
          target: node.expression.action.$sequence,
        },
      ]
    : [];
}

export interface GraphPort {
  /** 从节点根开始的字段路径，例如 next 或 action.body.$sequence。 */
  readonly path: readonly string[];
  readonly label: string;
  readonly target: string | null;
}

/** 仅投影本图的控制出口；独立资源与宏身份映射不参与本图连线。 */
export function listGraphPorts(node: ActionGraphNode): readonly GraphPort[] {
  const ports: GraphPort[] = [{ path: ['next'], label: 'next', target: node.next }];
  if (node.action.kind === 'callMacro') return ports;
  const visit = (value: unknown, path: readonly string[]): void => {
    if (value === null || typeof value !== 'object' || Object.hasOwn(value, 'actionGraph')) return;
    if (Object.hasOwn(value, '$sequence')) {
      const reference = value as { readonly $sequence: string | null };
      ports.push({
        path: [...path, '$sequence'],
        label: path.slice(1).join('.') || '$sequence',
        target: reference.$sequence,
      });
      return;
    }
    for (const [key, child] of Object.entries(value))
      if (key !== 'nodeBindings') visit(child, [...path, key]);
  };
  visit(node.action, ['action']);
  if (node.action.kind === 'conditional' && node.action.whenFalse === undefined)
    ports.push({ path: ['action', 'whenFalse', '$sequence'], label: 'whenFalse', target: null });
  return ports;
}
