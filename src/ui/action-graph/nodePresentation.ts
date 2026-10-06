/** 节点名称使用统一语言资源，节点身份单独显示。 */
import type {
  ActionGraphStep,
  ActionGraphDataNode,
} from '../../../packages/game-data-contract/src/actionGraph';
import { nodeName } from './editorNodeText';
export function dataNodeKind(node: ActionGraphDataNode): string {
  return node.type === 'string' ? 'stringOperand' : node.expression.kind;
}
export function dataNodeTitle(node: ActionGraphDataNode): string {
  return nodeName(dataNodeKind(node));
}
/** 仅黑板读取显示实际键；其他数据来源显示内部节点 ID，连线引用不变。 */
export function dataNodeSourceLabel(node: ActionGraphDataNode | undefined, id: string): string {
  if (!node) return id;
  if (node.type === 'number' && node.expression.kind === 'blackboard') return node.expression.key;
  if (
    node.type === 'string' &&
    typeof node.expression === 'object' &&
    'blackboardKey' in node.expression
  )
    return node.expression.blackboardKey;
  return id;
}
export function actionNodeTitle(kind: ActionGraphStep['kind']): string {
  return nodeName(kind);
}

/** 仅纯运算使用紧凑样式；读取游戏状态和写入变量仍保留其明确的行为名称。 */
export function compactDataSymbol(node: ActionGraphDataNode): string | undefined {
  if (node.type !== 'boolean') return undefined;
  const expression = node.expression;
  if (expression.kind === 'actionValueCompare')
    return {
      equal: '=',
      notEqual: '≠',
      greater: '>',
      greaterOrEqual: '≥',
      less: '<',
      lessOrEqual: '≤',
    }[expression.operator];
  if (expression.kind === 'all') return 'AND';
  if (expression.kind === 'any') return 'OR';
  if (expression.kind === 'not') return 'NOT';
  return undefined;
}
