import { ProjectileLifecycleRuntime } from './projectileLifecycleRuntime';
import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { CompiledGraphEntry, ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import type {
  ActionGraphDefinition,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import { createStateTestSession } from '../../../test/stateTestSession';
import type { CombatOperationContext } from '../skills/skillRuntime';
import {
  createCombatOperationHostState,
  type CombatOperationHostState,
} from '../state/actionState';
import type { CombatSkillCastInfo } from '../state/foundationState';
import { AbilityEntityChildSkillPrograms } from './abilityEntityChildSkillPrograms';
import { AbilityEntityOperationExecutor } from './abilityEntityOperationExecutor';
import { LogicalAbilityEntityRuntime } from './logicalAbilityEntityRuntime';
import { RuntimeTargetContext } from './runtimeTargetContext';
import { TargetContextOperationExecutor } from './targetContextOperationExecutor';

import { CombatClock } from '../time/combatClock';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { createCallbackSkillHostFactory, type CallbackSkillHostFactory } from './callbackSkillHost';

const childMetadata = {
  nativeSkillType: 'normalSkill' as const,
  naturalDurationFrames: 30,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'ultimateEnergy' as const, value: 0, availabilityThreshold: 0 },
  },
};

const stepEntry = (
  revision: string,
  action: ActionGraphStep,
  dataNodes?: ActionGraphDefinition['dataNodes'],
): CompiledGraphEntry => ({
  graph: createActionGraphCompilation(
    { nodes: { 'step-0': { action, next: null } }, dataNodes },
    1,
    revision,
  ).compileAll(),
  entry: 'step-0',
  callSite: revision,
});

describe('AbilityEntityOperationExecutor', () => {
  it('结束动作使用指定来源的子实体，不使用技能定义所属干员', () => {
    let nextInstanceId = 1;
    const allocateInstanceId = () => nextInstanceId++;
    const entities = new LogicalAbilityEntityRuntime({ allocateInstanceId });
    const projectiles = new ProjectileLifecycleRuntime(allocateInstanceId);
    const finishSkill = vi.fn();
    const sourceProjectile = projectiles.launch({
      source: { kind: 'operator', operatorId: 'source' },
      finishDelaySeconds: 10,
      recycleDelaySeconds: 1,
      finish: finishSkill,
      beforeReset: () => {},
      resolveTickDeltaSeconds: () => 1 / 30,
    });
    const spawn = (ownerId: string) =>
      entities.spawn({
        abilityEntityId: 'sword',
        definition: { lifetime: { kind: 'infinite' } },
        ownerId,
        source: { kind: 'operator', operatorId: ownerId },
      });
    const ownerEntity = spawn('owner');
    const sourceEntity = spawn('source');
    const delegate = new TargetContextOperationExecutor(
      'definition-owner',
      { execute: () => false, evaluate: () => false },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => undefined,
        ownerSpawned: query => entities.findOwnerSpawned(query),
        ownerSpawnedProjectiles: ownerId => projectiles.findOwnerSpawned(ownerId),
      },
    );
    const executor = new AbilityEntityOperationExecutor('definition-owner', entities, delegate, {
      resolveOperations: () => delegate,
      finishProjectile: target => projectiles.finishByAction(target),
    });
    const queryContext = new RuntimeTargetContext();
    for (const [kind, expected] of [
      ['owner', ownerEntity],
      ['source', sourceEntity],
    ] as const) {
      expect(
        executor.execute(
          {
            kind: 'findOwnerSpawnedAbilityEntities',
            parameters: {
              owner: { kind },
              saveToContextKey: 'children',
              abilityEntityIds: ['sword'],
            },
          },
          {
            blackboard: new ActionBlackboard(),
            targetContext: queryContext,
            actionOwnerId: 'owner',
            actionSourceId: 'source',
          },
        ),
      ).toBe(true);
      expect(queryContext.get('children')).toEqual([expected]);
    }
    expect(
      executor.execute(
        {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: { owner: { kind: 'source' }, saveToContextKey: 'children' },
        },
        { blackboard: new ActionBlackboard(), targetContext: queryContext },
      ),
    ).toBe(false);
    expect(queryContext.get('children')).toEqual([sourceEntity]);
    executor.execute(
      {
        kind: 'finishOwner',
        parameters: {
          targets: {
            kind: 'ownerSpawned',
            objectType: 'abilityEntity',
            owner: { kind: 'source' },
            abilityEntityIds: ['sword'],
            sameSourceSkillCast: false,
          },
        },
      },
      { blackboard: new ActionBlackboard(), actionOwnerId: 'owner', actionSourceId: 'source' },
    );
    expect(entities.snapshot(ownerEntity).isAlive).toBe(true);
    expect(entities.snapshot(sourceEntity).isAlive).toBe(false);
    expect(projectiles.getUnfinishedTargets()).toEqual([sourceProjectile.target]);
    const context = {
      blackboard: new ActionBlackboard(),
      actionOwnerId: 'owner',
      actionSourceId: 'source',
    };
    const targets = {
      kind: 'ownerSpawned',
      owner: { kind: 'source' },
      objectType: 'all',
      sameSourceSkillCast: false,
    } as const;
    expect(delegate.queryTargets(targets, context)).toEqual([
      sourceProjectile.target,
      sourceEntity,
    ]);
    executor.execute({ kind: 'finishOwner', parameters: { targets } }, context);
    expect(projectiles.getUnfinishedTargets()).toEqual([]);
    expect(projectiles.isActive(sourceProjectile.target)).toBe(true);
    expect(finishSkill).not.toHaveBeenCalled();
    expect(entities.snapshot(ownerEntity).isAlive).toBe(true);
  });
  let clock: CombatClock;
  let createCallbackSkillHost: CallbackSkillHostFactory;
  beforeEach(() => {
    clock = new CombatClock();
    let nextCastId = 1;
    createCallbackSkillHost = createCallbackSkillHostFactory({
      clock,
      receipt: new CombatReceiptCollector(),
      definitionOperatorId: 'owner',
      allocateSkillCastId: () => nextCastId++,
    });
  });
  function advance(entities: LogicalAbilityEntityRuntime): void {
    clock.advanceFrame();
    entities.advanceFrame();
  }
  it('出生动作查询一次并逐目标生成，完成后统一保存且只计算一次持续时间', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const targetContext = new RuntimeTargetContext();
    const blackboard = new ActionBlackboard({ duration: 2 });
    targetContext.set('birth', [
      { kind: 'spatialPoint', pointId: 1 },
      { kind: 'spatialPoint', pointId: 2 },
    ]);
    targetContext.setSingle('victim', { kind: 'enemy' });
    const queryTargets = vi.fn((query: { readonly kind: string; readonly key?: string }) =>
      targetContext.get(query.key!),
    );
    const delegate = { execute: () => false, evaluate: () => false, queryTargets };
    const executor = new AbilityEntityOperationExecutor('owner', entities, delegate, {
      resolveOperations: () => delegate,
      installPassiveSkills: () => {
        expect(targetContext.get('birth').every(target => target.kind === 'spatialPoint')).toBe(
          true,
        );
        blackboard.assignDynamic('duration', 100);
        targetContext.setSingle('victim', { kind: 'operator', operatorId: 'ally' });
      },
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'spawnAbilityEntity',
      parameters: {
        bornAt: { kind: 'context', key: 'birth' },
        target: { kind: 'context', key: 'victim' },
        abilityEntityId: 'spawned',
        definition: { lifetime: { kind: 'limited', durationSeconds: 12 } },
        overrideDurationSeconds: numberInput({ kind: 'blackboard', key: 'duration' }),
        dieWhenSourceDies: false,
        saveToContextKey: 'birth',
        finishByAction: true,
      },
    };
    const context = { blackboard, targetContext };
    expect(executor.execute(step, context)).toBe(true);
    expect(queryTargets).toHaveBeenCalledTimes(3);
    expect(targetContext.get('birth')).toHaveLength(2);
    const created = entities.findOwnerSpawned({ ownerId: 'owner' });
    expect(created).toHaveLength(2);
    expect(created.map(entity => entities.snapshot(entity).target)).toEqual([
      { kind: 'enemy' },
      { kind: 'operator', operatorId: 'ally' },
    ]);
    for (const entity of created)
      expect(entities.snapshot(entity).remainingDurationSeconds).toBe(2);
    expect([...executor.runtimeState.actionDurationEntities.values()][0]).toHaveLength(2);

    targetContext.set('birth', []);
    expect(executor.execute(step, context)).toBe(true);
    expect(entities.findOwnerSpawned({ ownerId: 'owner' })).toHaveLength(2);
    expect(targetContext.get('birth')).toEqual([]);
    // 空出生组不跳过动作的参数求值。
    expect(() =>
      executor.execute(
        {
          ...step,
          parameters: {
            ...step.parameters,
            overrideDurationSeconds: numberInput({ kind: 'blackboard', key: 'missing' }),
          },
        },
        context,
      ),
    ).toThrow();
  });

  it('两个实体共用子技能程序，结束一个实例只清理它自己的动作创建物', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const programs = new AbilityEntityChildSkillPrograms();
    const operationPrograms = new CombatOperationPrograms();
    const makeOperations = (state: CombatOperationHostState): AbilityEntityOperationExecutor =>
      new AbilityEntityOperationExecutor(
        'owner',
        entities,
        {
          execute: () => false,
          queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
          evaluate: () => false,
        },
        { createCallbackSkillHost, resolveOperations: makeOperations, programs },
        undefined,
        { state: state.abilityEntities, programs: operationPrograms },
      );
    const root = makeOperations(createCombatOperationHostState());
    const spawn: ResolvedCombatOperationStep = {
      kind: 'spawnAbilityEntity',
      parameters: {
        bornAt: { kind: 'owner' as const },
        abilityEntityId: 'parent',
        dieWhenSourceDies: false,
        definition: {
          lifetime: { kind: 'limited', durationSeconds: 10 },
          childSkill: {
            ...childMetadata,
            skillId: 'child',
            initialBlackboard: {},
            timelineActions: [
              {
                startFrame: 0,
                endFrame: 10,
                sequence: stepEntry('child-spawn-owned', {
                  kind: 'spawnAbilityEntity',
                  parameters: {
                    bornAt: { kind: 'owner' as const },
                    abilityEntityId: 'owned',
                    dieWhenSourceDies: false,
                    finishByAction: true,
                    definition: { lifetime: { kind: 'limited', durationSeconds: 10 } },
                  },
                }),
              },
            ],
          },
        },
      },
    };
    root.execute(spawn, { blackboard: new ActionBlackboard() });
    root.execute(spawn, { blackboard: new ActionBlackboard() });
    const parents = [...entities.runtimeState.instances.values()].filter(
      entity => entity.abilityEntityId === 'parent',
    );
    const first = parents[0]!.childSkills[0]!;
    const second = parents[1]!.childSkills[0]!;
    expect(first.programId).toBe(second.programId);
    expect(first.host.skill.operations).not.toBe(second.host.skill.operations);
    const owned = () =>
      [...entities.runtimeState.instances.values()].filter(
        entity => entity.abilityEntityId === 'owned' && entity.isAlive,
      );
    expect(owned()).toHaveLength(2);
    entities.finish({ kind: 'abilityEntity', instanceId: parents[0]!.instanceId });
    expect(owned()).toHaveLength(1);
    expect(parents[1]!.isAlive).toBe(true);
    entities.finish({ kind: 'abilityEntity', instanceId: parents[1]!.instanceId });
    expect(owned()).toHaveLength(0);
    expect(() => programs.resolve(first.programId + 1)).toThrow('does not exist');
  });

  it.each(['running', 'queued'] as const)('恢复 %s 实体技能，不重放初始化或丢失请求', mode => {
    const definition = {
      lifetime: { kind: 'limited' as const, durationSeconds: 10 },
      childSkill: {
        ...childMetadata,
        skillId: 'restored-child',
        initialBlackboard: {},
        timelineActions: [
          {
            startFrame: 0,
            sequence: stepEntry('restored-child-first', {
              kind: 'triggerCustomAbilityEvent',
              parameters: { eventName: 'first', eventParam: 0, target: 'caster' as const },
            }),
          },
          {
            startFrame: 2,
            sequence: stepEntry('restored-child-second', {
              kind: 'triggerCustomAbilityEvent',
              parameters: { eventName: 'second', eventParam: 0, target: 'caster' as const },
            }),
          },
        ],
      },
    };
    const originalEntities = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 1 / 30,
    });
    const originalExecute = vi.fn(() => true);
    const programs = new AbilityEntityChildSkillPrograms();
    let originalExecutor!: AbilityEntityOperationExecutor;
    originalExecutor = new AbilityEntityOperationExecutor(
      'owner',
      originalEntities,
      {
        execute: originalExecute,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      { createCallbackSkillHost, resolveOperations: () => originalExecutor, programs },
      id => (id === 'entity' ? definition : undefined),
    );
    if (mode === 'queued') {
      const entity = originalEntities.spawn({
        abilityEntityId: 'entity',
        definition: { lifetime: definition.lifetime },
        ownerId: 'owner',
        source: { kind: 'operator', operatorId: 'owner' },
      });
      originalExecutor.requestSkillCast(
        entity,
        {
          nativeSkillId: 'restored-child',
          inputTarget: { kind: 'abilityEntity', instanceId: 21 },
        },
        { blackboard: new ActionBlackboard() },
      );
      expect(originalExecute).not.toHaveBeenCalled();
    } else
      originalExecutor.execute(
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' as const },
            abilityEntityId: 'entity',
            dieWhenSourceDies: false,
          },
        },
        { blackboard: new ActionBlackboard() },
      );
    if (mode === 'running') advance(originalEntities);
    const saved = structuredClone(originalEntities.runtimeState);
    expect([...saved.instances.values()][0]!.childSkills[0]!.skillId).toBe('restored-child');

    const restoredExecute = vi.fn((_step: ResolvedCombatOperationStep) => true);
    const restoredEntities = new LogicalAbilityEntityRuntime({
      restoredState: saved,
      resolveDeltaSeconds: () => 1 / 30,
    });
    let restoredExecutor!: AbilityEntityOperationExecutor;
    restoredExecutor = new AbilityEntityOperationExecutor(
      'owner',
      restoredEntities,
      {
        execute: restoredExecute,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      { createCallbackSkillHost, resolveOperations: () => restoredExecutor, programs },
      id => (id === 'entity' ? definition : undefined),
    );
    restoredEntities.bindRestoredRelations({
      createChildRuntime: (entity, blackboard, state) =>
        restoredExecutor.bindRestoredChildSkill(entity, blackboard, state),
    });
    expect(restoredExecute).not.toHaveBeenCalled();
    expect([...saved.instances.values()][0]!.childSkills).toHaveLength(1);
    advance(restoredEntities);
    if (mode === 'queued') {
      expect(restoredExecute.mock.calls.map(call => call[0].parameters)).toEqual([
        expect.objectContaining({ eventName: 'first' }),
      ]);
      expect(
        [...saved.instances.values()][0]!.childSkills[0]!.host.ability.postSkillCastRequest,
      ).toBeNull();
      restoredExecute.mockClear();
      advance(restoredEntities);
      advance(restoredEntities);
    }
    expect(restoredExecute).toHaveBeenCalledOnce();
    expect(restoredExecute.mock.calls[0]![0]).toMatchObject({
      parameters: { eventName: 'second' },
    });
  });

  it('resolves an ID-only spawn from the current compiled skill definition table', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const executor = new AbilityEntityOperationExecutor(
      'arclight',
      entities,
      {
        execute: () => false,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      undefined,
      abilityEntityId =>
        abilityEntityId === 'pulse'
          ? { lifetime: { kind: 'limited', durationSeconds: 5 } }
          : undefined,
    );

    expect(
      executor.execute(
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' as const },
            abilityEntityId: 'pulse',
            dieWhenSourceDies: false,
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(entities.findOwnerSpawned({ ownerId: 'arclight' })).toHaveLength(1);
  });

  it('removes a spawned entity when its passive installation fails', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const executor = new AbilityEntityOperationExecutor(
      'camille',
      entities,
      {
        execute: () => false,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      {
        createCallbackSkillHost,
        resolveOperations: () => ({
          execute: () => false,
          queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
          evaluate: () => false,
        }),
        installPassiveSkills: () => {
          throw new Error('passive install failed');
        },
      },
      () => ({
        lifetime: { kind: 'limited', durationSeconds: 5 },
        passiveSkills: [],
      }),
    );

    expect(() =>
      executor.execute(
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' as const },
            abilityEntityId: 'bat',
            dieWhenSourceDies: false,
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toThrow('passive install failed');
    expect(entities.activeCount).toBe(0);
  });

  it('does not retain the source cast identity when the native spawn disables inheritance', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const definition = { lifetime: { kind: 'limited' as const, durationSeconds: 3 } };
    const executor = new AbilityEntityOperationExecutor(
      'typhoeus',
      entities,
      {
        execute: () => false,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      undefined,
      () => definition,
    );

    executor.execute(
      {
        kind: 'spawnAbilityEntity',
        parameters: {
          bornAt: { kind: 'owner' as const },
          abilityEntityId: 'dead-arrow',
          dieWhenSourceDies: false,
          inheritSourceSkillCastInfo: false,
        },
      },
      {
        blackboard: new ActionBlackboard(),
        skillCastInfo: {
          skillCastId: 37,
          originSkillId: 'chr_0034_typhoea_attack1_01',
          originSkillType: 'basicAttack',
          nonReturnedSpCost: 0,
        },
      },
    );

    const [entity] = entities.findOwnerSpawned({ ownerId: 'typhoeus' });
    expect(entity).toBeDefined();
    expect(entities.snapshot(entity!).sourceSkillCastId).toBeUndefined();
    expect(entities.snapshot(entity!).skillCastInfo).toBeNull();
    const saved = structuredClone(entities.runtimeState).instances.get(
      entities.snapshot(entity!).instanceId,
    )!;
    expect(saved.definitionProgramId).toBeDefined();
    expect(executor.programs.resolve(saved.definitionProgramId!)).toBe(definition);
  });

  it('resolves template duration and stacking limit from spawn entity-blackboard assignments', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const executor = new AbilityEntityOperationExecutor(
      'zhuang-fangyi',
      entities,
      {
        execute: () => false,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      undefined,
      () => ({
        lifetime: {
          kind: 'limited',
          durationSeconds: { blackboardKey: 'EntityBB_duration', fallback: 45 },
        },
        maxStackingCount: { blackboardKey: 'EntityBB_limit', fallback: 5 },
      }),
    );
    const step: ResolvedCombatOperationStep = {
      kind: 'spawnAbilityEntity',
      parameters: {
        bornAt: { kind: 'owner' as const },
        abilityEntityId: 'sword',
        dieWhenSourceDies: false,
        blackboardAssignments: {
          EntityBB_duration: { kind: 'constant', value: 12 },
          EntityBB_limit: { kind: 'constant', value: 1 },
        },
      },
    };
    const context = { blackboard: new ActionBlackboard() };

    executor.execute(step, context);
    const first = entities.findOwnerSpawned({ ownerId: 'zhuang-fangyi' })[0]!;
    expect(entities.snapshot(first).remainingDurationSeconds).toBe(12);
    executor.execute(step, context);

    expect(entities.isActive(first)).toBe(false);
    expect(entities.findOwnerSpawned({ ownerId: 'zhuang-fangyi' })).toHaveLength(1);
  });

  it('finishes only the entities created by a dieOnEnd spawn when that action ends', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const executor = new AbilityEntityOperationExecutor(
      'zhuang-fangyi',
      entities,
      {
        execute: () => false,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      undefined,
      () => ({ lifetime: { kind: 'limited', durationSeconds: 5 } }),
    );
    const step: ResolvedCombatOperationStep = {
      kind: 'spawnAbilityEntity',
      parameters: {
        bornAt: { kind: 'owner' as const },
        abilityEntityId: 'mirror',
        dieWhenSourceDies: true,
        finishByAction: true,
      },
    };
    const context = { blackboard: new ActionBlackboard() };

    executor.execute(step, context);
    executor.execute(step, context);
    expect(entities.activeCount).toBe(2);

    executor.end(step, context);
    expect(entities.activeCount).toBe(0);
  });

  it('恢复动作宿主后只结束恢复分支中由该动作创建的实体', () => {
    const definition = { lifetime: { kind: 'limited' as const, durationSeconds: 5 } };
    const originalEntities = new LogicalAbilityEntityRuntime({});
    const originalExecutor = new AbilityEntityOperationExecutor(
      'owner',
      originalEntities,
      {
        execute: () => false,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      undefined,
      () => definition,
    );
    const step: ResolvedCombatOperationStep = {
      kind: 'spawnAbilityEntity',
      parameters: {
        bornAt: { kind: 'owner' as const },
        abilityEntityId: 'mirror',
        dieWhenSourceDies: true,
        finishByAction: true,
      },
    };
    const context = { blackboard: new ActionBlackboard() };
    originalExecutor.execute(step, context);
    const copied = createStateTestSession(
      { entities: originalEntities.runtimeState, actions: originalExecutor.runtimeState },
      () => undefined,
    ).read();
    const restoredEntities = new LogicalAbilityEntityRuntime({ restoredState: copied.entities });
    const restoredExecutor = new AbilityEntityOperationExecutor(
      'owner',
      restoredEntities,
      {
        execute: () => false,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      undefined,
      () => definition,
      { state: copied.actions, programs: originalExecutor.programs },
    );

    restoredExecutor.end(step, context);

    expect(restoredEntities.activeCount).toBe(0);
    expect(originalEntities.activeCount).toBe(1);
  });

  it('keeps native query truncation after zero-space distance ordering is erased', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const first = entities.spawn({
      abilityEntityId: 'robot',
      definition: { lifetime: { kind: 'limited', durationSeconds: 10 } },
      ownerId: 'yvonne',
      source: { kind: 'operator', operatorId: 'yvonne' },
    });
    entities.spawn({
      abilityEntityId: 'robot',
      definition: { lifetime: { kind: 'limited', durationSeconds: 10 } },
      ownerId: 'yvonne',
      source: { kind: 'operator', operatorId: 'yvonne' },
    });
    const executor = new AbilityEntityOperationExecutor('yvonne', entities, {
      execute: () => false,
      queryTargets: (query, context) =>
        query.kind === 'context'
          ? context.targetContext!.get(query.key)
          : [{ kind: 'operator' as const, operatorId: 'yvonne' }],
      evaluate: () => false,
    });
    const targetContext = new RuntimeTargetContext();

    executor.execute(
      {
        kind: 'findOwnerSpawnedAbilityEntities',
        parameters: {
          owner: { kind: 'source' },
          saveToContextKey: 'robots',
          abilityEntityIds: ['robot'],
          maxTargets: 1,
        },
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );

    expect(targetContext.get('robots')).toEqual([first]);
  });

  it('uses a proven Context operator as the owner of an entity query', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const xaihiBall = entities.spawn({
      abilityEntityId: 'healing-ball',
      definition: { lifetime: { kind: 'limited', durationSeconds: 10 } },
      ownerId: 'xaihi',
      source: { kind: 'operator', operatorId: 'xaihi' },
    });
    entities.spawn({
      abilityEntityId: 'healing-ball',
      definition: { lifetime: { kind: 'limited', durationSeconds: 10 } },
      ownerId: 'party-member',
      source: { kind: 'operator', operatorId: 'party-member' },
    });
    const executor = new AbilityEntityOperationExecutor('party-member', entities, {
      execute: () => false,
      queryTargets: (query, context) =>
        query.kind === 'context'
          ? context.targetContext!.get(query.key)
          : [{ kind: 'operator' as const, operatorId: 'party-member' }],
      evaluate: () => false,
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.setSingle('seraph', { kind: 'operator', operatorId: 'xaihi' });

    executor.execute(
      {
        kind: 'findOwnerSpawnedAbilityEntities',
        parameters: {
          owner: { kind: 'context', key: 'seraph' },
          saveToContextKey: 'ball',
          abilityEntityIds: ['healing-ball'],
        },
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );

    expect(targetContext.get('ball')).toEqual([xaihiBall]);
  });

  it('releases the oldest same-template entity when the native stacking group is full', () => {
    const finished: string[] = [];
    const entities = new LogicalAbilityEntityRuntime({
      hooks: { finished: snapshot => finished.push(snapshot.abilityEntityId) },
    });
    const definition = {
      lifetime: { kind: 'limited' as const, durationSeconds: 10 },
      maxStackingCount: 1,
    };
    const first = entities.spawn({
      abilityEntityId: 'robot',
      definition,
      ownerId: 'yvonne',
      source: { kind: 'operator', operatorId: 'yvonne' },
    });
    const second = entities.spawn({
      abilityEntityId: 'robot',
      definition,
      ownerId: 'yvonne',
      source: { kind: 'operator', operatorId: 'yvonne' },
    });

    expect(entities.isActive(first)).toBe(false);
    expect(entities.isActive(second)).toBe(true);
    expect(finished).toEqual(['robot']);
  });

  it('spawns from operands and writes the resulting handle to Context', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const executor = new AbilityEntityOperationExecutor('arcane', entities, {
      execute: () => false,
      queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
      evaluate: () => false,
    });
    const targetContext = new RuntimeTargetContext();

    expect(
      executor.execute(
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' as const },
            abilityEntityId: 'seal',
            definition: {
              lifetime: { kind: 'limited', durationSeconds: 5 },
            },

            target: 'enemy',
            overrideDurationSeconds: numberInput({ kind: 'blackboard', key: 'duration' }),
            saveToContextKey: 'bunshin1',
            dieWhenSourceDies: false,
            blackboardAssignments: {
              EntityBB_wisd_greater_will: numberInput({ kind: 'blackboard', key: 'will' }),
            },
            stringBlackboardAssignments: {
              EntityBB_hitedMark: 'attack1UltHitMark',
            },
          },
        },
        {
          blackboard: new ActionBlackboard({ duration: 40, will: 3 }),
          targetContext,
        },
      ),
    ).toBe(true);

    const [entity] = targetContext.get('bunshin1');
    expect(entity).toBeDefined();
    if (entity === undefined) throw new Error('expected spawned entity context');
    expect(entities.snapshot(entity)).toMatchObject({
      ownerId: 'arcane',
      target: { kind: 'enemy' },
      remainingDurationSeconds: 40,
      blackboard: {
        EntityBB_wisd_greater_will: 3,
        EntityBB_hitedMark: 'attack1UltHitMark',
      },
    });
  });

  it('preserves the current AbilityEntity as a nested spawn target', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const parent = entities.spawn({
      abilityEntityId: 'laser-target',
      definition: { lifetime: { kind: 'limited', durationSeconds: 5 } },
      ownerId: 'arcane',
      source: { kind: 'operator', operatorId: 'arcane' },
    });
    const executor = new AbilityEntityOperationExecutor('arcane', entities, {
      execute: () => false,
      queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
      evaluate: () => false,
    });

    expect(
      executor.execute(
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' as const },
            abilityEntityId: 'laser',
            definition: { lifetime: { kind: 'limited', durationSeconds: 1.5 } },
            target: 'currentAbilityEntity',
            dieWhenSourceDies: false,
          },
        },
        { blackboard: new ActionBlackboard(), currentTarget: parent },
      ),
    ).toBe(true);

    const nested = entities
      .findOwnerSpawned({ ownerId: 'arcane' })
      .find(entity => entities.snapshot(entity).abilityEntityId === 'laser');
    expect(nested).toBeDefined();
    if (nested === undefined) throw new Error('expected nested AbilityEntity');
    expect(entities.snapshot(nested).target).toEqual(parent);

    expect(() =>
      executor.execute(
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' as const },
            abilityEntityId: 'orphan',
            definition: { lifetime: { kind: 'infinite' } },
            target: 'currentAbilityEntity',
            dieWhenSourceDies: false,
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toThrow('requires a current target');
  });

  it('preserves a materialized ActionOwner AbilityEntity as the nested spawn source', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const parent = entities.spawn({
      abilityEntityId: 'projectile-parent',
      definition: { lifetime: { kind: 'limited', durationSeconds: 5 } },
      ownerId: 'typhoeus',
      source: { kind: 'operator', operatorId: 'typhoeus' },
    });
    if (parent.kind !== 'abilityEntity') throw new Error('expected AbilityEntity target');
    const executor = new AbilityEntityOperationExecutor('typhoeus', entities, {
      execute: () => false,
      queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
      evaluate: () => false,
    });

    expect(
      executor.execute(
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' as const },
            abilityEntityId: 'dead-arrow',
            definition: { lifetime: { kind: 'limited', durationSeconds: 3 } },
            source: 'currentAbilityEntity',
            dieWhenSourceDies: true,
          },
        },
        { blackboard: new ActionBlackboard(), actionOwnerAbilityEntity: parent },
      ),
    ).toBe(true);

    const child = entities
      .findOwnerSpawned({ ownerId: `ability-entity:${parent.instanceId}` })
      .find(entity => entities.snapshot(entity).abilityEntityId === 'dead-arrow');
    expect(child).toBeDefined();
    if (child === undefined) throw new Error('expected nested AbilityEntity');
    expect(entities.snapshot(child).source).toEqual(parent);
    entities.notifySourceDied(parent);
    expect(entities.snapshot(child).isAlive).toBe(false);
  });

  it('requires the current entity source regardless of source-death tracking', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const executor = new AbilityEntityOperationExecutor('typhoeus', entities, {
      execute: () => false,
      queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
      evaluate: () => false,
    });
    const step = {
      kind: 'spawnAbilityEntity' as const,
      parameters: {
        bornAt: { kind: 'owner' as const },
        abilityEntityId: 'dead-arrow',
        definition: { lifetime: { kind: 'limited' as const, durationSeconds: 3 } },
        source: 'currentAbilityEntity' as const,
        dieWhenSourceDies: false,
      },
    };

    for (const dieWhenSourceDies of [false, true]) {
      expect(() =>
        executor.execute(
          { ...step, parameters: { ...step.parameters, dieWhenSourceDies } },
          { blackboard: new ActionBlackboard() },
        ),
      ).toThrow('requires its current AbilityEntity source');
    }
    expect(entities.findOwnerSpawned({ ownerId: 'typhoeus' })).toEqual([]);
  });

  it('takes the first Context source without substituting the definition owner', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const targetContext = new RuntimeTargetContext();
    targetContext.set('source', [
      { kind: 'operator', operatorId: 'actual-source' },
      { kind: 'enemy' },
    ]);
    const executor = new AbilityEntityOperationExecutor(
      'definition-owner',
      entities,
      new TargetContextOperationExecutor('definition-owner', {
        execute: () => false,
        evaluate: () => false,
      }),
    );
    const step = {
      kind: 'spawnAbilityEntity' as const,
      parameters: {
        bornAt: { kind: 'fixed' as const, target: 'enemy' as const },
        source: { kind: 'context' as const, key: 'source' },
        abilityEntityId: 'child',
        definition: { lifetime: { kind: 'infinite' as const } },
        dieWhenSourceDies: true,
      },
    };
    const context = { blackboard: new ActionBlackboard(), targetContext };
    expect(executor.execute(step, context)).toBe(true);
    expect(entities.findOwnerSpawned({ ownerId: 'actual-source' })).toHaveLength(1);
    expect(entities.findOwnerSpawned({ ownerId: 'definition-owner' })).toHaveLength(0);
    targetContext.set('source', []);
    expect(() => executor.execute(step, context)).toThrow('requires a valid source ability system');
    expect(entities.activeCount).toBe(1);
  });

  it('finds matching entities belonging only to the queried owner', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    entities.spawn({
      abilityEntityId: 'lance',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'avywenna',
      source: { kind: 'operator', operatorId: 'avywenna' },
    });
    entities.spawn({
      abilityEntityId: 'lance',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'other',
      source: { kind: 'operator', operatorId: 'other' },
    });
    const executor = new AbilityEntityOperationExecutor('avywenna', entities, {
      execute: () => false,
      queryTargets: (query, context) =>
        query.kind === 'context'
          ? context.targetContext!.get(query.key)
          : [{ kind: 'operator' as const, operatorId: 'avywenna' }],
      evaluate: () => false,
    });
    const blackboard = new ActionBlackboard();
    const targetContext = new RuntimeTargetContext();

    expect(
      executor.execute(
        {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            owner: { kind: 'source' },
            saveToContextKey: 'ComboLances',
            abilityEntityIds: ['lance'],
          },
        },
        { blackboard, targetContext },
      ),
    ).toBe(true);

    expect(targetContext.get('ComboLances')).toHaveLength(1);
  });

  it('applies native circular slot ordering in the zero-space projection', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    for (const index of [2, 0, 3, 1]) {
      entities.spawn({
        abilityEntityId: 'place',
        definition: { lifetime: { kind: 'infinite' } },
        ownerId: 'arcane',
        source: { kind: 'operator', operatorId: 'arcane' },
        blackboardAssignments: { EntityBB_index: index },
      });
    }
    const executor = new AbilityEntityOperationExecutor('arcane', entities, {
      execute: () => false,
      queryTargets: (query, context) =>
        query.kind === 'context'
          ? context.targetContext!.get(query.key)
          : [{ kind: 'operator' as const, operatorId: 'arcane' }],
      evaluate: () => false,
    });
    const targetContext = new RuntimeTargetContext();

    executor.execute(
      {
        kind: 'findOwnerSpawnedAbilityEntities',
        parameters: {
          owner: { kind: 'source' },
          saveToContextKey: 'places',
          abilityEntityIds: ['place'],
          circularOrder: {
            indexBlackboardKey: 'EntityBB_index',
            desiredCount: 4,
            reverseFlag: 1,
          },
        },
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );

    expect(
      targetContext
        .get('places')
        .map(target => entities.entityBlackboard(target).getNumber('EntityBB_index')),
    ).toEqual([0, 3, 2, 1]);
  });

  it('clears circular query results on count mismatch and preserves finder order on bad slots', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    for (const index of [1, 1]) {
      entities.spawn({
        abilityEntityId: 'place',
        definition: { lifetime: { kind: 'infinite' } },
        ownerId: 'arcane',
        source: { kind: 'operator', operatorId: 'arcane' },
        blackboardAssignments: { EntityBB_index: index },
      });
    }
    const executor = new AbilityEntityOperationExecutor('arcane', entities, {
      execute: () => false,
      queryTargets: (query, context) =>
        query.kind === 'context'
          ? context.targetContext!.get(query.key)
          : [{ kind: 'operator' as const, operatorId: 'arcane' }],
      evaluate: () => false,
    });
    const targetContext = new RuntimeTargetContext();
    const execute = (desiredCount: number) =>
      executor.execute(
        {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            owner: { kind: 'source' },
            saveToContextKey: 'places',
            abilityEntityIds: ['place'],
            circularOrder: {
              indexBlackboardKey: 'EntityBB_index',
              desiredCount,
              reverseFlag: -1,
            },
          },
        },
        { blackboard: new ActionBlackboard(), targetContext },
      );

    execute(3);
    expect(targetContext.get('places')).toEqual([]);
    execute(2);
    expect(targetContext.get('places')).toHaveLength(2);
  });

  it('picks one stable Context handle by a blackboard index and overwrites the output group', () => {
    const executor = new AbilityEntityOperationExecutor(
      'zhuang-fangyi',
      new LogicalAbilityEntityRuntime({}),
      {
        execute: () => false,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
    );
    const targetContext = new RuntimeTargetContext();
    targetContext.set('swords', [
      { kind: 'abilityEntity', instanceId: 4 },
      { kind: 'abilityEntity', instanceId: 7 },
    ]);
    targetContext.setSingle('swordInst', { kind: 'enemy' });

    expect(
      executor.execute(
        {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'swords',
            saveToContextKey: 'swordInst',
            index: numberInput({ kind: 'blackboard', key: 'swordIndex' }),
          },
        },
        {
          blackboard: new ActionBlackboard({ swordIndex: 1 }),
          targetContext,
        },
      ),
    ).toBe(true);
    expect(targetContext.get('swordInst')).toEqual([{ kind: 'abilityEntity', instanceId: 7 }]);
    for (const source of ['missing', 'empty', 'swords']) {
      targetContext.set('empty', []);
      expect(
        executor.execute(
          {
            kind: 'pickContextTarget',
            parameters: {
              sourceContextKey: source,
              saveToContextKey: 'swordInst',
              index: numberInput({ kind: 'constant', value: 2 }),
            },
          },
          { blackboard: new ActionBlackboard(), targetContext },
        ),
      ).toBe(false);
      expect(targetContext.get('swordInst')).toEqual([{ kind: 'abilityEntity', instanceId: 7 }]);
    }
  });

  it('applies SkillCastIdValidator semantics to owner-spawned queries', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    for (const sourceSkillCastId of [21, 22]) {
      entities.spawn({
        abilityEntityId: 'seal',
        definition: { lifetime: { kind: 'infinite' } },
        ownerId: 'arcane',
        source: { kind: 'operator', operatorId: 'arcane' },
        sourceSkillCastId,
      });
    }
    const executor = new AbilityEntityOperationExecutor('arcane', entities, {
      execute: () => false,
      queryTargets: (query, context) =>
        query.kind === 'context'
          ? context.targetContext!.get(query.key)
          : [{ kind: 'operator' as const, operatorId: 'arcane' }],
      evaluate: () => false,
    });
    const targetContext = new RuntimeTargetContext();
    const skillCastInfo: CombatSkillCastInfo = {
      skillCastId: 22,
      originSkillId: 'comboSkill',
      originSkillType: 'comboSkill',
      nonReturnedSpCost: 0,
    };

    executor.execute(
      {
        kind: 'findOwnerSpawnedAbilityEntities',
        parameters: {
          owner: { kind: 'source' },
          saveToContextKey: 'seals',
          abilityEntityIds: ['seal'],
          sameSourceSkillCast: true,
        },
      },
      { blackboard: new ActionBlackboard(), targetContext, skillCastInfo },
    );

    const [matched] = targetContext.get('seals');
    expect(matched).toBeDefined();
    if (matched === undefined) throw new Error('expected same-cast entity');
    expect(entities.snapshot(matched).sourceSkillCastId).toBe(22);
  });

  it('checks remaining duration and assigns it only to ability entity targets', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const entity = entities.spawn({
      abilityEntityId: 'water',
      definition: { lifetime: { kind: 'limited', durationSeconds: 12 } },
      ownerId: 'tangtang',
      source: { kind: 'operator', operatorId: 'tangtang' },
    });
    const executor = new AbilityEntityOperationExecutor(
      'tangtang',
      entities,
      new TargetContextOperationExecutor('tangtang', {
        execute: () => false,
        evaluate: () => false,
      }),
    );
    const blackboard = new ActionBlackboard();
    const precisionTarget = entities.spawn({
      abilityEntityId: 'precision',
      definition: { lifetime: { kind: 'limited', durationSeconds: 256 } },
      ownerId: 'tangtang',
      source: { kind: 'operator', operatorId: 'tangtang' },
    });
    expect(
      executor.evaluate(
        {
          kind: 'abilityEntityRemainingDurationCompare',
          operator: 'greater',
          value: { kind: 'constant', value: 255.99998474121094 },
        },
        { blackboard, currentTarget: precisionTarget },
      ),
    ).toBe(true);
    entities.finish(precisionTarget);

    const infiniteTarget = entities.spawn({
      abilityEntityId: 'infinite',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'tangtang',
      source: { kind: 'operator', operatorId: 'tangtang' },
    });
    expect(
      executor.evaluate(
        {
          kind: 'abilityEntityRemainingDurationCompare',
          operator: 'equal',
          value: { kind: 'constant', value: -1 },
        },
        { blackboard, currentTarget: infiniteTarget },
      ),
    ).toBe(true);
    entities.finish(infiniteTarget);

    expect(
      executor.evaluate(
        {
          kind: 'abilityEntityRemainingDurationCompare',
          operator: 'less',
          value: { kind: 'constant', value: 13 },
        },
        { blackboard, currentTarget: entity, actionInputTarget: entity },
      ),
    ).toBe(true);

    const durationCheck = {
      kind: 'abilityEntityRemainingDurationCompare' as const,
      target: { kind: 'source' as const },
      outputKey: 'curduration',
      operator: 'greater' as const,
      value: { kind: 'constant' as const, value: 0 },
    };
    const sourceContext = { blackboard, actionSourceId: `ability-entity:${entity.instanceId}` };
    expect(executor.evaluate(durationCheck, sourceContext)).toBe(true);
    expect(blackboard.getNumber('curduration')).toBe(12);
    blackboard.assignDynamic('curduration', 99);
    expect(
      executor.evaluate(
        { ...durationCheck, value: { kind: 'constant', value: 20 } },
        sourceContext,
      ),
    ).toBe(false);
    expect(blackboard.getNumber('curduration')).toBe(99);
    expect(executor.evaluate(durationCheck, { blackboard, actionSourceId: 'tangtang' })).toBe(
      false,
    );
    expect(blackboard.getNumber('curduration')).toBe(99);

    expect(
      executor.execute(
        {
          kind: 'setAbilityEntityRemainingDuration',
          parameters: { target: { kind: 'inputTarget' }, value: { kind: 'constant', value: 30 } },
        },
        { blackboard, currentTarget: entity, actionInputTarget: entity },
      ),
    ).toBe(true);
    expect(entities.snapshot(entity).remainingDurationSeconds).toBe(12);

    const second = entities.spawn({
      abilityEntityId: 'water',
      definition: { lifetime: { kind: 'limited', durationSeconds: 12 } },
      ownerId: 'tangtang',
      source: { kind: 'operator', operatorId: 'tangtang' },
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.set('waters', [entity, second]);
    executor.execute(
      {
        kind: 'setAbilityEntityRemainingDuration',
        parameters: {
          target: { kind: 'context', key: 'waters' },
          value: { kind: 'constant', value: 3 },
        },
      },
      { blackboard, targetContext },
    );
    expect(entities.snapshot(entity).remainingDurationSeconds).toBe(3);
    expect(entities.snapshot(second).remainingDurationSeconds).toBe(12);
    for (const targets of [[], [{ kind: 'enemy' as const }, second]]) {
      targetContext.set('waters', targets);
      expect(
        executor.execute(
          {
            kind: 'setAbilityEntityRemainingDuration',
            parameters: {
              target: { kind: 'context', key: 'waters' },
              value: {
                kind: 'valueNode',
                nodeId: 'duration',
                node: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'missing_duration' },
                },
              },
            },
          },
          { blackboard, targetContext },
        ),
      ).toBe(true);
    }
    expect(entities.snapshot(second).remainingDurationSeconds).toBe(12);
    entities.finish(second);

    expect(
      executor.execute(
        { kind: 'finishOwner', parameters: { targets: { kind: 'inputTarget' } } },
        { blackboard, currentTarget: entity, actionInputTarget: entity },
      ),
    ).toBe(true);
    expect(entities.activeCount).toBe(1);
    expect(entities.snapshot(entity).isAlive).toBe(false);
    advance(entities);
    expect(entities.activeCount).toBe(0);
    expect(
      executor.execute(
        { kind: 'finishOwner', parameters: { targets: { kind: 'inputTarget' } } },
        { blackboard, currentTarget: entity, actionInputTarget: entity },
      ),
    ).toBe(true);
  });

  it('advances an embedded child timeline with the entity local clock', () => {
    const entities = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 1 / 60,
    });
    const execute = vi.fn(
      (_step: ResolvedCombatOperationStep, _context?: CombatOperationContext) => true,
    );
    const rootOperations = {
      execute,
      queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
      evaluate: () => false,
    };
    const executor = new AbilityEntityOperationExecutor('fixture', entities, rootOperations, {
      createCallbackSkillHost,
      resolveOperations: () => rootOperations,
    });
    const sourceBlackboard = new ActionBlackboard({ inheritedParent: 11, inherited: 5 });
    sourceBlackboard.setValueCalculation('inheritedParent', {
      operation: 'assign',
      left: 0,
      right: 11,
      result: 11,
      sourceKind: 'skillBlackboard',
      sourceSkillId: 'source-skill',
      sourceKey: 'inheritedParent',
    });
    sourceBlackboard.setValueCalculation('inherited', {
      operation: 'assign',
      left: 0,
      right: 5,
      result: 5,
      sourceKind: 'skillBlackboard',
      sourceSkillId: 'source-skill',
      sourceKey: 'inherited',
    });

    executor.execute(
      {
        kind: 'spawnAbilityEntity',
        parameters: {
          bornAt: { kind: 'owner' as const },
          abilityEntityId: 'child-host',
          definition: {
            lifetime: { kind: 'limited', durationSeconds: 10 },
            childSkill: {
              ...childMetadata,
              skillId: 'child-skill',
              initialBlackboard: { local: 3 },
              timelineActions: [
                {
                  startFrame: 2,
                  sequence: stepEntry(
                    'embedded-child-timeline',
                    {
                      kind: 'modifyActionValue',
                      parameters: {
                        key: 'result',
                        operation: 'assign',
                        value: { kind: 'valueNode', nodeId: 'inherited' },
                      },
                    },
                    {
                      inherited: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'inherited' },
                      },
                    },
                  ),
                },
              ],
            },
          },

          dieWhenSourceDies: false,
          inheritActionBlackboard: true,
          blackboardAssignments: {
            inherited: { kind: 'constant', value: 7 },
            copied: numberInput({ kind: 'blackboard', key: 'inheritedParent' }),
          },
        },
      },
      { blackboard: sourceBlackboard },
    );

    const owner = [...entities.runtimeState.instances.values()][0]!;
    const childState = owner.childSkills[0]!;
    expect(childState.host.skill.execution.state).toBe('casting');
    expect(childState.host.skill.blackboard.entity).toBe(owner.blackboard);
    const childBlackboard = ActionBlackboard.bindRuntimeState(childState.host.skill.blackboard);
    expect(childBlackboard.getValueCalculation('inheritedParent')).toMatchObject({
      sourceKind: 'skillBlackboard',
      sourceSkillId: 'source-skill',
    });
    expect(childBlackboard.getValueCalculation('inherited')).toBeUndefined();
    expect(childBlackboard.getValueCalculation('copied')).toMatchObject({
      sourceKind: 'skillBlackboard',
      sourceSkillId: 'source-skill',
    });
    const saved = structuredClone(owner);
    expect(saved.blackboard.valueCalculations?.get('inheritedParent')?.result).toBe(11);

    advance(entities);
    advance(entities);
    advance(entities);
    expect(execute).not.toHaveBeenCalled();
    advance(entities);

    expect(execute).toHaveBeenCalledTimes(1);
    const operationContext = execute.mock.calls[0]?.[1];
    expect(operationContext?.blackboard.getNumber('local')).toBe(3);
    expect(operationContext?.blackboard.getNumber('inherited')).toBe(7);
    expect(operationContext?.blackboard.getNumber('inheritedParent')).toBe(11);
    expect(childState.host.skill.execution.passedFrames).toBeGreaterThan(0);
    expect(saved.childSkills[0]!.host.skill.execution.passedFrames).toBe(0);
    expect(saved.childSkills[0]!.host.skill.blackboard.entity).toBe(saved.blackboard);
  });

  it('selects the named child skill bound by the spawn action', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const execute = vi.fn(() => true);
    const rootOperations = {
      execute,
      queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
      evaluate: () => false,
    };
    const executor = new AbilityEntityOperationExecutor('fixture', entities, rootOperations, {
      createCallbackSkillHost,
      resolveOperations: () => rootOperations,
    });
    const child = (skillId: string, flag: string) => ({
      ...childMetadata,
      skillId,
      initialBlackboard: {},
      timelineActions: [
        {
          startFrame: 0,
          sequence: stepEntry(`named-child-${skillId}`, {
            kind: 'triggerCustomAbilityEvent',
            parameters: { eventName: flag, eventParam: 0, target: 'caster' as const },
          }),
        },
      ],
    });

    executor.execute(
      {
        kind: 'spawnAbilityEntity',
        parameters: {
          bornAt: { kind: 'owner' as const },
          abilityEntityId: 'multi-child-host',
          childSkillId: 'child-b',
          definition: {
            lifetime: { kind: 'limited', durationSeconds: 10 },
            childSkills: {
              'child-a': child('child-a', 'wrong-child'),
              'child-b': child('child-b', 'selected-child'),
            },
          },
          dieWhenSourceDies: false,
        },
      },
      { blackboard: new ActionBlackboard() },
    );

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: expect.objectContaining({ eventName: 'selected-child' }),
      }),
      expect.anything(),
    );
    expect(entities.snapshot(entities.findAll()[0]!).childSkillId).toBe('child-b');
  });

  it('keeps the spawned entity alive when its requested child skill is unregistered', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const execute = vi.fn(() => true);
    const executor = new AbilityEntityOperationExecutor('fixture', entities, {
      execute,
      queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
      evaluate: () => false,
    });
    expect(
      executor.execute(
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'host',
            childSkillId: 'obsolete',
            definition: { lifetime: { kind: 'limited', durationSeconds: 10 } },
            dieWhenSourceDies: false,
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(entities.findAll()).toHaveLength(1);
    expect(entities.snapshot(entities.findAll()[0]!).childSkillId).toBeUndefined();
    expect(execute).not.toHaveBeenCalled();
  });

  it('applies child-skill timeline jumps on the ability entity local clock', () => {
    const entities = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 1 / 60,
    });
    const execute = vi.fn(
      (_step: ResolvedCombatOperationStep, _context?: CombatOperationContext) => true,
    );
    const delegate = {
      execute,
      queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
      evaluate: () => true,
    };
    let executor!: AbilityEntityOperationExecutor;
    executor = new AbilityEntityOperationExecutor('fixture', entities, delegate, {
      createCallbackSkillHost,
      resolveOperations: () => executor,
    });

    executor.execute(
      {
        kind: 'spawnAbilityEntity',
        parameters: {
          bornAt: { kind: 'owner' as const },
          abilityEntityId: 'jump-host',
          definition: {
            lifetime: { kind: 'limited', durationSeconds: 10 },
            childSkill: {
              ...childMetadata,
              skillId: 'jump-child',
              initialBlackboard: {},
              timelineActions: [
                {
                  startFrame: 1,
                  endFrame: 2,
                  sequence: stepEntry('jump-child-jump', {
                    kind: 'jumpTimeline',
                    parameters: { destinationFrame: 5 },
                    condition: { kind: 'constant', value: true },
                  }),
                },
                {
                  startFrame: 3,
                  sequence: stepEntry('jump-child-skipped', {
                    kind: 'triggerCustomAbilityEvent',
                    parameters: { eventName: 'skipped', eventParam: 0, target: 'caster' as const },
                  }),
                },
                {
                  startFrame: 5,
                  sequence: stepEntry('jump-child-destination', {
                    kind: 'triggerCustomAbilityEvent',
                    parameters: {
                      eventName: 'destination',
                      eventParam: 0,
                      target: 'caster' as const,
                    },
                  }),
                },
              ],
            },
          },

          dieWhenSourceDies: false,
        },
      },
      { blackboard: new ActionBlackboard() },
    );

    advance(entities);
    advance(entities);
    expect(execute).not.toHaveBeenCalled();

    advance(entities);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'triggerCustomAbilityEvent',
        parameters: expect.objectContaining({ eventName: 'destination' }),
      }),
      expect.anything(),
    );
  });

  it('allows an embedded child timeline to finish its own host entity', () => {
    const entities = new LogicalAbilityEntityRuntime({});
    const delegate = new TargetContextOperationExecutor('fixture', {
      execute: () => false,
      evaluate: () => false,
    });
    let executor!: AbilityEntityOperationExecutor;
    executor = new AbilityEntityOperationExecutor('fixture', entities, delegate, {
      createCallbackSkillHost,
      resolveOperations: () => executor,
    });

    executor.execute(
      {
        kind: 'spawnAbilityEntity',
        parameters: {
          bornAt: { kind: 'owner' as const },
          abilityEntityId: 'self-finishing-host',
          definition: {
            lifetime: { kind: 'limited', durationSeconds: 10 },
            childSkill: {
              ...childMetadata,
              skillId: 'self-finishing-skill',
              initialBlackboard: {},
              timelineActions: [
                {
                  startFrame: 1,
                  sequence: stepEntry('self-finishing-host-finish', {
                    kind: 'finishOwner',
                    parameters: { targets: { kind: 'owner' } },
                  }),
                },
              ],
            },
          },

          dieWhenSourceDies: false,
          inheritActionBlackboard: false,
        },
      },
      { blackboard: new ActionBlackboard(), actionOwnerId: 'fixture' },
    );

    expect(entities.activeCount).toBe(1);
    advance(entities);
    expect(entities.activeCount).toBe(1);
    expect(entities.snapshot(entities.findAll()[0]!).isAlive).toBe(false);
    advance(entities);
    expect(entities.activeCount).toBe(0);
  });

  it.each(['immediate', 'deferred'] as const)('starts an entity child through %s casting', mode => {
    const entities = new LogicalAbilityEntityRuntime({});
    const entity = entities.spawn({
      abilityEntityId: 'seal',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'arcane',
      source: { kind: 'operator', operatorId: 'arcane' },
    });
    const execute = vi.fn(() => true);
    let executor!: AbilityEntityOperationExecutor;
    executor = new AbilityEntityOperationExecutor(
      'arcane',
      entities,
      {
        execute,
        queryTargets: () => [{ kind: 'operator' as const, operatorId: 'owner' }],
        evaluate: () => false,
      },
      { createCallbackSkillHost, resolveOperations: () => executor },
      () => ({
        lifetime: { kind: 'infinite' },
        childSkills: {
          'seal-end': {
            ...childMetadata,
            skillId: 'seal-end',
            initialBlackboard: {},
            timelineActions: [
              {
                startFrame: 1,
                sequence: stepEntry('hidden-child-start', {
                  kind: 'triggerCustomAbilityEvent',
                  parameters: {
                    eventName: 'hidden-child',
                    eventParam: 0,
                    target: 'caster' as const,
                  },
                }),
              },
            ],
          },
        },
      }),
    );

    if (mode === 'deferred') {
      const request = { nativeSkillId: 'seal-end', skipApplyCost: false };
      const context = { blackboard: new ActionBlackboard() };
      executor.requestSkillCast(entity, { ...request, inputTarget: { kind: 'enemy' } }, context);
      executor.requestSkillCast(
        entity,
        {
          ...request,
          inputTarget: { kind: 'abilityEntity', instanceId: 21 },
        },
        context,
      );
      expect(entities.runtimeState.instances.get(entity.instanceId)!.childSkills).toHaveLength(1);
      expect(
        entities.childSkillHosts(entity).ability.runtimeState.postSkillCastRequest?.inputTarget,
      ).toEqual({ kind: 'abilityEntity', instanceId: 21 });
    } else
      expect(
        executor.execute(
          {
            kind: 'startCurrentAbilityEntityChildSkillById',
            parameters: { childSkillId: 'seal-end' },
          },
          { blackboard: new ActionBlackboard(), currentTarget: entity },
        ),
      ).toBe(true);
    expect(execute).not.toHaveBeenCalled();

    advance(entities);
    if (mode === 'deferred') advance(entities);

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'triggerCustomAbilityEvent' }),
      expect.objectContaining({ currentTarget: entity }),
    );
    if (mode === 'deferred') {
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          actionInputTarget: { kind: 'abilityEntity', instanceId: 21 },
          actionOwnerAbilityEntity: entity,
        }),
      );
      expect(entities.childSkillHosts(entity).ability.runtimeState.postSkillCastRequest).toBeNull();
    }
  });
});
