import { numberInput, stringInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it } from 'vitest';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatClock } from '../time/combatClock';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { TimedMarkerOperationExecutor } from './timedMarkerOperationExecutor';
import { TimedMarkerContainer } from './timedMarkers';
import { LogicalAbilityEntityRuntime } from '../abilities/logicalAbilityEntityRuntime';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { TargetContextOperationExecutor } from '../abilities/targetContextOperationExecutor';
import { runtimeTargetFromEntityId } from '../../game-data/logicalAbilityEntity';
import { createStateTestSession } from '../../../test/stateTestSession';
import { TimeDilationRuntime } from '../time/timeDilationRuntime';

const delegate: CombatOperationExecutor = {
  execute: () => false,
  evaluate: () => false,
};
const targetQueries = new TargetContextOperationExecutor('caster', delegate);
const queryTargets = targetQueries.queryTargets.bind(targetQueries);

describe('TimedMarkerOperationExecutor', () => {
  it('普通标记跟随全局时间，显式缩放标记跟随目标实体，恢复后保留两路进度', () => {
    const dilation = new TimeDilationRuntime({});
    dilation.startGlobal({
      durationSeconds: 2,
      slot: 'ultimate',
      priority: 1,
      constantScale: 0,
      ignoredOperatorIds: ['caster'],
    });
    const markers = new TimedMarkerContainer('caster', dilation.getEntityClock('caster'));
    const executor = new TimedMarkerOperationExecutor({
      resolveEventTarget: () => markers,
      queryTargets,
      globalScaledClock: dilation,
      delegate,
    });
    for (const scaled of [false, true]) {
      executor.execute(
        {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'fixed', target: 'caster' },
            markerId: scaled ? 'entity' : 'ordinary',
            durationSeconds: { kind: 'constant', value: 0.1 },
            autoFinishByAction: false,
            timeDomain: scaled ? 'self' : 'globalScaled',
          },
        },
        { blackboard: new ActionBlackboard() },
      );
    }
    dilation.advanceFrame();
    const copy = createStateTestSession(
      { dilation: dilation.runtimeState, markers: markers.runtimeState },
      () => undefined,
    ).read();
    const restored = new TimeDilationRuntime(
      {},
      {},
      { state: copy.dilation, programs: dilation.programs },
    );
    const restoredMarkers = new TimedMarkerContainer(
      'caster',
      restored.getEntityClock('caster'),
      {},
      copy.markers,
      { globalScaled: restored },
    );
    for (let i = 0; i < 3; i++) restored.advanceFrame();
    expect(restoredMarkers.has('ordinary')).toBe(true);
    expect(restoredMarkers.has('entity')).toBe(false);
    expect(markers.has('entity')).toBe(true);
  });
  it.each(['buffOwner', 'buffSource'] as const)(
    'uses the explicit %s identity instead of the event or caster',
    target => {
      const clock = new CombatClock();
      const owner = new TimedMarkerContainer('receiver', clock);
      const source = new TimedMarkerContainer('sender', clock);
      const executor = new TimedMarkerOperationExecutor({
        resolveEventTarget: id => (id === 'receiver' ? owner : source),
        queryTargets,
        globalScaledClock: clock,
        delegate,
      });
      const context = {
        blackboard: new ActionBlackboard(),
        buffOwnerId: 'receiver',
        buffSourceId: 'sender',
        actionOwnerId: 'receiver',
        actionSourceId: 'sender',
      };
      executor.execute(
        {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: target === 'buffOwner' ? 'owner' : 'source' },
            timeDomain: 'self',
            markerId: 'heal-icd',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
          },
        },
        context,
      );
      expect(
        executor.evaluate(
          {
            kind: 'timedMarkerPresent',
            returnTrueIfNotExists: false,
            target: { kind: target === 'buffOwner' ? 'owner' : 'source' },
            markerId: 'heal-icd',
          },
          context,
        ),
      ).toBe(true);
      expect((target === 'buffOwner' ? source : owner).has('heal-icd')).toBe(false);
      expect(() =>
        executor.evaluate({
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: false,
          target: { kind: target === 'buffOwner' ? 'owner' : 'source' },
          markerId: 'heal-icd',
        }),
      ).toThrow('action context');
    },
  );
  it('重复非空执行替换动作的清理句柄，不误删前一次创建的标记', () => {
    const clock = new CombatClock();
    const caster = new TimedMarkerContainer('operator', clock);
    const enemy = new TimedMarkerContainer('enemy', clock);
    const executor = new TimedMarkerOperationExecutor({
      resolveEventTarget: id => (id === 'enemy' ? enemy : caster),
      queryTargets,
      globalScaledClock: clock,
      delegate,
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        targets: { kind: 'fixed', target: 'caster' },
        timeDomain: 'self',
        markerId: stringInput('marker'),
        durationSeconds: numberInput({ kind: 'blackboard', key: 'duration' }),
        autoFinishByAction: true,
      },
    };
    // 两个输入都缺失时，必须先读取 ID，不能提前求值时长。
    expect(() => executor.execute(step, { blackboard: new ActionBlackboard() })).toThrow(
      "marker id blackboard 'marker' is missing",
    );
    const context = { blackboard: new ActionBlackboard({ marker: 'voice', duration: 5 }) };

    expect(executor.execute(step, context)).toBe(true);
    context.blackboard.assign({ marker: 'second' });
    expect(executor.execute(step, context)).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: false,
          target: { kind: 'fixed', target: 'caster' },
          markerId: 'voice',
        },
        context,
      ),
    ).toBe(true);
    executor.end(step, context);
    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: false,
          target: { kind: 'fixed', target: 'caster' },
          markerId: 'voice',
        },
        context,
      ),
    ).toBe(true);
    expect(caster.has('second')).toBe(false);
  });

  it('空组短路；逐目标读取输入并在动作结束时统一清理本次标记', () => {
    const clock = new CombatClock();
    const blackboard = new ActionBlackboard();
    const targetContext = new RuntimeTargetContext();
    const first = new TimedMarkerContainer('first', clock, {
      created: () => blackboard.assign({ marker: 'second-marker', duration: 2 }),
    });
    const second = new TimedMarkerContainer('second', clock);
    const executor = new TimedMarkerOperationExecutor({
      resolveEventTarget: id => (id === 'first' ? first : second),
      queryTargets,
      globalScaledClock: clock,
      delegate,
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        targets: { kind: 'context', key: 'group' },
        markerId: stringInput('marker'),
        durationSeconds: numberInput({ kind: 'blackboard', key: 'duration' }),
        autoFinishByAction: true,
        timeDomain: 'self',
      },
    };
    const context = { blackboard, targetContext };
    expect(executor.execute(step, context)).toBe(false);
    // 位置不是 AbilitySystem；非空但没有实体的组成功返回，不读取 ID/时长。
    targetContext.set('group', [{ kind: 'spatialPoint', pointId: 1 }]);
    expect(executor.execute(step, context)).toBe(true);
    targetContext.set('group', [
      { kind: 'operator', operatorId: 'first' },
      { kind: 'operator', operatorId: 'second' },
    ]);
    blackboard.assign({ marker: 'first-marker', duration: 1 });
    expect(executor.execute(step, context)).toBe(true);
    expect(first.has('first-marker')).toBe(true);
    expect(second.has('second-marker')).toBe(true);
    targetContext.set('group', []);
    expect(executor.execute(step, context)).toBe(false);
    executor.end(step, context);
    expect(first.has('first-marker')).toBe(false);
    expect(second.has('second-marker')).toBe(false);
  });

  it('恢复动作宿主后按标记身份只移除恢复分支实例', () => {
    const originalClock = new CombatClock();
    const originalContainer = new TimedMarkerContainer('operator', originalClock);
    const originalExecutor = new TimedMarkerOperationExecutor({
      resolveEventTarget: () => originalContainer,
      queryTargets,
      globalScaledClock: originalClock,
      delegate,
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        targets: { kind: 'fixed', target: 'caster' },
        timeDomain: 'self',
        markerId: 'voice',
        durationSeconds: { kind: 'constant', value: 5 },
        autoFinishByAction: true,
      },
    };
    const context = { blackboard: new ActionBlackboard() };
    originalExecutor.execute(step, context);
    const copied = createStateTestSession(
      {
        clock: originalClock.runtimeState,
        markers: originalContainer.runtimeState,
        actions: originalExecutor.runtimeState,
      },
      () => undefined,
    ).read();
    const restoredClock = new CombatClock(copied.clock);
    const restoredContainer = new TimedMarkerContainer(
      'operator',
      restoredClock,
      {},
      copied.markers,
    );
    const restoredExecutor = new TimedMarkerOperationExecutor(
      {
        resolveEventTarget: () => restoredContainer,
        queryTargets,
        globalScaledClock: restoredClock,
        delegate,
      },
      { state: copied.actions, programs: originalExecutor.programs },
    );

    restoredExecutor.end(step, context);

    expect(restoredContainer.has('voice')).toBe(false);
    expect(originalContainer.has('voice')).toBe(true);
  });

  it('creates and queries a marker on the active healing event target', () => {
    const clock = new CombatClock();
    const receiver = new TimedMarkerContainer('operator:receiver', clock);
    const executor = new TimedMarkerOperationExecutor({
      queryTargets,
      globalScaledClock: clock,
      resolveEventTarget: targetId => {
        expect(targetId).toBe('operator:receiver');
        return receiver;
      },
      delegate,
    });
    const context = {
      blackboard: new ActionBlackboard(),
      actionInputTarget: { kind: 'operator' as const, operatorId: 'operator:receiver' },
      event: {
        event: 'receiveHeal' as const,
        payload: {
          sourceId: 'operator:healer',
          targetId: 'operator:receiver',
          requestedHealing: 100,
          actualHealing: 0,
          overhealing: 100,
          tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
        },
      },
    };
    const step: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        targets: { kind: 'inputTarget' },
        timeDomain: 'self',
        markerId: 'heal-icd',
        durationSeconds: { kind: 'constant', value: 0.1 },
        autoFinishByAction: false,
      },
    };

    expect(executor.execute(step, context)).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: false,
          target: { kind: 'inputTarget' },
          markerId: 'heal-icd',
        },
        context,
      ),
    ).toBe(true);
  });

  it('uses the current ability entity local clock for time-dilated markers', () => {
    const entities = new LogicalAbilityEntityRuntime({ resolveDeltaSeconds: () => 1 / 60 });
    const target = entities.spawn({
      abilityEntityId: 'seal',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    const executor = new TimedMarkerOperationExecutor({
      resolveEventTarget: id => entities.timedMarkers(runtimeTargetFromEntityId(id)),
      queryTargets,
      globalScaledClock: new CombatClock(),
      delegate,
    });
    const context = {
      blackboard: new ActionBlackboard(),
      currentTarget: target,
      actionInputTarget: target,
    };
    const step: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        targets: { kind: 'inputTarget' },
        markerId: 'end',
        durationSeconds: { kind: 'constant', value: 1 },
        autoFinishByAction: false,
        timeDomain: 'self',
      },
    };

    expect(executor.execute(step, context)).toBe(true);
    for (let frame = 0; frame < 30; frame += 1) entities.advanceFrame();
    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          target: { kind: 'inputTarget' },
          returnTrueIfNotExists: false,
          markerId: 'end',
        },
        context,
      ),
    ).toBe(true);
    for (let frame = 0; frame < 31; frame += 1) entities.advanceFrame();
    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          target: { kind: 'inputTarget' },
          returnTrueIfNotExists: false,
          markerId: 'end',
        },
        context,
      ),
    ).toBe(false);
  });

  it('keeps global-clock entity markers independent from the entity local clock', () => {
    const globalClock = new CombatClock();
    const entities = new LogicalAbilityEntityRuntime({ resolveDeltaSeconds: () => 1 / 120 });
    const target = entities.spawn({
      abilityEntityId: 'water',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    const executor = new TimedMarkerOperationExecutor({
      resolveEventTarget: id => entities.timedMarkers(runtimeTargetFromEntityId(id)),
      queryTargets,
      globalScaledClock: globalClock,
      delegate,
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.setSingle('water_group', target);
    const context = {
      blackboard: new ActionBlackboard(),
      currentTarget: target,
      actionInputTarget: target,
      targetContext,
    };
    const globalStep: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        targets: { kind: 'inputTarget' },
        markerId: 'global',
        durationSeconds: { kind: 'constant', value: 1 },
        autoFinishByAction: false,
        timeDomain: 'globalScaled',
      },
    };
    const selfStep: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        targets: { kind: 'inputTarget' },
        markerId: 'self',
        durationSeconds: { kind: 'constant', value: 1 },
        autoFinishByAction: false,
        timeDomain: 'self',
      },
    };

    executor.execute(globalStep, context);
    executor.execute(selfStep, context);
    const unmarked = entities.spawn({
      abilityEntityId: 'water',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    targetContext.set('water_group', [unmarked, target]);
    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: false,
          markerId: 'self',
          target: { kind: 'context', key: 'water_group' },
        },
        context,
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          markerId: 'self',
          target: { kind: 'context', key: 'water_group' },
        },
        context,
      ),
    ).toBe(true);
    targetContext.remove('water_group');
    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: true,
          markerId: stringInput('missing'),
          target: { kind: 'context', key: 'water_group' },
        },
        context,
      ),
    ).toBe(false);
    targetContext.set('water_group', [target, unmarked]);
    for (let frame = 0; frame < 31; frame += 1) {
      globalClock.advanceFrame();
      entities.advanceFrame();
    }

    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: false,
          markerId: 'global',
          target: { kind: 'context', key: 'water_group' },
        },
        context,
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        {
          kind: 'timedMarkerPresent',
          returnTrueIfNotExists: false,
          markerId: 'self',
          target: { kind: 'context', key: 'water_group' },
        },
        context,
      ),
    ).toBe(true);
  });
});
