/**
 * 编译后数据连线直接引用共享节点定义。绑定只解析身份，不读取战斗状态；
 * 每次消费输入都重新求值，节点和引用不进入可恢复的执行状态。
 */
import type {
  ActionValueExpression,
  CombatConditionExpression,
} from '../../../packages/game-data-contract/src/conditions';
import type { ActionStringExpression } from '../../../packages/game-data-contract/src/primitives';
import type {
  ActionGraphDefinition,
  ActionGraphStepForKind,
} from '../../../packages/game-data-contract/src/actionGraph';
import type {
  CombatStepKind,
  CombatStepParameters,
  CombatStepForKind,
} from '../../../packages/game-data-contract/src/actions';

export type CompiledValueInput =
  | { readonly kind: 'constant'; readonly value: number }
  | { readonly kind: 'valueNode'; readonly nodeId: string; readonly node: CompiledNumberNode };
export type CompiledConditionInput =
  | { readonly kind: 'constant'; readonly value: boolean }
  | { readonly kind: 'conditionNode'; readonly nodeId: string; readonly node: CompiledBooleanNode };
export type CompiledStringInput =
  | string
  | { readonly kind: 'stringNode'; readonly nodeId: string; readonly node: CompiledStringNode };

export interface CompiledNumberNode {
  readonly type: 'number';
  /** 宏实参绑定后可以转向调用方节点，仍不提前读取变量。 */
  readonly expression: Exclude<ActionValueExpression, { kind: 'valueNode' }> | CompiledValueInput;
}
export interface CompiledBooleanNode {
  readonly type: 'boolean';
  readonly expression: CompiledInputs<CombatConditionExpression>;
}
export interface CompiledStringNode {
  readonly type: 'string';
  readonly expression:
    Exclude<ActionStringExpression, { kind: 'stringNode' }> | CompiledStringInput;
}
export type CompiledDataNode = CompiledNumberNode | CompiledBooleanNode | CompiledStringNode;
/** 求值器同时接收条件输入和解引用后的一项条件操作。 */
export type CompiledCondition = CompiledConditionInput | CompiledBooleanNode['expression'];

/** 仅将输入的节点 ID 绑定为节点引用；独立资源保留自己的编译入口。 */
export type CompiledInputs<T> = T extends { readonly kind: 'valueNode' }
  ? Extract<CompiledValueInput, { kind: 'valueNode' }>
  : T extends { readonly kind: 'conditionNode' }
    ? Extract<CompiledConditionInput, { kind: 'conditionNode' }>
    : T extends { readonly kind: 'stringNode' }
      ? Exclude<CompiledStringInput, string>
      : T extends { readonly actionGraph: unknown }
        ? T
        : T extends object
          ? { [K in keyof T]: CompiledInputs<T[K]> }
          : T;
export type CompiledStepParameters = CompiledInputs<CombatStepParameters>;
export type CompiledStepForKind<K extends CombatStepKind> = CompiledInputs<CombatStepForKind<K>>;
export type CompiledGraphStepForKind<K extends CombatStepKind> = CompiledInputs<
  ActionGraphStepForKind<K>
>;

export function compileGraphData(graph: ActionGraphDefinition) {
  const nodes: Record<string, CompiledDataNode> = {};
  const visiting = new Set<string>();
  function node(id: string): CompiledDataNode {
    if (nodes[id]) return nodes[id];
    const source = graph.dataNodes?.[id];
    if (!source) throw new Error(`missing data node: ${id}`);
    if (visiting.has(id)) throw new Error(`recursive data graph: ${id}`);
    visiting.add(id);
    const result = { type: source.type, expression: bind(source.expression) } as CompiledDataNode;
    visiting.delete(id);
    nodes[id] = result;
    return result;
  }
  function bind<T>(value: T, qualify: (id: string) => string = id => id): CompiledInputs<T> {
    if (!value || typeof value !== 'object' || 'actionGraph' in value)
      return value as CompiledInputs<T>;
    if (
      'kind' in value &&
      'nodeId' in value &&
      (value.kind === 'valueNode' || value.kind === 'conditionNode' || value.kind === 'stringNode')
    ) {
      const definition = node(qualify(String(value.nodeId)));
      const type =
        value.kind === 'valueNode'
          ? 'number'
          : value.kind === 'conditionNode'
            ? 'boolean'
            : 'string';
      if (definition.type !== type)
        throw new Error(
          `data node ${String(value.nodeId)}: expected ${type}, got ${definition.type}`,
        );
      return {
        ...value,
        nodeId: qualify(String(value.nodeId)),
        node: definition,
      } as CompiledInputs<T>;
    }
    if (Array.isArray(value)) return value.map(item => bind(item, qualify)) as CompiledInputs<T>;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, bind(item, qualify)]),
    ) as CompiledInputs<T>;
  }
  const actions = bind(graph.nodes);
  return { nodes: actions, dataNodes: nodes, bind };
}

/** 找到数值输入的读取操作；不会读取变量或缓存其值。 */
export function valueInputExpression(
  input: CompiledValueInput,
): Exclude<ActionValueExpression, { kind: 'valueNode' }> {
  return input.kind === 'valueNode' ? valueInputExpressionNode(input.node.expression) : input;
}
function valueInputExpressionNode(
  expression: CompiledNumberNode['expression'],
): Exclude<ActionValueExpression, { kind: 'valueNode' }> {
  return expression.kind === 'valueNode' ? valueInputExpression(expression) : expression;
}
export function valueInputBlackboardKey(input: CompiledValueInput | number): string | undefined {
  if (typeof input === 'number') return undefined;
  const expression = valueInputExpression(input);
  return expression.kind === 'blackboard' ? expression.key : undefined;
}
export function stringInputExpression(
  input: CompiledStringInput,
): Exclude<ActionStringExpression, { kind: 'stringNode' }> {
  const expression = typeof input === 'string' ? input : input.node.expression;
  return typeof expression !== 'string' && 'kind' in expression
    ? stringInputExpression(expression)
    : expression;
}
export function conditionInputExpression(
  input: CompiledCondition,
): CompiledBooleanNode['expression'] {
  return input.kind === 'conditionNode' ? conditionInputExpression(input.node.expression) : input;
}
