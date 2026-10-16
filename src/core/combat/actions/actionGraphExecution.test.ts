import { describe, expect, it, vi } from 'vitest';
import { CombatActionTagQueryListener } from './combatActionEventListener';
import type { TagQueryListenerState } from '../state/actionState';

it('标签监听恢复不重放首次回调，匹配跃迁先保存再允许同步重入', () => {
  let matched = true;
  let changed: (() => void) | undefined;
  const state: TagQueryListenerState<{ executions: number }> = {
    active: false,
    matched: false,
    body: null,
  };
  const create = (saved = { executions: 0 }) => ({
    runtimeState: saved,
    executeInstant: () => {
      saved.executions++;
      changed?.();
      return true;
    },
    reset: () => {},
    end: () => {
      expect(changed).toBeUndefined();
    },
  });
  const observe = (callback: () => void) => {
    changed = callback;
    return () => {
      changed = undefined;
    };
  };
  const original = new CombatActionTagQueryListener(state, true, () => matched, observe, create);
  original.execute();
  expect(state.body?.executions).toBe(1);
  const saved = structuredClone(state);
  original.end();
  const restored = new CombatActionTagQueryListener(saved, true, () => matched, observe, create);
  expect(saved.body?.executions).toBe(1);
  changed?.();
  expect(saved.body?.executions).toBe(1);
  matched = false;
  changed?.();
  matched = true;
  changed?.();
  expect(saved.body?.executions).toBe(2);
  restored.end();
});
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphResourceDefinition,
} from '../../../../packages/game-data-contract/src/actionGraph';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import { createProgramDefinitionCompiler } from '../../compiler/compileProgramDefinitions';
import { ActionBlackboard, resolveActionValueOperand } from './actionBlackboard';
import { CombatActionSequenceRuntime } from './combatActionSequenceRuntime';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { AbilitySystemRuntime } from '../abilities/abilitySystemRuntime';
import { SkillSlotOperationExecutor } from '../skills/skillSlotOperationExecutor';
import { ActionBlackboardOperationExecutor } from './actionBlackboardOperationExecutor';
import { CombatOperationPrograms } from './combatOperationPrograms';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { createNativeEventFixture } from '../events/nativeEventTestFixture';
import { ActionExecutionTrace } from './actionExecutionTrace';
import { ComboWindowRuntime } from '../skills/comboWindowRuntime';
import { CombatClock } from '../time/combatClock';
import { CombatReceiptCollector } from '../receipt/combatReceipt';

const graph: ActionGraphDefinition = {
  nodes: {
    first: {
      action: {
        kind: 'triggerCustomAbilityEvent',
        parameters: { eventName: 'first', eventParam: 0, target: 'caster' as const },
      },
      next: 'damage',
    },
    second: {
      action: {
        kind: 'triggerCustomAbilityEvent',
        parameters: { eventName: 'second', eventParam: 0, target: 'caster' as const },
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
  it('正式标签监听图在首次匹配和再次进入时执行子图，结束后停止响应', () => {
    let matched = true;
    let notify: (() => void) | undefined;
    const execute = vi.fn(() => true);
    const runtime = new CombatActionSequenceRuntime(
      {
        execute,
        evaluate: () => true,
        ownerTagQuery: () => ({
          matches: () => matched,
          observe: callback => {
            notify = callback;
            return () => {
              notify = undefined;
            };
          },
        }),
      },
      { blackboard: new ActionBlackboard(), actionOwnerId: 'owner' },
    );
    const compilation = createActionGraphCompilation(
      {
        nodes: {
          listen: {
            action: {
              kind: 'listenForTagQuery',
              parameters: {
                tags: ['SelectCategory/Unmarkable'],
                tagQueryType: 'hasAny',
                executeOnMatch: true,
                sequence: { $sequence: 'damage' },
              },
            },
            next: null,
          },
          damage: graph.nodes.damage!,
        },
      },
      1,
    );
    const sequence = runtime.createSequence(
      compilation.compileEntry({ $sequence: 'listen' }, 'tags'),
    );
    sequence.execute({});
    expect(execute).toHaveBeenCalledTimes(1);
    notify?.();
    expect(execute).toHaveBeenCalledTimes(1);
    matched = false;
    notify?.();
    matched = true;
    notify?.();
    expect(execute).toHaveBeenCalledTimes(2);
    sequence.end({});
    expect(notify).toBeUndefined();
  });
  it('不同子技能的局部调用路径相同时，匿名命中仍分别归属各自技能', () => {
    const resource = { main: graph, macros: {} };
    const compilation = createActionGraphCompilation(resource, 1);
    const definitions = createProgramDefinitionCompiler(
      1,
      compilation.compileEntry,
      () => compilation.compileEntry,
    );
    const keys = ['projectile-hit', 'projectile-hit-visual'].map(skillId => {
      const child = definitions.childSkill(
        {
          skillId,
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
          },
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'damage' } }],
          actionGraph: resource,
        },
        'graph.launch.callbacks[0].skill',
      );
      const runtime = fixture();
      runtime.runtime.createSequence(child.timelineActions[0]!.sequence).execute({});
      return vi.mocked(runtime.operations.execute).mock.calls[0]![0].key;
    });
    expect(keys.every(key => typeof key === 'string')).toBe(true);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it.each(['natural', 'interrupted', 'normalOnly', 'restored'] as const)(
    '动画结束子序列保留输入和一次性生命周期：%s',
    mode => {
      const program = createActionGraphCompilation(
        {
          nodes: {
            animation: {
              action: {
                kind: 'playAnimation',
                parameters: {
                  durationSeconds: 2,
                  blendOutSeconds: 0.5,
                  executeOnNormalEndOnly: mode === 'normalOnly',
                },
                onEnd: { $sequence: 'callback' },
              },
              next: null,
            },
            callback: {
              action: {
                kind: 'triggerCustomAbilityEvent',
                parameters: { eventName: 'ended', eventParam: 0, target: 'caster' as const },
              },
              next: null,
            },
          },
        },
        1,
      ).compileAll();
      const calls: unknown[] = [];
      const context = {
        blackboard: new ActionBlackboard(),
        actionInputTarget: { kind: 'operator' as const, operatorId: 'saved' },
      };
      const makeRuntime = () =>
        new CombatActionSequenceRuntime(
          {
            evaluate: () => true,
            execute: (_step, input) => {
              calls.push(input?.actionInputTarget);
              return true;
            },
          },
          context,
        );
      let action = makeRuntime().createGraphSequence(program, 'animation', 'root');
      action.tryExecute({});
      action.tick(0.5, {});
      expect(calls).toEqual([]);
      context.actionInputTarget = { kind: 'operator', operatorId: 'later' };
      if (mode === 'restored')
        action = makeRuntime().createGraphSequence(
          program,
          'animation',
          'root',
          undefined,
          structuredClone(action.runtimeState),
        );
      if (mode === 'natural' || mode === 'restored') {
        action.tick(1, {});
        expect(calls).toEqual([{ kind: 'operator', operatorId: 'saved' }]);
      }
      action.end({});
      action.end({});
      expect(calls).toEqual(
        mode === 'normalOnly' ? [] : [{ kind: 'operator', operatorId: 'saved' }],
      );
    },
  );

  it.each([false, true])('QTE 保存输入并在恢复后按动作实例清理：restore=%s', restore => {
    const program = createActionGraphCompilation(
      {
        nodes: {
          qte: {
            action: {
              kind: 'showComboRingQte',
              parameters: {
                earlyDurationSeconds: { kind: 'constant', value: 0 },
                activeDurationSeconds: { kind: 'constant', value: 1 },
              },
              triggeredAction: { $sequence: 'success' },
            },
            next: null,
          },
          success: {
            action: {
              kind: 'triggerCustomAbilityEvent',
              parameters: { eventName: 'success', eventParam: 0, target: 'caster' as const },
            },
            next: null,
          },
        },
      },
      1,
    ).compileAll();
    const calls: unknown[] = [];
    const clock = new CombatClock();
    let windows = new ComboWindowRuntime(clock, new CombatReceiptCollector(), 5);
    windows.open('rossi', 'combo');
    const context = {
      blackboard: new ActionBlackboard(),
      actionSourceId: 'rossi',
      actionInputTarget: { kind: 'operator' as const, operatorId: 'saved' },
    };
    const makeRuntime = () =>
      new CombatActionSequenceRuntime(
        {
          comboWindows: windows,
          evaluate: () => true,
          execute: (_step, callback) => {
            calls.push(callback?.actionInputTarget);
            return true;
          },
        },
        context,
      );
    let action = makeRuntime().createGraphSequence(program, 'qte', 'root');
    action.tryExecute({});
    context.actionInputTarget = { kind: 'operator', operatorId: 'later' };
    if (restore) {
      windows = new ComboWindowRuntime(
        clock,
        new CombatReceiptCollector(),
        5,
        [],
        structuredClone(windows.runtimeState),
      );
      action = makeRuntime().createGraphSequence(
        program,
        'qte',
        'root',
        undefined,
        structuredClone(action.runtimeState),
      );
    }
    windows.consume('rossi', 'combo', result => result);
    expect(calls).toEqual([{ kind: 'operator', operatorId: 'saved' }]);
    action.end({});
    expect(windows.runtimeState.ringQtes.size).toBe(0);
  });
  it.each(['restore', 'apply', 'enter', 'exit', 'empty'] as const)('Aura 生命周期：%s', mode => {
    const program = createActionGraphCompilation(
      {
        nodes: {
          aura: {
            action: {
              kind: 'aura',
              parameters: { targets: { kind: 'characterTeam', excludeOwner: false }, buffs: [] },
              onEnter: { $sequence: mode === 'empty' ? null : 'enter' },
              onExit: { $sequence: mode === 'empty' ? null : 'exit' },
            },
            next: null,
          },
          enter: {
            action: {
              kind: 'triggerCustomAbilityEvent',
              parameters: { eventName: 'enter', eventParam: 0, target: 'caster' as const },
            },
            next: null,
          },
          exit: {
            action: {
              kind: 'triggerCustomAbilityEvent',
              parameters: { eventName: 'exit', eventParam: 0, target: 'caster' as const },
            },
            next: null,
          },
        },
      },
      1,
    ).compileAll();
    const events: string[] = [];
    let stop: () => void = () => {};
    const targets = [
      { kind: 'operator' as const, operatorId: 'a' },
      { kind: 'operator' as const, operatorId: 'b' },
    ];
    const operations: CombatOperationExecutor = {
      evaluate: () => true,
      execute: (step, context) => {
        if (step.kind === 'triggerCustomAbilityEvent') {
          const target = context!.actionInputTarget!;
          events.push(
            `${step.parameters.eventName}:${target.kind === 'operator' ? target.operatorId : target.kind}`,
          );
          if (step.parameters.eventName === mode) stop();
        }
        return true;
      },
      aura: {
        targets: () => targets,
        apply: (_parameters, target) => {
          const ownerId = target.kind === 'operator' ? target.operatorId : 'enemy';
          events.push(`apply:${ownerId}`);
          if (mode === 'apply') stop();
          return [{ ownerId, instanceId: 1 }];
        },
        finish: references =>
          references.forEach(reference => events.push(`finish:${reference.ownerId}`)),
      },
    };
    const runtime = new CombatActionSequenceRuntime(operations, {
      blackboard: new ActionBlackboard(),
    });
    const action = runtime.createGraphSequence(program, 'aura', 'root');
    stop = () => action.end({});
    action.tryExecute({});
    if (mode === 'empty') {
      expect(events).toEqual(['apply:a', 'apply:b']);
      const restored = runtime.createGraphSequence(
        program,
        'aura',
        'root',
        undefined,
        structuredClone(action.runtimeState),
      );
      restored.tick(1 / 30, {});
      expect(events).toEqual(['apply:a', 'apply:b']);
      restored.end({});
      expect(events).toEqual(['apply:a', 'apply:b', 'finish:b', 'finish:a']);
      return;
    }
    if (mode === 'apply' || mode === 'enter') {
      expect(events.filter(event => event.startsWith('apply:'))).toEqual(['apply:a']);
      expect(events.filter(event => event.startsWith('finish:'))).toEqual(['finish:a']);
      expect(events.filter(event => event.startsWith('exit:'))).toEqual(['exit:a']);
      const ended = [...events];
      action.tick(1 / 30, {});
      action.end({});
      expect(events).toEqual(ended);
      return;
    }
    expect(events).toEqual(['apply:a', 'enter:a', 'apply:b', 'enter:b']);
    const restored = runtime.createGraphSequence(
      program,
      'aura',
      'root',
      undefined,
      structuredClone(action.runtimeState),
    );
    stop = () => restored.end({});
    if (mode === 'exit') {
      restored.end({});
      expect(events.slice(4)).toEqual(['finish:b', 'exit:b', 'finish:a', 'exit:a']);
      restored.end({});
      expect(events).toHaveLength(8);
      return;
    }
    restored.tick(1 / 30, {});
    expect(events).toHaveLength(4);
    // 离场后重新进入是新的影响实例；恢复不能复用已经结束的回调状态。
    const departed = targets.pop()!;
    restored.tick(1 / 30, {});
    expect(events.slice(4)).toEqual(['finish:b', 'exit:b']);
    targets.push(departed);
    restored.tick(1 / 30, {});
    expect(events.slice(6)).toEqual(['apply:b', 'enter:b']);
    restored.end({});
    expect(events.slice(8)).toEqual(['finish:b', 'exit:b', 'finish:a', 'exit:a']);
  });

  it('诊断记录不重放动作，区分共享图调用，并在异常后恢复观察作用域', () => {
    const program = createActionGraphCompilation(graph, 1).compileAll();
    const trace = new ActionExecutionTrace('cast');
    let executions = 0;
    const operations: CombatOperationExecutor = {
      executionTrace: { recorder: trace, frame: () => 12, receiptCount: () => executions },
      execute: (_step, context) => {
        context!.blackboard.getNumber('value');
        executions++;
        return true;
      },
      evaluate: () => true,
    };
    const board = new ActionBlackboard({ value: 3 });
    const runtime = new CombatActionSequenceRuntime(operations, {
      blackboard: board,
      executionActionId: 'cast',
    });
    runtime.createGraphSequence(program, 'first', 'first-call').executeInstant({});
    runtime.createGraphSequence(program, 'first', 'second-call').executeInstant({});
    const executed = trace.records.filter(r => r.phase === 'execute');
    expect(executions).toBe(4);
    expect(executed.map(r => r.invocation)).toEqual([
      'first-call',
      'first-call',
      'second-call',
      'second-call',
    ]);
    expect(executed.every(r => r.receiptEnd - r.receiptStart === 1)).toBe(true);
    expect(executed[0]!.observations).toEqual([{ kind: 'blackboard', input: 'value', result: 3 }]);
    board.getNumber('value');
    expect(executed[0]!.observations).toHaveLength(1);
    const broken = new CombatActionSequenceRuntime(
      {
        ...operations,
        execute: () => {
          throw new Error('stop');
        },
      },
      { blackboard: board, executionActionId: 'cast' },
    );
    expect(() => broken.createGraphSequence(program, 'first', 'broken').tryExecute({})).toThrow(
      'stop',
    );
    expect(trace.records.at(-1)?.failed).toBe(true);
    const count = trace.records.length;
    new CombatActionSequenceRuntime(operations, { blackboard: board, executionActionId: 'other' })
      .createGraphSequence(program, 'first', 'other')
      .executeInstant({});
    expect(trace.records).toHaveLength(count);
  });
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
  it('图内跳转恢复不重复发出请求', () => {
    const source: ActionGraphDefinition = {
      nodes: {
        jump: {
          action: {
            kind: 'jumpTimeline',
            parameters: { destinationFrame: 30 },
            condition: { kind: 'constant', value: true },
          },
          next: null,
        },
        damage: graph.nodes.damage!,
      },
    };
    const program = createActionGraphCompilation(source, 1, 'timeline').compileAll();
    const execute = vi.fn(() => true);
    const jump = vi.fn();
    const context = {
      blackboard: new ActionBlackboard(),
      requestTimelineJump: jump,
    };
    const runtime = new CombatActionSequenceRuntime({ execute, evaluate: () => true }, context);
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
  it('逐目标调用共享子序列与 once 位置，即时结束后恢复不重复清理', () => {
    const source: ActionGraphDefinition = {
      nodes: {
        loop: {
          action: {
            kind: 'forEachContextTarget',
            parameters: { targets: { kind: 'context', key: 'items' } },
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
                `execute:${step.kind === 'triggerCustomAbilityEvent' ? step.parameters.eventName : step.kind}:${context?.currentTarget?.kind === 'abilityEntity' ? context.currentTarget.instanceId : 0}`,
              );
              return true;
            },
            end: (step, context) => {
              seen.push(
                `end:${step.kind === 'triggerCustomAbilityEvent' ? step.parameters.eventName : step.kind}:${context?.currentTarget?.kind === 'abilityEntity' ? context.currentTarget.instanceId : 0}`,
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
      'end:second:1',
      'execute:second:2',
      'end:second:2',
    ]);
    const loop = execution.runtimeState.nodes.get('loop')!.data;
    if (loop.kind !== 'graphTargets') throw new Error('expected target loop');
    expect(loop.body).not.toBeNull();
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
    expect(restored.seen).toEqual([]);
    execution.end({});
    expect(resumed.runtimeState.nodes.get('loop')!.data).toEqual(loop);
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
            parameters: { targets: { kind: 'context', key: 'items' } },
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
          if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
          const event = context?.event;
          const buffId =
            event && 'payload' in event && event.event === 'addedBuff'
              ? event.payload.buffId
              : 'missing';
          seen.push(`${step.parameters.eventName}:${buffId}`);
          if (step.parameters.eventName === 'emit') {
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
            kind: 'triggerCustomAbilityEvent',
            parameters: { eventName: 'emit', eventParam: 0, target: 'caster' as const },
          },
          next: 'tail',
        },
        tail: {
          action: {
            kind: 'triggerCustomAbilityEvent',
            parameters: { eventName: 'tail', eventParam: 0, target: 'caster' as const },
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

  it('once 的状态属于调用实例，相同图入口的不同实例互不抑制', () => {
    const source: ActionGraphDefinition = {
      nodes: {
        shared: {
          action: { kind: 'once', parameters: {}, body: { $sequence: 'body' } },
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
    expect(operations.execute).toHaveBeenCalledTimes(4);
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
              kind: 'triggerCustomAbilityEvent',
              parameters: { eventName: 'stop', eventParam: 0, target: 'caster' as const },
            },
            next: 'unreached',
          },
          unreached: { ...graph.nodes.second!, next: null },
          after: { ...graph.nodes.first!, next: null },
        },
      };
      const events: string[] = [];
      const label = (step: Parameters<CombatOperationExecutor['execute']>[0]) =>
        step.kind === 'triggerCustomAbilityEvent' ? step.parameters.eventName : step.kind;
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
    let finish = () => {};
    const program = createActionGraphCompilation(graph, 1, 'revision-1').compileAll();
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
                parameters: {
                  bornAt: { kind: 'owner' },
                  abilityEntityId: 'fixture',
                  dieWhenSourceDies: false,
                },
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
                bornAt: { kind: 'owner' as const },
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

it('宏参数绑定保留独立子技能的可执行图，子技能仍能单独执行', () => {
  const resource: ActionGraphResourceDefinition = {
    main: {
      nodes: {
        call: {
          action: {
            kind: 'callMacro',
            macroId: 'spawn',
            arguments: { duration: { kind: 'constant', value: 3 } },
          },
          next: null,
        },
      },
    },
    macros: {
      spawn: {
        parameters: ['duration'],
        entry: { $sequence: 'spawn' },
        graph: {
          dataNodes: {
            duration: { type: 'number', expression: { kind: 'parameter', parameter: 'duration' } },
          },
          nodes: {
            spawn: {
              next: null,
              action: {
                kind: 'spawnAbilityEntity',
                parameters: {
                  bornAt: { kind: 'owner' as const },
                  abilityEntityId: 'child',
                  dieWhenSourceDies: false,
                  overrideDurationSeconds: { kind: 'valueNode', nodeId: 'duration' },
                  definition: {
                    lifetime: { kind: 'infinite' },
                    childSkill: {
                      skillId: 'child',
                      nativeSkillType: 'normalSkill',
                      naturalDurationFrames: 10,
                      castResource: {
                        costFrame: 0,
                        cooldownSeconds: 0,
                        maxChargeTime: 1,
                        cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
                      },
                      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'flag' } }],
                      actionGraph: {
                        main: {
                          nodes: {
                            flag: {
                              next: null,
                              action: {
                                kind: 'triggerCustomAbilityEvent',
                                parameters: {
                                  eventName: 'child-executed',
                                  eventParam: 0,
                                  target: 'caster' as const,
                                },
                              },
                            },
                          },
                        },
                        macros: {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  const flags: string[] = [];
  const host = fixture((step, context) => {
    if (step.kind === 'spawnAbilityEntity') {
      expect(
        resolveActionValueOperand(step.parameters.overrideDurationSeconds!, context!.blackboard),
      ).toBe(3);
      const entry = step.parameters.definition!.childSkill!.timelineActions[0]!.sequence;
      host.runtime.createSequence(entry).executeInstant({});
    } else if (step.kind === 'triggerCustomAbilityEvent') flags.push(step.parameters.eventName);
    return true;
  });
  const compiled = createActionGraphCompilation(resource, 1).compileEntry(
    { $sequence: 'call' },
    'call',
  );
  host.runtime.createSequence(compiled).executeInstant({});
  expect(flags).toEqual(['child-executed']);
});
