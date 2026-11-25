import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it } from 'vitest';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { logicalAbilityEntityRuntimeId } from '../../game-data/logicalAbilityEntity';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { TimeDilationOperationExecutor } from './timeDilationOperationExecutor';
import { TimeDilationRuntime } from './timeDilationRuntime';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { resolveDirectActionTargets } from '../abilities/targetContextOperationExecutor';
import { createStateTestSession } from '../../../test/stateTestSession';

const PRIORITY = 20;
const delegate: CombatOperationExecutor = {
  execute: () => false,
  evaluate: () => false,
};

function runtime() {
  return new TimeDilationRuntime({
    curves: new Map([['constant-half', () => 0.5]]),
  });
}

describe('TimeDilationOperationExecutor', () => {
  it.each([true, false])('忽略位按执行时目标设置，结束写反值而非恢复历史值：ignore=%s', ignore => {
    const timeDilation = runtime();
    timeDilation.startGlobal({
      durationSeconds: 10,
      slot: 'Test/Global',
      priority: PRIORITY,
      constantScale: 0.5,
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.set('selected', [
      { kind: 'enemy', enemyId: 'enemy:second' },
      { kind: 'operator', operatorId: 'other' },
      { kind: 'spatialPoint', pointId: 5 },
    ]);
    for (const id of ['enemy:second', 'other']) timeDilation.setIgnoreGlobalTimeScale(id, ignore);
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      delegate,
      sourceId: 'owner',
      sourceActionId: 'skill',
      resolveTargetIds: () => {
        throw new Error('must retain query identities');
      },
      queryTargets: (query, context) => resolveDirectActionTargets(query, context)!,
    });
    const step: ResolvedCombatStepForKind<'setIgnoreGlobalTimeScale'> = {
      kind: 'setIgnoreGlobalTimeScale',
      parameters: { targets: { kind: 'context', key: 'selected' }, ignore, revertOnEnd: true },
    };
    const context = { blackboard: new ActionBlackboard(), targetContext };
    executor.execute(step, context);
    for (const id of ['enemy:second', 'other'])
      expect(timeDilation.getOperatorScale(id)).toBe(ignore ? 1 : 0.5);
    targetContext.set('selected', [{ kind: 'enemy', enemyId: 'enemy' }]);
    executor.end(step, context);
    for (const id of ['enemy:second', 'other'])
      expect(timeDilation.getOperatorScale(id)).toBe(ignore ? 0.5 : 1);
    expect(timeDilation.getOperatorScale('enemy')).toBe(0.5);
    expect(timeDilation.currentGlobalScale).toBe(0.5);
  });
  it.each([false, true])(
    '全局忽略查询保留实际实体，跳过位置并随动作结束清理：ultimate=%s',
    ultimate => {
      const timeDilation = runtime();
      const targetContext = new RuntimeTargetContext();
      targetContext.set('ignored', [
        { kind: 'enemy', enemyId: 'enemy:second' },
        { kind: 'abilityEntity', instanceId: 9 },
        { kind: 'spatialPoint', pointId: 5 },
      ]);
      const executor = new TimeDilationOperationExecutor({
        runtime: timeDilation,
        delegate,
        sourceId: 'operator',
        sourceActionId: 'skill',
        resolveTargetIds: () => ['operator'],
        queryTargets: (query, context) => resolveDirectActionTargets(query, context)!,
      });
      const ignoredTargets = [{ kind: 'context' as const, key: 'ignored' }];
      const step:
        | ResolvedCombatStepForKind<'startTimeDilation'>
        | ResolvedCombatStepForKind<'startUltimateTimeDilation'> = ultimate
        ? {
            kind: 'startUltimateTimeDilation',
            parameters: {
              priority: PRIORITY,
              targetScale: { kind: 'constant', value: 0.5 },
              ignoredTargets,
            },
          }
        : {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'global',
              durationSeconds: { kind: 'constant', value: 1 },
              slot: 'Test/TimeSlot1',
              priority: PRIORITY,
              curve: { kind: 'named', key: 'constant-half' },
              finishByAction: true,
              ignoredTargets,
            },
          };
      const context = {
        blackboard: new ActionBlackboard(),
        targetContext,
        actionSourceId: 'actual-source',
      };
      executor.execute(step, context);
      targetContext.set('ignored', []);
      expect(timeDilation.getOperatorScale('enemy:second')).toBe(1);
      expect(timeDilation.getOperatorScale('ability-entity:9')).toBe(1);
      expect(timeDilation.getOperatorScale('enemy')).toBe(0.5);
      expect(timeDilation.getOperatorScale('operator')).toBe(0.5);
      expect(timeDilation.getOperatorScale('actual-source')).toBe(ultimate ? 1 : 0.5);
      executor.end(step, context);
      expect(timeDilation.currentGlobalScale).toBe(1);
    },
  );
  it.each(['OnlyAttacker', 'OnlyTarget', 'Both'] as const)(
    '命中停顿 %s 保留首攻击者与全部受击目标',
    affectType => {
      const timeDilation = runtime();
      let targetQueries = 0;
      let attackerPresent = false;
      const executor = new TimeDilationOperationExecutor({
        runtime: timeDilation,
        delegate,
        sourceId: 'owner',
        sourceActionId: 'skill',
        resolveTargetIds: () => {
          throw new Error('must use actual targets');
        },
        queryTargets: query => {
          if (query.kind === 'source')
            return attackerPresent
              ? [
                  { kind: 'spatialPoint', pointId: 1 },
                  { kind: 'operator', operatorId: 'first' },
                  { kind: 'operator', operatorId: 'second' },
                ]
              : [];
          expect(query).toEqual({ kind: 'partBuffSource', targets: { kind: 'inputTarget' } });
          targetQueries++;
          return [
            { kind: 'enemy', enemyId: 'enemy:second' },
            { kind: 'enemy', enemyId: 'enemy:third' },
            { kind: 'spatialPoint', pointId: 5 },
          ];
        },
      });
      const step: ResolvedCombatStepForKind<'startTimeDilation'> = {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'hitStop',
          attacker: { kind: 'source' },
          targets: { kind: 'inputTarget' },
          affectType,
          durationSeconds: { kind: 'constant', value: 1 },
          priority: PRIORITY,
          curve: { kind: 'named', key: 'constant-half' },
        },
      };
      const context = { blackboard: new ActionBlackboard() };
      expect(executor.execute(step, context)).toBe(true);
      expect(targetQueries).toBe(0);
      attackerPresent = true;
      expect(executor.execute(step, context)).toBe(true);
      expect(targetQueries).toBe(1);
      executor.end(step, context);
      expect(timeDilation.getOperatorScale('first')).toBe(affectType === 'OnlyTarget' ? 1 : 0.5);
      expect(timeDilation.getOperatorScale('second')).toBe(1);
      expect(timeDilation.getOperatorScale('enemy')).toBe(1);
      for (const id of ['enemy:second', 'enemy:third'])
        expect(timeDilation.getOperatorScale(id)).toBe(affectType === 'OnlyAttacker' ? 1 : 0.5);
    },
  );
  it('Context 顿帧遍历所有实体并跳过空间点，不替换成定义宿主', () => {
    const timeDilation = runtime();
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      delegate,
      sourceId: 'definition-owner',
      sourceActionId: 'skill',
      resolveTargetIds: target => [target],
      queryTargets: (query, context) => resolveDirectActionTargets(query, context)!,
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.set('attacker', [
      { kind: 'spatialPoint', pointId: 4 },
      { kind: 'operator', operatorId: 'actual-attacker' },
      { kind: 'abilityEntity', instanceId: 9 },
      { kind: 'enemy', enemyId: 'enemy:second' },
    ]);
    executor.execute(
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'entity',
          durationSeconds: { kind: 'constant', value: 1 },
          slot: 'Test/TimeSlot1',
          priority: PRIORITY,
          curve: { kind: 'named', key: 'constant-half' },
          finishByAction: false,
          targets: [{ kind: 'context', key: 'attacker' }],
        },
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );
    expect(timeDilation.getOperatorScale('actual-attacker')).toBe(0.5);
    expect(timeDilation.getOperatorScale('ability-entity:9')).toBe(0.5);
    expect(timeDilation.getOperatorScale('enemy:second')).toBe(0.5);
    expect(timeDilation.getOperatorScale('enemy')).toBe(1);
    expect(timeDilation.getOperatorScale('definition-owner')).toBe(1);
  });
  it('实体自身顿帧作用于动作宿主，不依赖当前循环目标或技能输入目标', () => {
    const timeDilation = runtime();
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      delegate,
      sourceId: 'operator',
      sourceActionId: 'skill',
      resolveTargetIds: target => [target],
      resolveContextAbilityEntityId: id => logicalAbilityEntityRuntimeId(id),
    });
    executor.execute(
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'entity',
          durationSeconds: { kind: 'constant', value: 1 },
          slot: 'Test/TimeSlot1',
          priority: PRIORITY,
          curve: { kind: 'named', key: 'constant-half' },
          finishByAction: false,
          targets: [],
          abilityEntityTargets: [{ kind: 'current' }],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        actionOwnerAbilityEntity: { kind: 'abilityEntity', instanceId: 4 },
        currentTarget: { kind: 'abilityEntity', instanceId: 7 },
      },
    );
    expect(timeDilation.getOperatorScale(logicalAbilityEntityRuntimeId(4))).toBe(0.5);
    expect(timeDilation.getOperatorScale(logicalAbilityEntityRuntimeId(7))).toBe(1);
  });

  it('starts a named global curve and lets the caster ignore it', () => {
    const timeDilation = runtime();
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      resolveTargetIds: target => [target === 'caster' ? 'operator' : 'enemy'],
      sourceId: 'operator',
      sourceActionId: 'skill',
      delegate,
    });
    const step: ResolvedCombatStepForKind<'startTimeDilation'> = {
      kind: 'startTimeDilation',
      parameters: {
        scope: 'global',
        durationSeconds: numberInput({ kind: 'blackboard', key: 'duration' }),
        slot: 'Test/TimeSlot1',
        priority: PRIORITY,
        curve: { kind: 'named', key: 'constant-half' },
        finishByAction: false,
        ignoredTargets: ['caster'],
      },
    };

    expect(executor.execute(step, { blackboard: new ActionBlackboard({ duration: 2 }) })).toBe(
      true,
    );
    expect(timeDilation.currentGlobalScale).toBe(0.5);
    expect(timeDilation.globalInstances[0]?.source?.curveKey).toBe('constant-half');
    expect(timeDilation.getOperatorScale('operator')).toBe(1);
    expect(timeDilation.getOperatorScale('enemy')).toBe(0.5);
  });

  it('resolves the controlled operator when the global action executes', () => {
    const timeDilation = runtime();
    const resolvedTargets: string[] = [];
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      resolveTargetIds: target => {
        resolvedTargets.push(target);
        return target === 'controlled' ? ['active-operator'] : [target];
      },
      sourceId: 'operator',
      sourceActionId: 'skill',
      delegate,
    });
    const step: ResolvedCombatStepForKind<'startTimeDilation'> = {
      kind: 'startTimeDilation',
      parameters: {
        scope: 'global',
        durationSeconds: { kind: 'constant', value: 1 },
        slot: 'Test/TimeSlot1',
        priority: PRIORITY,
        curve: { kind: 'named', key: 'constant-half' },
        finishByAction: false,
        ignoredTargets: ['controlled'],
      },
    };

    executor.execute(step, { blackboard: new ActionBlackboard() });

    expect(resolvedTargets).toEqual(['controlled']);
    expect(timeDilation.getOperatorScale('active-operator')).toBe(1);
    expect(timeDilation.getOperatorScale('operator')).toBe(0.5);
  });

  it('creates one entity instance per target and stops action-scoped instances', () => {
    const timeDilation = runtime();
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      resolveTargetIds: target => [target === 'caster' ? 'operator' : 'enemy'],
      sourceId: 'operator',
      sourceActionId: 'skill',
      delegate,
    });
    const step: ResolvedCombatStepForKind<'startTimeDilation'> = {
      kind: 'startTimeDilation',
      parameters: {
        scope: 'entity',
        durationSeconds: { kind: 'constant', value: 1 },
        slot: 'Test/TimeSlot2',
        priority: PRIORITY,
        curve: {
          kind: 'inline',
          keys: [
            {
              time: 0,
              value: 0.25,
              inTangent: 0,
              outTangent: 0,
              weightedMode: 0,
              inWeight: 0,
              outWeight: 0,
            },
          ],
        },
        finishByAction: true,
        targets: ['caster', 'enemy'],
      },
    };
    const context = { blackboard: new ActionBlackboard() };

    executor.execute(step, context);
    expect(timeDilation.entityInstances.map(instance => instance.entityId)).toEqual([
      'operator',
      'enemy',
    ]);
    executor.end(step, context);
    expect(timeDilation.entityInstances).toEqual([]);
  });

  it('resolves an entity effect against the current Buff owner', () => {
    const timeDilation = runtime();
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      resolveTargetIds: target => [target === 'caster' ? 'operator' : 'enemy'],
      sourceId: 'operator',
      sourceActionId: 'buff-lifecycle',
      delegate,
    });
    const step: ResolvedCombatStepForKind<'startTimeDilation'> = {
      kind: 'startTimeDilation',
      parameters: {
        scope: 'entity',
        durationSeconds: { kind: 'constant', value: 1 },
        slot: 'Test/TimeSlot2',
        priority: PRIORITY,
        curve: { kind: 'named', key: 'constant-half' },
        finishByAction: false,
        targets: ['buffOwner'],
      },
    };

    expect(
      executor.execute(step, {
        blackboard: new ActionBlackboard(),
        buffOwnerId: 'buff-recipient',
      }),
    ).toBe(true);
    expect(timeDilation.getEntityScale('buff-recipient')).toBe(0.5);
    expect(() => executor.execute(step, { blackboard: new ActionBlackboard() })).toThrow(
      "time-dilation entity target 'buffOwner' requires a Buff lifecycle owner",
    );
  });

  it('resolves logical AbilityEntity queries for global exclusions and entity effects', () => {
    const timeDilation = runtime();
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      resolveTargetIds: target => [target === 'caster' ? 'operator' : 'enemy'],
      resolveAbilityEntityTargetIds: query => {
        expect(query).toEqual({ kind: 'ownerSpawned' });
        return ['ability-entity:1'];
      },
      sourceId: 'operator',
      sourceActionId: 'skill',
      delegate,
    });
    const context = { blackboard: new ActionBlackboard() };
    executor.execute(
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'global',
          durationSeconds: { kind: 'constant', value: 1 },
          slot: 'Test/TimeSlot1',
          priority: PRIORITY,
          curve: { kind: 'named', key: 'constant-half' },
          finishByAction: false,
          ignoredTargets: [],
          ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
        },
      },
      context,
    );
    executor.execute(
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'entity',
          durationSeconds: { kind: 'constant', value: 1 },
          slot: 'Test/TimeSlot2',
          priority: PRIORITY,
          curve: { kind: 'named', key: 'constant-half' },
          finishByAction: false,
          targets: [],
          abilityEntityTargets: [{ kind: 'ownerSpawned' }],
        },
      },
      context,
    );

    expect(timeDilation.currentGlobalScale).toBe(0.5);
    expect(timeDilation.getEntityScale('ability-entity:1')).toBe(0.5);
    expect(timeDilation.entityInstances.map(instance => instance.entityId)).toEqual([
      'ability-entity:1',
    ]);
  });

  it('resolves ability entities already stored in the current target Context', () => {
    const timeDilation = runtime();
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      resolveTargetIds: target => [target === 'caster' ? 'operator' : 'enemy'],
      resolveContextAbilityEntityId: instanceId => logicalAbilityEntityRuntimeId(instanceId),
      sourceId: 'operator',
      sourceActionId: 'skill',
      delegate,
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.setSingle('mirror', { kind: 'abilityEntity', instanceId: 7 });

    executor.execute(
      {
        kind: 'startUltimateTimeDilation',
        parameters: {
          priority: PRIORITY,
          targetScale: { kind: 'constant', value: 0 },
          ignoredTargets: [],
          ignoredAbilityEntityTargets: [{ kind: 'context', contextKey: 'mirror' }],
        },
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );

    expect(timeDilation.getEntityScale('ability-entity:7')).toBe(1);
    expect(timeDilation.getEntityScale('enemy')).toBe(0);
  });

  it('temporarily lets a Context AbilityEntity ignore global time scale', () => {
    const timeDilation = runtime();
    timeDilation.startGlobal({
      durationSeconds: 2,
      slot: 'Test/Global',
      priority: PRIORITY,
      constantScale: 0.5,
    });
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      resolveTargetIds: target => [target],
      resolveContextAbilityEntityId: instanceId => logicalAbilityEntityRuntimeId(instanceId),
      sourceId: 'operator',
      sourceActionId: 'skill',
      delegate,
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.setSingle('soldier', { kind: 'abilityEntity', instanceId: 9 });
    const step: ResolvedCombatStepForKind<'setIgnoreGlobalTimeScale'> = {
      kind: 'setIgnoreGlobalTimeScale',
      parameters: {
        abilityEntityTargets: [{ kind: 'context', contextKey: 'soldier' }],
        ignore: true,
        revertOnEnd: true,
      },
    };

    expect(timeDilation.getEntityScale('ability-entity:9')).toBe(0.5);
    expect(executor.execute(step, { blackboard: new ActionBlackboard(), targetContext })).toBe(
      true,
    );
    expect(timeDilation.getEntityScale('ability-entity:9')).toBe(1);
    executor.end(step, { blackboard: new ActionBlackboard(), targetContext });
    expect(timeDilation.getEntityScale('ability-entity:9')).toBe(0.5);
  });

  it('treats an absent optional ignored AbilityEntity Context as an empty set', () => {
    const timeDilation = runtime();
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      resolveTargetIds: target => [target === 'caster' ? 'operator' : 'enemy'],
      resolveContextAbilityEntityId: instanceId => logicalAbilityEntityRuntimeId(instanceId),
      sourceId: 'operator',
      sourceActionId: 'skill',
      delegate,
    });

    expect(() =>
      executor.execute(
        {
          kind: 'startUltimateTimeDilation',
          parameters: {
            priority: PRIORITY,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
            ignoredAbilityEntityTargets: [{ kind: 'context', contextKey: 'optional-model' }],
          },
        },
        { blackboard: new ActionBlackboard(), targetContext: new RuntimeTargetContext() },
      ),
    ).not.toThrow();
    expect(timeDilation.getEntityScale('enemy')).toBe(0);
  });

  it('keeps the ultimate caster running and stops the constant scale with the action', () => {
    const timeDilation = runtime();
    const executor = new TimeDilationOperationExecutor({
      runtime: timeDilation,
      resolveTargetIds: target => [target === 'caster' ? 'operator' : 'enemy'],
      sourceId: 'operator',
      sourceActionId: 'skill',
      delegate,
    });
    const step: ResolvedCombatStepForKind<'startUltimateTimeDilation'> = {
      kind: 'startUltimateTimeDilation',
      parameters: {
        priority: PRIORITY,
        targetScale: { kind: 'constant', value: 0 },
        ignoredTargets: [],
      },
    };
    const context = { blackboard: new ActionBlackboard() };

    executor.execute(step, context);
    expect(timeDilation.currentGlobalScale).toBe(0);
    expect(timeDilation.getOperatorScale('operator')).toBe(1);
    expect(timeDilation.getOperatorScale('enemy')).toBe(0);
    executor.end(step, context);
    expect(timeDilation.currentGlobalScale).toBe(1);
    // 同内容的两个程序节点必须持有不同关系；被替换的旧动作不能停止新实例。
    const otherStep = structuredClone(step);
    executor.execute(step, context);
    executor.execute(otherStep, context);
    expect(executor.runtimeState.instanceIds.size).toBe(2);
    executor.end(step, context);
    expect(timeDilation.currentGlobalScale).toBe(0);
    executor.end(otherStep, context);
    expect(timeDilation.currentGlobalScale).toBe(1);
    expect(executor.runtimeState.instanceIds.size).toBe(0);
  });

  it('恢复动作宿主后由同一程序槽停止恢复分支的膨胀实例', () => {
    const originalRuntime = runtime();
    const dependencies = {
      runtime: originalRuntime,
      resolveTargetIds: (target: string) => [target === 'caster' ? 'operator' : 'enemy'],
      sourceId: 'operator',
      sourceActionId: 'skill',
      delegate,
    };
    const originalExecutor = new TimeDilationOperationExecutor(dependencies);
    const step: ResolvedCombatStepForKind<'startUltimateTimeDilation'> = {
      kind: 'startUltimateTimeDilation',
      parameters: {
        priority: PRIORITY,
        targetScale: { kind: 'constant', value: 0 },
        ignoredTargets: [],
      },
    };
    const context = { blackboard: new ActionBlackboard() };
    originalExecutor.execute(step, context);
    const copied = createStateTestSession(
      { time: originalRuntime.runtimeState, actions: originalExecutor.runtimeState },
      () => undefined,
    ).read();
    const restoredRuntime = new TimeDilationRuntime(
      {},
      {},
      { state: copied.time, programs: originalRuntime.programs },
    );
    const restoredExecutor = new TimeDilationOperationExecutor(
      { ...dependencies, runtime: restoredRuntime },
      { state: copied.actions, programs: originalExecutor.programs },
    );

    restoredExecutor.end(step, context);

    expect(restoredRuntime.currentGlobalScale).toBe(1);
    expect(originalRuntime.currentGlobalScale).toBe(0);
  });
});
