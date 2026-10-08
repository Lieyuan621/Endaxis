import { expect, it, vi } from 'vitest';
import type { ActionGraphDefinition } from '../../src/compiler/intermediateDefinitions';
import { extractGraphDataNodes } from '../../src/compiler/extractGraphDataNodes';
import { finalizeDefinitionResources } from '../../src/compiler/finalizeDefinitions';
import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import { createActionGraphCompilation } from '../../../../src/core/compiler/compileActionGraph';
import { ActionBlackboard } from '../../../../src/core/combat/actions/actionBlackboard';
import { ActionBlackboardOperationExecutor } from '../../../../src/core/combat/actions/actionBlackboardOperationExecutor';
import { ExplicitProbabilitySampleSource } from '../../../../src/core/combat/random/probabilitySampleSource';

it.each(['off', 'report'] as const)(
  '%s 模式仍生成数据节点；短路不抽样，多次消费读取各自当前状态',
  mode => {
    const source: ActionGraphDefinition = {
      nodes: {
        branch: {
          action: {
            kind: 'conditional',
            parameters: {
              condition: {
                kind: 'all',
                conditions: [
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'count' },
                    operator: 'greater',
                    right: { kind: 'constant', value: 0 },
                  },
                  { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                ],
              },
            },
            whenTrue: { $sequence: null },
          },
          next: null,
        },
      },
    };
    const graph = finalizeDefinitionResources<{ actionGraph: ActionGraphResourceDefinition }>(
      { actionGraph: { main: source, macros: {} } },
      mode,
    ).value.actionGraph.main;
    const compilation = createActionGraphCompilation(graph, 1);
    const program = compilation.compileAll();
    const action = program.nodes.get('branch')!.action;
    if (action.kind !== 'conditional' || action.parameters.condition.kind !== 'conditionNode')
      throw new Error('expected a compiled condition reference');
    const condition = action.parameters.condition;
    expect(condition.node).toBe(program.dataNodes[condition.nodeId]);
    expect(condition.node.expression.kind).toBe('all');
    if (condition.node.expression.kind !== 'all') throw new Error('expected all');
    expect(condition.node.expression.conditions.map(input => input.kind)).toEqual([
      'conditionNode',
      'conditionNode',
    ]);
    const samples = new ExplicitProbabilitySampleSource([0.25, 0.75]);
    const sample = vi.spyOn(samples, 'nextProbabilitySample');
    const executor = new ActionBlackboardOperationExecutor(
      { execute: () => false, evaluate: () => false },
      samples,
    );
    const blackboard = new ActionBlackboard({ count: 0 });
    expect(executor.evaluate(condition, { blackboard })).toBe(false);
    expect(sample).not.toHaveBeenCalled();
    blackboard.assignDynamic('count', 1);
    expect(executor.evaluate(condition, { blackboard })).toBe(true);
    expect(executor.evaluate(condition, { blackboard })).toBe(false);
    expect(sample).toHaveBeenCalledTimes(2);
    expect(source.nodes.branch!.action).not.toEqual(graph.nodes.branch!.action);
  },
);

it('只把字符串输入中的变量读取提取成字符串节点，不改写独立的数值配置', () => {
  const source: ActionGraphDefinition = {
    nodes: {
      cast: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: { blackboardKey: 'skill' },
            target: 'caster',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
    },
  };
  const graph = extractGraphDataNodes(source);
  const action = graph.nodes.cast!.action;
  if (action.kind !== 'castSkillDuringAction') throw new Error('expected cast');
  expect(action.parameters.skillId).toEqual({ kind: 'stringNode', nodeId: 'data_1' });
  expect(graph.dataNodes!.data_1).toEqual({
    type: 'string',
    expression: { blackboardKey: 'skill' },
  });
  expect(extractGraphDataNodes(graph)).toEqual(graph);
});
