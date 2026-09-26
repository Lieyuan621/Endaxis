import { describe, expect, it, vi } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphResourceDefinition,
} from '../../../../packages/game-data-contract/src/actionGraph';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import { ActionBlackboard } from './actionBlackboard';
import { CombatActionSequenceRuntime } from './combatActionSequenceRuntime';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { AbilitySystemRuntime } from '../abilities/abilitySystemRuntime';
import { SkillSlotOperationExecutor } from '../skills/skillSlotOperationExecutor';
import { ActionBlackboardOperationExecutor } from './actionBlackboardOperationExecutor';
import { CombatOperationPrograms } from './combatOperationPrograms';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { createNativeEventFixture } from '../events/nativeEventTestFixture';

const graph: ActionGraphDefinition = {
  nodes: {
    first: {
      action: {
        kind: 'setContextFlag',
        parameters: { flag: 'first', value: true, target: 'caster' },
      },
      next: 'damage',
    },
    second: {
      action: {
        kind: 'setContextFlag',
        parameters: { flag: 'second', value: true, target: 'caster' },
      },
      next: 'damage',
    },
    damage: {
      action: {
        kind: 'dealDamage',
        parameters: { damageType: 'physical', attackScale: [1, 2], tags: [] },
      },
      next: null,
    },
  },
};

function fixture(execute?: CombatOperationExecutor['execute']) {
  const operations: CombatOperationExecutor = {
    execute: vi.fn(execute ?? (() => true)),
    evaluate: () => true,
    prepare: vi.fn(),
    end: vi.fn(),
  };
  return {
    operations,
    runtime: new CombatActionSequenceRuntime(operations, { blackboard: new ActionBlackboard() }),
  };
}

describe('直接图执行', () => {
  it('外部资源使用自己的同名节点，执行和恢复均不借用调用方图', () => {
    const child: ActionGraphResourceDefinition = {
      main: {
        nodes: {
          entry: {
            action: {
              kind: 'dealDamage',
              parameters: { damageType: 'physical', attackScale: 7, tags: [] },
            },
            next: null,
          },
        },
      },
      macros: {},
    };
    const parent: ActionGraphResourceDefinition = {
      main: {
        nodes: {
          entry: {
            action: {
              kind: 'callResource',
              resource: { id: 'callback', actionGraph: child, entry: { $sequence: 'entry' } },
            },
            next: null,
          },
        },
      },
      macros: {},
    };
    const compilation = createActionGraphCompilation(parent, 1);
    const entry = compilation.compileEntry({ $sequence: 'entry' }, 'launch');
    expect(entry.graph.nodes.size).toBe(1);
    const original = fixture();
    const running = original.runtime.createSequence(entry);
    running.tryExecute({});
    expect(original.operations.execute).toHaveBeenCalledTimes(1);
    expect(vi.mocked(original.operations.execute).mock.calls[0]![0]).toMatchObject({
      kind: 'dealDamage',
      parameters: { attackScale: 7 },
    });
    const restored = fixture();
    const resumed = restored.runtime.createSequence(
      entry,
      undefined,
      structuredClone(running.runtimeState),
    );
    expect(restored.operations.execute).not.toHaveBeenCalled();
    resumed.end({});
    expect(restored.operations.end).toHaveBeenCalledTimes(1);
  });
  it('两处宏调用共用内部程序，但执行状态、伤害身份和恢复分别绑定', () => {
    const resource: ActionGraphResourceDefinition = {
      main: {
        nodes: {
          first: { action: { kind: 'callMacro', macroId: 'hit' }, next: 'second' },
          second: { action: { kind: 'callMacro', macroId: 'hit' }, next: null },
        },
      },
      macros: {
        hit: {
          entry: { $sequence: 'first' },
          graph: {
            nodes: {
              first: {
                action: {
                  kind: 'dealDamage',
                  parameters: { damageType: 'physical', attackScale: 1, tags: [] },
                },
                next: null,
              },
            },
          },
        },
      },
    };
    const compilation = createActionGraphCompilation(resource, 1, 'macro-test');
    const entry = compilation.compileEntry({ $sequence: 'first' }, 'skill:start');
    expect(entry.graph.nodes.size).toBe(3);
    expect(Object.keys(resource.main.nodes)).toEqual(['first', 'second']);
    expect(Object.keys(resource.macros.hit!.graph.nodes)).toEqual(['first']);
    const original = fixture();
    const running = original.runtime.createSequence(entry);
    running.tryExecute({});
    const hits = vi.mocked(original.operations.execute).mock.calls.map(([action]) => action);
    expect(hits).toHaveLength(2);
    expect(hits[0]!.key).not.toBe(hits[1]!.key);
    if (!('nodes' in running.runtimeState)) throw new Error('expected graph execution state');
    const states = [...running.runtimeState.nodes.values()].map(node => node.data);
    expect(states).toHaveLength(2);
    expect(states.every(state => state.kind === 'graphMacro')).toBe(true);
    if (states[0]?.kind !== 'graphMacro' || states[1]?.kind !== 'graphMacro')
      throw new Error('macro state is missing');
    expect(states[0].body).not.toBe(states[1].body);
    const restored = fixture();
    const resumed = restored.runtime.createSequence(
      entry,
      undefined,
      structuredClone(running.runtimeState),
    );
    expect(restored.operations.execute).not.toHaveBeenCalled();
    resumed.end({});
    expect(restored.operations.end).toHaveBeenCalledTimes(2);
  });

  it('不同技能入口复用同一图时，宿主内相同调用编号不混用操作身份', () => {
    const program = createActionGraphCompilation(graph, 1).compileAll();
    const first = fixture();
    const second = fixture();
    const firstEntry = { graph: program, entry: 'damage', callSite: 'skill-a:start' };
    const secondEntry = { graph: program, entry: 'damage', callSite: 'skill-b:start' };
    const firstCall = first.runtime.createSequence(firstEntry);
    const secondCall = second.runtime.createSequence(secondEntry);
    firstCall.execute({});
    secondCall.execute({});
    const firstOperation = vi.mocked(first.operations.execute).mock.calls[0]![0];
    const secondOperation = vi.mocked(second.operations.execute).mock.calls[0]![0];
    expect(firstOperation).not.toBe(secondOperation);
    expect(firstOperation.key).not.toBe(secondOperation.key);
    const restored = fixture();
    const restoredCall = restored.runtime.createSequence(
      firstEntry,
      undefined,
      structuredClone(firstCall.runtimeState),
    );
    expect(restored.operations.execute).not.toHaveBeenCalled();
    restoredCall.end({});
    expect(vi.mocked(restored.operations.end!).mock.calls[0]![0]).toBe(firstOperation);
  });

  it('正式区间调度器直接消费图入口，恢复乱序调度表不重放已执行节点', () => {
    const program = createActionGraphCompilation(graph, 1, 'timeline-graph').compileAll();
    const actions = [
      {
        startFrame: 5,
        endFrame: 8,
        sequence: { graph: program, entry: 'first', callSite: 'late' },
      },
      {
        startFrame: 0,
        endFrame: 2,
        sequence: { graph: program, entry: 'first', callSite: 'early' },
      },
    ];
    const original = fixture();
    const timeline = original.runtime.createTimeline(actions);
    timeline.reset({});
    timeline.tick(0, 1 / 30, {});
    expect(original.operations.execute).toHaveBeenCalledTimes(2);
    const saved = structuredClone(timeline.runtimeState);
    expect(
      saved.sequences.map(sequence => {
        if (!('nodes' in sequence)) throw new Error('expected graph state');
        return sequence.invocation;
      }),
    ).toEqual(['call:2', 'call:1']);
    const restored = fixture();
    const resumed = restored.runtime.createTimeline(actions, {}, saved);
    expect(restored.operations.execute).not.toHaveBeenCalled();
    expect(restored.operations.prepare).not.toHaveBeenCalled();
    expect(restored.operations.end).not.toHaveBeenCalled();
    resumed.tick(2, 1 / 30, {});
    expect(restored.operations.execute).not.toHaveBeenCalled();
    expect(restored.operations.end).toHaveBeenCalledTimes(2);
    resumed.tick(5, 1 / 30, {});
    expect(restored.operations.execute).toHaveBeenCalledTimes(2);
    expect(original.operations.execute).toHaveBeenCalledTimes(2);
    resumed.tick(8, 1 / 30, {});
    expect(resumed.isComplete).toBe(true);
    expect(timeline.isComplete).toBe(false);
  });
  it('图内结束时间线同步终止后续操作，跳转恢复不重复发出请求', () => {
    const source: ActionGraphDefinition = {
      nodes: {
        finish: { action: { kind: 'finishTimeline', parameters: {} }, next: 'damage' },
        jump: {
          action: { kind: 'jumpTimeline', parameters: { destinationFrame: 30 } },
          next: null,
        },
        damage: graph.nodes.damage!,
      },
    };
    const program = createActionGraphCompilation(source, 1, 'timeline').compileAll();
    const execute = vi.fn(() => true);
    const jump = vi.fn();
    let finish = () => {};
    const context = {
      blackboard: new ActionBlackboard(),
      requestTimelineFinish: () => finish(),
      requestTimelineJump: jump,
    };
    const runtime = new CombatActionSequenceRuntime({ execute, evaluate: () => true }, context);
    const execution = runtime.createGraphSequence(program, 'finish', 'finish-root');
    finish = () => execution.end({});
    execution.tryExecute({});
    expect(execute).not.toHaveBeenCalled();
    const jumping = runtime.createGraphSequence(program, 'jump', 'jump-root');
    jumping.tryExecute({});
    expect(jump).toHaveBeenCalledExactlyOnceWith(30);
    const resumed = runtime.createGraphSequence(
      program,
      'jump',
      'jump-root',
      context,
      structuredClone(jumping.runtimeState),
    );
    resumed.tick(1 / 30, {});
    resumed.tick(1 / 30, {});
    expect(jump).toHaveBeenCalledTimes(1);
  });
  it('逐目标调用共享静态 once 位置但隔离动态进度，恢复后按目标结束', () => {
    const source: ActionGraphDefinition = {
      nodes: {
        loop: {
          action: {
            kind: 'forEachContextTarget',
            parameters: { contextKey: 'items' },
            body: { $sequence: 'once' },
          },
          next: null,
        },
        once: {
          action: { kind: 'once', parameters: {}, body: { $sequence: 'onceBody' } },
          next: 'active',
        },
        onceBody: { ...graph.nodes.first!, next: null },
        active: { ...graph.nodes.second!, next: null },
      },
    };
    const program = createActionGraphCompilation(source, 1, 'target-loop').compileAll();
    const targets = new RuntimeTargetContext();
    targets.set('items', [
      { kind: 'abilityEntity', instanceId: 1 },
      { kind: 'abilityEntity', instanceId: 2 },
    ]);
    const make = () => {
      const seen: string[] = [];
      return {
        seen,
        runtime: new CombatActionSequenceRuntime(
          {
            evaluate: () => true,
            execute: (step, context) => {
              seen.push(
                `execute:${step.kind === 'setContextFlag' ? step.parameters.flag : step.kind}:${context?.currentTarget?.kind === 'abilityEntity' ? context.currentTarget.instanceId : 0}`,
              );
              return true;
            },
            end: (step, context) => {
              seen.push(
                `end:${step.kind === 'setContextFlag' ? step.parameters.flag : step.kind}:${context?.currentTarget?.kind === 'abilityEntity' ? context.currentTarget.instanceId : 0}`,
              );
            },
          },
          { blackboard: new ActionBlackboard(), targetContext: targets },
        ),
      };
    };
    const first = make();
    const execution = first.runtime.createGraphSequence(program, 'loop', 'root');
    execution.tryExecute({});
    expect(first.seen).toEqual([
      'execute:first:1',
      'end:first:1',
      'execute:second:1',
      'execute:second:2',
    ]);
    const loop = execution.runtimeState.nodes.get('loop')!.data;
    if (loop.kind !== 'graphTargets') throw new Error('expected target loop');
    const [a, b] = [...loop.loop.bodies.values()].map(body => body.sequence);
    expect(a!.callSite).toBe(b!.callSite);
    expect(a!.invocation).not.toBe(b!.invocation);
    targets.set('items', []);
    const restored = make();
    const resumed = restored.runtime.createGraphSequence(
      program,
      'loop',
      'root',
      undefined,
      structuredClone(execution.runtimeState),
    );
    expect(restored.seen).toEqual([]);
    resumed.end({});
    expect(restored.seen).toEqual(['end:second:1', 'end:second:2']);
    expect(loop.loop.activeBodies).toEqual([1, 2]);
  });

  it('多目标循环内匿名伤害共享静态身份，目标由回执目标区分而非 stepKey', () => {
    // 锁定现有语义：callSite 不含动态目标实例号，同一匿名 dealDamage 对每个目标产生相同 key；
    // 逐目标区分依赖回执 targetId，命中详情按 hitId(+帧) 合并查看是文档化行为。
    // 若未来需要逐目标伤害身份，必须同步改 callSite 构造与命中预览，而不是依赖本断言空缺。
    const source: ActionGraphDefinition = {
      nodes: {
        loop: {
          action: {
            kind: 'forEachContextTarget',
            parameters: { contextKey: 'items' },
            body: { $sequence: 'hit' },
          },
          next: 'outside',
        },
        hit: {
          action: {
            kind: 'dealDamage',
            parameters: { damageType: 'physical', attackScale: 1, tags: [] },
          },
          next: null,
        },
        outside: {
          action: {
            kind: 'dealDamage',
            parameters: { damageType: 'physical', attackScale: 1, tags: [] },
          },
          next: null,
        },
      },
    };
    const program = createActionGraphCompilation(source, 1, 'target-hit-key').compileAll();
    const targets = new RuntimeTargetContext();
    targets.set('items', [
      { kind: 'abilityEntity', instanceId: 1 },
      { kind: 'abilityEntity', instanceId: 2 },
    ]);
    const operations: CombatOperationExecutor = {
      execute: vi.fn(() => true),
      evaluate: () => true,
      end: vi.fn(),
    };
    const runtime = new CombatActionSequenceRuntime(operations, {
      blackboard: new ActionBlackboard(),
      targetContext: targets,
    });
    runtime.createGraphSequence(program, 'loop', 'root').tryExecute({});
    const calls = vi.mocked(operations.execute).mock.calls.map(([step, context]) => ({
      key: (step as { key?: string }).key,
      target:
        context?.currentTarget?.kind === 'abilityEntity' ? context.currentTarget.instanceId : 0,
    }));
    expect(calls).toHaveLength(3);
    expect(calls[0]!.key).toBe(calls[1]!.key);
    expect(calls.map(call => call.target)).toEqual([1, 2, 0]);
    expect(calls[2]!.key).not.toBe(calls[0]!.key);
  });

  it('图事件响应复用守卫，阻止同步自重入，结束后注销监听', () => {
    const events = createNativeEventFixture();
    const seen: string[] = [];
    const emit = (buffId: string) =>
      events.emitAddedBuff({ sourceId: 'owner', targetId: 'owner', buffId, buffTags: [] });
    const runtime = new CombatActionSequenceRuntime(
      {
        evaluate: () => true,
        execute: (step, context) => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected operation');
          const event = context?.event;
          const buffId =
            event && 'payload' in event && event.event === 'addedBuff'
              ? event.payload.buffId
              : 'missing';
          seen.push(`${step.parameters.flag}:${buffId}`);
          if (step.parameters.flag === 'emit') {
            if (seen.length > 10) throw new Error('recursive listener');
            emit('nested');
          }
          return true;
        },
      },
      { blackboard: new ActionBlackboard() },
      {},
      events.semanticEvents,
      'owner',
    );
    const source: ActionGraphDefinition = {
      nodes: {
        listener: {
          action: {
            kind: 'listenForCombatEvents',
            parameters: {
              responses: [
                {
                  key: 'reentry',
                  event: { kind: 'abilityEvent', event: 'addedBuff' },
                  sequence: { $sequence: 'guard' },
                },
              ],
            },
          },
          next: null,
        },
        guard: {
          action: {
            kind: 'conditional',
            parameters: { condition: { kind: 'constant', value: true } },
            whenTrue: { $sequence: 'emit' },
          },
          next: null,
        },
        emit: {
          action: {
            kind: 'setContextFlag',
            parameters: { flag: 'emit', value: true, target: 'caster' },
          },
          next: 'tail',
        },
        tail: {
          action: {
            kind: 'setContextFlag',
            parameters: { flag: 'tail', value: true, target: 'caster' },
          },
          next: null,
        },
      },
    };
    const execution = runtime.createGraphSequence(
      createActionGraphCompilation(source, 1, 'listener').compileAll(),
      'listener',
      'root',
    );
    execution.tryExecute({});
    emit('first');
    emit('second');
    expect(seen).toEqual(['emit:first', 'tail:first', 'emit:second', 'tail:second']);
    execution.end({});
    emit('after-end');
    expect(seen).toHaveLength(4);
  });
  it('计数循环只在入口读取次数，子程序写黑板不改变本轮循环次数', () => {
    const source: ActionGraphDefinition = {
      nodes: {
        repeat: {
          action: {
            kind: 'repeatByActionValue',
            parameters: { count: { kind: 'blackboard', key: 'count' } },
            body: { $sequence: 'add' },
          },
          next: null,
        },
        add: {
          action: {
            kind: 'modifyActionValue',
            parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
          },
          next: null,
        },
      },
    };
    const board = new ActionBlackboard({ count: 3 });
    const runtime = new CombatActionSequenceRuntime(
      new ActionBlackboardOperationExecutor({ execute: () => false, evaluate: () => false }),
      { blackboard: board },
    );
    const program = createActionGraphCompilation(source, 1, 'counted').compileAll();
    const execution = runtime.createGraphSequence(program, 'repeat', 'root');
    expect(execution.tryExecute({})).toBe(true);
    expect(board.getNumber('count')).toBe(6);
    board.assignDynamicUnconditionally('count', -1);
    execution.end({});
    execution.reset({});
    expect(() => execution.tryExecute({})).toThrow('non-negative integer');
  });

  it('共享节点的操作登记按调用隔离，恢复后不改变槽位', () => {
    const program = createActionGraphCompilation(graph, 1, 'slots').compileAll();
    const directory = new CombatOperationPrograms();
    const slots: number[] = [];
    const make = () =>
      new CombatActionSequenceRuntime(
        {
          execute: step => {
            slots.push(directory.slot(step));
            return true;
          },
          end: step => {
            slots.push(directory.slot(step));
          },
          evaluate: () => true,
        },
        { blackboard: new ActionBlackboard() },
      );
    const runtime = make();
    const first = runtime.createGraphSequence(program, 'damage', 'first');
    const second = runtime.createGraphSequence(program, 'damage', 'second');
    first.tryExecute({});
    second.tryExecute({});
    expect(slots[0]).not.toBe(slots[1]);
    const resumed = make().createGraphSequence(
      program,
      'damage',
      'first',
      undefined,
      structuredClone(first.runtimeState),
    );
    resumed.end({});
    expect(slots[2]).toBe(slots[0]);
    expect(program.nodes.size).toBe(3);
    expect(() =>
      make().createGraphSequence(
        createActionGraphCompilation(graph, 1, 'slots').compileAll(),
        'damage',
        'first',
        undefined,
        structuredClone(first.runtimeState),
      ),
    ).toThrow('binding is missing');
  });
  it.each(['parent', 'execution'] as const)(
    '局部黑板 %s 寿命在图恢复后保持，重置不重放变量写入',
    lifetime => {
      const source: ActionGraphDefinition = {
        nodes: {
          scope: {
            action: {
              kind: 'withActionBlackboardScope',
              parameters: {
                scopeKey: 'local',
                lifetime,
                initialValues: { count: [1, 2] },
                inheritParent: false,
              },
              body: { $sequence: 'add' },
            },
            next: null,
          },
          add: {
            action: {
              kind: 'modifyActionValue',
              parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
            },
            next: null,
          },
        },
      };
      const program = createActionGraphCompilation(source, 2, 'scope').compileAll();
      const make = (
        blackboard: ActionBlackboard,
        state?: ReturnType<typeof fixture>['runtime']['scopeState'],
      ) =>
        new CombatActionSequenceRuntime(
          new ActionBlackboardOperationExecutor({ execute: () => false, evaluate: () => false }),
          { blackboard },
          {},
          undefined,
          undefined,
          state,
        );
      const parent = new ActionBlackboard({ count: 100 });
      const runtime = make(parent);
      const first = runtime.createGraphSequence(program, 'scope', 'root');
      first.reset({});
      first.tryExecute({});
      expect(parent.getNumber('count')).toBe(100);
      const saved = structuredClone({
        execution: first.runtimeState,
        scopes: runtime.scopeState,
        parent: parent.runtimeState,
      });
      const next = make(ActionBlackboard.bindRuntimeState(saved.parent), saved.scopes);
      const resumed = next.createGraphSequence(
        program,
        'scope',
        'root',
        undefined,
        saved.execution,
      );
      const getCount = () => {
        const data = resumed.runtimeState.nodes.get('scope')!.data;
        if (data.kind !== 'graphScope' || !data.body) throw new Error('missing graph scope');
        return data.body.blackboard.values.get('count');
      };
      expect(getCount()).toBe(3);
      resumed.end({});
      resumed.reset({});
      resumed.tryExecute({});
      expect(getCount()).toBe(lifetime === 'parent' ? 4 : 3);
      const original = first.runtimeState.nodes.get('scope')!.data;
      if (original.kind !== 'graphScope' || !original.body)
        throw new Error('missing original scope');
      expect(original.body.blackboard.values.get('count')).toBe(3);
    },
  );

  it('once 的共享键跨入口有效，省略键时调用位置独立', () => {
    const source: ActionGraphDefinition = {
      nodes: {
        shared: {
          action: { kind: 'once', parameters: { scopeKey: 'shared' }, body: { $sequence: 'body' } },
          next: null,
        },
        local: {
          action: { kind: 'once', parameters: {}, body: { $sequence: 'body' } },
          next: null,
        },
        body: { ...graph.nodes.first!, next: null },
      },
    };
    const program = createActionGraphCompilation(source, 1, 'once').compileAll();
    const { runtime, operations } = fixture();
    for (const entry of ['shared', 'local']) {
      for (const call of ['first', 'second']) {
        const execution = runtime.createGraphSequence(program, entry, call);
        execution.reset({});
        execution.tryExecute({});
        execution.end({});
      }
    }
    expect(operations.execute).toHaveBeenCalledTimes(3);
    expect(runtime.scopeState.executedOnce.size).toBe(3);
  });

  it('原生重复动作恢复计时和首次 Tick 标记，不重放 Execute', () => {
    const source: ActionGraphDefinition = {
      nodes: {
        repeat: {
          action: {
            kind: 'repeatEachTick',
            parameters: { nativeTickInterval: { intervalSeconds: 0.1, executeEachFrame: false } },
            body: { $sequence: 'body' },
          },
          next: null,
        },
        body: { ...graph.nodes.first!, next: null },
      },
    };
    const program = createActionGraphCompilation(source, 1, 'repeat').compileAll();
    const first = fixture();
    const execution = first.runtime.createGraphSequence(program, 'repeat', 'root');
    execution.reset({});
    execution.tryExecute({});
    execution.tick(1 / 30, {});
    const restored = fixture();
    const resumed = restored.runtime.createGraphSequence(
      program,
      'repeat',
      'root',
      undefined,
      structuredClone(execution.runtimeState),
    );
    expect(restored.operations.execute).not.toHaveBeenCalled();
    const before = vi.mocked(first.operations.execute).mock.calls.length;
    for (let frame = 0; frame < 12; frame++) {
      execution.tick(1 / 30, {});
      resumed.tick(1 / 30, {});
    }
    expect(vi.mocked(first.operations.execute).mock.calls.length - before).toBe(
      vi.mocked(restored.operations.execute).mock.calls.length,
    );
    expect(resumed.runtimeState).toEqual(execution.runtimeState);
    expect(restored.operations.execute).toHaveBeenCalled();
  });
  it.each(['guard', 'ifElse', 'switch'] as const)('%s 的短路、Reset 和结束顺序保持稳定', kind => {
    for (const conditionResult of [false, true]) {
      const control: ActionGraphNode['action'] =
        kind === 'switch'
          ? {
              kind: 'switch',
              parameters: {
                choice: { kind: 'constant', value: conditionResult ? 1 : 9 },
                alwaysNext: true,
              },
              options: [
                { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'body' } },
                { value: { kind: 'constant', value: 2 }, sequence: { $sequence: null } },
              ],
            }
          : {
              kind: 'conditional',
              parameters: {
                condition: { kind: 'constant', value: conditionResult },
                ...(kind === 'ifElse' ? { alwaysNext: true } : {}),
              },
              whenTrue: { $sequence: 'body' },
              ...(kind === 'ifElse' ? { whenFalse: { $sequence: null } } : {}),
            };
      const source: ActionGraphDefinition = {
        nodes: {
          entry: { action: control, next: 'after' },
          body: { ...graph.nodes.first!, next: 'stop' },
          stop: {
            action: {
              kind: 'setContextFlag',
              parameters: { flag: 'stop', value: true, target: 'caster' },
            },
            next: 'unreached',
          },
          unreached: { ...graph.nodes.second!, next: null },
          after: { ...graph.nodes.first!, next: null },
        },
      };
      const events: string[] = [];
      const label = (step: Parameters<CombatOperationExecutor['execute']>[0]) =>
        step.kind === 'setContextFlag' ? step.parameters.flag : step.kind;
      const runtime = new CombatActionSequenceRuntime(
        {
          execute: step => {
            events.push(`execute:${label(step)}`);
            return label(step) !== 'stop';
          },
          evaluate: () => {
            events.push('condition');
            return conditionResult;
          },
          prepare: step => {
            events.push(`reset:${label(step)}`);
          },
          end: step => {
            events.push(`end:${label(step)}`);
          },
        },
        { blackboard: new ActionBlackboard() },
      );
      const execution = runtime.createGraphSequence(
        createActionGraphCompilation(source, 1, 'controls').compileAll(),
        'entry',
        'root',
      );
      execution.reset({});
      events.push(`result:${execution.tryExecute({})}`);
      execution.tick(1 / 30, {});
      execution.end({});
      execution.reset({});
      // 期望按共享生命周期算法推导，只锁定图分派行为，不重算原生语义：
      // executeActionSequence 逐项短路、branchActionExecution 选择与未选分支 Reset、
      // endActionSequence/序列 Reset 的 End 与 Reset 顺序。
      const reset = ['reset:first', 'reset:stop', 'reset:second', 'reset:first'];
      const branchBody = ['execute:first', 'execute:stop', 'execute:first'];
      const expected =
        kind === 'guard'
          ? conditionResult
            ? [
                ...reset,
                'condition',
                'execute:first',
                'execute:stop',
                'result:false',
                'end:first',
                'end:stop',
                ...reset,
              ]
            : [...reset, 'condition', 'result:false', ...reset]
          : kind === 'switch'
            ? conditionResult
              ? [
                  ...reset,
                  ...branchBody,
                  'result:true',
                  'end:first',
                  'end:stop',
                  'end:first',
                  ...reset,
                ]
              : [...reset, 'execute:first', 'result:true', 'end:first', ...reset]
            : conditionResult
              ? [
                  ...reset,
                  'condition',
                  ...branchBody,
                  'result:true',
                  'end:first',
                  'end:stop',
                  'end:first',
                  ...reset,
                ]
              : [...reset, 'condition', 'execute:first', 'result:true', 'end:first', ...reset];
      expect(events).toEqual(expected);
    }
  });

  it('不同分支引用同一子程序时分别绑定状态，恢复不重选分支', () => {
    const source: ActionGraphDefinition = {
      nodes: {
        entry: {
          action: {
            kind: 'conditional',
            parameters: { condition: { kind: 'constant', value: true }, alwaysNext: true },
            whenTrue: { $sequence: 'damage' },
            whenFalse: { $sequence: 'damage' },
          },
          next: null,
        },
        damage: graph.nodes.damage!,
      },
    };
    const program = createActionGraphCompilation(source, 1, 'branches').compileAll();
    const original = fixture();
    const first = original.runtime.createGraphSequence(program, 'entry', 'root');
    first.reset({});
    first.tryExecute({});
    const branch = first.runtimeState.nodes.get('entry')!.data;
    if (branch.kind !== 'graphBranch') throw new Error('expected graph branch');
    expect(branch.branches.get(0)).not.toBe(branch.branches.get(1));
    expect(branch.branches.get(0)!.nodes.get('damage')!.lifecycle.state).toBe('started');
    expect(branch.branches.get(1)!.nodes.get('damage')!.lifecycle.state).toBe('pending');
    const restored = fixture();
    const resumed = restored.runtime.createGraphSequence(
      program,
      'entry',
      'root',
      undefined,
      structuredClone(first.runtimeState),
    );
    expect(restored.operations.execute).not.toHaveBeenCalled();
    resumed.end({});
    expect(restored.operations.end).toHaveBeenCalledTimes(1);
  });

  it('共享程序的黑板读取仍在本次执行时求值，恢复不重复修改变量', () => {
    const program = createActionGraphCompilation(
      {
        nodes: {
          add: {
            action: {
              kind: 'modifyActionValue',
              parameters: {
                key: 'count',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              },
            },
            next: null,
          },
        },
      },
      1,
      'counter',
    ).compileAll();
    const create = (blackboard: ActionBlackboard) =>
      new CombatActionSequenceRuntime(
        new ActionBlackboardOperationExecutor({ execute: () => false, evaluate: () => false }),
        { blackboard },
      );
    const firstBoard = new ActionBlackboard({ count: 1 });
    const secondBoard = new ActionBlackboard({ count: 10 });
    const first = create(firstBoard).createGraphSequence(program, 'add', 'first');
    const second = create(secondBoard).createGraphSequence(program, 'add', 'second');
    first.tryExecute({});
    second.tryExecute({});
    expect(firstBoard.getNumber('count')).toBe(2);
    expect(secondBoard.getNumber('count')).toBe(11);
    const saved = structuredClone({
      execution: first.runtimeState,
      blackboard: firstBoard.runtimeState,
    });
    const restoredBoard = ActionBlackboard.bindRuntimeState(saved.blackboard);
    const restored = create(restoredBoard).createGraphSequence(
      program,
      'add',
      'first',
      undefined,
      saved.execution,
    );
    expect(restoredBoard.getNumber('count')).toBe(2);
    restored.end({});
    restored.reset({});
    restored.tryExecute({});
    expect(restoredBoard.getNumber('count')).toBe(3);
    expect(firstBoard.getNumber('count')).toBe(2);
  });

  it('共享尾部只编译一次，不共享入口状态，伤害身份按调用位置绑定', () => {
    const program = createActionGraphCompilation(graph, 2, 'revision-1').compileAll();
    expect(program.nodes.size).toBe(3);
    expect(program.nodes.get('damage')!.action).toMatchObject({ parameters: { attackScale: 2 } });
    const { runtime, operations } = fixture();
    const first = runtime.createGraphSequence(program, 'first', 'interval-1');
    const second = runtime.createGraphSequence(program, 'second', 'interval-2');
    expect(first.runtimeState.nodes.size).toBe(0);
    first.tryExecute({});
    expect(second.runtimeState.nodes.size).toBe(0);
    second.tryExecute({});
    const hits = vi
      .mocked(operations.execute)
      .mock.calls.map(([step]) => step)
      .filter(step => step.kind === 'dealDamage');
    expect(hits).toHaveLength(2);
    expect(hits[0]!.key).not.toBe(hits[1]!.key);
    expect(program.nodes.get('damage')!.action.key).toBeUndefined();
    expect(first.runtimeState.nodes.get('damage')).not.toBe(
      second.runtimeState.nodes.get('damage'),
    );
  });

  it('恢复只重绑，结束调用恢复后的宿主且不重复执行', () => {
    const program = createActionGraphCompilation(graph, 1, 'revision-1').compileAll();
    const original = fixture();
    const running = original.runtime.createGraphSequence(program, 'first', 'interval');
    running.tryExecute({});
    const saved = structuredClone(running.runtimeState);
    const restored = fixture();
    const resumed = restored.runtime.createGraphSequence(
      program,
      'first',
      'interval',
      undefined,
      saved,
    );
    expect(restored.operations.execute).not.toHaveBeenCalled();
    expect(restored.operations.prepare).not.toHaveBeenCalled();
    resumed.end({});
    resumed.end({});
    expect(restored.operations.end).toHaveBeenCalledTimes(2);
    expect(original.operations.end).not.toHaveBeenCalled();
    expect(running.runtimeState.closed).toBe(false);
    resumed.tryExecute({});
    expect(restored.operations.execute).not.toHaveBeenCalled();
  });

  it('同步结束阻止后续节点进入，Reset 仍准备尚未进入的节点', () => {
    const program = createActionGraphCompilation(graph, 1, 'revision-1').compileAll();
    let finish = () => {};
    const { runtime, operations } = fixture(() => {
      finish();
      return true;
    });
    const running = runtime.createGraphSequence(program, 'first', 'interval');
    finish = () => running.end({});
    running.tryExecute({});
    expect(operations.execute).toHaveBeenCalledTimes(1);
    expect(operations.end).toHaveBeenCalledTimes(1);
    expect(running.runtimeState.nodes.has('damage')).toBe(false);
    running.reset({});
    expect(operations.prepare).toHaveBeenCalledTimes(2);
    expect(running.runtimeState.nodes.get('damage')!.lifecycle.state).toBe('pending');
  });

  it('逐节点读取许可，未获许可的节点不执行 End，短路不创建尾部', () => {
    const { runtime, operations } = fixture(() => false);
    const program = createActionGraphCompilation(graph, 1, 'revision-1').compileAll();
    const running = runtime.createGraphSequence(program, 'first', 'interval');
    expect(running.tryExecute({})).toBe(false);
    expect(running.runtimeState.nodes.size).toBe(1);
    running.end({});
    expect(operations.end).toHaveBeenCalledTimes(1);
    const blocked = runtime.createGraphSequence(program, 'first', 'blocked', {
      blackboard: new ActionBlackboard(),
      canExecuteAction: () => false,
    });
    expect(blocked.tryExecute({})).toBe(false);
    blocked.end({});
    expect(operations.execute).toHaveBeenCalledTimes(1);
    expect(operations.end).toHaveBeenCalledTimes(1);
  });

  it('拒绝不匹配的程序修订、入口及调用位置', () => {
    const program = createActionGraphCompilation(graph, 1, 'revision-1').compileAll();
    const { runtime } = fixture();
    const saved = runtime.createGraphSequence(program, 'first', 'interval').runtimeState;
    expect(() =>
      runtime.createGraphSequence(
        { ...program, revision: 'revision-2' },
        'first',
        'interval',
        undefined,
        saved,
      ),
    ).toThrow('checkpoint');
    expect(() =>
      runtime.createGraphSequence(program, 'second', 'interval', undefined, saved),
    ).toThrow('checkpoint');
    expect(() => runtime.createGraphSequence(program, 'first', 'other', undefined, saved)).toThrow(
      'checkpoint',
    );
    expect(() =>
      runtime.createGraphSequence(
        createActionGraphCompilation(graph, 2, 'revision-1').compileAll(),
        'first',
        'interval',
        undefined,
        saved,
      ),
    ).toThrow('checkpoint');
  });

  it('Reset 中的同步结束不会跳过后续准备，与序列重置顺序一致', () => {
    const program = createActionGraphCompilation(graph, 1, 'revision-1').compileAll();
    const { runtime, operations } = fixture();
    const running = runtime.createGraphSequence(program, 'first', 'interval');
    running.tryExecute({});
    vi.mocked(operations.prepare!).mockImplementationOnce(() => running.end({}));
    running.reset({});
    expect(operations.prepare).toHaveBeenCalledTimes(2);
    expect(running.runtimeState.closed).toBe(false);
    for (const state of running.runtimeState.nodes.values())
      expect(state.lifecycle.state).toBe('pending');
    expect(running.tryExecute({})).toBe(true);
    expect(operations.execute).toHaveBeenCalledTimes(4);
  });

  it('有状态操作恢复后使用保存的登记，结束不影响原会话', () => {
    const options = {
      skills: [],
      playerActionModes: [
        { modeId: 'base', modeLayer: 'mode', defaultEnabled: true, commandMappings: {} },
        { modeId: 'special', modeLayer: 'mode', defaultEnabled: false, commandMappings: {} },
      ],
    };
    const bind = (ability: AbilitySystemRuntime) => {
      const activate = vi.fn((id: string) => ability.activatePlayerActionMode(id).registrationId);
      const runtime = new CombatActionSequenceRuntime(
        new SkillSlotOperationExecutor({
          changeSkillSlot: vi.fn(),
          activatePlayerActionMode: activate,
          finishPlayerActionMode: id => ability.finishPlayerActionModeActivation(id),
          delegate: { execute: () => false, evaluate: () => false },
        }),
        { blackboard: new ActionBlackboard() },
      );
      return { runtime, activate };
    };
    const program = createActionGraphCompilation(
      {
        nodes: {
          mode: {
            action: {
              kind: 'changePlayerActionMode',
              parameters: { modeId: 'special', lifetime: 'finishByAction' },
            },
            next: null,
          },
        },
      },
      1,
      'mode-1',
    ).compileAll();
    const ability = new AbilitySystemRuntime(options);
    const original = bind(ability);
    const execution = original.runtime.createGraphSequence(program, 'mode', 'interval');
    execution.tryExecute({});
    const saved = structuredClone({
      ability: ability.runtimeState,
      execution: execution.runtimeState,
    });
    const restored = bind(new AbilitySystemRuntime(options, saved.ability));
    const resumed = restored.runtime.createGraphSequence(
      program,
      'mode',
      'interval',
      undefined,
      saved.execution,
    );
    expect(restored.activate).not.toHaveBeenCalled();
    resumed.end({});
    resumed.end({});
    expect(saved.ability.activePlayerActionModeByLayer.get('mode')).toBe('base');
    expect(ability.runtimeState.activePlayerActionModeByLayer.get('mode')).toBe('special');
    execution.end({});
    expect(ability.runtimeState.activePlayerActionModeByLayer.get('mode')).toBe('base');
  });

  it('缺失引用、循环和未迁移动作不回退到树执行', () => {
    expect(() =>
      createActionGraphCompilation(
        { nodes: { a: { ...graph.nodes.first!, next: 'missing' } } },
        1,
        'r',
      ).compileAll(),
    ).toThrow('missing');
    expect(() =>
      createActionGraphCompilation(
        { nodes: { a: { ...graph.nodes.first!, next: 'a' } } },
        1,
        'r',
      ).compileAll(),
    ).toThrow('recursive');
    expect(() =>
      createActionGraphCompilation(
        {
          nodes: {
            a: {
              action: {
                kind: 'spawnAbilityEntity',
                parameters: { abilityEntityId: 'fixture', dieWhenSourceDies: false },
              },
              next: null,
            },
          },
        },
        1,
        'r',
      ).compileAll(),
    ).toThrow("AbilityEntity definition 'fixture' does not exist");
    const program = createActionGraphCompilation(
      {
        nodes: {
          spawn: {
            action: {
              kind: 'spawnAbilityEntity',
              parameters: {
                abilityEntityId: 'fixture',
                dieWhenSourceDies: false,
                definition: { lifetime: { kind: 'infinite' } },
              },
            },
            next: null,
          },
        },
      },
      1,
      'unsupported-host',
    ).compileAll();
    const runtime = fixture().runtime;
    expect(runtime.createGraphSequence(program, 'spawn', 'root').tryExecute({})).toBe(true);
  });
});
