/** 节点名称使用统一语言资源，节点身份单独显示。 */
import type {
  ActionGraphStep,
  ActionGraphDataNode,
} from '../../../packages/game-data-contract/src/actionGraph';
import { nodeName } from './editorNodeText';
export function dataNodeTitle(node: ActionGraphDataNode): string {
  return nodeName(node.expression.kind);
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
