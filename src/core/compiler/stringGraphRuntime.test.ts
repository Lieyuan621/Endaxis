import { describe, expect, it, vi } from 'vitest';
import type {
  ActionGraphDataNode,
  ActionGraphDefinition,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import type { ActionStringOperand } from '../../../packages/game-data-contract/src/primitives';
import { createGraphDataResolver, resolveGraphData } from '../action-graph/actionGraphData';
import { ActionBlackboard } from '../combat/actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../combat/actions/combatActionSequenceRuntime';
import { CombatAttributeSet } from '../combat/attributes/combatAttributes';
import {
  BuffOperationExecutor,
  type BuffApplicationRequest,
} from '../combat/buffs/buffOperationExecutor';
import { CombatBuffContainer } from '../combat/buffs/combatBuffs';
import { StateStepper } from '../combat/runtime/stateStepper';
import {
  SkillCastOperationExecutor,
  type SkillCastOperationExecutorDependencies,
} from '../combat/skills/skillCastOperationExecutor';
import { TimedMarkerOperationExecutor } from '../combat/status/timedMarkerOperationExecutor';
import { TimedMarkerContainer } from '../combat/status/timedMarkers';
import { CombatClock } from '../combat/time/combatClock';
import { validateActionGraphActions } from '../game-data/validation/actionPrograms';
import { validateActionStringOperand } from '../game-data/validation/definitionValues';
import { createActionGraphCompilation } from './compileActionGraph';

const delegate = { execute: () => false, evaluate: () => false };
const reference = { kind: 'stringNode', nodeId: 'read' } as const;
const read: ActionGraphDataNode = { type: 'string', expression: { blackboardKey: 'id' } };
function cast(skillId: ActionStringOperand = reference): ActionGraphStep {
  return {
    kind: 'castSkillDuringAction',
    parameters: {
      skillId,
      target: 'enemy',
      skipApplyCost: false,
      inheritSourceSkillCastInfo: false,
    },
  };
}
function graph(action: ActionGraphStep = cast()): ActionGraphDefinition {
  return { nodes: { entry: { action, next: null } }, dataNodes: { read } };
}
function execute(
  source: ActionGraphDefinition | ActionGraphResourceDefinition,
  board: ActionBlackboard,
) {
  const request = vi.fn();
  const executor = new SkillCastOperationExecutor({ casterId: 'caster', request, delegate });
  const compilation = createActionGraphCompilation(source, 1);
  const entry = compilation.compileEntry({ $sequence: 'entry' }, 'test');
  new CombatActionSequenceRuntime(executor, { blackboard: board })
    .createSequence(entry)
    .executeInstant({});
  return request.mock.calls.map(([request]) => request.nativeSkillId);
}

describe('字符串数据图绑定与契约边界', () => {
  it('旧内联与黑板引用原样 round-trip，混合输入不迁移为另一种表达式', () => {
    const old: ActionGraphDefinition = {
      nodes: {
        entry: { action: cast('literal'), next: 'dynamic' },
        dynamic: { action: cast({ blackboardKey: 'id' }), next: null },
      },
    };
    const saved = JSON.stringify(old);
    expect(resolveGraphData(JSON.parse(saved))).toEqual(old);
    expect(JSON.stringify(old)).toBe(saved);
    const mixed: ActionGraphDefinition = {
      ...old,
      dataNodes: { read },
      nodes: { ...old.nodes, connected: { action: cast(), next: null } },
    };
    expect(validateActionGraphActions(JSON.parse(JSON.stringify(mixed)), 'graph')).toEqual([]);
    expect(execute(old, new ActionBlackboard({ id: 'current' }))).toEqual(['literal', 'current']);
    expect(mixed.nodes.dynamic!.action).toEqual(old.nodes.dynamic!.action);
  });

  it('字符串链只共享定义，编译前后不读取黑板或缓存结果', () => {
    const source: ActionGraphDefinition = {
      nodes: { entry: { action: cast(), next: 'second' }, second: { action: cast(), next: null } },
      dataNodes: {
        read: { type: 'string', expression: { kind: 'stringNode', nodeId: 'source' } },
        source: read,
      },
    };
    const bound = resolveGraphData(source);
    const first = bound.nodes.entry!.action;
    const second = bound.nodes.second!.action;
    if (first.kind !== 'castSkillDuringAction' || second.kind !== 'castSkillDuringAction')
      throw new Error('fixture');
    expect(first.parameters.skillId).toBe(second.parameters.skillId);
    expect(first.parameters.skillId).toEqual({ blackboardKey: 'id' });
    const board = new ActionBlackboard({ id: 'first' });
    const getString = vi.spyOn(board, 'getString');
    const request = vi.fn<SkillCastOperationExecutorDependencies['request']>(() =>
      board.assign({ id: 'second' }),
    );
    const executor = new SkillCastOperationExecutor({ casterId: 'caster', request, delegate });
    const entry = createActionGraphCompilation(source, 1).compileEntry(
      { $sequence: 'entry' },
      'test',
    );
    expect(getString).not.toHaveBeenCalled();
    new CombatActionSequenceRuntime(executor, { blackboard: board })
      .createSequence(entry)
      .executeInstant({});
    expect(request.mock.calls.map(([request]) => request.nativeSkillId)).toEqual([
      'first',
      'second',
    ]);
    expect(getString).toHaveBeenCalledTimes(2);
  });

  it('同一表达式在父、局部和其他执行上下文分别读取当前字符串，不做转换或裁剪', () => {
    const source = graph();
    const parent = new ActionBlackboard({ id: 'parent' });
    const local = parent.createLocalScope({ id: ' local / 名称 ' }, false);
    expect(execute(source, parent)).toEqual(['parent']);
    expect(execute(source, local)).toEqual([' local / 名称 ']);
    parent.assign({ id: 'changed' });
    expect(execute(source, parent)).toEqual(['changed']);
    expect(execute(source, local)).toEqual([' local / 名称 ']);
    for (const value of [undefined, 7, '']) {
      expect(() =>
        execute(source, new ActionBlackboard(value === undefined ? {} : { id: value })),
      ).toThrow('is missing');
    }
  });

  it('主图、名为 main 的宏和独立资源的同名字符串节点各自绑定', () => {
    const child: ActionGraphResourceDefinition = {
      main: { ...graph(), dataNodes: { read: { type: 'string', expression: 'child' } } },
      macros: {},
    };
    const source: ActionGraphResourceDefinition = {
      main: {
        nodes: {
          entry: { action: cast(), next: 'macro' },
          macro: { action: { kind: 'callMacro', macroId: 'main' }, next: 'child' },
          child: {
            action: {
              kind: 'callResource',
              resource: { id: 'child', actionGraph: child, entry: { $sequence: 'entry' } },
            },
            next: null,
          },
        },
        dataNodes: { read: { type: 'string', expression: 'main' } },
      },
      macros: {
        main: {
          entry: { $sequence: 'entry' },
          graph: { ...graph(), dataNodes: { read: { type: 'string', expression: 'macro' } } },
        },
      },
    };
    expect(validateActionGraphActions(source, 'resource')).toEqual([]);
    expect(execute(source, new ActionBlackboard())).toEqual(['main', 'macro', 'child']);
    const missing: ActionGraphResourceDefinition = {
      ...source,
      macros: { main: { entry: { $sequence: 'entry' }, graph: { nodes: graph().nodes } } },
    };
    expect(() => createActionGraphCompilation(missing, 1)).toThrow('missing string data node');
    const missingChild = { ...child, main: { nodes: graph().nodes } };
    expect(() =>
      createActionGraphCompilation(
        {
          ...graph({
            kind: 'callResource',
            resource: { id: 'child', actionGraph: missingChild, entry: { $sequence: 'entry' } },
          }),
        },
        1,
      ),
    ).toThrow('missing string data node');
  });

  it.each([
    ['missing reference', { kind: 'stringNode', nodeId: 'missing' }, 'missing string'],
    ['empty identity', { kind: 'stringNode', nodeId: '' }, 'invalid data node reference'],
    ['missing identity', { kind: 'stringNode' }, 'invalid data node reference'],
    ['numeric identity', { kind: 'stringNode', nodeId: 2 }, 'invalid data node reference'],
    [
      'resource-shaped extra field',
      { kind: 'stringNode', nodeId: 'read', actionGraph: {} },
      'invalid data node reference',
    ],
    [
      'extra fields',
      { kind: 'stringNode', nodeId: 'read', blackboardKey: 'id' },
      'invalid data node reference',
    ],
  ])('拒绝 %s', (_name, value, message) => {
    const source = graph(cast(value as ActionStringOperand));
    expect(() => resolveGraphData(source)).toThrow(String(message));
    expect(validateActionGraphActions(source, 'graph')).not.toEqual([]);
  });

  it.each([
    null,
    12,
    true,
    '',
    {},
    [],
    { blackboardKey: '' },
    { blackboardKey: 'id', fallback: 'value' },
    { kind: 'unknownString', blackboardKey: 'id' },
    { kind: 'constant', value: 'text' },
  ])('拒绝未知或错误字符串表达式 %j', expression => {
    const source = {
      ...graph(),
      dataNodes: { read: { type: 'string', expression } },
    } as ActionGraphDefinition;
    expect(() => resolveGraphData(source)).toThrow('expected a non-empty string');
    expect(validateActionGraphActions(source, 'graph')).not.toEqual([]);
  });

  it('拒绝未知数据类型、数据环与 number/boolean 冒充 string', () => {
    for (const node of [
      { type: 'unknown', expression: 'string' },
      { type: 'number', expression: { kind: 'constant', value: 3 } },
      { type: 'boolean', expression: { kind: 'constant', value: true } },
    ]) {
      expect(() =>
        resolveGraphData({ ...graph(), dataNodes: { read: node as ActionGraphDataNode } }),
      ).toThrow();
    }
    const cycle: ActionGraphDefinition = {
      nodes: {},
      dataNodes: {
        read: { type: 'string', expression: { kind: 'stringNode', nodeId: 'other' } },
        other: { type: 'string', expression: reference },
      },
    };
    expect(() => resolveGraphData(cycle)).toThrow('recursive data graph');
    const resolver = createGraphDataResolver(cycle);
    expect(() => resolver.node('read', 'string')).toThrow('recursive');
    expect(() => resolver.node('read', 'string')).toThrow('recursive');
    expect(() => createGraphDataResolver(graph()).node('read', 'number')).toThrow(
      'expected number',
    );
  });

  it.each([
    {
      kind: 'modifyActionValue',
      parameters: { key: 'out', operation: 'assign', value: reference },
    },
    {
      kind: 'modifyActionValue',
      parameters: { key: reference, operation: 'assign', value: { kind: 'constant', value: 1 } },
    },
    { kind: 'changeSkillSlot', parameters: { skillId: reference } },
    {
      kind: 'applyBuff',
      parameters: {
        buffId: 'buff',
        target: 'caster',
        stringBlackboardAssignments: { output: reference },
      },
    },
    { kind: 'callMacro', macroId: 'macro', arguments: { amount: reference } },
    {
      kind: 'conditional',
      parameters: { condition: reference },
      whenTrue: { $sequence: null },
      whenFalse: { $sequence: null },
    },
  ])('禁止把字符串引用接入数值、条件、静态身份、写目标或宏参数：%j', action => {
    const source = graph(action as unknown as ActionGraphStep);
    expect(() => resolveGraphData(source)).toThrow('only allowed in an ActionStringOperand');
    expect(() => createActionGraphCompilation(source, 1)).toThrow(
      'only allowed in an ActionStringOperand',
    );
  });

  it.each(['valueNode', 'conditionNode'] as const)(
    '字符串输入拒绝 %s 引用，即便节点声明已损坏',
    kind => {
      const source = graph(cast({ kind, nodeId: 'wrong' } as unknown as ActionStringOperand));
      const configured = {
        ...source,
        dataNodes: {
          wrong: { type: kind === 'valueNode' ? 'number' : 'boolean', expression: 'forged string' },
        },
      } as unknown as ActionGraphDefinition;
      expect(() => createActionGraphCompilation(configured, 1)).toThrow(
        'string input expects a stringNode',
      );
    },
  );

  it.each([
    { kind: 'unknownStringNode', nodeId: 'read' },
    { blackboardKey: 'id', nodeId: 'read' },
    { blackboardKey: 'id', actionGraph: {} },
  ])('字符串输入的未知或混合格式必须在编译边界拒绝：%j', value => {
    expect(() =>
      createActionGraphCompilation(graph(cast(value as ActionStringOperand)), 1),
    ).toThrow('expected a non-empty string');
  });

  it('无所属图的未绑定引用和混合旧对象不能被字符串操作数校验静默接受', () => {
    for (const value of [
      reference,
      { blackboardKey: 'id', kind: 'unknown' },
      { blackboardKey: 'id', extra: 1 },
    ]) {
      const issues: Parameters<typeof validateActionStringOperand>[2] = [];
      validateActionStringOperand(value, 'operand', issues);
      expect(issues.length).toBeGreaterThan(0);
    }
  });
});

describe('字符串数据图实际消费与切面恢复', () => {
  it('Buff 每次施加动态查目录；第一个应用修改黑板时后续次数读到新 ID', () => {
    const board = new ActionBlackboard({ id: 'first' });
    const apply = vi.fn((_request: BuffApplicationRequest) => {
      board.assign({ id: 'second' });
      return true;
    });
    const target = Object.assign(new CombatBuffContainer('caster', new CombatAttributeSet()), {
      apply,
    });
    const lookup = vi.fn((_id: string) => ({ stackingType: 'unique' as const }));
    const executor = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => target,
      resolveBuffDefinition: lookup,
      delegate,
    });
    const source = graph({
      kind: 'applyBuff',
      parameters: { target: 'caster', buffId: reference, count: { kind: 'constant', value: 2 } },
    });
    expect(validateActionGraphActions(source, 'graph')).toEqual([]);
    const entry = createActionGraphCompilation(source, 1).compileEntry(
      { $sequence: 'entry' },
      'buff',
    );
    new CombatActionSequenceRuntime(executor, { blackboard: board })
      .createSequence(entry)
      .executeInstant({});
    expect(lookup.mock.calls.map(([id]) => id)).toEqual(['first', 'second']);
    expect(apply).toHaveBeenCalledTimes(2);
    expect(() =>
      executor.execute(
        { kind: 'applyBuff', parameters: { target: 'caster', buffId: reference } },
        { blackboard: board },
      ),
    ).toThrow('unbound string data node');
    const bad = graph({
      kind: 'applyBuff',
      parameters: { target: 'caster', buffId: reference, durationSeconds: 1 },
    });
    expect(
      validateActionGraphActions(bad, 'graph').some(issue =>
        issue.message.includes('动态 Buff ID'),
      ),
    ).toBe(true);
  });

  it('普通和实体标记条件在 boolean 数据节点内部绑定字符串输入，静态冷却 ID 保持不能接线', () => {
    const source = graph({
      kind: 'conditional',
      parameters: { condition: { kind: 'conditionNode', nodeId: 'condition' } },
      whenTrue: { $sequence: null },
      whenFalse: { $sequence: null },
    });
    for (const kind of ['timedMarkerPresent', 'abilityEntityTimedMarkerPresent'] as const) {
      const configured: ActionGraphDefinition = {
        ...source,
        dataNodes: {
          ...source.dataNodes,
          condition: {
            type: 'boolean',
            expression:
              kind === 'timedMarkerPresent'
                ? { kind, markerId: reference, target: 'caster' }
                : { kind, markerId: reference },
          },
        },
      };
      expect(validateActionGraphActions(configured, 'graph')).toEqual([]);
      const action = resolveGraphData(configured).nodes.entry!.action;
      expect(action).toMatchObject({
        parameters: { condition: { markerId: { blackboardKey: 'id' } } },
      });
    }
    const bad = graph({
      kind: 'setGlobalCooldown',
      parameters: {
        target: 'caster',
        markerId: reference,
        durationSeconds: { kind: 'constant', value: 1 },
      },
    } as unknown as ActionGraphStep);
    expect(() => resolveGraphData(bad)).toThrow('only allowed');
  });

  it('恢复后不重放已完成字符串消费，待执行动作读取恢复分支的新黑板', () => {
    const source: ActionGraphDefinition = {
      ...graph(),
      nodes: { entry: { action: cast(), next: null }, later: { action: cast(), next: null } },
    };
    const compiler = createActionGraphCompilation(source, 1, 'string-checkpoint');
    const actions = [
      {
        startFrame: 0,
        endFrame: 1,
        sequence: compiler.compileEntry({ $sequence: 'entry' }, 'early'),
      },
      {
        startFrame: 2,
        endFrame: 3,
        sequence: compiler.compileEntry({ $sequence: 'later' }, 'late'),
      },
    ];
    const board = new ActionBlackboard({ id: 'before' });
    const request = vi.fn();
    const executor = new SkillCastOperationExecutor({ casterId: 'caster', request, delegate });
    const timeline = new CombatActionSequenceRuntime(executor, {
      blackboard: board,
    }).createTimeline(actions);
    timeline.reset({});
    timeline.tick(0, 1 / 30, {});
    expect(request.mock.calls.map(([request]) => request.nativeSkillId)).toEqual(['before']);
    const saved = new StateStepper(
      { board: board.runtimeState, timeline: timeline.runtimeState },
      () => undefined,
    ).read();
    const restoredBoard = ActionBlackboard.bindRuntimeState(saved.board);
    const restoredRequest = vi.fn();
    const restoredExecutor = new SkillCastOperationExecutor({
      casterId: 'caster',
      request: restoredRequest,
      delegate,
    });
    const restored = new CombatActionSequenceRuntime(restoredExecutor, {
      blackboard: restoredBoard,
    }).createTimeline(actions, {}, saved.timeline);
    expect(restoredRequest).not.toHaveBeenCalled();
    restoredBoard.assign({ id: 'restored' });
    board.assign({ id: 'original' });
    restored.tick(2, 1 / 30, {});
    expect(restoredRequest.mock.calls.map(([request]) => request.nativeSkillId)).toEqual([
      'restored',
    ]);
    timeline.tick(2, 1 / 30, {});
    expect(request.mock.calls.map(([request]) => request.nativeSkillId)).toEqual([
      'before',
      'original',
    ]);
  });

  it('图创建的动态标记恢复并结束时按保存实例清理，不按修改后的字符串误删', () => {
    const source = graph({
      kind: 'createTimedMarker',
      parameters: {
        target: 'caster',
        markerId: reference,
        durationSeconds: { kind: 'constant', value: 10 },
        autoFinishByAction: true,
      },
    });
    const entry = createActionGraphCompilation(source, 1).compileEntry(
      { $sequence: 'entry' },
      'marker',
    );
    const clock = new CombatClock();
    const markers = new TimedMarkerContainer('caster', clock);
    const executor = new TimedMarkerOperationExecutor({
      resolveTarget: () => markers,
      resolveEventTarget: () => markers,
      delegate,
    });
    const board = new ActionBlackboard({ id: 'original-id' });
    const runtime = new CombatActionSequenceRuntime(executor, { blackboard: board });
    const running = runtime.createSequence(entry);
    running.tryExecute({});
    expect(markers.has('original-id')).toBe(true);
    const saved = new StateStepper(
      {
        clock: clock.runtimeState,
        markers: markers.runtimeState,
        executor: executor.runtimeState,
        board: board.runtimeState,
        execution: running.runtimeState,
      },
      () => undefined,
    ).read();
    const restoredClock = new CombatClock(saved.clock);
    const restoredMarkers = new TimedMarkerContainer('caster', restoredClock, {}, saved.markers);
    const restoredExecutor = new TimedMarkerOperationExecutor(
      { resolveTarget: () => restoredMarkers, resolveEventTarget: () => restoredMarkers, delegate },
      { state: saved.executor, programs: executor.programs },
    );
    const restoredBoard = ActionBlackboard.bindRuntimeState(saved.board);
    restoredBoard.assign({ id: 'replacement-id' });
    restoredMarkers.add('replacement-id', 10);
    const restored = new CombatActionSequenceRuntime(restoredExecutor, {
      blackboard: restoredBoard,
    }).createSequence(entry, undefined, saved.execution);
    restored.end({});
    expect(restoredMarkers.has('original-id')).toBe(false);
    expect(restoredMarkers.has('replacement-id')).toBe(true);
    expect(markers.has('original-id')).toBe(true);
  });
});
