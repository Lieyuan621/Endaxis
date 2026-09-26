/** 单个原生资源的图构建器。子程序先构建为入口引用，再交给父节点；不接受动作树。 */
import { createHash } from 'node:crypto';
import type {
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../../packages/game-data-contract/src/actionGraph.ts';

export interface BuiltActionGraph<Action> {
  readonly nodes: Readonly<
    Record<string, { readonly action: Action; readonly next: string | null }>
  >;
}

export type ActionGraphBuilder<Action extends { readonly kind: string } = ActionGraphStep> =
  ReturnType<typeof createActionGraphBuilder<Action>>;

/** 读取一个入口的同层动作；不会把分支、宏或外部资源展开成树。 */
export function readActionGraphChain<Action>(
  graph: BuiltActionGraph<Action>,
  entry: ActionGraphReference,
): readonly Action[] {
  const result: Action[] = [];
  const seen = new Set<string>();
  let cursor = entry.$sequence;
  while (cursor !== null) {
    if (seen.has(cursor)) throw new Error(`cyclic action chain: ${cursor}`);
    seen.add(cursor);
    const current = graph.nodes[cursor];
    if (!current) throw new Error(`action does not belong to this resource: ${cursor}`);
    result.push(current.action);
    cursor = current.next;
  }
  return result;
}

export function createActionGraphBuilder<
  Action extends { readonly kind: string } = ActionGraphStep,
>() {
  const nodes: Record<string, { readonly action: Action; readonly next: string | null }> = {};
  let serial = 0;
  const signatures = new Map<string, string>();
  const signature = (
    value: unknown,
    visiting = new Set<string>(),
    resolveReferences = true,
  ): string => {
    if (Array.isArray(value))
      return `[${value.map(item => signature(item, visiting, resolveReferences)).join(',')}]`;
    if (value && typeof value === 'object') {
      if ('actionGraph' in value) resolveReferences = false;
      if (resolveReferences && Object.keys(value).length === 1 && '$sequence' in value) {
        const id = value.$sequence;
        if (id === null) return 'empty';
        if (typeof id !== 'string' || !nodes[id])
          throw new Error(`missing resource node: ${String(id)}`);
        const cached = signatures.get(id);
        if (cached !== undefined) return cached;
        if (visiting.has(id)) throw new Error(`cyclic resource node: ${id}`);
        visiting.add(id);
        const current = nodes[id]!;
        const result = createHash('sha256')
          .update(
            `${signature(current.action, visiting)};${signature({ $sequence: current.next }, visiting)}`,
          )
          .digest('hex');
        visiting.delete(id);
        signatures.set(id, result);
        return result;
      }
      return `{${Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([key, item]) => `${JSON.stringify(key)}:${signature(item, visiting, resolveReferences)}`,
        )
        .join(',')}}`;
    }
    return `${typeof value}:${typeof value === 'number' && Object.is(value, -0) ? '-0' : String(value)}`;
  };
  const node = (
    action: Action,
    next: ActionGraphReference = { $sequence: null },
  ): ActionGraphReference => {
    const id = `${action.kind}_${++serial}`;
    nodes[id] = { action, next: next.$sequence };
    return { $sequence: id };
  };
  return {
    node,
    equivalent(left: ActionGraphReference, right: ActionGraphReference): boolean {
      return signature(left) === signature(right);
    },
    /** 只串接同层动作；控制节点的分支必须已经是本资源的图引用。 */
    sequence(actions: readonly Action[]): ActionGraphReference {
      let entry: ActionGraphReference = { $sequence: null };
      for (let index = actions.length - 1; index >= 0; index--)
        entry = node(actions[index]!, entry);
      return entry;
    },
    /** 资源完成后输出独立节点表，后续构建不会修改已输出图。 */
    finish(): BuiltActionGraph<Action> {
      return { nodes: { ...nodes } };
    },
    /** 读取同层 next 链用于拼接；分支始终保留引用，不展开子程序。 */
    actions(entry: ActionGraphReference): readonly Action[] {
      return readActionGraphChain({ nodes }, entry);
    },
    /** 枚举入口可达的节点，每个节点一次；保留引用，不还原动作树。 */
    reachableActions(entry: ActionGraphReference): readonly Action[] {
      const seen = new Set<string>();
      const result: Action[] = [];
      const visit = (value: unknown): void => {
        if (!value || typeof value !== 'object') return;
        if ('actionGraph' in value) return;
        if ('$sequence' in value) {
          const id = value.$sequence;
          if (id === null || (typeof id === 'string' && seen.has(id))) return;
          if (typeof id !== 'string' || !nodes[id])
            throw new Error(`missing resource node: ${String(id)}`);
          seen.add(id);
          const node = nodes[id]!;
          result.push(node.action);
          visit(node.action);
          visit({ $sequence: node.next });
          return;
        }
        Object.values(value).forEach(visit);
      };
      visit(entry);
      return result;
    },
  };
}
