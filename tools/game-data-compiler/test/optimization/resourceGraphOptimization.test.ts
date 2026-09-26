import { describe, expect, it } from 'vitest';
import { createActionGraphBuilder } from '../../src/compiler/actions/actionGraphBuilder.ts';
import { optimizeResourceGraphs } from '../../src/compiler/optimization/resourceGraphOptimization.ts';
import { optimizeDefinitionResources } from '../../src/compiler/optimization/definitionProgramOptimization.ts';
import { validateActionGraphOwner } from '../../../../src/core/action-graph/actionGraphValidation.ts';
import { pruneUnusedGraphSkillValues } from '../../src/compiler/optimization/graphValueOptimization.ts';
import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
import type { ActionGraphStep } from '../../../../packages/game-data-contract/src/actionGraph.ts';
import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph.ts';
import { createActionGraphCompilation } from '../../../../src/core/compiler/compileActionGraph.ts';
import { CombatActionSequenceRuntime } from '../../../../src/core/combat/actions/combatActionSequenceRuntime.ts';
import {
  ActionBlackboard,
  resolveActionValueOperand,
} from '../../../../src/core/combat/actions/actionBlackboard.ts';
import { ActionBlackboardOperationExecutor } from '../../../../src/core/combat/actions/actionBlackboardOperationExecutor.ts';

function repeatedMiddleResource() {
  const graph = createActionGraphBuilder();
  const entries = ['first', 'second'].map(name =>
    graph.sequence([
      ...Array.from({ length: 10 }, (_, index) => ({
        kind: 'modifyActionValue' as const,
        parameters: {
          key: `shared-calculation-${index}`,
          operation: 'assign' as const,
          value: { kind: 'constant' as const, value: index + 1 },
        },
      })),
      {
        kind: 'modifyActionValue',
        parameters: {
          key: name,
          operation: 'assign',
          value: { kind: 'constant', value: 1 },
        },
      },
    ]),
  );
  return { entries, actionGraph: { main: graph.finish(), macros: {} } };
}

describe('独立资源图构建与优化', () => {
  it('再次优化时，宏的原节点身份不作为当前图引用，也不重写宏内部 ID', () => {
    const actionGraph: ActionGraphResourceDefinition = {
      main: {
        nodes: {
          call: {
            action: {
              kind: 'callMacro',
              macroId: 'middle',
              nodeBindings: { $sequence: 'removed' },
            },
            next: null,
          },
        },
      },
      macros: {
        middle: {
          entry: { $sequence: '$sequence' },
          graph: {
            nodes: {
              $sequence: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'value',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
            },
          },
        },
      },
    };
    const definition = { entry: { $sequence: 'call' }, actionGraph };
    const result = optimizeDefinitionResources(definition, 'apply');
    expect(result.value).toEqual(definition);
    expect(result.value.actionGraph.macros.middle).toBe(actionGraph.macros.middle);
  });

  it('提取后用真实黑板执行，每次调用仍按原节点顺序读取当前值', () => {
    const graph = createActionGraphBuilder();
    const calculations: ActionGraphStep[] = Array.from({ length: 8 }, (_, index) => ({
      kind: 'calculateActionValue',
      parameters: {
        key: `result-${index}`,
        operation: 'add',
        left: { kind: 'blackboard', key: index === 0 ? 'input' : `result-${index - 1}` },
        right: { kind: 'constant', value: 1 },
      },
    }));
    const entries = ['first', 'second'].map(key =>
      graph.sequence([
        ...calculations,
        {
          kind: 'changeResourceByActionValue',
          key,
          parameters: {
            resource: 'sp',
            recipient: 'team',
            amount: { kind: 'blackboard', key: 'result-7' },
          },
        },
      ]),
    );
    const original = { entries, actionGraph: { main: graph.finish(), macros: {} } };
    const extracted = optimizeResourceGraphs(original, 'apply').value;
    expect(Object.keys(extracted.actionGraph.macros)).toHaveLength(1);
    const execute = (definition: typeof original) => {
      const board = new ActionBlackboard();
      const outputs: number[] = [];
      const executor = new ActionBlackboardOperationExecutor({
        evaluate: () => true,
        execute(step, context) {
          if (step.kind !== 'changeResourceByActionValue') throw new Error('unexpected leaf');
          outputs.push(resolveActionValueOperand(step.parameters.amount, context!.blackboard));
          return true;
        },
      });
      const runtime = new CombatActionSequenceRuntime(executor, { blackboard: board });
      const compiler = createActionGraphCompilation(definition.actionGraph, 1);
      const programs = definition.entries.map((entry, index) =>
        runtime.createSequence(compiler.compileEntry(entry, `call-${index}`)),
      );
      compiler.compileAll();
      programs.forEach((program, index) => {
        board.assign({ input: index === 0 ? 2 : 7 });
        program.reset({});
        program.execute({});
        program.end({});
      });
      return { outputs, values: board.snapshot() };
    };
    expect(execute(original).outputs).toEqual([10, 15]);
    expect(execute(extracted)).toEqual(execute(original));
  });

  it.each(['apply', 'report'] as const)('%s 在提取宏前裁掉无用写入并重新去重', mode => {
    const resource = repeatedMiddleResource();
    const definition: SkillDefinition = {
      key: 'skill',
      timelineBlockFrames: 30,
      scheduledSequences: resource.entries.map(sequence => ({ startFrame: 0, sequence })),
      actionGraph: resource.actionGraph,
    };
    let removedWrites = 0;
    const result = optimizeDefinitionResources(definition, mode, simplified => {
      expect(Object.keys(simplified.actionGraph.macros)).toHaveLength(0);
      const pruned = pruneUnusedGraphSkillValues(simplified);
      removedWrites = pruned.report.removedWrites.length;
      return pruned.skill;
    });
    expect(removedWrites).toBeGreaterThan(10);
    expect(result.report.programs.flatMap(item => item.macroCandidates ?? [])).toEqual([]);
    if (mode === 'apply') {
      expect(Object.keys(result.value.actionGraph.macros)).toHaveLength(0);
      expect(result.value.scheduledSequences[0]!.sequence).toEqual(
        result.value.scheduledSequences[1]!.sequence,
      );
    } else expect(result.value).toBe(definition);
    expect(
      optimizeDefinitionResources(definition, 'off', () => {
        throw new Error('关闭优化时不应裁剪');
      }).value,
    ).toBe(definition);
  });

  it('先去重再提取中间段，报告不替换输入，重复优化保留原调用位置绑定', () => {
    const definition = repeatedMiddleResource();
    const original = structuredClone(definition);
    const off = optimizeResourceGraphs(definition, 'off');
    const report = optimizeResourceGraphs(definition, 'report');
    const applied = optimizeResourceGraphs(definition, 'apply');
    expect(off.value).toBe(definition);
    expect(report.value).toBe(definition);
    expect(definition).toEqual(original);
    expect(report.reports.flatMap(item => item.macroCandidates ?? [])).toEqual(
      applied.reports.flatMap(item => item.macroCandidates ?? []),
    );
    expect(Object.keys(applied.value.actionGraph.macros)).toHaveLength(1);
    expect(applied.value.entries).toEqual(definition.entries);
    expect(() => validateActionGraphOwner(applied.value, 'skill')).not.toThrow();
    const again = optimizeResourceGraphs(applied.value, 'apply');
    expect(again.value).toEqual(applied.value);
    expect(() => validateActionGraphOwner(again.value, 'skill')).not.toThrow();
  });

  it('多个资源的重复中间段分别提取，各宏只能使用自己的局部节点', () => {
    const result = optimizeResourceGraphs(
      { first: repeatedMiddleResource(), second: repeatedMiddleResource() },
      'apply',
    ).value;
    expect(Object.keys(result.first.actionGraph.macros)).toHaveLength(1);
    expect(Object.keys(result.second.actionGraph.macros)).toHaveLength(1);
    expect(result.first.actionGraph.macros).not.toBe(result.second.actionGraph.macros);
    expect(() => validateActionGraphOwner(result.first, 'first')).not.toThrow();
    expect(() => validateActionGraphOwner(result.second, 'second')).not.toThrow();
  });

  it('自动生成的图路径身份不会阻止重复分支合并，且不生成宏', () => {
    const graph = createActionGraphBuilder();
    const first = graph.sequence([
      {
        kind: 'dealDamage',
        key: 'skill:/actionGraph/main/nodes/a/action',
        parameters: { damageType: 'physical', attackScale: 1, tags: [] },
      },
      { kind: 'finishTimeline', parameters: {} },
    ]);
    const second = graph.sequence([
      {
        kind: 'dealDamage',
        key: 'skill:/actionGraph/main/nodes/b/action',
        parameters: { damageType: 'physical', attackScale: 1, tags: [] },
      },
      { kind: 'finishTimeline', parameters: {} },
    ]);
    const definition = {
      scheduledSequences: [{ sequence: first }, { sequence: second }],
      actionGraph: { main: graph.finish(), macros: {} },
    };
    const result = optimizeDefinitionResources(definition, 'apply').value;
    expect(Object.values(result.actionGraph.macros)).toHaveLength(0);
    expect(result.scheduledSequences[0]!.sequence).toEqual(result.scheduledSequences[1]!.sequence);
    expect(Object.values(result.actionGraph.main.nodes).map(node => node.action.kind)).toEqual([
      'finishTimeline',
      'dealDamage',
    ]);
    expect(() => validateActionGraphOwner(result, 'skill')).not.toThrow();
  });
  it('优化外部调用不会重写外部资源的同名入口或丢失内部节点', () => {
    const child = createActionGraphBuilder();
    const childEntry = child.sequence([
      {
        kind: 'modifyActionValue',
        parameters: { key: 'child', operation: 'assign', value: { kind: 'constant', value: 7 } },
      },
    ]);
    const parent = createActionGraphBuilder();
    const entry = parent.sequence([
      {
        kind: 'callResource',
        resource: {
          id: 'callback',
          entry: childEntry,
          actionGraph: { main: child.finish(), macros: {} },
        },
      },
    ]);
    const result = optimizeResourceGraphs(
      { entry, actionGraph: { main: parent.finish(), macros: {} } },
      'apply',
    ).value;
    expect(() => validateActionGraphOwner(result, 'parent')).not.toThrow();
    const call = result.actionGraph.main.nodes[result.entry.$sequence!]!.action;
    expect(call.kind).toBe('callResource');
    if (call.kind !== 'callResource') throw new Error('missing resource call');
    expect(Object.values(call.resource.actionGraph.main.nodes)).toHaveLength(1);
    expect(
      call.resource.actionGraph.main.nodes[call.resource.entry.$sequence!]!.action,
    ).toMatchObject({ kind: 'modifyActionValue', parameters: { key: 'child' } });
  });
  it('优化一个入口不会删除同一资源的其他调度入口', () => {
    const graph = createActionGraphBuilder();
    const firstBody = graph.sequence([
      {
        kind: 'modifyActionValue',
        parameters: { key: 'first', operation: 'assign', value: { kind: 'constant', value: 1 } },
      },
    ]);
    const first = graph.sequence([
      {
        kind: 'conditional',
        parameters: { condition: { kind: 'constant', value: true } },
        whenTrue: firstBody,
      },
    ]);
    const second = graph.sequence([
      {
        kind: 'modifyActionValue',
        parameters: { key: 'second', operation: 'assign', value: { kind: 'constant', value: 2 } },
      },
    ]);
    const definition = {
      scheduledSequences: [{ sequence: first }, { sequence: second }],
      actionGraph: { main: graph.finish(), macros: {} },
    };
    const result = optimizeResourceGraphs(definition, 'apply').value;
    expect(() => validateActionGraphOwner(result, 'skill')).not.toThrow();
    const keys = Object.values(result.actionGraph.main.nodes).flatMap(node =>
      node.action.kind === 'modifyActionValue' ? [node.action.parameters.key] : [],
    );
    expect(keys).toEqual(expect.arrayContaining(['first', 'second']));
  });

  it('相同结构位于两个资源时仍然各自拥有图', () => {
    const make = () => {
      const graph = createActionGraphBuilder();
      const sequence = graph.sequence([
        {
          kind: 'modifyActionValue',
          parameters: { key: 'value', operation: 'assign', value: { kind: 'constant', value: 1 } },
        },
      ]);
      return { sequence, actionGraph: { main: graph.finish(), macros: {} } };
    };
    const result = optimizeResourceGraphs({ first: make(), second: make() }, 'apply').value;
    expect(result.first.actionGraph.main).not.toBe(result.second.actionGraph.main);
    expect(() => validateActionGraphOwner(result.first, 'first')).not.toThrow();
    expect(() => validateActionGraphOwner(result.second, 'second')).not.toThrow();
  });

  it('领域动作树直接失败，不进入转图兜底', () => {
    expect(() => optimizeResourceGraphs({ sequence: { steps: [] } }, 'apply')).toThrow(
      'action trees are no longer supported',
    );
  });

  it('图快照不会被后续构建修改，等价比较沿图引用处理分支', () => {
    const graph = createActionGraphBuilder();
    const first = graph.sequence([{ kind: 'finishTimeline', parameters: {} }]);
    const snapshot = graph.finish();
    const second = graph.sequence([{ kind: 'finishTimeline', parameters: {} }]);
    expect(Object.keys(snapshot.nodes)).toHaveLength(1);
    expect(graph.equivalent(first, second)).toBe(true);
  });
});
