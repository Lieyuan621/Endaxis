import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { COMBAT_STEP_EXECUTION_ROUTES, isCombatOperationStep } from '../../compiler/combatProgram';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { COMBAT_STEP_KINDS } from '../../game-data/operatorDefinition';
import type { ResolvedActionSequence, ResolvedCombatStep } from '../../compiler/combatProgram';
import { ActionBlackboard } from './actionBlackboard';
import { CombatActionSequenceRuntime } from './combatActionSequenceRuntime';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { createNativeEventFixture } from '../events/nativeEventTestFixture';
import { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import { AbilityEventDispatcher } from '../events/abilityEventDispatcher';
import { AbilitySystemRuntime } from '../abilities/abilitySystemRuntime';
import { SkillSlotOperationExecutor } from '../skills/skillSlotOperationExecutor';
import type { AbilityEventPayloadMap } from '../events/combatAbilityEvent';

function operation(flag: string): ResolvedCombatStep {
  return {
    kind: 'setContextFlag',
    parameters: { flag, value: true, target: 'caster' },
  };
}

function sequence(...steps: ResolvedCombatStep[]): ResolvedActionSequence {
  return { steps };
}

function createFixture(conditionResult = true) {
  const executed: string[] = [];
  const operations: CombatOperationExecutor = {
    execute: vi.fn(step => {
      executed.push(step.parameters.flag as string);
      return true;
    }),
    evaluate: vi.fn(() => conditionResult),
  };
  const runtime = new CombatActionSequenceRuntime(operations, {
    blackboard: new ActionBlackboard(),
  });
  return { executed, operations, runtime };
}

describe('CombatActionSequenceRuntime', () => {
  it('ExecuteInterval 保留子动作到下一周期，切面恢复后仍能结束原登记', () => {
    const bind = () => {
      const finish = vi.fn();
      const replace = vi.fn(() => 12);
      const context = { blackboard: new ActionBlackboard() };
      const runtime = new CombatActionSequenceRuntime(
        new SkillSlotOperationExecutor({
          changeSkillSlot: vi.fn(),
          replaceSkillSlot: replace,
          finishSkillSlotReplacement: finish,
          delegate: { execute: () => true, evaluate: () => true },
        }),
        context,
      );
      return { runtime, context, finish, replace };
    };
    const definition = sequence({
      kind: 'repeatEachTick',
      parameters: { nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 0.5 } },
      body: sequence({
        kind: 'changeSkillSlot',
        parameters: {
          skillGroupKey: 'battle',
          targetSkillKey: 'enhanced',
          lifetime: 'finishByAction',
        },
      }),
    });
    const original = bind();
    const action = original.runtime.createSequence(definition);
    action.reset({});
    action.execute({});
    action.tick(0.25, {});
    expect(original.replace).toHaveBeenCalledTimes(1);
    expect(original.finish).not.toHaveBeenCalled();
    const branch = bind();
    const restored = branch.runtime.createSequence(
      definition,
      branch.context,
      structuredClone(action.runtimeState),
    );
    expect(branch.replace).not.toHaveBeenCalled();
    restored.tick(0.25, {});
    expect(branch.finish).toHaveBeenCalledExactlyOnceWith('battle', 12);
    expect(branch.replace).toHaveBeenCalledTimes(1);
    restored.end({});
    expect(branch.finish).toHaveBeenCalledTimes(2);
    expect(original.finish).not.toHaveBeenCalled();
    action.end({});
    expect(original.finish).toHaveBeenCalledTimes(1);
  });

  it('技能槽替换动作恢复时不重放替换，结束只调用新分支的登记编号', () => {
    const firstFinish = vi.fn();
    const secondFinish = vi.fn();
    const bind = (finish: (group: string, id: number) => void) => {
      const replace = vi.fn(() => 12);
      const context = { blackboard: new ActionBlackboard() };
      const runtime = new CombatActionSequenceRuntime(
        new SkillSlotOperationExecutor({
          changeSkillSlot: vi.fn(),
          replaceSkillSlot: replace,
          finishSkillSlotReplacement: finish,
          delegate: { execute: () => false, evaluate: () => false },
        }),
        context,
      );
      return { runtime, context, replace };
    };
    const definition = sequence({
      kind: 'changeSkillSlot',
      parameters: {
        skillGroupKey: 'battle',
        targetSkillKey: 'enhanced',
        lifetime: 'finishByAction',
      },
    });
    const first = bind(firstFinish);
    const action = first.runtime.createSequence(definition);
    action.execute({});
    const saved = structuredClone(action.runtimeState);
    const second = bind(secondFinish);
    const restored = second.runtime.createSequence(definition, second.context, saved);
    expect(second.replace).not.toHaveBeenCalled();
    restored.end({});
    restored.end({});
    expect(secondFinish).toHaveBeenCalledExactlyOnceWith('battle', 12);
    expect(firstFinish).not.toHaveBeenCalled();
    action.end({});
    expect(firstFinish).toHaveBeenCalledExactlyOnceWith('battle', 12);
  });

  it('普攻映射动作恢复后保留覆盖顺序，结束时只删除当前分支自己的登记', () => {
    const bind = (ability: AbilitySystemRuntime) => {
      const register = vi.fn((id: string) => ability.overrideBasicAttackMapping(id).registrationId);
      const context = { blackboard: new ActionBlackboard() };
      const runtime = new CombatActionSequenceRuntime(
        new SkillSlotOperationExecutor({
          changeSkillSlot: vi.fn(),
          overrideBasicAttackMapping: register,
          finishBasicAttackMapping: id => ability.finishBasicAttackMapping(id),
          delegate: { execute: () => false, evaluate: () => false },
        }),
        context,
      );
      return { runtime, context, register };
    };
    const original = new AbilitySystemRuntime({ skills: [] });
    original.overrideBasicAttackMapping('earlier');
    const first = bind(original);
    const definition = sequence({
      kind: 'overrideBasicAttackMapping',
      parameters: { skillId: 'current' },
    });
    const action = first.runtime.createSequence(definition);
    action.execute({});
    const saved = structuredClone({ ability: original.runtimeState, action: action.runtimeState });
    const restored = new AbilitySystemRuntime({ skills: [] }, saved.ability);
    const second = bind(restored);
    const resumed = second.runtime.createSequence(definition, second.context, saved.action);
    expect(second.register).not.toHaveBeenCalled();
    expect(saved.ability.nextBasicAttackMappingId).toBe(2);
    restored.overrideBasicAttackMapping('later');
    resumed.end({});
    resumed.end({});
    expect([...saved.ability.buffBasicAttackMappings.values()]).toEqual(['earlier', 'later']);
    expect([...original.runtimeState.buffBasicAttackMappings.values()]).toEqual([
      'earlier',
      'current',
    ]);
    expect(second.context).not.toHaveProperty('actionRegistrationState');
  });

  it('恢复形态动作后按保存的编号结束，不重放切换或触碰旧分支', () => {
    const options = {
      skills: [],
      playerActionModes: [
        { modeId: 'base', modeLayer: 'mode', defaultEnabled: true, commandMappings: {} },
        { modeId: 'special', modeLayer: 'mode', defaultEnabled: false, commandMappings: {} },
      ],
    };
    const bind = (ability: AbilitySystemRuntime) => {
      const activate = vi.fn((id: string) => ability.activatePlayerActionMode(id).registrationId);
      const context = { blackboard: new ActionBlackboard() };
      const runtime = new CombatActionSequenceRuntime(
        new SkillSlotOperationExecutor({
          changeSkillSlot: vi.fn(),
          activatePlayerActionMode: activate,
          finishPlayerActionMode: id => ability.finishPlayerActionModeActivation(id),
          delegate: { execute: () => false, evaluate: () => false },
        }),
        context,
      );
      return { runtime, activate, context };
    };
    const definition = sequence({
      kind: 'changePlayerActionMode',
      parameters: { modeId: 'special', lifetime: 'finishByAction' },
    });
    const original = new AbilitySystemRuntime(options);
    const first = bind(original);
    const action = first.runtime.createSequence(definition);
    action.execute({});
    expect(first.context).not.toHaveProperty('actionRegistrationState');
    const saved = structuredClone({ ability: original.runtimeState, action: action.runtimeState });
    const restored = new AbilitySystemRuntime(options, saved.ability);
    const second = bind(restored);
    const resumed = second.runtime.createSequence(definition, second.context, saved.action);
    expect(second.activate).not.toHaveBeenCalled();
    expect(saved.ability.nextPlayerActionModeActivationId).toBe(1);
    resumed.end({});
    resumed.end({});
    expect(saved.ability.activePlayerActionModeByLayer.get('mode')).toBe('base');
    expect(original.runtimeState.activePlayerActionModeByLayer.get('mode')).toBe('special');
    expect(second.context).not.toHaveProperty('actionRegistrationState');
    action.end({});
    expect(original.runtimeState.activePlayerActionModeByLayer.get('mode')).toBe('base');
  });

  it('恢复 SkillAffix 动作后按保存编号结束且不重新安装', () => {
    const create = (installed: number[], finished: number[]) => {
      const context = { blackboard: new ActionBlackboard() };
      return {
        context,
        runtime: new CombatActionSequenceRuntime(
          {
            execute: (step, operationContext) => {
              if (step.kind !== 'skillAffix') return false;
              const state = operationContext?.actionRegistrationState;
              if (state === undefined) throw new Error('missing SkillAffix action data');
              state.registrationId = 17;
              installed.push(17);
              return true;
            },
            end: (step, operationContext) => {
              if (step.kind !== 'skillAffix') return;
              const state = operationContext?.actionRegistrationState;
              if (state?.registrationId === null || state?.registrationId === undefined) return;
              finished.push(state.registrationId);
              state.registrationId = null;
            },
            evaluate: () => false,
          },
          context,
        ),
      };
    };
    const definition = sequence({ kind: 'skillAffix', parameters: {} });
    const oldInstalled: number[] = [];
    const oldFinished: number[] = [];
    const first = create(oldInstalled, oldFinished);
    const action = first.runtime.createSequence(definition);
    action.execute({});
    const saved = structuredClone(action.runtimeState);

    const newInstalled: number[] = [];
    const newFinished: number[] = [];
    const second = create(newInstalled, newFinished);
    const restored = second.runtime.createSequence(definition, second.context, saved);
    restored.end({});

    expect(oldInstalled).toEqual([17]);
    expect(newInstalled).toEqual([]);
    expect(newFinished).toEqual([17]);
    expect(oldFinished).toEqual([]);
    action.end({});
    expect(oldFinished).toEqual([17]);
  });

  it('恢复原生监听响应时不重注册或重置，后续事件只执行一次且旧句柄不影响新分支', () => {
    const native = createNativeEventFixture();
    const parent = new ActionBlackboard();
    const original = new CombatActionSequenceRuntime(
      { execute: () => true, evaluate: () => true },
      { blackboard: parent },
      {},
      native.semanticEvents,
      'owner',
    );
    const definition = sequence({
      kind: 'listenForCombatEvents',
      parameters: {
        responses: [
          {
            key: 'response',
            event: { kind: 'buffApplied' },
            phase: 'dataAction',
            priority: 4,
            sequence: sequence(operation('response')),
          },
        ],
      },
    });
    const listener = original.createSequence(definition);
    listener.execute({});
    const saved = structuredClone({
      sequence: listener.runtimeState,
      parent: parent.runtimeState,
      scopes: original.scopeState,
      native: native.dispatcher.runtimeState,
      semantic: native.semanticEvents.runtimeState,
    });
    const dispatcher = new AbilityEventDispatcher<
      keyof AbilityEventPayloadMap,
      AbilityEventPayloadMap
    >(saved.native);
    const semantic = new CombatSemanticEventRuntime(undefined, {
      state: saved.semantic,
      bindNative: (reference, receive) =>
        dispatcher.bindSubscription(reference, event => {
          if (event.event !== 'addedBuff') throw new Error('unexpected fixture event');
          receive({ event });
        }),
    });
    const execute = vi.fn(() => true);
    const prepare = vi.fn();
    const restored = new CombatActionSequenceRuntime(
      { execute, prepare, evaluate: () => true },
      { blackboard: ActionBlackboard.bindRuntimeState(saved.parent) },
      {},
      semantic,
      'owner',
      saved.scopes,
    );
    const nextId = saved.native.nextRegistrationId;
    const resumed = restored.createSequence(definition, undefined, saved.sequence);
    expect(prepare).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
    expect(saved.native.nextRegistrationId).toBe(nextId);
    listener.end({});
    const event = {
      event: 'addedBuff' as const,
      payload: {
        sourceId: 'owner',
        targetId: 'owner',
        buffId: 'signal',
        buffTags: [],
      },
    };
    dispatcher.dispatch(event, []);
    expect(execute).toHaveBeenCalledTimes(1);
    resumed.end({});
    dispatcher.dispatch(event, []);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('恢复无序配置的时间轴，保留活动区间并按原顺序启动尚未开始的区间', () => {
    const actions = [
      { startFrame: 3, sequence: sequence(operation('later')) },
      {
        startFrame: 0,
        endFrame: 5,
        sequence: sequence({
          kind: 'repeatEachTick' as const,
          parameters: {},
          body: sequence(operation('running')),
        }),
      },
    ];
    const original = createFixture();
    const timeline = original.runtime.createTimeline(actions);
    timeline.reset({});
    timeline.tick(0, 0, {});
    timeline.tick(1, 1 / 30, {});
    const saved = structuredClone(timeline.runtimeState);
    const restored = createFixture();
    const lifecycle = { started: vi.fn(), ended: vi.fn() };
    const restoredState = structuredClone(saved);
    const resumed = restored.runtime.createTimeline(actions, lifecycle, restoredState);
    expect(resumed.runtimeState).toBe(restoredState);
    expect(restored.executed).toEqual([]);
    expect(lifecycle.started).not.toHaveBeenCalled();
    original.executed.length = 0;
    for (let frame = 2; frame <= 5; frame++) {
      timeline.tick(frame, 1 / 30, {});
      resumed.tick(frame, 1 / 30, {});
      expect(resumed.runtimeState).toEqual(timeline.runtimeState);
    }
    expect(restored.executed).toEqual(original.executed);
    expect(restored.executed).toContain('later');
    expect(lifecycle.started).toHaveBeenCalledTimes(1);
    expect(lifecycle.started).toHaveBeenCalledWith(expect.anything(), 0, 3);
    expect(resumed.isComplete).toBe(true);
    expect(saved.scheduling.active).toEqual([0]);
  });

  it('恢复宿主作用域后保留 once 标记和缓存黑板，后续新序列继续复用', () => {
    const original = createFixture();
    const parent = original.runtime.context.blackboard;
    const scoped = {
      kind: 'withActionBlackboardScope',
      parameters: { scopeKey: 'shared', inheritParent: true, initialValues: { value: 1 } },
      body: sequence(),
    } as const;
    const board = original.runtime.getActionBlackboardScope(scoped, parent);
    board.assignDynamic('value', 9);
    const definition = sequence({
      kind: 'once',
      parameters: { scopeKey: 'once' },
      body: sequence(operation('once')),
    });
    original.runtime.createSequence(definition).executeInstant({});
    const saved = structuredClone({
      parent: parent.runtimeState,
      scopes: original.runtime.scopeState,
    });
    const restoredParent = ActionBlackboard.bindRuntimeState(saved.parent);
    const execute = vi.fn(() => true);
    const restored = new CombatActionSequenceRuntime(
      { execute, evaluate: () => true },
      { blackboard: restoredParent },
      {},
      undefined,
      undefined,
      saved.scopes,
    );
    expect(restored.scopeState).toBe(saved.scopes);
    const restoredBoard = restored.getActionBlackboardScope(scoped, restoredParent);
    expect(restoredBoard.runtimeState).toBe(
      saved.scopes.blackboards.get(saved.parent)!.get('shared'),
    );
    expect(restoredBoard.getNumber('value')).toBe(9);
    restored.createSequence(definition).executeInstant({});
    expect(execute).not.toHaveBeenCalled();
    restoredBoard.assignDynamic('value', 12);
    expect(board.getNumber('value')).toBe(9);
    restored.reset();
    restored.createSequence(definition).executeInstant({});
    expect(execute).toHaveBeenCalledTimes(1);
    expect(original.runtime.scopeState.executedOnce.has('once')).toBe(true);
  });

  it('无状态投射物步骤可绑定，序列长度仍必须匹配', () => {
    const { runtime } = createFixture();
    const definition = sequence({
      kind: 'launchProjectile',
      parameters: { finish: { reachAfterTicks: 2, maxDurationSeconds: 2 }, recycleDelaySeconds: 0 },
      callbacks: [],
    });
    const state = structuredClone(runtime.createSequence(definition).runtimeState);
    expect(() => runtime.createSequence(definition, undefined, state)).not.toThrow();
    expect(() => runtime.createSequence(sequence(), undefined, state)).toThrow('program length');
  });

  it('恢复同步循环、结束时间轴和可操作边界步骤，不重放已执行动作', () => {
    const definition = sequence(
      {
        kind: 'repeatByActionValue',
        parameters: { count: { kind: 'blackboard', key: 'count' } },
        body: sequence(operation('hit')),
      },
      { kind: 'reachSkillOperableBoundary', parameters: { skillIds: ['native'] } },
      { kind: 'finishTimeline', parameters: {} },
    );
    const bind = () => {
      const execute = vi.fn(() => true);
      const finish = vi.fn();
      const boundary = vi.fn();
      const context = {
        blackboard: new ActionBlackboard({ count: 2 }),
        requestTimelineFinish: finish,
        reachSkillOperableBoundary: boundary,
      };
      const runtime = new CombatActionSequenceRuntime({ execute, evaluate: () => true }, context);
      return { runtime, context, execute, finish, boundary };
    };
    const original = bind();
    const action = original.runtime.createSequence(definition);
    action.execute({});
    expect(original.execute).toHaveBeenCalledTimes(2);
    const next = bind();
    const restored = next.runtime.createSequence(
      definition,
      next.context,
      structuredClone(action.runtimeState),
    );
    restored.tick(1, {});
    restored.end({});
    expect(next.execute).not.toHaveBeenCalled();
    expect(next.finish).not.toHaveBeenCalled();
    expect(next.boundary).not.toHaveBeenCalled();
    restored.reset({});
    restored.execute({});
    expect(next.execute).toHaveBeenCalledTimes(2);
    expect(next.finish).toHaveBeenCalledOnce();
    expect(next.boundary).toHaveBeenCalledExactlyOnceWith(['native']);
    expect(original.finish).toHaveBeenCalledOnce();
  });

  it('恢复目标循环中的作用域和计时器，不重选目标或重新初始化黑板', () => {
    const definition = sequence({
      kind: 'forEachContextTarget',
      parameters: { contextKey: 'targets' },
      body: sequence({
        kind: 'withActionBlackboardScope',
        parameters: {
          scopeKey: 'target',
          lifetime: 'execution',
          inheritParent: true,
          initialValues: { count: 0 },
        },
        body: sequence({
          kind: 'repeatEachTick',
          parameters: {},
          body: sequence(operation('count')),
        }),
      }),
    });
    const targets = new RuntimeTargetContext();
    targets.set('targets', [
      { kind: 'abilityEntity', instanceId: 3 },
      { kind: 'abilityEntity', instanceId: 7 },
    ]);
    const create = (targetContext: RuntimeTargetContext) => {
      const seen: unknown[] = [];
      const runtime = new CombatActionSequenceRuntime(
        {
          evaluate: () => true,
          execute: (_step, context) => {
            const board = context!.blackboard;
            const previous = board.getNumber('count');
            if (previous === undefined) throw new Error('restored scope is missing count');
            const count = previous + 1;
            board.assignDynamic('count', count);
            seen.push([context!.currentTarget, count]);
            return true;
          },
        },
        { blackboard: new ActionBlackboard(), targetContext },
      );
      return { seen, runtime };
    };
    const original = create(targets);
    const action = original.runtime.createSequence(definition);
    action.execute({});
    action.tick(0, {});
    const saved = structuredClone(action.runtimeState);
    const restored = create(new RuntimeTargetContext());
    const resumed = restored.runtime.createSequence(definition, undefined, structuredClone(saved));
    expect(restored.seen).toEqual([]);
    resumed.tick(1 / 30, {});
    expect(restored.seen).toEqual([
      [{ kind: 'abilityEntity', instanceId: 3 }, 2],
      [{ kind: 'abilityEntity', instanceId: 7 }, 2],
    ]);
    action.tick(1 / 30, {});
    expect(resumed.runtimeState).toEqual(action.runtimeState);
    resumed.end({});
    const loop = saved.steps[0];
    if (loop?.kind !== 'targets') throw new Error('expected target loop');
    expect(loop.loop.bodies.size).toBe(2);
  });

  it('重新绑定分支循环后只继续 Tick，不重放 Execute 或重新求值分支', () => {
    const definition = sequence({
      kind: 'conditional',
      parameters: { condition: { kind: 'combatActive' }, alwaysNext: true },
      whenTrue: sequence({
        kind: 'repeatEachTick',
        parameters: {},
        body: sequence(operation('tick')),
      }),
      whenFalse: sequence(operation('wrong-branch')),
    });
    const original = createFixture(true);
    const action = original.runtime.createSequence(definition);
    action.execute({});
    action.tick(0, {});
    const saved = structuredClone(action.runtimeState);
    action.tick(1 / 30, {});
    const restored = createFixture(false);
    const resumed = restored.runtime.createSequence(definition, undefined, structuredClone(saved));
    expect(restored.executed).toEqual([]);
    expect(restored.operations.evaluate).not.toHaveBeenCalled();
    resumed.tick(1 / 30, {});
    expect(restored.executed).toEqual(['tick']);
    expect(resumed.runtimeState).toEqual(action.runtimeState);
    resumed.end({});
    expect(saved.entries[0]!.state).not.toBe('ended');
  });

  it('从父序列保存分支内的循环进度，后续执行不会修改已保存的数据', () => {
    const { runtime } = createFixture();
    const action = runtime.createSequence(
      sequence({
        kind: 'conditional',
        parameters: { condition: { kind: 'combatActive' }, alwaysNext: true },
        whenTrue: sequence({
          kind: 'repeatEachTick',
          parameters: {},
          body: sequence(operation('frame')),
        }),
      }),
    );
    action.execute({});
    const branch = action.runtimeState.steps[0];
    if (branch?.kind !== 'branch') throw new Error('expected branch data');
    expect(branch.selection.activeBranch).toBe(0);
    const loop = branch.branches[0]!.steps[0];
    if (loop?.kind !== 'repeat') throw new Error('expected repeat data');
    expect(loop.repetition.skipInitialTick).toBe(true);
    const saved = structuredClone(action.runtimeState);
    action.tick(0, {});
    expect(loop.repetition.skipInitialTick).toBe(false);
    const savedBranch = saved.steps[0];
    if (savedBranch?.kind !== 'branch') throw new Error('expected saved branch');
    expect(savedBranch.branches[0]!.steps[0]).toMatchObject({
      kind: 'repeat',
      repetition: { skipInitialTick: true },
    });
    expect(savedBranch.branches[0]!.entries[0]!.state).toBe('started');
  });

  it('每种步骤必须声明执行归属，监听器不能进入操作链', () => {
    expect(Object.keys(COMBAT_STEP_EXECUTION_ROUTES).sort()).toEqual([...COMBAT_STEP_KINDS].sort());
    expect(isCombatOperationStep(operation('ordinary'))).toBe(true);
    expect(
      isCombatOperationStep({ kind: 'listenForCombatEvents', parameters: { responses: [] } }),
    ).toBe(false);
    expectTypeOf<ResolvedCombatOperationStep['kind']>()
      .exclude<'listenForCombatEvents'>()
      .toEqualTypeOf<ResolvedCombatOperationStep['kind']>();
  });

  it('回调的 Channeling 子序列即时清理，不把 finishByAction 延长到回调时间轴结束', () => {
    // 洛茜 projhit3 的形状：maxCountPerTarget=1，子动作含 finishByAction Buff。
    // Channeling.actionOnTick 原生走 ExecuteInstant；与外层技能的寿命不同。
    const seen: string[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: () => {
          seen.push('apply');
          return true;
        },
        end: () => {
          seen.push('finish');
        },
        evaluate: () => true,
      },
      { blackboard: new ActionBlackboard() },
    );
    const timeline = runtime.createTimeline([
      {
        startFrame: 0,
        endFrame: 30,
        sequence: sequence({
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: sequence({
            kind: 'applyBuff',
            parameters: {
              buffId: 'fixture',
              target: 'caster',
              finishByAction: true,
            },
          }),
        }),
      },
    ]);
    timeline.reset({});
    timeline.tick(0, 0, {});
    expect(seen).toEqual(['apply', 'finish']);
    expect(timeline.isComplete).toBe(false);
    for (let frame = 1; frame <= 30; frame++) timeline.tick(frame, 1 / 30, {});
    timeline.end(30, {});
    expect(timeline.isComplete).toBe(true);
    expect(seen).toEqual(['apply', 'finish']);
  });

  it('temporary listener conditions and bodies share the live host permission', () => {
    const { dispatcher, semanticEvents, emitAddedBuff } = createNativeEventFixture();
    let enabled = true;
    const evaluate = vi.fn(() => true);
    const execute = vi.fn(() => true);
    const runtime = new CombatActionSequenceRuntime(
      { evaluate, execute },
      { blackboard: new ActionBlackboard(), canExecuteAction: () => enabled },
      {},
      semanticEvents,
      'owner',
    );
    const listener = runtime.createSequence(
      sequence({
        kind: 'listenForCombatEvents',
        parameters: {
          responses: [
            {
              key: 'gated',
              event: { kind: 'abilityEvent', event: 'addedBuff' },
              phase: 'dataAction',
              priority: 0,
              condition: { kind: 'probability', probability: { kind: 'constant', value: 1 } },
              sequence: sequence(operation('response')),
            },
          ],
        },
      }),
    );
    const emit = () =>
      emitAddedBuff({ sourceId: 'owner', targetId: 'owner', buffId: 'signal', buffTags: [] });
    listener.execute({});
    const listenerData = listener.runtimeState.steps[0];
    if (listenerData?.kind !== 'listener') throw new Error('expected listener data');
    expect(listenerData.listener.responses).toHaveLength(1);
    const copied = structuredClone({ listenerData, events: dispatcher.runtimeState });
    const savedListener = copied.listenerData;
    const reference = savedListener.listener.responses[0]!.subscriptions[0]!;
    expect(reference.state).toBe(copied.events);
    expect(reference.event).toBe('addedBuff');
    expect(reference.phase).toBe('action');
    expect(
      copied.events.phases.action.get('addedBuff')!.some(entry => entry.id === reference.id),
    ).toBe(true);
    enabled = false;
    emit();
    expect(evaluate).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
    enabled = true;
    emit();
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
    enabled = false;
    listener.end({});
    expect(listenerData.listener.responses).toHaveLength(0);
    expect(savedListener.listener.responses).toHaveLength(1);
    enabled = true;
    emit();
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('creates independent interval lifetimes sharing only their host context', () => {
    const trace: string[] = [];
    const context = { blackboard: new ActionBlackboard() };
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (step, current) => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected test action');
          expect(current).toBe(context);
          const flag = step.parameters.flag;
          if (flag === 'first') current!.blackboard.assignDynamic('shared', 7);
          else expect(current!.blackboard.getNumber('shared')).toBe(7);
          trace.push(`start:${flag}`);
          return true;
        },
        end: step => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected test action');
          trace.push(`end:${step.parameters.flag}`);
        },
        evaluate: () => true,
      },
      context,
    );
    const actions = [
      { startFrame: 0, endFrame: 1, sequence: sequence(operation('first')) },
      { startFrame: 0, endFrame: 3, sequence: sequence(operation('second')) },
    ];
    const timeline = runtime.createTimeline(actions);
    const other = runtime.createTimeline(actions);
    timeline.reset({});
    timeline.tick(0, 0, {});
    expect(trace).toEqual(['start:first', 'start:second']);
    timeline.tick(1, 1 / 30, {});
    expect(trace).toEqual(['start:first', 'start:second', 'end:first']);
    timeline.tick(3, 2 / 30, {});
    expect(trace.at(-1)).toBe('end:second');
    expect(timeline.isComplete).toBe(true);
    expect(other.isComplete).toBe(false);
    other.reset({});
    other.tick(0, 0, {});
    expect(trace.slice(-2)).toEqual(['start:first', 'start:second']);
  });

  it('临时监听部分注册失败时立即释放已安装响应', () => {
    const { dispatcher, semanticEvents, emitAddedBuff } = createNativeEventFixture();
    const persistent = vi.fn();
    dispatcher.registerAction('addedBuff', 0, persistent);
    const execute = vi.fn(() => true);
    const register = semanticEvents.register.bind(semanticEvents);
    vi.spyOn(semanticEvents, 'register')
      .mockImplementationOnce(register)
      .mockImplementationOnce(() => {
        throw new Error('registration failed');
      });
    const runtime = new CombatActionSequenceRuntime(
      { evaluate: () => true, execute },
      { blackboard: new ActionBlackboard() },
      {},
      semanticEvents,
      'owner',
    );
    const listener = runtime.createSequence(
      sequence({
        kind: 'listenForCombatEvents',
        parameters: {
          responses: ['first', 'second'].map(key => ({
            key,
            event: { kind: 'buffApplied' as const },
            phase: 'dataAction' as const,
            priority: 0,
            sequence: sequence(operation(key)),
          })),
        },
      }),
    );
    expect(() => listener.execute({})).toThrow('registration failed');
    emitAddedBuff({ sourceId: 'owner', targetId: 'owner', buffId: 'signal', buffTags: [] });
    expect(execute).not.toHaveBeenCalled();
    expect(persistent).toHaveBeenCalledTimes(1);
    expect(() => listener.end({})).not.toThrow();
  });

  it('临时原生动作与常驻动作同阶段执行，结束后仅移除自身注册', () => {
    const { dispatcher, semanticEvents, emitAddedBuff } = createNativeEventFixture();
    const calls: string[] = [];
    dispatcher.registerListener('addedBuff', 'skill', () => calls.push('skill'));
    dispatcher.registerAction('addedBuff', 0, () => calls.push('persistent'));
    const runtime = new CombatActionSequenceRuntime(
      {
        evaluate: () => true,
        execute: step => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected operation');
          calls.push(step.parameters.flag as string);
          return true;
        },
      },
      { blackboard: new ActionBlackboard() },
      {},
      semanticEvents,
      'owner',
    );
    const listener = runtime.createSequence(
      sequence({
        kind: 'listenForCombatEvents',
        parameters: {
          responses: [
            {
              key: 'temporary',
              event: { kind: 'abilityEvent', event: 'addedBuff' },
              phase: 'dataAction',
              priority: 0,
              sequence: sequence(operation('temporary')),
            },
          ],
        },
      }),
    );
    const emit = () =>
      emitAddedBuff({
        sourceId: 'owner',
        targetId: 'owner',
        buffId: 'signal',
        buffTags: [],
      });
    listener.execute({});
    emit();
    expect(calls).toEqual(['persistent', 'temporary', 'skill']);
    listener.end({});
    calls.length = 0;
    emit();
    expect(calls).toEqual(['persistent', 'skill']);
  });

  it('监听复用原生守卫状态，阻止自身尾部事件重入，但仍响应后续事件', () => {
    const { semanticEvents: events, emitAddedBuff } = createNativeEventFixture();
    const calls: string[] = [];
    const emit = (buffId: string) =>
      emitAddedBuff({
        sourceId: 'owner',
        targetId: 'owner',
        buffId,
        buffTags: [],
      });
    const runtime = new CombatActionSequenceRuntime(
      {
        evaluate: (_condition, context) => {
          calls.push(
            `check:${context?.event && 'payload' in context.event && context.event.event === 'addedBuff' ? context.event.payload.buffId : 'missing'}`,
          );
          return true;
        },
        execute: (step, context) => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected operation');
          const id =
            context?.event && 'payload' in context.event && context.event.event === 'addedBuff'
              ? context.event.payload.buffId
              : 'missing';
          calls.push(`${step.parameters.flag}:${id}`);
          if (step.parameters.flag === 'emit') {
            // Bound a broken implementation's recursion so the regression fails
            // with a useful assertion rather than megabytes of stack errors.
            if (calls.length > 12) throw new Error('listener recursively restarted');
            emit('nested');
          }
          return true;
        },
      },
      { blackboard: new ActionBlackboard() },
      {},
      events,
      'owner',
    );
    const listener = runtime.createSequence(
      sequence({
        kind: 'listenForCombatEvents',
        parameters: {
          responses: [
            {
              key: 'reentry',
              event: { kind: 'abilityEvent', event: 'addedBuff' },
              sequence: sequence({
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['signal'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                whenTrue: sequence(operation('emit'), operation('tail')),
              }),
            },
          ],
        },
      }),
    );
    listener.execute({});
    emit('first');
    emit('second');
    expect(calls).toEqual([
      'check:first',
      'emit:first',
      'tail:first',
      'check:second',
      'emit:second',
      'tail:second',
    ]);
    listener.end({});
    emit('after-end');
    expect(calls).toHaveLength(6);
  });

  it.each([
    { count: 0, source: 'actionSource' as const, expectedSource: 'operator' },
    { count: 2, source: 'actionSource' as const, expectedSource: 'operator' },
    { count: 2, source: 'actionOwner' as const, expectedSource: 'buff-owner' },
  ])('投射物按Context目标执行，来源为$source', ({ count, source, expectedSource }) => {
    const targetContext = new RuntimeTargetContext();
    targetContext.set(
      'items',
      Array.from({ length: count }, (_, index) => ({
        kind: 'abilityEntity' as const,
        instanceId: index + 1,
      })),
    );
    const schedule = vi.fn(() => {
      // 发射过程中后续查询覆盖同名组，不应改变本次已取得的目标快照。
      targetContext.set('items', []);
      return {
        target: { kind: 'abilityEntity' as const, instanceId: 100 },
        instanceId: 100,
        onReset: () => ({ registrationId: 0, dispose: () => {} }),
      };
    });
    const runtime = new CombatActionSequenceRuntime(
      { execute: () => true, evaluate: () => true },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        actionSourceId: 'operator',
        buffOwnerId: 'buff-owner',
        launchProjectile: schedule,
      },
    );
    const finish = { reachAfterTicks: 2, maxDurationSeconds: 2 };
    const launches = runtime.createSequence(
      sequence({
        kind: 'forEachContextTarget',
        parameters: { contextKey: 'items' },
        body: sequence({
          kind: 'launchProjectile',
          parameters: { finish, recycleDelaySeconds: 1.5, source },
          callbacks: [],
        }),
      }),
    );
    launches.executeInstant({});
    expect(schedule).toHaveBeenCalledTimes(count);
    // 下一次执行读取已清空的组，不重复发射上一批目标。
    launches.executeInstant({});
    expect(schedule).toHaveBeenCalledTimes(count);
    if (count > 0)
      expect(schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          finish,
          recycleDelaySeconds: 1.5,
          sourceId: expectedSource,
          callbacks: [],
        }),
      );
  });

  it('唯一目标 ForEach 仍隔离内部失败并让外层后继继续', () => {
    const seen: unknown[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (step, context) => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected test operation');
          seen.push([step.parameters.flag, context?.currentTarget]);
          return true;
        },
        evaluate: () => false,
      },
      { blackboard: new ActionBlackboard() },
    );

    expect(
      runtime
        .createSequence(
          sequence(
            {
              kind: 'forEachContextTarget',
              parameters: { target: 'enemy' },
              body: sequence(
                {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'combatActive' } },
                  whenTrue: sequence(operation('guarded')),
                },
                operation('inside-after-failed-guard'),
              ),
            },
            operation('outside-after-loop'),
          ),
        )
        .executeInstant({}),
    ).toBe(true);
    expect(seen).toEqual([['outside-after-loop', undefined]]);
  });

  it('逐项失败只跳过本项后继；保留目标快照与共享黑板，循环后继续', () => {
    const targetContext = new RuntimeTargetContext();
    targetContext.set('items', [
      { kind: 'abilityEntity', instanceId: 1 },
      { kind: 'abilityEntity', instanceId: 2 },
    ]);
    const blackboard = new ActionBlackboard({ count: 0 });
    const seen: unknown[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (step, context) => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected test operation');
          seen.push([step.parameters.flag, context?.currentTarget]);
          expect(context?.blackboard).toBe(blackboard);
          return true;
        },
        evaluate: (_condition, context) => {
          targetContext.set('items', []);
          context!.blackboard.assignDynamic('count', context!.blackboard.getNumber('count')! + 1);
          return (
            context?.currentTarget?.kind === 'abilityEntity' &&
            context.currentTarget.instanceId === 2
          );
        },
      },
      { blackboard, targetContext },
    );
    expect(
      runtime
        .createSequence(
          sequence(
            {
              kind: 'forEachContextTarget',
              parameters: { contextKey: 'items' },
              body: sequence({
                kind: 'conditional',
                parameters: { condition: { kind: 'combatActive' } },
                whenTrue: sequence(operation('accepted')),
              }),
            },
            operation('after'),
          ),
        )
        .executeInstant({}),
    ).toBe(true);
    expect(seen).toEqual([
      ['accepted', { kind: 'abilityEntity', instanceId: 2 }],
      ['after', undefined],
    ]);
    expect(blackboard.getNumber('count')).toBe(2);
  });

  it('逐目标循环空集合成功，但未知异常不得被当成条件失败吞掉', () => {
    const targetContext = new RuntimeTargetContext();
    targetContext.set('items', []);
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: () => {
          throw new Error('invalid data');
        },
        evaluate: () => false,
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );
    const definition = sequence({
      kind: 'forEachContextTarget',
      parameters: { contextKey: 'items' },
      body: sequence(operation('bad')),
    });
    expect(runtime.createSequence(definition).executeInstant({})).toBe(true);
    targetContext.set('items', [{ kind: 'abilityEntity', instanceId: 1 }]);
    expect(() => runtime.createSequence(definition).executeInstant({})).toThrow('invalid data');
  });

  it('keeps per-target body operations alive until the enclosing action ends', () => {
    const end = vi.fn();
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: () => true,
        end,
        evaluate: () => true,
      },
      { blackboard: new ActionBlackboard() },
    );
    const action = runtime.createSequence(
      sequence({
        kind: 'forEachContextTarget',
        parameters: { target: 'enemy' },
        body: sequence(operation('scoped')),
      }),
    );

    action.execute({});
    action.tick(1 / 30, {});
    expect(end).not.toHaveBeenCalled();

    action.end({});
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('同名子作用域只在同一父黑板内复用，不跨投射物宿主串板', () => {
    const fixture = createFixture();
    const step = {
      kind: 'withActionBlackboardScope',
      parameters: { scopeKey: 'callback', inheritParent: true, initialValues: {} },
      body: sequence(),
    } as const;
    const firstParent = new ActionBlackboard({ sourceValue: 2 });
    const secondParent = new ActionBlackboard({ sourceValue: 7 });
    const first = fixture.runtime.getActionBlackboardScope(step, firstParent);
    const second = fixture.runtime.getActionBlackboardScope(step, secondParent);
    expect(first).not.toBe(second);
    expect(first.getNumber('sourceValue')).toBe(2);
    expect(second.getNumber('sourceValue')).toBe(7);
    expect(fixture.runtime.getActionBlackboardScope(step, firstParent)).toBe(first);
  });

  it('作用域子序列惰性接入数据树，重置清除当前子序列但不影响已保存的切面', () => {
    const parent = new ActionBlackboard();
    const boards: ActionBlackboard[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (_step, context) => {
          boards.push(context!.blackboard);
          context!.blackboard.assignDynamic('count', 7);
          return true;
        },
        evaluate: () => true,
      },
      { blackboard: parent },
    );
    const action = runtime.createSequence(
      sequence({
        kind: 'withActionBlackboardScope',
        parameters: {
          scopeKey: 'saved-scope',
          lifetime: 'execution',
          inheritParent: true,
          initialValues: { count: 1 },
        },
        body: sequence(operation('write')),
      }),
    );
    const data = action.runtimeState.steps[0];
    if (data?.kind !== 'blackboardScope') throw new Error('expected scope data');
    expect(data.scope.body).toBeNull();
    action.execute({});
    expect(data.scope.body!.blackboard).toBe(boards[0]!.runtimeState);
    const saved = structuredClone(action.runtimeState);
    action.end({});
    action.reset({});
    expect(data.scope.body).toBeNull();
    const savedData = saved.steps[0];
    if (savedData?.kind !== 'blackboardScope') throw new Error('expected saved scope');
    expect(savedData.scope.body!.blackboard.values.get('count')).toBe(7);
    expect(savedData.scope.body!.sequence.entries[0]!.state).toBe('started');
    action.execute({});
    expect(boards[1]).not.toBe(boards[0]);
    expect(data.scope.body!.blackboard).toBe(boards[1]!.runtimeState);
  });

  it('逐目标循环在同一静态路径创建独立实体板，保留当前目标', () => {
    const targetContext = new RuntimeTargetContext();
    targetContext.set('lances', [
      { kind: 'abilityEntity', instanceId: 3 },
      { kind: 'abilityEntity', instanceId: 7 },
    ]);
    const observed: unknown[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (_step, context) => {
          observed.push([context!.currentTarget, context!.blackboard.getNumber('EntityBB_count')]);
          context!.blackboard.assignDynamic('EntityBB_count', 99);
          return true;
        },
        evaluate: () => true,
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );
    runtime
      .createSequence(
        sequence({
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'lances' },
          body: sequence({
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: 'launch',
              lifetime: 'execution',
              initialValues: {},
              entityInitialValues: { EntityBB_count: 0 },
              inheritParent: true,
            },
            body: sequence({
              kind: 'withActionBlackboardScope',
              parameters: {
                scopeKey: 'callback',
                initialValues: {},
                inheritParent: true,
              },
              body: sequence(operation('visit')),
            }),
          }),
        }),
      )
      .executeInstant({});
    expect(observed).toEqual([
      [{ kind: 'abilityEntity', instanceId: 3 }, 0],
      [{ kind: 'abilityEntity', instanceId: 7 }, 0],
    ]);
  });

  it('兄弟回调共享宿主实体层，但各自 direct 修改不覆盖源快照或另一个回调', () => {
    const parent = new ActionBlackboard({ shared: 6 });
    const seen: unknown[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (step, context) => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected operation');
          const board = context!.blackboard;
          seen.push([
            step.parameters.flag,
            board.getNumber('shared'),
            board.getNumber('EntityBB_count'),
          ]);
          board.assign({ shared: 123 });
          board.assignDynamic('EntityBB_count', 8);
          return true;
        },
        evaluate: () => true,
      },
      { blackboard: parent },
    );
    const children = ['hit', 'reach'].map(key => ({
      kind: 'withActionBlackboardScope' as const,
      parameters: { scopeKey: key, initialValues: { shared: 0 }, inheritParent: true },
      body: sequence(operation(key)),
    }));
    const launch = sequence({
      kind: 'withActionBlackboardScope',
      parameters: {
        scopeKey: 'projectile',
        lifetime: 'execution',
        initialValues: {},
        inheritParent: true,
        entityInitialValues: { EntityBB_count: 0 },
      },
      body: sequence(...children),
    });
    const action = runtime.createSequence(launch);
    action.executeInstant({});
    parent.assign({ shared: 10 });
    action.executeInstant({});
    expect(seen).toEqual([
      ['hit', 6, 0],
      ['reach', 6, 8],
      ['hit', 10, 0],
      ['reach', 10, 8],
    ]);
    expect(parent.snapshot()).toEqual({ shared: 10 });
  });

  it.each([false, true])('回调边界 alwaysNext=%s 只影响局部短路，不跳过执行', alwaysNext => {
    const fixture = createFixture(false);
    fixture.runtime
      .createSequence(
        sequence(
          {
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: 'callback',
              initialValues: {},
              inheritParent: true,
              alwaysNext,
            },
            body: sequence({
              kind: 'conditional',
              parameters: { condition: { kind: 'combatActive' } },
              whenTrue: sequence(operation('blocked')),
            }),
          },
          operation('after'),
        ),
      )
      .executeInstant({});
    expect(fixture.operations.evaluate).toHaveBeenCalledTimes(1);
    expect(fixture.executed).toEqual(alwaysNext ? ['after'] : []);
  });

  it('并列 Buff 回调隔离短路结果但共享父级 direct blackboard', () => {
    const parent = new ActionBlackboard();
    const seen: number[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (step, context) => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected test operation');
          if (step.parameters.flag === 'write') {
            context!.blackboard.assignDynamic('shared_from_callback', 4);
          } else {
            seen.push(context!.blackboard.getNumber('shared_from_callback')!);
          }
          return true;
        },
        evaluate: () => false,
      },
      { blackboard: parent },
    );
    const callback = (scopeKey: string, body: ResolvedActionSequence): ResolvedCombatStep => ({
      kind: 'withActionBlackboardScope',
      parameters: {
        scopeKey,
        lifetime: 'execution',
        alwaysNext: true,
        shareParentBlackboard: true,
        initialValues: {},
        inheritParent: true,
      },
      body,
    });

    expect(
      runtime
        .createSequence(
          sequence(
            callback(
              'first',
              sequence(operation('write'), {
                kind: 'conditional',
                parameters: { condition: { kind: 'combatActive' } },
                whenTrue: sequence(operation('unreachable')),
              }),
            ),
            callback('second', sequence(operation('read'))),
          ),
        )
        .executeInstant({}),
    ).toBe(true);
    expect(seen).toEqual([4]);
    expect(parent.getNumber('shared_from_callback')).toBe(4);
  });

  it('execution 作用域在执行、tick 和 end 期间保持同一黑板', () => {
    const boards: ActionBlackboard[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (_step, context) => {
          boards.push(context!.blackboard);
          return true;
        },
        end: (_step, context) => {
          boards.push(context!.blackboard);
        },
        evaluate: () => true,
      },
      { blackboard: new ActionBlackboard() },
    );
    const action = runtime.createSequence(
      sequence({
        kind: 'withActionBlackboardScope',
        parameters: {
          scopeKey: 'launch',
          lifetime: 'execution',
          initialValues: {},
          inheritParent: true,
        },
        body: sequence({
          kind: 'repeatEachTick',
          parameters: {},
          body: sequence(operation('tick')),
        }),
      }),
    );
    action.execute({});
    action.tick(0, {});
    action.tick(1, {});
    action.end({});
    expect(boards.length).toBe(4);
    expect(new Set(boards).size).toBe(1);
  });

  it('严格按照声明顺序执行普通步骤', () => {
    const fixture = createFixture();

    fixture.runtime
      .createSequence(sequence(operation('first'), operation('second')))
      .executeInstant({});

    expect(fixture.executed).toEqual(['first', 'second']);
  });

  it('按动作黑板整数重复，并为每次 execution 子作用域创建独立黑板', () => {
    const parent = new ActionBlackboard({ projectile_count: 3 });
    const boards: ActionBlackboard[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (_step, context) => {
          boards.push(context!.blackboard);
          return true;
        },
        evaluate: () => true,
      },
      { blackboard: parent },
    );
    runtime
      .createSequence(
        sequence({
          kind: 'repeatByActionValue',
          parameters: { count: { kind: 'blackboard', key: 'projectile_count' } },
          body: sequence({
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: 'projectile:reach',
              lifetime: 'execution',
              initialValues: {},
              inheritParent: true,
            },
            body: sequence(operation('reach')),
          }),
        }),
      )
      .executeInstant({});

    expect(boards).toHaveLength(3);
    expect(new Set(boards).size).toBe(3);
    expect(boards.every(board => board.getNumber('projectile_count') === 3)).toBe(true);
  });

  it('动态重复序列在首次执行前先准备内部操作', () => {
    let prepared = false;
    const runtime = new CombatActionSequenceRuntime(
      {
        prepare: () => {
          prepared = true;
        },
        execute: () => {
          expect(prepared).toBe(true);
          return true;
        },
        evaluate: () => true,
      },
      { blackboard: new ActionBlackboard({ count: 1 }) },
    );

    runtime
      .createSequence(
        sequence({
          kind: 'repeatByActionValue',
          parameters: { count: { kind: 'blackboard', key: 'count' } },
          body: sequence(operation('prepared')),
        }),
      )
      .executeInstant({});
  });

  it('在命中时创建并复用隔离的子 SkillData 动作黑板', () => {
    const parent = new ActionBlackboard({ inherited: 1, childOnly: 99 });
    const snapshots: Readonly<Record<string, unknown>>[] = [];
    const operations: CombatOperationExecutor = {
      execute: (_step, context) => {
        snapshots.push(context!.blackboard.snapshot());
        context!.blackboard.assignDynamic('childOnly', 3);
        return true;
      },
      evaluate: vi.fn(() => true),
    };
    const runtime = new CombatActionSequenceRuntime(operations, { blackboard: parent });
    const scoped: ResolvedCombatStep = {
      kind: 'withActionBlackboardScope',
      parameters: {
        scopeKey: 'projectile:child:1',
        initialValues: { inherited: 0, childOnly: 2 },
        inheritParent: true,
      },
      body: sequence(operation('child')),
    };
    const scheduled = sequence(scoped);
    parent.assignDynamic('inherited', 7);

    runtime.createSequence(scheduled).executeInstant({});
    runtime.createSequence(scheduled).executeInstant({});

    expect(snapshots).toEqual([
      { inherited: 7, childOnly: 99 },
      { inherited: 7, childOnly: 3 },
    ]);
    expect(parent.snapshot()).toEqual({ inherited: 7, childOnly: 99 });
  });

  it('在同一投射物作用域内复用模板实体黑板，并在运行时重置后重新初始化', () => {
    const observed: number[] = [];
    const operations: CombatOperationExecutor = {
      execute: (_step, context) => {
        const blackboard = context!.blackboard;
        observed.push(blackboard.getNumber('EntityBB_hitCount')!);
        blackboard.assignDynamic('EntityBB_hitCount', observed.at(-1)! + 1);
        return true;
      },
      evaluate: vi.fn(() => true),
    };
    const runtime = new CombatActionSequenceRuntime(operations, {
      blackboard: new ActionBlackboard(),
    });
    const scoped: ResolvedCombatStep = {
      kind: 'withActionBlackboardScope',
      parameters: {
        scopeKey: 'projectile:instance:1',
        initialValues: {},
        entityInitialValues: { EntityBB_hitCount: 0 },
        inheritParent: true,
      },
      body: sequence(operation('hit')),
    };

    runtime.createSequence(sequence(scoped)).executeInstant({});
    runtime.createSequence(sequence(scoped)).executeInstant({});
    runtime.reset();
    runtime.createSequence(sequence(scoped)).executeInstant({});

    expect(observed).toEqual([0, 1, 0]);
  });

  it('根据条件结果只执行对应分支', () => {
    const fixture = createFixture(false);
    const conditional: ResolvedCombatStep = {
      kind: 'conditional',
      parameters: {
        condition: { kind: 'contextFlagEquals', flag: 'enabled', value: true },
      },
      whenTrue: sequence(operation('true')),
      whenFalse: sequence(operation('false')),
    };

    fixture.runtime.createSequence(sequence(conditional)).executeInstant({});

    expect(fixture.executed).toEqual(['false']);
    expect(fixture.operations.evaluate).toHaveBeenCalledTimes(1);
  });

  it('条件分支中的有状态动作保持到外层动作结束', () => {
    const lifecycle: string[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: step => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected test operation');
          lifecycle.push(`execute:${step.parameters.flag}`);
          return true;
        },
        end: step => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected test operation');
          lifecycle.push(`end:${step.parameters.flag}`);
        },
        evaluate: () => true,
      },
      { blackboard: new ActionBlackboard() },
    );
    const action = runtime.createSequence(
      sequence({
        kind: 'conditional',
        parameters: { condition: { kind: 'combatActive' } },
        whenTrue: sequence(operation('held')),
      }),
    );

    expect(action.tryExecute({})).toBe(true);
    expect(lifecycle).toEqual(['execute:held']);
    action.tick(1 / 30, {});
    expect(lifecycle).toEqual(['execute:held']);
    action.end({});
    expect(lifecycle).toEqual(['execute:held', 'end:held']);
  });

  it('alwaysNext 条件失败时仍允许外层序列继续', () => {
    const fixture = createFixture(false);
    const conditional: ResolvedCombatStep = {
      kind: 'conditional',
      parameters: {
        condition: { kind: 'contextFlagEquals', flag: 'enabled', value: true },
        alwaysNext: true,
      },
      whenTrue: sequence(operation('true')),
    };

    const result = fixture.runtime
      .createSequence(sequence(conditional, operation('after')))
      .executeInstant({});

    expect(result).toBe(true);
    expect(fixture.executed).toEqual(['after']);
  });

  it('在当前状态所有者内去重 once，并允许显式重置', () => {
    const fixture = createFixture();
    const once: ResolvedCombatStep = {
      kind: 'once',
      parameters: { scopeKey: 'shared-effect' },
      body: sequence(operation('once')),
    };
    const action = sequence(once);

    fixture.runtime.createSequence(action).executeInstant({});
    fixture.runtime.createSequence(action).executeInstant({});
    expect(fixture.executed).toEqual(['once']);

    fixture.runtime.reset();
    fixture.runtime.createSequence(action).executeInstant({});
    expect(fixture.executed).toEqual(['once', 'once']);
  });

  it('在区间开始和之后每个 Tick 执行 repeatEachTick body，跳过调度器的起始同帧 Tick', () => {
    const fixture = createFixture();
    const action = fixture.runtime.createSequence(
      sequence({
        kind: 'repeatEachTick',
        parameters: {},
        body: sequence(operation('frame')),
      }),
    );

    action.execute({});
    action.tick(0, {});
    action.tick(1 / 30, {});
    action.tick(1 / 30, {});

    expect(fixture.executed).toEqual(['frame', 'frame', 'frame']);
  });

  it('按原生单精度扫描门槛驱动固定单目标 Channeling', () => {
    const fixture = createFixture();
    const action = fixture.runtime.createSequence(
      sequence({
        kind: 'repeatEachTick',
        parameters: {
          nativeChanneling: {
            executeEachFrame: false,
            triggerIntervalSeconds: 0.06,
            maxCountPerTarget: 3,
            targetTriggerIntervalSeconds: -1,
          },
        },
        body: sequence(operation('channel')),
      }),
    );

    action.execute({});
    action.tick(0, {});
    action.tick(1 / 30, {});
    action.tick(1 / 30, {});
    action.tick(1 / 30, {});
    action.tick(1 / 30, {});
    action.tick(1 / 30, {});

    expect(fixture.executed).toEqual(['channel', 'channel', 'channel']);
  });

  it('原生 Channeling 忽略子序列的 false 返回值并继续后续扫描', () => {
    const fixture = createFixture(false);
    const action = fixture.runtime.createSequence(
      sequence({
        kind: 'repeatEachTick',
        parameters: {
          nativeChanneling: {
            executeEachFrame: false,
            triggerIntervalSeconds: 0.1,
            maxCountPerTarget: -1,
            targetTriggerIntervalSeconds: 0,
          },
        },
        body: sequence({
          kind: 'conditional',
          parameters: {
            condition: { kind: 'contextFlagEquals', flag: 'enabled', value: true },
            alwaysNext: false,
          },
          whenTrue: sequence(operation('unreachable')),
        }),
      }),
    );

    expect(() => {
      action.execute({});
      action.tick(0, {});
      action.tick(0.1, {});
    }).not.toThrow();
    expect(fixture.executed).toEqual([]);
  });

  it('按原生 TickIntervalAction 启动时触发，后续 Tick 使用单精度周期和单次追赶', () => {
    const fixture = createFixture();
    const action = fixture.runtime.createSequence(
      sequence({
        kind: 'repeatEachTick',
        parameters: {
          nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.07 },
        },
        body: sequence(operation('interval')),
      }),
    );

    action.execute({});
    expect(fixture.executed).toEqual(['interval']);
    action.tick(0, {});
    action.tick(0.5, {});
    action.tick(0, {});

    // 0.5 秒已经跨过多个周期，但原生每次宿主更新最多只追赶一次。
    expect(fixture.executed).toEqual(['interval', 'interval', 'interval']);
  });

  it('原生周期动作自身在 Execute 内触发一次，后续首次普通 Tick 不跳过，终点 Tick 先于 End', () => {
    const fixture = createFixture();
    const timeline = fixture.runtime.createTimeline([
      {
        startFrame: 1,
        endFrame: 3,
        sequence: sequence({
          kind: 'repeatEachTick',
          parameters: { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.033 } },
          body: sequence(operation('interval')),
        }),
      },
    ]);
    timeline.reset({});
    timeline.tick(1, 1 / 30, {});
    expect(fixture.executed).toEqual(['interval']);
    timeline.tick(2, 1 / 30, {});
    expect(fixture.executed).toEqual(['interval', 'interval']);
    timeline.tick(3, 1 / 30, {});
    expect(fixture.executed).toEqual(['interval', 'interval', 'interval']);
    expect(timeline.isComplete).toBe(true);
    timeline.tick(4, 1 / 30, {});
    expect(fixture.executed).toEqual(['interval', 'interval', 'interval']);
  });

  it('对 Context 快照中的每个稳定目标同步执行 body', () => {
    const targetContext = new RuntimeTargetContext();
    targetContext.set('lances', [
      { kind: 'abilityEntity', instanceId: 3 },
      { kind: 'abilityEntity', instanceId: 7 },
    ]);
    const visited: number[] = [];
    const operations: CombatOperationExecutor = {
      execute: (_step, context) => {
        if (context?.currentTarget?.kind === 'abilityEntity') {
          visited.push(context.currentTarget.instanceId);
        }
        return true;
      },
      evaluate: () => false,
    };
    const runtime = new CombatActionSequenceRuntime(operations, {
      blackboard: new ActionBlackboard(),
      targetContext,
    });

    runtime
      .createSequence(
        sequence({
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'lances' },
          body: sequence(operation('visit')),
        }),
      )
      .executeInstant({});

    expect(visited).toEqual([3, 7]);
  });

  it('无条件时间轴跳转在首次执行时立即请求一次', () => {
    const requestTimelineJump = vi.fn();
    const fixture = createFixture();
    const runtime = new CombatActionSequenceRuntime(fixture.operations, {
      blackboard: new ActionBlackboard(),
      requestTimelineJump,
    });
    const action = runtime.createSequence(
      sequence({ kind: 'jumpTimeline', parameters: { destinationFrame: 150 } }),
    );

    action.execute({});
    action.tick(0, {});
    action.tick(1 / 30, {});

    expect(requestTimelineJump).toHaveBeenCalledTimes(1);
    expect(requestTimelineJump).toHaveBeenCalledWith(150);
  });

  it('把实际进入分支的有序连段窗口通知给技能宿主', () => {
    const reachSkillOperableBoundary = vi.fn();
    const fixture = createFixture();
    const runtime = new CombatActionSequenceRuntime(fixture.operations, {
      blackboard: new ActionBlackboard(),
      reachSkillOperableBoundary,
    });
    const action = runtime.createSequence(
      sequence({
        kind: 'reachSkillOperableBoundary',
        parameters: { skillIds: ['native.attack5'] },
      }),
    );

    action.execute({});

    expect(reachSkillOperableBoundary).toHaveBeenCalledOnce();
    expect(reachSkillOperableBoundary).toHaveBeenCalledWith(['native.attack5']);
  });

  it('条件时间轴跳转在后续 Tick 重试并只在首次通过时请求', () => {
    const requestTimelineJump = vi.fn();
    const conditionResults = [false, true];
    const operations: CombatOperationExecutor = {
      execute: vi.fn(() => true),
      evaluate: vi.fn(() => conditionResults.shift() ?? true),
    };
    const runtime = new CombatActionSequenceRuntime(operations, {
      blackboard: new ActionBlackboard(),
      requestTimelineJump,
    });
    const condition = { kind: 'combatActive' } as const;
    const action = runtime.createSequence(
      sequence({
        kind: 'jumpTimeline',
        parameters: { destinationFrame: 89, condition },
      }),
    );

    action.execute({});
    action.tick(0, {});
    expect(requestTimelineJump).not.toHaveBeenCalled();

    action.tick(1 / 30, {});
    action.tick(1 / 30, {});

    expect(operations.evaluate).toHaveBeenCalledTimes(2);
    expect(requestTimelineJump).toHaveBeenCalledTimes(1);
    expect(requestTimelineJump).toHaveBeenCalledWith(89);
  });
});
