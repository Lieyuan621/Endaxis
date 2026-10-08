/** 执行器单测使用的已绑定数据输入；不经过生成器，不接受内联子表达式。 */
import type {
  CompiledBooleanNode,
  CompiledConditionInput,
  CompiledNumberNode,
  CompiledStringInput,
  CompiledValueInput,
} from '../core/compiler/compiledGraphData';

export function numberInput(expression: CompiledNumberNode['expression']): CompiledValueInput {
  return { kind: 'valueNode', nodeId: 'number', node: { type: 'number', expression } };
}

export function conditionInput(
  expression: CompiledBooleanNode['expression'],
): CompiledConditionInput {
  return { kind: 'conditionNode', nodeId: 'condition', node: { type: 'boolean', expression } };
}

export function stringInput(key: string): CompiledStringInput {
  return {
    kind: 'stringNode',
    nodeId: 'string',
    node: { type: 'string', expression: { blackboardKey: key } },
  };
}
