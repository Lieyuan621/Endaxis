import { describe, expect, it, vi } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import type { ResolvedActionSequence } from '../../compiler/combatProgram';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import { AbilitySystemRuntime } from '../abilities/abilitySystemRuntime';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { AbilityEventDispatcher } from '../events/abilityEventDispatcher';
import type { AbilityEventPayloadMap } from '../events/combatAbilityEvent';
import { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import { createNativeEventFixture } from '../events/nativeEventTestFixture';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { SkillSlotOperationExecutor } from '../skills/skillSlotOperationExecutor';
import { ActionBlackboard } from './actionBlackboard';
import { CombatActionSequenceRuntime } from './combatActionSequenceRuntime';

function operation(flag: string): ActionGraphStep {
  return {
    kind: 'triggerCustomAbilityEvent',
    parameters: { eventName: flag, eventParam: 0, target: 'caster' as const },
  };
}

it.each([
  [false, 0.125, -1, 4],
  [false, 0.125, 0.125, 2],
  [true, 0.125, -1, 4],
  [false, 0, -1, 4],
] as const)(
  'ChannelingV2 补轮次并保留各轮时间，恢复不重放：%s/%s/%s',
  (executeEachFrame, triggerIntervalSeconds, targetTriggerIntervalSeconds, expected) => {
    let frame = 0;
    let hits = 0;
    const context = { blackboard: new ActionBlackboard() };
    const runtime = new CombatActionSequenceRuntime(
      {
        frame: () => frame,
        queryTargets: () => [{ kind: 'enemy' }],
        execute: () => {
          hits++;
          return true;
        },
        evaluate: () => true,
      },
      context,
    );
    const program = compileGraphEntry('channeling-v2', 'loop', {
      loop: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: true,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame,
              triggerIntervalSeconds,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds,
            },
          },
          body: { $sequence: 'hit' },
        },
        next: null,
      },
      hit: { action: operation('hit'), next: null },
    });
    const action = runtime.createSequence(program);
    action.execute({});
    frame = 3;
    action.tick(0.375, {});
    expect(hits).toBe(expected);
    const restored = runtime.createSequence(program, context, structuredClone(action.runtimeState));
    restored.tick(0, {});
    expect(hits).toBe(expected);
    frame = 4;
    restored.tick(0.125, {});
    expect(hits).toBe(expected + 1);
  },
);

it('OR 条件组按序即时执行并短路；恢复后保留独立子序列状态', () => {
  const seen: string[] = [];
  const context = { blackboard: new ActionBlackboard() };
  const runtime = new CombatActionSequenceRuntime(
    {
      execute: step => {
        if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
        seen.push(`execute:${step.parameters.eventName}`);
        return step.parameters.eventName !== 'fail';
      },
      end: step => {
        if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
        seen.push(`end:${step.parameters.eventName}`);
      },
      evaluate: () => true,
    },
    context,
  );
  const program = compileGraphEntry(
    'native-or',
    'or',
    {
      or: {
        action: {
          kind: 'anyCondition',
          parameters: {},
          conditions: ['fail', 'pass', 'unused'].map(nodeId => ({ kind: 'conditionNode', nodeId })),
        },
        next: null,
      },
      fail: { action: operation('fail'), next: 'unreachable' },
      unreachable: { action: operation('unreachable'), next: null },
      pass: { action: operation('pass'), next: null },
      unused: { action: operation('unused'), next: null },
    },
    {
      fail: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'fail' } },
      },
      pass: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'pass' } },
      },
      unused: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'unused' } },
      },
    },
  );
  const original = runtime.createSequence(program);
  expect(original.executeInstant({})).toBe(true);
  expect(seen).toEqual(['execute:fail', 'end:fail', 'execute:pass', 'end:pass']);
  seen.length = 0;
  const restored = runtime.createSequence(program, context, structuredClone(original.runtimeState));
  expect(seen).toEqual([]);
  expect(restored.executeInstant({})).toBe(true);
  expect(seen).toEqual(['execute:fail', 'end:fail', 'execute:pass', 'end:pass']);
  expect(
    runtime
      .createSequence(
        chainEntry('empty-or', [{ kind: 'anyCondition', parameters: {}, conditions: [] }]),
      )
      .executeInstant({}),
  ).toBe(false);
});

it.each([false, true])(
  'IfElse 即时结束条件动作，分支寿命留到父序列结束，alwaysNext=%s',
  alwaysNext => {
    const seen: string[] = [];
    const context = { blackboard: new ActionBlackboard() };
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: step => {
          if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
          seen.push(`execute:${step.parameters.eventName}`);
          return step.parameters.eventName !== 'true';
        },
        end: step => {
          if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
          seen.push(`end:${step.parameters.eventName}`);
        },
        evaluate: () => {
          seen.push('check');
          return true;
        },
      },
      context,
    );
    const program = compileGraphEntry(
      'native-if-else',
      'branch',
      {
        branch: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext },
            condition: { kind: 'conditionNode', nodeId: 'result' },
            whenTrue: { $sequence: 'true' },
            whenFalse: { $sequence: 'false' },
          },
          next: 'after',
        },
        write: { action: operation('condition'), next: 'check' },
        check: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'constant', value: true } },
          },
          next: null,
        },
        true: { action: operation('true'), next: null },
        false: { action: operation('false'), next: null },
        after: { action: operation('after'), next: null },
      },
      {
        result: {
          type: 'boolean',
          expression: { kind: 'checkActionResult', action: { $sequence: 'write' } },
        },
      },
    );
    const action = runtime.createSequence(program);
    expect(action.tryExecute({})).toBe(alwaysNext);
    expect(seen).toEqual([
      'execute:condition',
      'end:condition',
      'check',
      'execute:true',
      ...(alwaysNext ? ['execute:after'] : []),
    ]);
    seen.length = 0;
    const restored = runtime.createSequence(program, context, structuredClone(action.runtimeState));
    restored.end({});
    expect(seen).toEqual(['end:true', ...(alwaysNext ? ['end:after'] : [])]);
  },
);

it.each([true, false])('纯条件移除行为包装后仍在原位置消费 NotNext，条件值=%s', value => {
  const run = (adapter: boolean) => {
    const seen: string[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: step => {
          if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
          seen.push(step.parameters.eventName);
          return true;
        },
        evaluate: () => value,
      },
      { blackboard: new ActionBlackboard() },
    );
    const program = compileGraphEntry(
      'pure-condition-result',
      'invert',
      {
        invert: { action: { kind: 'invertNextResult', parameters: {} }, next: 'branch' },
        branch: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: adapter
              ? { kind: 'conditionNode', nodeId: 'result' }
              : { kind: 'constant', value },
            whenTrue: { $sequence: 'yes' },
            whenFalse: { $sequence: 'no' },
          },
          next: 'after',
        },
        check: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'constant', value } },
          },
          next: null,
        },
        yes: { action: operation('yes'), next: null },
        no: { action: operation('no'), next: null },
        after: { action: operation('after'), next: null },
      },
      {
        result: {
          type: 'boolean',
          expression: { kind: 'checkActionResult', action: { $sequence: 'check' } },
        },
      },
    );
    const sequence = runtime.createSequence(program);
    const result = sequence.executeInstant({});
    return { result, seen };
  };
  expect(run(false)).toEqual(run(true));
  expect(run(false).seen).toEqual([value ? 'no' : 'yes']);
});

it.each([true, false])('NotNext 反转普通动作返回值 %s，且下次执行不残留反转状态', result => {
  const seen: string[] = [];
  const runtime = new CombatActionSequenceRuntime(
    {
      execute: step => {
        if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
        const flag = step.parameters.eventName as string;
        seen.push(flag);
        return flag === 'first' ? result : true;
      },
      evaluate: () => false,
    },
    { blackboard: new ActionBlackboard() },
  );
  const sequence = runtime.createSequence(
    chainEntry('native-not-next', [
      { kind: 'invertNextResult', parameters: {} },
      operation('first'),
      operation('after'),
    ]),
  );
  expect(sequence.executeInstant({})).toBe(!result);
  expect(sequence.executeInstant({})).toBe(!result);
  expect(seen).toEqual(result ? ['first', 'first'] : ['first', 'after', 'first', 'after']);
});

it('独立条件动作失败时短路，检查通过才执行后继', () => {
  let permitted = false;
  const execute = vi.fn(() => true);
  const runtime = new CombatActionSequenceRuntime(
    { execute, evaluate: () => permitted },
    { blackboard: new ActionBlackboard() },
  );
  const sequence = runtime.createSequence(
    chainEntry('native-check', [
      { kind: 'checkCondition', parameters: { condition: { kind: 'constant', value: true } } },
      operation('after'),
    ]),
  );
  expect(sequence.executeInstant({})).toBe(false);
  expect(execute).not.toHaveBeenCalled();
  permitted = true;
  expect(sequence.executeInstant({})).toBe(true);
  expect(execute).toHaveBeenCalledTimes(1);
});

it('恢复条件动作的执行状态，不重新检查或重放后继', () => {
  const evaluate = vi.fn(() => true);
  const execute = vi.fn(() => true);
  const context = { blackboard: new ActionBlackboard() };
  const runtime = new CombatActionSequenceRuntime({ execute, evaluate }, context);
  const program = chainEntry('saved-check', [
    { kind: 'checkCondition', parameters: { condition: { kind: 'constant', value: true } } },
    operation('after'),
  ]);
  const original = runtime.createSequence(program);
  expect(original.tryExecute({})).toBe(true);
  const restored = runtime.createSequence(program, context, structuredClone(original.runtimeState));
  restored.tick(1, {});
  restored.end({});
  expect(evaluate).toHaveBeenCalledTimes(1);
  expect(execute).toHaveBeenCalledTimes(1);
  restored.reset({});
  expect(restored.tryExecute({})).toBe(true);
  expect(evaluate).toHaveBeenCalledTimes(2);
  expect(execute).toHaveBeenCalledTimes(2);
});

const compileGraphEntry = (
  revision: string,
  entry: string | null,
  nodes: Record<string, ActionGraphNode>,
  dataNodes: ActionGraphDefinition['dataNodes'] = {},
): ResolvedActionSequence => ({
  graph: createActionGraphCompilation({ nodes, dataNodes }, 1, revision).compileAll(),
  entry,
  callSite: revision,
});

const chainEntry = (
  revision: string,
  actions: readonly ActionGraphStep[],
  dataNodes: ActionGraphDefinition['dataNodes'] = {},
): ResolvedActionSequence => {
  const nodes: Record<string, ActionGraphNode> = {};
  actions.forEach((action, index) => {
    nodes[`step-${index}`] = {
      action,
      next: index + 1 < actions.length ? `step-${index + 1}` : null,
    };
  });
  return compileGraphEntry(revision, actions.length === 0 ? null : 'step-0', nodes, dataNodes);
};

function createFixture(conditionResult = true) {
  const executed: string[] = [];
  const operations: CombatOperationExecutor = {
    frame: () => 0,
    execute: vi.fn(step => {
      executed.push(step.parameters.eventName as string);
      return true;
    }),
    evaluate: vi.fn(() => conditionResult),
  };
  const runtime = new CombatActionSequenceRuntime(operations, {
    actionOwnerId: 'caster',
    blackboard: new ActionBlackboard(),
  });
  return { executed, operations, runtime };
}

describe('CombatActionSequenceRuntime', () => {
  it('Channeling 每轮查询目标，按身份限次，切面恢复不重放且 Reset 不清空记录', () => {
    let frame = 10;
    const seen: unknown[] = [];
    const targets = new RuntimeTargetContext();
    targets.set('targets', [{ kind: 'operator', operatorId: 'a' }]);
    const context = { blackboard: new ActionBlackboard(), targetContext: targets };
    const runtime = new CombatActionSequenceRuntime(
      {
        frame: () => frame,
        execute: (_step, context) => {
          seen.push(context?.actionInputTarget);
          return false;
        },
        evaluate: () => true,
      },
      context,
    );
    const program = compileGraphEntry('channeling-targets', 'channel', {
      channel: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'context', key: 'targets' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.1,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: -1,
            },
          },
          body: { $sequence: 'body' },
        },
        next: null,
      },
      body: { action: operation('hit'), next: null },
    });
    const action = runtime.createSequence(program);
    action.execute({});
    targets.set('targets', [
      { kind: 'operator', operatorId: 'a' },
      { kind: 'operator', operatorId: 'b' },
    ]);
    action.tick(0, {});
    expect(seen).toEqual([{ kind: 'operator', operatorId: 'a' }]);
    // 同帧仍检查周期；不能无条件跳过。
    action.tick(0.1, {});
    expect(seen).toHaveLength(2);
    const saved = structuredClone(action.runtimeState);
    const restored = runtime.createSequence(program, context, saved);
    expect(seen).toHaveLength(2);
    frame++;
    restored.tick(0, {});
    expect(seen).toHaveLength(2);
    const state = saved.nodes.get('channel')!.data;
    if (state.kind !== 'channeling') throw new Error('expected channeling');
    restored.reset({});
    expect(state.channeling.targets.size).toBe(2);
    restored.execute({});
    expect(seen).toHaveLength(4);
    restored.end({});
    expect(state.channeling.targets.size).toBe(0);
  });

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
    const definition = compileGraphEntry('execute-interval', 'repeat', {
      repeat: {
        action: {
          kind: 'repeatEachTick',
          parameters: { nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 0.5 } },
          body: { $sequence: 'body' },
        },
        next: null,
      },
      body: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillSlotKey: 'battle',
            targetSkillKey: 'enhanced',
            lifetime: 'finishByAction',
          },
        },
        next: null,
      },
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
    const definition = chainEntry('slot-replacement', [
      {
        kind: 'changeSkillSlot',
        parameters: {
          skillSlotKey: 'battle',
          targetSkillKey: 'enhanced',
          lifetime: 'finishByAction',
        },
      },
    ]);
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
    const definition = chainEntry('basic-attack-restore', [
      {
        kind: 'overrideBasicAttackMapping',
        parameters: { skillIds: ['current', 'current.next'] },
      },
    ]);
    const action = first.runtime.createSequence(definition);
    action.execute({});
    const saved = structuredClone({ ability: original.runtimeState, action: action.runtimeState });
    const restored = new AbilitySystemRuntime({ skills: [] }, saved.ability);
    const second = bind(restored);
    const resumed = second.runtime.createSequence(definition, second.context, saved.action);
    expect(second.register).not.toHaveBeenCalled();
    expect(saved.ability.nextBasicAttackMappingId).toBe(3);
    restored.overrideBasicAttackMapping('later');
    resumed.end({});
    resumed.end({});
    expect([...saved.ability.buffBasicAttackMappings.values()]).toEqual(['earlier', 'later']);
    expect([...original.runtimeState.buffBasicAttackMappings.values()]).toEqual([
      'earlier',
      'current',
      'current.next',
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
    const definition = chainEntry('action-mode-restore', [
      {
        kind: 'changePlayerActionMode',
        parameters: { modeId: 'special', lifetime: 'finishByAction' },
      },
    ]);
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
              state.registrationIds = [17];
              installed.push(17);
              return true;
            },
            end: (step, operationContext) => {
              if (step.kind !== 'skillAffix') return;
              const state = operationContext?.actionRegistrationState;
              if (state === undefined) return;
              finished.push(...state.registrationIds);
              state.registrationIds = [];
            },
            evaluate: () => false,
          },
          context,
        ),
      };
    };
    const definition = chainEntry('skill-affix-restore', [{ kind: 'skillAffix', parameters: {} }]);
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
    const definition = compileGraphEntry('restored-native-listener', 'listen', {
      listen: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'response',
                event: { kind: 'buffApplied' },
                phase: 'dataAction',
                priority: 4,
                sequence: { $sequence: 'respond' },
              },
            ],
          },
        },
        next: null,
      },
      respond: {
        action: operation('response'),
        next: null,
      },
    });
    const listener = original.createSequence(definition);
    listener.execute({});
    const saved = structuredClone({
      sequence: listener.runtimeState,
      parent: parent.runtimeState,
      sequenceHost: original.sequenceHostState,
      native: native.dispatcher.runtimeState,
    });
    const dispatcher = new AbilityEventDispatcher<
      keyof AbilityEventPayloadMap,
      AbilityEventPayloadMap
    >(saved.native);
    const semantic = new CombatSemanticEventRuntime(undefined, {
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
      saved.sequenceHost,
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
      { startFrame: 3, sequence: chainEntry('restored-timeline-later', [operation('later')]) },
      {
        startFrame: 0,
        endFrame: 5,
        sequence: compileGraphEntry('restored-timeline-running', 'loop', {
          loop: {
            action: {
              kind: 'repeatEachTick' as const,
              parameters: {},
              body: { $sequence: 'run' },
            },
            next: null,
          },
          run: {
            action: operation('running'),
            next: null,
          },
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

  it('恢复后保留 once 状态，重置可重新执行且不改变原分支', () => {
    const original = createFixture();
    const parent = original.runtime.context.blackboard;
    const definition = compileGraphEntry('restored-scope-once', 'once', {
      once: {
        action: {
          kind: 'once',
          parameters: {},
          body: { $sequence: 'apply' },
        },
        next: null,
      },
      apply: {
        action: operation('once'),
        next: null,
      },
    });
    const originalSequence = original.runtime.createSequence(definition);
    originalSequence.executeInstant({});
    const saved = structuredClone({
      execution: originalSequence.runtimeState,
      parent: parent.runtimeState,
      sequenceHost: original.runtime.sequenceHostState,
    });
    const restoredParent = ActionBlackboard.bindRuntimeState(saved.parent);
    const execute = vi.fn(() => true);
    const restored = new CombatActionSequenceRuntime(
      { execute, evaluate: () => true },
      { blackboard: restoredParent },
      {},
      undefined,
      undefined,
      saved.sequenceHost,
    );
    expect(restored.sequenceHostState).toBe(saved.sequenceHost);
    const restoredSequence = restored.createSequence(definition, undefined, saved.execution);
    restoredSequence.executeInstant({});
    expect(execute).not.toHaveBeenCalled();
    restoredSequence.reset({});
    restoredSequence.executeInstant({});
    expect(execute).toHaveBeenCalledTimes(1);
    expect(originalSequence.runtimeState.nodes.get('once')!.data).toMatchObject({
      kind: 'graphOnce',
      executed: true,
    });
  });

  it('无状态投射物步骤可绑定，序列长度仍必须匹配', () => {
    const { runtime } = createFixture();
    const definition = chainEntry('projectile-restore', [
      {
        kind: 'launchProjectile',
        parameters: {
          inheritActionBlackboard: true,
          finish: { reachAfterTicks: 2, maxDurationSeconds: 2 },
          recycleDelaySeconds: 0,
        },
        callbacks: [],
      },
    ]);
    const state = structuredClone(runtime.createSequence(definition).runtimeState);
    expect(() => runtime.createSequence(definition, undefined, state)).not.toThrow();
    const empty = compileGraphEntry('projectile-restore', null, {});
    expect(() => runtime.createSequence(empty, undefined, state)).toThrow(
      'graph checkpoint does not match program or call site',
    );
  });

  it('恢复单次执行和可操作边界步骤，不重放已执行动作', () => {
    const definition = compileGraphEntry('restored-once-boundary', 'once', {
      once: {
        action: {
          kind: 'once',
          parameters: {},
          body: { $sequence: 'hit' },
        },
        next: 'boundary',
      },
      boundary: {
        action: { kind: 'reachSkillOperableBoundary', parameters: { skillIds: ['native'] } },
        next: null,
      },
      hit: {
        action: operation('hit'),
        next: null,
      },
    });
    const bind = () => {
      const execute = vi.fn(() => true);
      const boundary = vi.fn();
      const context = {
        blackboard: new ActionBlackboard(),
        reachSkillOperableBoundary: boundary,
      };
      const runtime = new CombatActionSequenceRuntime({ execute, evaluate: () => true }, context);
      return { runtime, context, execute, boundary };
    };
    const original = bind();
    const action = original.runtime.createSequence(definition);
    action.execute({});
    expect(original.execute).toHaveBeenCalledTimes(1);
    const next = bind();
    const restored = next.runtime.createSequence(
      definition,
      next.context,
      structuredClone(action.runtimeState),
    );
    restored.tick(1, {});
    restored.end({});
    expect(next.execute).not.toHaveBeenCalled();
    expect(next.boundary).not.toHaveBeenCalled();
    restored.reset({});
    restored.execute({});
    expect(next.execute).toHaveBeenCalledTimes(1);
    expect(next.boundary).toHaveBeenCalledExactlyOnceWith(['native']);
  });

  it('重新绑定分支循环后只继续 Tick，不重放 Execute 或重新求值分支', () => {
    const definition = compileGraphEntry(
      'restored-branch-loop',
      'branch',
      {
        branch: {
          action: {
            kind: 'conditional',
            parameters: {
              condition: { kind: 'conditionNode', nodeId: 'input_1' },
              alwaysNext: true,
            },
            whenTrue: { $sequence: 'tick-loop' },
            whenFalse: { $sequence: 'wrong' },
          },
          next: null,
        },
        'tick-loop': {
          action: {
            kind: 'repeatEachTick',
            parameters: {},
            body: { $sequence: 'tick' },
          },
          next: null,
        },
        tick: {
          action: operation('tick'),
          next: null,
        },
        wrong: {
          action: operation('wrong-branch'),
          next: null,
        },
      },
      { input_1: { type: 'boolean', expression: { kind: 'combatActive' } } },
    );
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
    expect(saved.nodes.get('branch')!.lifecycle.state).not.toBe('ended');
  });

  it('从父序列保存分支内的循环进度，后续执行不会修改已保存的数据', () => {
    const { runtime } = createFixture();
    const action = runtime.createSequence(
      compileGraphEntry(
        'saved-branch-progress',
        'branch',
        {
          branch: {
            action: {
              kind: 'conditional',
              parameters: {
                condition: { kind: 'conditionNode', nodeId: 'input_1' },
                alwaysNext: true,
              },
              whenTrue: { $sequence: 'loop' },
            },
            next: null,
          },
          loop: {
            action: {
              kind: 'repeatEachTick',
              parameters: {},
              body: { $sequence: 'frame' },
            },
            next: null,
          },
          frame: {
            action: operation('frame'),
            next: null,
          },
        },
        { input_1: { type: 'boolean', expression: { kind: 'combatActive' } } },
      ),
    );
    action.execute({});
    const branch = action.runtimeState.nodes.get('branch');
    if (branch?.data.kind !== 'graphBranch') throw new Error('expected branch data');
    expect(branch.data.selection.activeBranch).toBe(0);
    const loopEntry = branch.data.branches.get(0)!.nodes.get('loop');
    if (loopEntry?.data.kind !== 'repeat') throw new Error('expected repeat data');
    expect(loopEntry.data.repetition.skipInitialTick).toBe(true);
    const saved = structuredClone(action.runtimeState);
    action.tick(0, {});
    expect(loopEntry.data.repetition.skipInitialTick).toBe(false);
    const savedBranch = saved.nodes.get('branch');
    if (savedBranch?.data.kind !== 'graphBranch') throw new Error('expected saved branch');
    const savedLoop = savedBranch.data.branches.get(0)!.nodes.get('loop');
    expect(savedLoop).toMatchObject({
      data: { kind: 'repeat', repetition: { skipInitialTick: true } },
    });
    expect(savedLoop!.lifecycle.state).toBe('started');
  });

  it('回调的 Channeling 子序列即时清理，不把 finishByAction 延长到回调时间轴结束', () => {
    // 洛茜 projhit3 的形状：maxCountPerTarget=1，子动作含 finishByAction Buff。
    // Channeling.actionOnTick 原生走 ExecuteInstant；与外层技能的寿命不同。
    const seen: string[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        frame: () => 0,
        execute: () => {
          seen.push('apply');
          return true;
        },
        end: () => {
          seen.push('finish');
        },
        evaluate: () => true,
      },
      { blackboard: new ActionBlackboard(), actionOwnerId: 'caster' },
    );
    const timeline = runtime.createTimeline([
      {
        startFrame: 0,
        endFrame: 30,
        sequence: compileGraphEntry('channeling-callback', 'channel', {
          channel: {
            action: {
              kind: 'repeatEachTick',
              parameters: {
                nativeChanneling: {
                  catchUpMissedTicks: false,
                  target: { kind: 'owner' },
                  executeEachFrame: true,
                  triggerIntervalSeconds: 0.033,
                  maxCountPerTarget: 1,
                  targetTriggerIntervalSeconds: 0.033,
                },
              },
              body: { $sequence: 'apply' },
            },
            next: null,
          },
          apply: {
            action: {
              kind: 'applyBuff',
              parameters: {
                buffs: [{ buffId: 'fixture' }],
                targets: { kind: 'fixed', target: 'caster' },
                finishByAction: true,
              },
            },
            next: null,
          },
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
      compileGraphEntry(
        'gated-listener',
        'listen',
        {
          listen: {
            action: {
              kind: 'listenForCombatEvents',
              parameters: {
                responses: [
                  {
                    key: 'gated',
                    event: { kind: 'abilityEvent', event: 'addedBuff' },
                    phase: 'dataAction',
                    priority: 0,
                    condition: { kind: 'conditionNode', nodeId: 'input_1' },
                    sequence: { $sequence: 'respond' },
                  },
                ],
              },
            },
            next: null,
          },
          respond: {
            action: operation('response'),
            next: null,
          },
        },
        {
          input_1: {
            type: 'boolean',
            expression: { kind: 'probability', probability: { kind: 'constant', value: 1 } },
          },
        },
      ),
    );
    const emit = () =>
      emitAddedBuff({ sourceId: 'owner', targetId: 'owner', buffId: 'signal', buffTags: [] });
    listener.execute({});
    const listenerData = listener.runtimeState.nodes.get('listen')!.data;
    if (listenerData.kind !== 'graphListener') throw new Error('expected listener data');
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
          if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected test action');
          expect(current).toBe(context);
          const flag = step.parameters.eventName;
          if (flag === 'first') current!.blackboard.assignDynamic('shared', 7);
          else expect(current!.blackboard.getNumber('shared')).toBe(7);
          trace.push(`start:${flag}`);
          return true;
        },
        end: step => {
          if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected test action');
          trace.push(`end:${step.parameters.eventName}`);
        },
        evaluate: () => true,
      },
      context,
    );
    const actions = [
      { startFrame: 0, endFrame: 1, sequence: chainEntry('interval-first', [operation('first')]) },
      {
        startFrame: 0,
        endFrame: 3,
        sequence: chainEntry('interval-second', [operation('second')]),
      },
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
      compileGraphEntry('partial-registration-failure', 'listen', {
        listen: {
          action: {
            kind: 'listenForCombatEvents',
            parameters: {
              responses: ['first', 'second'].map(key => ({
                key,
                event: { kind: 'buffApplied' as const },
                phase: 'dataAction' as const,
                priority: 0,
                sequence: { $sequence: `respond-${key}` },
              })),
            },
          },
          next: null,
        },
        'respond-first': {
          action: operation('first'),
          next: null,
        },
        'respond-second': {
          action: operation('second'),
          next: null,
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
          if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
          calls.push(step.parameters.eventName as string);
          return true;
        },
      },
      { blackboard: new ActionBlackboard() },
      {},
      semanticEvents,
      'owner',
    );
    const listener = runtime.createSequence(
      compileGraphEntry('temporary-native-action', 'listen', {
        listen: {
          action: {
            kind: 'listenForCombatEvents',
            parameters: {
              responses: [
                {
                  key: 'temporary',
                  event: { kind: 'abilityEvent', event: 'addedBuff' },
                  phase: 'dataAction',
                  priority: 0,
                  sequence: { $sequence: 'respond' },
                },
              ],
            },
          },
          next: null,
        },
        respond: {
          action: operation('temporary'),
          next: null,
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
          if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
          const id =
            context?.event && 'payload' in context.event && context.event.event === 'addedBuff'
              ? context.event.payload.buffId
              : 'missing';
          calls.push(`${step.parameters.eventName}:${id}`);
          if (step.parameters.eventName === 'emit') {
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
      compileGraphEntry(
        'reentry-guard-listener',
        'listen',
        {
          listen: {
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
              parameters: {
                condition: { kind: 'conditionNode', nodeId: 'input_1' },
              },
              whenTrue: { $sequence: 'emit' },
            },
            next: null,
          },
          emit: {
            action: operation('emit'),
            next: 'tail',
          },
          tail: {
            action: operation('tail'),
            next: null,
          },
        },
        {
          input_1: {
            type: 'boolean',
            expression: {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['signal'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
          },
        },
      ),
    );
    listener.execute({});
    emit('first');
    emit('second');
    expect(calls).toEqual([
      'check:first',
      'emit:first',
      'check:nested',
      'tail:first',
      'check:second',
      'emit:second',
      'check:nested',
      'tail:second',
    ]);
    listener.end({});
    emit('after-end');
    expect(calls).toHaveLength(8);
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
      compileGraphEntry('projectile-launch-count', 'loop', {
        loop: {
          action: {
            kind: 'forEachContextTarget',
            parameters: { targets: { kind: 'context', key: 'items' } },
            body: { $sequence: 'launch' },
          },
          next: null,
        },
        launch: {
          action: {
            kind: 'launchProjectile',
            parameters: { inheritActionBlackboard: true, finish, recycleDelaySeconds: 1.5, source },
            callbacks: [],
          },
          next: null,
        },
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

  it('投射物固定发射点与目标集合后逐对发射，白名单保留空间点身份', () => {
    const selected = [{ kind: 'spatialPoint' as const, pointId: 7 }];
    const queryTargets = vi.fn(() => selected);
    const launchProjectile = vi.fn(() => {
      targetContext.set('points', []);
      return {
        target: { kind: 'abilityEntity' as const, instanceId: 1 },
        instanceId: 1,
        onReset: () => ({ registrationId: 0, dispose: () => {} }),
      };
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.set('points', [
      { kind: 'spatialPoint', pointId: 8 },
      { kind: 'spatialPoint', pointId: 9 },
    ]);
    const runtime = new CombatActionSequenceRuntime(
      { execute: () => true, evaluate: () => true, queryTargets },
      { blackboard: new ActionBlackboard(), launchProjectile, targetContext },
    );
    runtime
      .createSequence(
        compileGraphEntry('filtered-launch', 'launch', {
          launch: {
            action: {
              kind: 'launchProjectile',
              parameters: {
                inheritActionBlackboard: false,
                finish: 1,
                targets: { kind: 'context', contextKey: 'points' },
                emitters: { kind: 'context', contextKey: 'points' },
                onlyHitTargets: { kind: 'inputTarget' },
              },
              callbacks: [],
            },
            next: null,
          },
        }),
      )
      .executeInstant({});
    selected.length = 0;
    expect(queryTargets).toHaveBeenCalledOnce();
    expect(launchProjectile).toHaveBeenCalledTimes(4);
    expect(launchProjectile).toHaveBeenLastCalledWith(
      expect.objectContaining({
        onlyHitTargets: [{ kind: 'spatialPoint', pointId: 7 }],
      }),
    );
  });

  it('唯一目标 ForEach 仍隔离内部失败并让外层后继继续', () => {
    const seen: unknown[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: (step, context) => {
          if (step.kind !== 'triggerCustomAbilityEvent')
            throw new Error('unexpected test operation');
          seen.push([step.parameters.eventName, context?.currentTarget]);
          return true;
        },
        evaluate: () => false,
      },
      { blackboard: new ActionBlackboard() },
    );

    expect(
      runtime
        .createSequence(
          compileGraphEntry(
            'single-target-isolation',
            'loop',
            {
              loop: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                  body: { $sequence: 'guard' },
                },
                next: 'outside',
              },
              guard: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'input_1' } },
                  whenTrue: { $sequence: 'guarded' },
                },
                next: 'inside',
              },
              guarded: {
                action: operation('guarded'),
                next: null,
              },
              inside: {
                action: operation('inside-after-failed-guard'),
                next: null,
              },
              outside: {
                action: operation('outside-after-loop'),
                next: null,
              },
            },
            { input_1: { type: 'boolean', expression: { kind: 'combatActive' } } },
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
          if (step.kind !== 'triggerCustomAbilityEvent')
            throw new Error('unexpected test operation');
          seen.push([step.parameters.eventName, context?.currentTarget]);
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
          compileGraphEntry(
            'per-target-failure-skip',
            'loop',
            {
              loop: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { targets: { kind: 'context', key: 'items' } },
                  body: { $sequence: 'guard' },
                },
                next: 'after',
              },
              guard: {
                action: {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'input_1' } },
                  whenTrue: { $sequence: 'accepted' },
                },
                next: null,
              },
              accepted: {
                action: operation('accepted'),
                next: null,
              },
              after: {
                action: operation('after'),
                next: null,
              },
            },
            { input_1: { type: 'boolean', expression: { kind: 'combatActive' } } },
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
    const definition = compileGraphEntry('empty-target-loop', 'loop', {
      loop: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'items' } },
          body: { $sequence: 'bad' },
        },
        next: null,
      },
      bad: {
        action: operation('bad'),
        next: null,
      },
    });
    expect(runtime.createSequence(definition).executeInstant({})).toBe(true);
    targetContext.set('items', [{ kind: 'abilityEntity', instanceId: 1 }]);
    expect(() => runtime.createSequence(definition).executeInstant({})).toThrow('invalid data');
  });

  it('每个目标的循环体即时结束，外层 End 不重复清理', () => {
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
      compileGraphEntry('per-target-alive', 'loop', {
        loop: {
          action: {
            kind: 'forEachContextTarget',
            parameters: { targets: { kind: 'fixed', target: 'enemy' } },
            body: { $sequence: 'scoped' },
          },
          next: null,
        },
        scoped: {
          action: operation('scoped'),
          next: null,
        },
      }),
    );

    action.execute({});
    action.tick(1 / 30, {});
    expect(end).toHaveBeenCalledTimes(1);

    action.end({});
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('严格按照声明顺序执行普通步骤', () => {
    const fixture = createFixture();

    fixture.runtime
      .createSequence(chainEntry('ordered-steps', [operation('first'), operation('second')]))
      .executeInstant({});

    expect(fixture.executed).toEqual(['first', 'second']);
  });

  it('根据条件结果只执行对应分支', () => {
    const fixture = createFixture(false);

    fixture.runtime
      .createSequence(
        compileGraphEntry(
          'conditional-branches',
          'branch',
          {
            branch: {
              action: {
                kind: 'conditional',
                parameters: {
                  condition: { kind: 'conditionNode', nodeId: 'input_1' },
                },
                whenTrue: { $sequence: 'true' },
                whenFalse: { $sequence: 'false' },
              },
              next: null,
            },
            true: {
              action: operation('true'),
              next: null,
            },
            false: {
              action: operation('false'),
              next: null,
            },
          },
          {
            input_1: {
              type: 'boolean',
              expression: { kind: 'combatActive' },
            },
          },
        ),
      )
      .executeInstant({});

    expect(fixture.executed).toEqual(['false']);
    expect(fixture.operations.evaluate).toHaveBeenCalledTimes(1);
  });

  it('条件分支中的有状态动作保持到外层动作结束', () => {
    const lifecycle: string[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: step => {
          if (step.kind !== 'triggerCustomAbilityEvent')
            throw new Error('unexpected test operation');
          lifecycle.push(`execute:${step.parameters.eventName}`);
          return true;
        },
        end: step => {
          if (step.kind !== 'triggerCustomAbilityEvent')
            throw new Error('unexpected test operation');
          lifecycle.push(`end:${step.parameters.eventName}`);
        },
        evaluate: () => true,
      },
      { blackboard: new ActionBlackboard() },
    );
    const action = runtime.createSequence(
      compileGraphEntry(
        'held-branch-action',
        'branch',
        {
          branch: {
            action: {
              kind: 'conditional',
              parameters: { condition: { kind: 'conditionNode', nodeId: 'input_1' } },
              whenTrue: { $sequence: 'held' },
            },
            next: null,
          },
          held: {
            action: operation('held'),
            next: null,
          },
        },
        { input_1: { type: 'boolean', expression: { kind: 'combatActive' } } },
      ),
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

    const result = fixture.runtime
      .createSequence(
        compileGraphEntry(
          'always-next-failure',
          'guard',
          {
            guard: {
              action: {
                kind: 'conditional',
                parameters: {
                  condition: { kind: 'conditionNode', nodeId: 'input_1' },
                  alwaysNext: true,
                },
                whenTrue: { $sequence: 'true' },
              },
              next: 'after',
            },
            true: {
              action: operation('true'),
              next: null,
            },
            after: {
              action: operation('after'),
              next: null,
            },
          },
          {
            input_1: {
              type: 'boolean',
              expression: { kind: 'combatActive' },
            },
          },
        ),
      )
      .executeInstant({});

    expect(result).toBe(true);
    expect(fixture.executed).toEqual(['after']);
  });

  it('同一 once 实例跨瞬时执行保留标记，正常重置后允许再次执行', () => {
    const fixture = createFixture();
    const action = compileGraphEntry('once-dedup', 'once', {
      once: {
        action: {
          kind: 'once',
          parameters: {},
          body: { $sequence: 'apply' },
        },
        next: null,
      },
      apply: {
        action: operation('once'),
        next: null,
      },
    });

    const sequence = fixture.runtime.createSequence(action);
    sequence.executeInstant({});
    sequence.executeInstant({});
    expect(fixture.executed).toEqual(['once']);

    sequence.reset({});
    sequence.executeInstant({});
    expect(fixture.executed).toEqual(['once', 'once']);
  });

  it('在区间开始和之后每个 Tick 执行 repeatEachTick body，跳过调度器的起始同帧 Tick', () => {
    const fixture = createFixture();
    const action = fixture.runtime.createSequence(
      compileGraphEntry('repeat-each-tick', 'loop', {
        loop: {
          action: {
            kind: 'repeatEachTick',
            parameters: {},
            body: { $sequence: 'frame' },
          },
          next: null,
        },
        frame: {
          action: operation('frame'),
          next: null,
        },
      }),
    );

    action.execute({});
    action.tick(0, {});
    action.tick(1 / 30, {});
    action.tick(1 / 30, {});

    expect(fixture.executed).toEqual(['frame', 'frame', 'frame']);
  });

  it('周期子序列复用 once 实例，正常重置后重新执行', () => {
    const fixture = createFixture();
    const action = fixture.runtime.createSequence(
      compileGraphEntry('periodic-once', 'loop', {
        loop: {
          action: {
            kind: 'repeatEachTick',
            parameters: { nativeTickInterval: { executeEachFrame: true, intervalSeconds: 0.1 } },
            body: { $sequence: 'once' },
          },
          next: null,
        },
        once: {
          action: { kind: 'once', parameters: {}, body: { $sequence: 'apply' } },
          next: null,
        },
        apply: { action: operation('apply'), next: null },
      }),
    );
    action.execute({});
    action.tick(1 / 30, {});
    action.tick(1 / 30, {});
    expect(fixture.executed).toEqual(['apply']);
    action.end({});
    action.reset({});
    action.execute({});
    expect(fixture.executed).toEqual(['apply', 'apply']);
  });

  it('按原生单精度扫描门槛驱动固定单目标 Channeling', () => {
    const fixture = createFixture();
    const action = fixture.runtime.createSequence(
      compileGraphEntry('native-channeling-scan', 'loop', {
        loop: {
          action: {
            kind: 'repeatEachTick',
            parameters: {
              nativeChanneling: {
                catchUpMissedTicks: false,
                target: { kind: 'owner' },
                executeEachFrame: false,
                triggerIntervalSeconds: 0.06,
                maxCountPerTarget: 3,
                targetTriggerIntervalSeconds: -1,
              },
            },
            body: { $sequence: 'channel' },
          },
          next: null,
        },
        channel: {
          action: operation('channel'),
          next: null,
        },
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
      compileGraphEntry(
        'native-channeling-guard',
        'loop',
        {
          loop: {
            action: {
              kind: 'repeatEachTick',
              parameters: {
                nativeChanneling: {
                  catchUpMissedTicks: false,
                  target: { kind: 'owner' },
                  executeEachFrame: false,
                  triggerIntervalSeconds: 0.1,
                  maxCountPerTarget: -1,
                  targetTriggerIntervalSeconds: 0,
                },
              },
              body: { $sequence: 'guard' },
            },
            next: null,
          },
          guard: {
            action: {
              kind: 'conditional',
              parameters: {
                condition: { kind: 'conditionNode', nodeId: 'input_1' },
                alwaysNext: false,
              },
              whenTrue: { $sequence: 'unreachable' },
            },
            next: null,
          },
          unreachable: {
            action: operation('unreachable'),
            next: null,
          },
        },
        {
          input_1: {
            type: 'boolean',
            expression: { kind: 'combatActive' },
          },
        },
      ),
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
      compileGraphEntry('native-tick-interval', 'loop', {
        loop: {
          action: {
            kind: 'repeatEachTick',
            parameters: {
              nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.07 },
            },
            body: { $sequence: 'interval' },
          },
          next: null,
        },
        interval: {
          action: operation('interval'),
          next: null,
        },
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

  it.each(['tickInterval', 'channeling'] as const)(
    '%s 启动后不重复跳过首次普通 Tick，终点 Tick 先于 End',
    kind => {
      const fixture = createFixture();
      const timeline = fixture.runtime.createTimeline([
        {
          startFrame: 1,
          endFrame: 3,
          sequence: compileGraphEntry('native-interval-timeline', 'loop', {
            loop: {
              action: {
                kind: 'repeatEachTick',
                parameters:
                  kind === 'tickInterval'
                    ? { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.033 } }
                    : {
                        nativeChanneling: {
                          catchUpMissedTicks: false,
                          target: { kind: 'owner' },
                          executeEachFrame: false,
                          triggerIntervalSeconds: 0.033,
                          maxCountPerTarget: 5,
                          targetTriggerIntervalSeconds: 0,
                        },
                      },
                body: { $sequence: 'interval' },
              },
              next: null,
            },
            interval: {
              action: operation('interval'),
              next: null,
            },
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
    },
  );

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
        compileGraphEntry('stable-target-snapshot', 'loop', {
          loop: {
            action: {
              kind: 'forEachContextTarget',
              parameters: { targets: { kind: 'context', key: 'lances' } },
              body: { $sequence: 'visit' },
            },
            next: null,
          },
          visit: {
            action: operation('visit'),
            next: null,
          },
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
      chainEntry('unconditional-jump', [
        {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 150 },
          condition: { kind: 'constant', value: true },
        },
      ]),
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
      chainEntry('operable-boundary', [
        {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['native.attack5'] },
        },
      ]),
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
    const condition = { kind: 'conditionNode', nodeId: 'active' } as const;
    const program = compileGraphEntry(
      'conditional-jump',
      'jump',
      {
        jump: {
          action: {
            kind: 'jumpTimeline',
            parameters: { destinationFrame: 89 },
            condition: { kind: 'conditionNode', nodeId: 'result' },
          },
          next: null,
        },
        write: { action: operation('condition-write'), next: 'check' },
        check: { action: { kind: 'checkCondition', parameters: { condition } }, next: null },
      },
      {
        active: { type: 'boolean', expression: { kind: 'combatActive' } },
        result: {
          type: 'boolean',
          expression: { kind: 'checkActionResult', action: { $sequence: 'write' } },
        },
      },
    );
    const action = runtime.createSequence(program);

    action.execute({});
    action.tick(0, {});
    expect(requestTimelineJump).not.toHaveBeenCalled();

    action.tick(1 / 30, {});
    action.tick(1 / 30, {});

    expect(operations.evaluate).toHaveBeenCalledTimes(2);
    expect(operations.execute).toHaveBeenCalledTimes(2);
    const restored = runtime.createSequence(
      program,
      undefined,
      structuredClone(action.runtimeState),
    );
    restored.tick(1 / 30, {});
    restored.end({});
    expect(operations.evaluate).toHaveBeenCalledTimes(2);
    expect(requestTimelineJump).toHaveBeenCalledTimes(1);
    expect(requestTimelineJump).toHaveBeenCalledWith(89);
  });
});

it('循环查询一次并捕获列表，子序列失败不阻止后继', () => {
  const team = ['first', 'second'];
  const calls: string[] = [];
  const board = new ActionBlackboard();
  const query = vi.fn((excludedOwnerId?: string) => {
    expect(excludedOwnerId).toBe('owner');
    return team.map(operatorId => ({ kind: 'operator' as const, operatorId }));
  });
  const runtime = new CombatActionSequenceRuntime(
    {
      queryTargets: (selection, context) => {
        expect(selection).toEqual({ kind: 'characterTeam', excludeOwner: true });
        return query(context.actionOwnerId);
      },
      evaluate: () => true,
      execute: (step, context) => {
        if (step.kind !== 'triggerCustomAbilityEvent') throw new Error('unexpected operation');
        const target = context?.currentTarget;
        const id = target?.kind === 'operator' ? target.operatorId : 'outside';
        calls.push(`execute:${step.parameters.eventName}:${id}`);
        expect(context?.blackboard).toBe(board);
        if (id !== 'outside') expect(context?.actionInputTarget).toEqual(target);
        team.pop();
        return id !== 'first';
      },
      end: (step, context) => {
        if (step.kind !== 'triggerCustomAbilityEvent') return;
        const target = context?.currentTarget;
        calls.push(
          `end:${step.parameters.eventName}:${target?.kind === 'operator' ? target.operatorId : 'outside'}`,
        );
      },
    },
    { blackboard: board, actionOwnerId: 'owner' },
  );
  const action = runtime.createSequence(
    compileGraphEntry('party-loop', 'loop', {
      loop: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'characterTeam', excludeOwner: true } },
          body: { $sequence: 'body' },
        },
        next: 'outside',
      },
      body: { action: operation('body'), next: null },
      outside: { action: operation('after'), next: null },
    }),
  );
  action.execute({});
  expect(query).toHaveBeenCalledTimes(1);
  expect(calls).toEqual([
    'execute:body:first',
    'end:body:first',
    'execute:body:second',
    'end:body:second',
    'execute:after:outside',
  ]);
  action.end({});
  expect(calls.at(-1)).toBe('end:after:outside');
  expect(calls).toHaveLength(6);
});

it('末尾 NotNext 跨同一环境入口保留；切面恢复保留待消费策略且不同宿主互不影响', () => {
  const program = createActionGraphCompilation(
    {
      nodes: {
        invert: { action: { kind: 'invertNextResult', parameters: {} }, next: null },
        pass: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'constant', value: true } },
          },
          next: null,
        },
      },
    },
    1,
  );
  const operations = { execute: () => true, evaluate: () => true };
  const context = { blackboard: new ActionBlackboard() };
  const runtime = new CombatActionSequenceRuntime(operations, context);
  const invert = runtime.createSequence(program.compileEntry({ $sequence: 'invert' }, 'invert'));
  expect(invert.executeInstant({})).toBe(true);
  invert.reset({});
  const saved = structuredClone(runtime.sequenceHostState);
  const probe = program.compileEntry({ $sequence: 'pass' }, 'probe');
  expect(
    new CombatActionSequenceRuntime(operations, context).createSequence(probe).executeInstant({}),
  ).toBe(true);
  const restored = new CombatActionSequenceRuntime(
    operations,
    context,
    {},
    undefined,
    undefined,
    saved,
  );
  const resumed = restored.createSequence(probe);
  expect(resumed.executeInstant({})).toBe(false);
  expect(resumed.executeInstant({})).toBe(true);
  expect(runtime.createSequence(probe).executeInstant({})).toBe(false);
});
