import { extractResourceDataNodes } from '../../src/compiler/extractGraphDataNodes.ts';
import { COMPILED_BUFF_CAPTURED_TARGET_GROUPS } from '../../src/compiler/buffs/compiledBuffMetadata.ts';
import { skillFixture } from '../../../../src/test/skillFixture';
import { describe, expect, it } from 'vitest';
import { createActionGraphBuilder } from '../../src/compiler/actions/actionGraphBuilder.ts';
import { optimizeResourceGraphs } from '../../src/compiler/optimization/resourceGraphOptimization.ts';
import { collectUnobservedGraphTargetGroups } from '../../src/compiler/optimization/graphTargetUsage.ts';
import {
  finalizeCommonBuffDefinitions,
  finalizeDefinitionResources,
} from '../../src/compiler/finalizeDefinitions.ts';
import { validateActionGraphOwner } from '../../../../src/core/action-graph/actionGraphValidation.ts';
import type { SkillDefinition } from '../../src/compiler/intermediateDefinitions.ts';
import type { ActionGraphStep } from '../../src/compiler/intermediateDefinitions.ts';
import type { ActionGraphResourceDefinition } from '../../src/compiler/intermediateDefinitions.ts';
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
  it('干员实体初值只证明自己的技能读取安全，不越过子资源边界', () => {
    const graph = createActionGraphBuilder();
    const sequence = graph.sequence([
      {
        kind: 'switch',
        parameters: { alwaysNext: true, choice: { kind: 'blackboard', key: 'EntityBB_index' } },
        options: [{ value: { kind: 'constant', value: 0 }, sequence: { $sequence: null } }],
      },
    ]);
    const skill: SkillDefinition = {
      ...skillFixture({
        key: 'empty-switch',
        timelineBlockFrames: 30,
        scheduledSequences: [],
        actionGraph: { main: { nodes: {} }, macros: {} },
      }),
      scheduledSequences: [{ startFrame: 0, sequence }],
      actionGraph: { main: graph.finish(), macros: {} },
    };
    const result = optimizeResourceGraphs(
      {
        entityBlackboard: { EntityBB_index: 0 },
        skills: [skill],
        abilityEntityDefinitions: { child: { childSkill: skill } },
      },
      'apply',
    ).value;
    expect(Object.values(result.skills[0]!.actionGraph.main.nodes)).toHaveLength(0);
    expect(
      Object.values(result.abilityEntityDefinitions.child.childSkill.actionGraph.main.nodes),
    ).toHaveLength(1);
  });

  it('空 switch 只在返回值无人使用且求值安全时删除', () => {
    const make = (variant: 'empty' | 'declared' | 'guard' | 'condition' | 'missing' | 'keyed') => {
      const graph = createActionGraphBuilder();
      const branch: ActionGraphStep = {
        kind: 'switch',
        ...(variant === 'keyed' ? { key: 'observed' } : {}),
        parameters: {
          choice:
            variant === 'missing' || variant === 'declared'
              ? { kind: 'blackboard', key: 'missing' }
              : { kind: 'constant', value: 1 },
          alwaysNext: false,
        },
        options: [{ value: { kind: 'constant', value: 2 }, sequence: { $sequence: null } }],
      };
      const sequence = graph.sequence([
        branch,
        ...(variant === 'guard'
          ? [
              {
                kind: 'modifyActionValue' as const,
                parameters: {
                  key: 'result',
                  operation: 'assign' as const,
                  value: { kind: 'constant' as const, value: 1 },
                },
              },
            ]
          : []),
      ]);
      return {
        ...(variant === 'declared' ? { blackboard: { missing: 0 } } : {}),
        ...(variant === 'condition'
          ? { condition: sequence }
          : { scheduledSequences: [{ sequence }] }),
        actionGraph: { main: graph.finish(), macros: {} },
      };
    };
    for (const variant of [
      'empty',
      'declared',
      'guard',
      'condition',
      'missing',
      'keyed',
    ] as const) {
      const result = optimizeResourceGraphs(make(variant), 'apply').value;
      const entry =
        'condition' in result ? result.condition : result.scheduledSequences[0]!.sequence;
      expect(entry.$sequence === null, variant).toBe(variant === 'empty' || variant === 'declared');
    }
  });

  it('能力实体不继承父目标组，但出生目标读取仍保护目标查询', () => {
    const make = (usesGroup: boolean) => {
      const graph = createActionGraphBuilder();
      const query = graph.sequence([
        {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'team', selection: { kind: 'controlledOperator' } },
        },
      ]);
      const spawn = graph.sequence([
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'child',
            bornAt: usesGroup ? { kind: 'context', key: 'team' } : { kind: 'owner' },
            dieWhenSourceDies: false,
            inheritActionBlackboard: true,
          },
        },
      ]);
      return {
        key: 'target-groups',
        scheduledSequences: [
          { startFrame: 0, sequence: query },
          { startFrame: 1, sequence: spawn },
        ],
        actionGraph: { main: graph.finish(), macros: {} },
      };
    };
    for (const usesGroup of [false, true]) {
      const result = optimizeResourceGraphs(make(usesGroup), 'apply').value;
      const actions = Object.values(result.actionGraph.main.nodes).map(node => node.action.kind);
      expect(actions.includes('findCharacterTeamTargets')).toBe(usesGroup);
      expect(actions).toContain('spawnAbilityEntity');
    }
    const resource = make(false).actionGraph;
    expect(
      collectUnobservedGraphTargetGroups({ child: { actionGraph: resource } }, resource),
    ).toEqual(new Set(['team']));
    expect(
      collectUnobservedGraphTargetGroups(
        { child: { actionGraph: resource, target: { kind: 'context', key: 'team' } } },
        resource,
      ),
    ).toEqual(new Set());
  });

  it('Buff 传参保留处理器及外部事件读取，未知接收方和缺键求值不裁剪', () => {
    const graph = createActionGraphBuilder();
    const assignments = {
      duration: { kind: 'constant' as const, value: 3 },
      external: { kind: 'constant' as const, value: 4 },
      unused: { kind: 'blackboard' as const, key: 'local' },
      missing: { kind: 'blackboard' as const, key: 'missing' },
    };
    const sequence = graph.sequence([
      {
        kind: 'applyBuff',
        parameters: {
          targets: { kind: 'fixed', target: 'caster' },
          buffs: ['fixture', 'unresolved'].map(buffId => ({
            buffId,
            blackboardAssignments: assignments,
            stringBlackboardAssignments: { unusedText: 'unused' },
            copiedBlackboardAssignments: { unusedCopy: 'local', missingCopy: 'missing' },
          })),
        },
      },
    ]);
    const input = {
      buffDefinitions: {
        fixture: {
          stackingType: 'unlimited' as const,
          durationSeconds: { blackboardKey: 'duration' },
        },
      },
      skill: {
        blackboard: { local: 1 },
        scheduledSequences: [{ sequence }],
        actionGraph: { main: graph.finish(), macros: {} },
      },
    };
    const shared = {
      externalReads: [{ kind: 'eventBuff' as const, key: 'external' }],
      unknownAccess: false,
      commonAbilityEntityDefinitions: {},
    };
    const result = optimizeResourceGraphs(input, 'apply', undefined, { sharedUsage: shared }).value;
    const action = Object.values(result.skill.actionGraph.main.nodes)[0]!.action;
    if (action.kind !== 'applyBuff') throw new Error('expected Buff application');
    expect(action.parameters.buffs[0]).toEqual({
      buffId: 'fixture',
      blackboardAssignments: {
        duration: assignments.duration,
        external: assignments.external,
        missing: assignments.missing,
      },
      copiedBlackboardAssignments: { missingCopy: 'missing' },
    });
    expect(action.parameters.buffs[1]).toEqual({
      buffId: 'unresolved',
      blackboardAssignments: assignments,
      stringBlackboardAssignments: { unusedText: 'unused' },
      copiedBlackboardAssignments: { unusedCopy: 'local', missingCopy: 'missing' },
    });
    expect(
      optimizeResourceGraphs(input, 'apply', undefined, {
        sharedUsage: { ...shared, unknownAccess: true },
      }).value,
    ).toEqual(result);
  });

  it.each(['mergeContextTargets', 'createSpatialPointTargets'] as const)(
    '删除未被读取的 %s 尾部写入，保留其他入口和 Buff 捕获的读取',
    kind => {
      const make = (consumer?: ActionGraphStep, metadata: object = {}) => {
        const graph = createActionGraphBuilder();
        const write = graph.sequence([
          {
            ...(kind === 'mergeContextTargets'
              ? {
                  kind,
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target' as const, target: 'enemy' as const }],
                  },
                }
              : {
                  kind,
                  parameters: {
                    saveToContextKey: 'targets',
                    count: { kind: 'constant' as const, value: 1 },
                  },
                }),
          },
        ]);
        const entries = [write, ...(consumer ? [graph.sequence([consumer])] : [])];
        return {
          ...metadata,
          scheduledSequences: entries.map(sequence => ({ sequence })),
          actionGraph: { main: graph.finish(), macros: {} },
        };
      };
      expect(
        optimizeResourceGraphs(make(), 'apply').value.scheduledSequences[0]!.sequence.$sequence,
      ).toBeNull();
      const read: ActionGraphStep = {
        kind: 'copyContextTargets',
        parameters: { source: { kind: 'context', key: 'targets' }, saveToContextKey: 'copy' },
      };
      for (const definition of [
        make(read),
        make(undefined, { condition: { kind: 'context', contextKey: 'targets' } }),
        make(undefined, {
          capture: {
            [COMPILED_BUFF_CAPTURED_TARGET_GROUPS]: { enemyKeys: ['targets'], zeroSpaceKeys: [] },
          },
        }),
      ]) {
        expect(
          optimizeResourceGraphs(definition, 'apply').value.scheduledSequences[0]!.sequence
            .$sequence,
        ).not.toBeNull();
      }
    },
  );

  it('独立调度可丢弃末尾检查，但条件入口、后续动作和随机抽样仍保留', () => {
    const graph = createActionGraphBuilder();
    const check: ActionGraphStep = {
      kind: 'checkCondition',
      parameters: {
        condition: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['required'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    };
    const tail = graph.sequence([check]);
    const guarded = graph.sequence([
      check,
      {
        kind: 'modifyActionValue',
        parameters: { key: 'result', operation: 'assign', value: { kind: 'constant', value: 1 } },
      },
    ]);
    const random = graph.sequence([
      {
        kind: 'checkCondition',
        parameters: {
          condition: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
        },
      },
    ]);
    const emptyBranch: ActionGraphStep = {
      kind: 'ifElse',
      parameters: { alwaysNext: true },
      condition: { kind: 'checkActionResult', action: tail },
      whenTrue: { $sequence: null },
      whenFalse: { $sequence: null },
    };
    const branch = graph.sequence([emptyBranch]);
    const keyedBranch = graph.sequence([{ ...emptyBranch, key: 'branch' }]);
    const invertedBranch = graph.sequence([
      { kind: 'invertNextResult', parameters: {} },
      emptyBranch,
    ]);
    const branches = optimizeResourceGraphs(
      {
        scheduledSequences: [branch, keyedBranch, invertedBranch].map(sequence => ({
          startFrame: 0,
          sequence,
        })),
        damageModifiers: [{ condition: branch }],
        actionGraph: { main: graph.finish(), macros: {} },
      },
      'apply',
    ).value;
    expect(branches.scheduledSequences[0]!.sequence.$sequence).toBeNull();
    for (const entry of [
      ...branches.scheduledSequences.slice(1).map(item => item.sequence),
      branches.damageModifiers[0]!.condition,
    ]) {
      expect(entry.$sequence).not.toBeNull();
    }
    const owner = {
      scheduledSequences: [tail, guarded, random].map(sequence => ({ startFrame: 0, sequence })),
      damageModifiers: [{ condition: tail }],
      actionGraph: { main: graph.finish(), macros: {} },
    };
    const { value } = optimizeResourceGraphs(owner, 'apply');
    expect(value.scheduledSequences[0]!.sequence.$sequence).toBeNull();
    const timed = optimizeResourceGraphs({ ...owner, naturalDurationFrames: 30 }, 'apply').value;
    expect(timed.naturalDurationFrames).toBe(30);
    expect(timed.scheduledSequences).toEqual(value.scheduledSequences.slice(1));
    const buff = optimizeResourceGraphs(
      {
        ...owner,
        stackingType: 'unlimited',
        lifecycleSequences: { start: [tail, guarded, random] },
        igniteEventResponses: [{ sequences: [tail, guarded, random] }],
      },
      'apply',
    ).value;
    expect(buff.scheduledSequences).toEqual(value.scheduledSequences.slice(1));
    // 同一检查被修正器消费时保留；生命周期和点燃入口只删无用途的纯检查。
    for (const entries of [
      buff.lifecycleSequences.start,
      buff.igniteEventResponses[0]!.sequences,
    ]) {
      expect(entries[0]!.$sequence).toBeNull();
      expect(entries.slice(1)).toEqual(
        value.scheduledSequences.slice(1).map(item => item.sequence),
      );
    }
    expect(buff.damageModifiers[0]!.condition).toEqual(tail);
    for (const entry of [
      value.scheduledSequences[1]!.sequence,
      value.scheduledSequences[2]!.sequence,
      value.damageModifiers[0]!.condition,
    ]) {
      expect(entry.$sequence).not.toBeNull();
      expect(value.actionGraph.main.nodes[entry.$sequence!]!.action.kind).toBe('checkCondition');
    }
  });

  it.each(['ifElse', 'switch'] as const)(
    '%s 分支消失后回收已声明的条件输入，保留有效输出',
    kind => {
      const graph = createActionGraphBuilder();
      const assign = (key: string, value: number): ActionGraphStep => ({
        kind: 'modifyActionValue',
        parameters: { key, operation: 'assign', value: { kind: 'constant', value } },
      });
      const condition = graph.sequence([
        {
          kind: 'checkCondition',
          parameters: {
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'temporary' },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
          },
        },
      ]);
      const sequence = graph.sequence([
        assign('temporary', 1),
        {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'checkActionResult', action: condition },
          whenTrue: graph.sequence([assign('result', 7)]),
          whenFalse: graph.sequence([assign('result', 7)]),
        },
        {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            source: { kind: 'owner' },
            targets: { kind: 'owner' },
            amount: { kind: 'blackboard', key: 'result' },
          },
        },
        ...(kind === 'switch'
          ? [
              {
                kind: 'switch' as const,
                parameters: {
                  alwaysNext: true,
                  choice: { kind: 'blackboard' as const, key: 'temporary', fallback: 0 },
                },
                options: [
                  { value: { kind: 'constant' as const, value: 1 }, sequence: { $sequence: null } },
                ],
              },
            ]
          : []),
      ]);
      const definition: SkillDefinition = {
        ...skillFixture({
          key: 'fixture',
          timelineBlockFrames: 30,
          scheduledSequences: [],
          actionGraph: { main: { nodes: {} }, macros: {} },
        }),
        blackboard: { temporary: 0, result: 0 },
        scheduledSequences: [{ startFrame: 0, sequence }],
        actionGraph: { main: graph.finish(), macros: {} },
      };
      const result = optimizeResourceGraphs(definition, 'apply');
      const actions = Object.values(result.value.actionGraph.main.nodes).map(node => node.action);
      // 初值已声明，移除不影响分支结果的读取不会隐藏缺键错误。
      expect(
        actions.some(action => action.kind === 'checkCondition' || action.kind === 'switch'),
      ).toBe(false);
      expect(
        actions.some(
          action => action.kind === 'modifyActionValue' && action.parameters.key === 'temporary',
        ),
      ).toBe(false);
      expect(result.value.blackboard).toEqual({ result: 0 });
      expect(actions.some(action => action.kind === 'changeResource')).toBe(true);
      expect(result.reports).toHaveLength(1);
      const execute = (skill: SkillDefinition) => {
        const outputs: number[] = [];
        const board = new ActionBlackboard({ temporary: 0, result: 0 });
        const runtime = new CombatActionSequenceRuntime(
          new ActionBlackboardOperationExecutor({
            evaluate: () => true,
            execute(step, context) {
              if (step.kind === 'changeResource')
                outputs.push(
                  typeof step.parameters.amount === 'number'
                    ? step.parameters.amount
                    : resolveActionValueOperand(step.parameters.amount, context!.blackboard),
                );
              return true;
            },
          }),
          { blackboard: board },
        );
        const compiler = createActionGraphCompilation(
          extractResourceDataNodes(skill.actionGraph),
          1,
        );
        const compiled = compiler.compileEntry(skill.scheduledSequences[0]!.sequence, 'fixture');
        compiler.compileAll();
        const program = runtime.createSequence(compiled);
        program.reset({});
        program.executeInstant({});
        return outputs;
      };
      expect(execute(definition)).toEqual([7]);
      expect(execute(result.value)).toEqual(execute(definition));
    },
  );

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
    const result = finalizeDefinitionResources(definition, 'apply');
    expect(result.value).toEqual(definition);
    expect(result.value.actionGraph.macros.middle).toEqual(actionGraph.macros.middle);
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
          kind: 'changeResource',
          key,
          parameters: {
            resource: 'sp',
            source: { kind: 'owner' },
            targets: { kind: 'owner' },
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
          if (step.kind !== 'changeResource') throw new Error('unexpected leaf');
          outputs.push(
            typeof step.parameters.amount === 'number'
              ? step.parameters.amount
              : resolveActionValueOperand(step.parameters.amount, context!.blackboard),
          );
          return true;
        },
      });
      const runtime = new CombatActionSequenceRuntime(executor, { blackboard: board });
      const compiler = createActionGraphCompilation(
        extractResourceDataNodes(definition.actionGraph),
        1,
      );
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
      ...skillFixture({
        key: 'fixture',
        timelineBlockFrames: 30,
        scheduledSequences: [],
        actionGraph: { main: { nodes: {} }, macros: {} },
      }),
      key: 'skill',
      timelineBlockFrames: 30,
      scheduledSequences: resource.entries.map(sequence => ({ startFrame: 0, sequence })),
      actionGraph: resource.actionGraph,
    };
    const result = finalizeDefinitionResources(definition, mode);
    expect(result.report.resourceValues.flatMap(item => item.removedWrites).length).toBeGreaterThan(
      10,
    );
    expect(result.report.programs).toHaveLength(1);
    expect(result.report.before.steps).toBeGreaterThan(10);
    expect(result.report.after.steps).toBe(0);
    expect(result.report.programs.flatMap(item => item.macroCandidates ?? [])).toEqual([]);
    if (mode === 'apply') {
      expect(Object.keys(result.value.actionGraph.macros)).toHaveLength(0);
      expect(result.value.scheduledSequences).toEqual([]);
    } else expect(result.value).toEqual(definition);
    expect(
      finalizeDefinitionResources(definition, 'off', () => {
        throw new Error('关闭优化时不应裁剪');
      }).value,
    ).toEqual(definition);
  });

  it('先去重再提取中间段，报告不替换输入，重复优化保留原调用位置绑定', () => {
    const definition = repeatedMiddleResource();
    const original = structuredClone(definition);
    const off = optimizeResourceGraphs(definition, 'off');
    const report = optimizeResourceGraphs(definition, 'report');
    const applied = optimizeResourceGraphs(definition, 'apply');
    expect(off.value).toEqual(definition);
    expect(report.value).toEqual(definition);
    expect(definition).toEqual(original);
    expect(report.reports.flatMap(item => item.macroCandidates ?? [])).toEqual(
      applied.reports.flatMap(item => item.macroCandidates ?? []),
    );
    expect(Object.keys(applied.value.actionGraph.macros)).toHaveLength(1);
    expect(applied.value.entries).toEqual(definition.entries);
    expect(() => validateFinalOwner(applied.value, 'skill')).not.toThrow();
    const again = optimizeResourceGraphs(applied.value, 'apply');
    expect(again.value).toEqual(applied.value);
    expect(() => validateFinalOwner(again.value, 'skill')).not.toThrow();
  });

  it('多个资源的重复中间段分别提取，各宏只能使用自己的局部节点', () => {
    const result = optimizeResourceGraphs(
      { first: repeatedMiddleResource(), second: repeatedMiddleResource() },
      'apply',
    ).value;
    expect(Object.keys(result.first.actionGraph.macros)).toHaveLength(1);
    expect(Object.keys(result.second.actionGraph.macros)).toHaveLength(1);
    expect(result.first.actionGraph.macros).not.toBe(result.second.actionGraph.macros);
    expect(() => validateFinalOwner(result.first, 'first')).not.toThrow();
    expect(() => validateFinalOwner(result.second, 'second')).not.toThrow();
  });

  it('自动生成的图路径身份不会阻止重复分支合并，且不生成宏', () => {
    const graph = createActionGraphBuilder();
    const first = graph.sequence([
      {
        kind: 'dealDamage',
        key: 'skill:/actionGraph/main/nodes/a/action',
        parameters: { damageType: 'physical', attackScale: 1, tags: [] },
      },
      { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
    ]);
    const second = graph.sequence([
      {
        kind: 'dealDamage',
        key: 'skill:/actionGraph/main/nodes/b/action',
        parameters: { damageType: 'physical', attackScale: 1, tags: [] },
      },
      { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
    ]);
    const definition = {
      scheduledSequences: [{ sequence: first }, { sequence: second }],
      actionGraph: { main: graph.finish(), macros: {} },
    };
    const result = finalizeDefinitionResources(definition, 'apply').value;
    expect(Object.values(result.actionGraph.macros)).toHaveLength(0);
    expect(result.scheduledSequences[0]!.sequence).toEqual(result.scheduledSequences[1]!.sequence);
    expect(Object.values(result.actionGraph.main.nodes).map(node => node.action.kind)).toEqual([
      'markCurrentSkillCanInterrupt',
      'dealDamage',
    ]);
    expect(() => validateFinalOwner(result, 'skill')).not.toThrow();
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
    expect(() => validateFinalOwner(result, 'parent')).not.toThrow();
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
    expect(() => validateFinalOwner(result, 'skill')).not.toThrow();
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
    expect(() => validateFinalOwner(result.first, 'first')).not.toThrow();
    expect(() => validateFinalOwner(result.second, 'second')).not.toThrow();
  });

  it('领域动作树直接失败，不进入转图兜底', () => {
    expect(() => optimizeResourceGraphs({ sequence: { steps: [] } }, 'apply')).toThrow(
      'action trees are no longer supported',
    );
  });

  it('图快照不会被后续构建修改，等价比较沿图引用处理分支', () => {
    const graph = createActionGraphBuilder();
    const first = graph.sequence([{ kind: 'markCurrentSkillCanInterrupt', parameters: {} }]);
    const snapshot = graph.finish();
    const second = graph.sequence([{ kind: 'markCurrentSkillCanInterrupt', parameters: {} }]);
    expect(Object.keys(snapshot.nodes)).toHaveLength(1);
    expect(graph.equivalent(first, second)).toBe(true);
  });
});

function validateFinalOwner(value: { actionGraph: ActionGraphResourceDefinition }, label: string) {
  validateActionGraphOwner(
    { ...value, actionGraph: extractResourceDataNodes(value.actionGraph) },
    label,
  );
}

it('Buff 裁剪保留跨生命周期、参数和外部查询读取，只删除无观察者的变量', () => {
  const graph = createActionGraphBuilder();
  const keys = ['unused', 'duration', 'external', 'later'];
  const start = graph.sequence(
    keys.map(key => ({
      kind: 'modifyActionValue' as const,
      parameters: {
        key,
        operation: 'assign' as const,
        value: { kind: 'constant' as const, value: 4 },
      },
    })),
  );
  const finish = graph.sequence([
    {
      kind: 'setCharacterPassiveUiValue',
      parameters: { target: 'caster', value: { kind: 'blackboard', key: 'later' } },
    },
  ]);
  const definitions = {
    fixture: {
      stackingType: 'unlimited' as const,
      durationSeconds: { blackboardKey: 'duration' },
      blackboard: Object.fromEntries(keys.map(key => [key, 1])),
      actionGraph: { main: graph.finish(), macros: {} },
      lifecycleSequences: { start: [start], finish: [finish] },
    },
  };
  const shared = {
    externalReads: [{ kind: 'eventBuff' as const, key: 'external' }],
    unknownAccess: false,
    commonAbilityEntityDefinitions: {},
  };
  const result = finalizeCommonBuffDefinitions(definitions, 'apply', shared);
  expect(
    optimizeResourceGraphs(definitions, 'apply', undefined, {
      sharedUsage: shared,
      skillInitialKeys: new Map([['fixture', new Set(['unused'])]]),
    }).value.fixture.blackboard,
  ).toEqual({ duration: 1, external: 1, later: 1 });
  expect(result.definitions.fixture!.blackboard).toEqual({ duration: 1, external: 1, later: 1 });
  expect(
    result.report.resourceValues.flatMap(item => item.removedWrites.map(write => write.key)),
  ).toEqual(['unused']);
  expect(
    finalizeCommonBuffDefinitions(definitions, 'apply').definitions.fixture!.blackboard,
  ).toEqual(definitions.fixture.blackboard);
  const unresolved = finalizeCommonBuffDefinitions(definitions, 'apply', {
    ...shared,
    unknownAccess: true,
  });
  expect(unresolved.definitions.fixture!.blackboard).toEqual(
    result.definitions.fixture!.blackboard,
  );
});

it('被动技能跨启用和事件共用变量，保留养成补丁与实体共享值，裁掉无人读取初值', () => {
  const graph = createActionGraphBuilder();
  const enableSequence = graph.sequence([
    {
      kind: 'modifyActionValue',
      parameters: {
        key: 'patched',
        operation: 'assign',
        value: { kind: 'constant', value: 9 },
      },
    },
    {
      kind: 'modifyActionValue',
      parameters: {
        key: 'eventValue',
        operation: 'assign',
        value: { kind: 'constant', value: 3 },
      },
    },
  ]);
  const sequence = graph.sequence([
    {
      kind: 'setCharacterPassiveUiValue',
      parameters: {
        target: 'caster',
        value: { kind: 'blackboard', key: 'eventValue' },
      },
    },
  ]);
  const owner = {
    passiveSkills: [
      {
        key: 'passive',
        blackboard: { unused: 1, patched: 2, eventValue: 0, EntityBB_shared: 4 },
        enableSequence,
        abilityEventResponses: [{ event: 'enterFight', priority: 0, sequence }],
        actionGraph: { main: graph.finish(), macros: {} },
      },
      {
        key: 'other',
        blackboard: { patched: 2 },
        enableSequence: { $sequence: null },
        abilityEventResponses: [],
        actionGraph: { main: { nodes: {} }, macros: {} },
      },
    ],
  };
  const result = optimizeResourceGraphs(owner, 'apply', undefined, {
    passiveInitialKeys: new Map([['passive', new Set(['patched'])]]),
    sharedUsage: {
      externalReads: [],
      unknownAccess: false,
      commonAbilityEntityDefinitions: {},
    },
  });
  expect(result.value.passiveSkills[0]!.blackboard).toEqual({
    patched: 2,
    eventValue: 0,
    EntityBB_shared: 4,
  });
  expect(result.resourceValues[0]!.removedInitialKeys).toEqual(['unused']);
  expect(result.value.passiveSkills[1]!.blackboard).toEqual({});
  expect(result.resourceValues[0]!.removedWrites.map(write => write.key)).toEqual(['patched']);
});

it('Buff 外部读取按资源 ID 和分类标签保护，扩展标签不参与查找', () => {
  const buff = (applyTags: readonly string[], extendTags: readonly string[] = []) => ({
    stackingType: 'unlimited' as const,
    applyTags,
    extendTags,
    blackboard: { byId: 1, byTag: 2, excluded: 3, event: 4, unused: 5 },
    actionGraph: { main: { nodes: {} }, macros: {} },
  });
  const result = finalizeCommonBuffDefinitions(
    {
      wanted: buff(['Combat/Buff/Frozen/Child']),
      other: buff([], ['Combat/Buff/Frozen/Child']),
    },
    'apply',
    {
      unknownAccess: false,
      commonAbilityEntityDefinitions: {},
      externalReads: [
        {
          kind: 'buff',
          target: 'buffOwner',
          query: { kind: 'id', buffIds: ['wanted'] },
          key: 'byId',
        },
        {
          kind: 'buff',
          target: 'buffOwner',
          query: { kind: 'tag', buffTags: ['Combat/Buff/Frozen'], tagQueryType: 'hasAny' },
          key: 'byTag',
        },
        {
          kind: 'buff',
          target: 'buffOwner',
          query: { kind: 'tag', buffTags: ['Combat/Buff/Frozen'], tagQueryType: 'exceptAny' },
          key: 'excluded',
        },
        { kind: 'eventBuff', key: 'event' },
      ],
    },
  );
  expect(result.definitions.wanted!.blackboard).toEqual({ byId: 1, byTag: 2, event: 4 });
  expect(result.definitions.other!.blackboard).toEqual({ excluded: 3, event: 4 });
});
