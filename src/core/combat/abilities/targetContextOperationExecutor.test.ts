import { singleTargetList } from '../../game-data/logicalAbilityEntity';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { CompiledTargetQuery } from '../../compiler/compiledGraphData';
import { describe, expect, it, vi } from 'vitest';
import { numberInput } from '../../../test/compiledGraphInputs';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatVitals } from '../resources/combatVitals';
import { RuntimeTargetContext } from './runtimeTargetContext';
import {
  TargetContextOperationExecutor,
  resolveDirectActionTargets,
} from './targetContextOperationExecutor';
import { ProjectileLifecycleRuntime } from './projectileLifecycleRuntime';
import { createKillEvent } from '../events/killEventTestFixture';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { BuffDefinitionOperationTarget } from '../buffs/buffDefinitionOperationTarget';
import { GameplayTagRegistry } from '../tags/gameplayTags';
import type { BuffLookupQuery } from '../../../../packages/game-data-contract/src/conditions';

const terminal = {
  execute: () => false,
  evaluate: () => false,
};

function vitals(health: number): CombatVitals {
  return new CombatVitals({
    health,
    maxHealth: 1000,
    maxPoise: 0,
    poise: 0,
    poiseRecoveryTime: 0,
    poiseRecoveryTimeMultiplier: 0,
    poiseBrokenEndTime: 0,
    poiseImmune: false,
  });
}

describe('TargetContextOperationExecutor', () => {
  it('InputTarget 保留技能输入集合，空集合不回退到旧首目标', () => {
    const executor = new TargetContextOperationExecutor('owner', terminal);
    const first = { kind: 'enemy' as const, enemyId: 'enemy:first' };
    const second = { kind: 'enemy' as const, enemyId: 'enemy:second' };
    const context = {
      blackboard: new ActionBlackboard(),
      actionInputTargets: [first, second],
    };
    expect(executor.queryTargets({ kind: 'inputTarget' }, context)).toEqual([first, second]);
    expect(
      executor.queryTargets({ kind: 'inputTarget' }, { ...context, actionInputTargets: [] }),
    ).toEqual([]);
    expect(
      executor.queryTargets(
        { kind: 'inputTarget' },
        { ...context, actionInputTargets: singleTargetList(second) },
      ),
    ).toEqual([second]);
  });
  it('包含过滤比较归一化部位身份，但保留原始目标、顺序和重复项', () => {
    const enemy: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:secondary' };
    const part: RuntimeTargetRef = { kind: 'abilityEntity', instanceId: 7 };
    const executor = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => enemy,
        ownerSpawned: () => [],
        partBuffSource: target =>
          target.kind === 'abilityEntity' && target.instanceId === 7 ? enemy : target,
      },
    );
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    context.targetContext.set('candidates', [
      { kind: 'enemy', enemyId: 'enemy' },
      part,
      enemy,
      part,
    ]);
    context.targetContext.set('parents', [part]);
    const query = {
      kind: 'intersection',
      targets: { kind: 'context', key: 'candidates' },
      parentTargets: { kind: 'context', key: 'parents' },
    } as const;
    expect(executor.queryTargets(query, context)).toEqual([part, enemy, part]);
    context.targetContext.set('parents', []);
    expect(executor.queryTargets(query, context)).toEqual([]);
  });

  it('实体转位置逐个转换、保留已有位置，空组不凭空创建位置', () => {
    const executor = new TargetContextOperationExecutor('caster', terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    const point: RuntimeTargetRef = { kind: 'spatialPoint', pointId: 99 };
    context.targetContext.set('targets', [
      { kind: 'enemy', enemyId: 'enemy' },
      point,
      { kind: 'enemy', enemyId: 'enemy:secondary' },
    ]);
    const step = {
      kind: 'copyContextTargets',
      parameters: {
        source: { kind: 'context', key: 'targets' },
        saveToContextKey: 'points',
        convertEntitiesToPositions: true,
      },
    } as const;
    expect(executor.execute(step, context)).toBe(true);
    expect(context.targetContext.get('points')).toEqual([
      { kind: 'spatialPoint', pointId: 1 },
      point,
      { kind: 'spatialPoint', pointId: 2 },
    ]);
    const resumed = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { ...executor.runtimeState },
    );
    resumed.execute(step, context);
    expect(context.targetContext.get('points')).toEqual([
      { kind: 'spatialPoint', pointId: 3 },
      point,
      { kind: 'spatialPoint', pointId: 4 },
    ]);
    context.targetContext.set('targets', []);
    resumed.execute(step, context);
    expect(context.targetContext.get('points')).toEqual([]);
  });
  it('反弹先排除当前敌人再限数，后续目标组变化仍动态求值', () => {
    const executor = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => ({ kind: 'enemy', enemyId: 'enemy' }),
        ownerSpawned: () => [],
        exclusionTarget: target => target,
      },
    );
    const targetContext = new RuntimeTargetContext();
    const primary: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy' };
    const second: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:second' };
    const third: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:third' };
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext,
      actionInputTargets: singleTargetList(primary),
    };
    const query: CompiledTargetQuery = {
      kind: 'limit',
      count: 1,
      targets: {
        kind: 'exclude',
        targets: { kind: 'context', key: 'candidates' },
        excludeTargets: { kind: 'inputTarget' },
      },
    };
    targetContext.set('candidates', [primary, second, third]);
    expect(executor.queryTargets(query, context)).toEqual([second]);
    targetContext.set('candidates', [primary, third]);
    expect(executor.queryTargets(query, context)).toEqual([third]);
    targetContext.set('candidates', [primary]);
    expect(executor.queryTargets(query, context)).toEqual([]);
  });

  it('距离筛选保留范围近似，标签筛选保留不能锁定的目标', () => {
    let marked = false;
    const executor = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => ({ kind: 'enemy', enemyId: 'enemy' }),
        ownerSpawned: () => [],
        matchesTags: target => (target.kind === 'enemy' ? marked : undefined),
      },
    );
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    const enemy = { kind: 'enemy', enemyId: 'enemy' } as const;
    const point = { kind: 'spatialPoint', pointId: 1 } as const;
    context.targetContext.set('targets', [enemy, point]);
    const distanceQuery: CompiledTargetQuery = {
      kind: 'distanceFilter',
      targets: { kind: 'fixed', target: 'enemy' },
      center: { kind: 'fixed', target: 'caster' },
      operator: 'lessOrEqual',
      threshold: numberInput({ kind: 'constant', value: 3 }),
      clampToXZ: false,
    };
    expect(executor.queryTargets(distanceQuery, context)).toEqual([enemy]);
    expect(executor.queryTargets({ ...distanceQuery, clampToXZ: true }, context)).toEqual([enemy]);
    const tagQuery: CompiledTargetQuery = {
      kind: 'tagFilter',
      targets: { kind: 'context', key: 'targets' },
      tags: ['Status/Marked'],
      tagQueryType: 'hasAny',
    };
    expect(executor.queryTargets(tagQuery, context)).toEqual([point]);
    marked = true;
    expect(executor.queryTargets(tagQuery, context)).toEqual([enemy, point]);
    expect(context.targetContext.get('targets')).toEqual([enemy, point]);
  });

  it('picks one stable Context handle by a blackboard index and overwrites the output group', () => {
    const executor = new TargetContextOperationExecutor('caster', terminal);
    const targetContext = new RuntimeTargetContext();
    targetContext.set('swords', [
      { kind: 'abilityEntity', instanceId: 4 },
      { kind: 'abilityEntity', instanceId: 7 },
    ]);
    targetContext.setSingle('swordInst', { kind: 'enemy', enemyId: 'enemy' });

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
    targetContext.set('team', [
      { kind: 'operator', operatorId: 'first' },
      { kind: 'operator', operatorId: 'second' },
    ]);
    expect(
      executor.execute(
        {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'team',
            saveToContextKey: 'swordInst',
            index: numberInput({ kind: 'constant', value: 1 }),
          },
        },
        { blackboard: new ActionBlackboard(), targetContext },
      ),
    ).toBe(true);
    expect(targetContext.get('team')).toHaveLength(2);
    expect(targetContext.get('swordInst')).toEqual([{ kind: 'operator', operatorId: 'second' }]);
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
      expect(targetContext.get('swordInst')).toEqual([{ kind: 'operator', operatorId: 'second' }]);
    }
  });

  it('BuffValidator rechecks actual Buff instances after removal and preserves non-entity targets', () => {
    const container = new CombatBuffContainer(
      'caster',
      new CombatAttributeSet<string>(),
      new GameplayTagRegistry(['Status/Marked']),
    );
    container.addEntityTags(['Status/Marked']);
    const buffs = new BuffDefinitionOperationTarget(container, {
      get: () => undefined,
      compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
    });
    const executor = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => undefined,
        ownerSpawned: () => [],
        hasMatchingBuff: (target, query) =>
          target.kind === 'operator' ? !buffs.findMatching(query).next().done : false,
      },
    );
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    const targets = [
      { kind: 'operator' as const, operatorId: 'caster' },
      { kind: 'enemy' as const, enemyId: 'enemy' },
      { kind: 'spatialPoint' as const, pointId: 1 },
    ];
    context.targetContext.set('candidates', targets);
    const query = (lookup: BuffLookupQuery, requireBuff = true): CompiledTargetQuery => ({
      kind: 'buffFilter',
      targets: { kind: 'context', key: 'candidates' },
      query: lookup,
      requireBuff,
    });
    const tagged: BuffLookupQuery = {
      kind: 'tag',
      buffTags: ['Status/Marked'],
      tagQueryType: 'hasAny',
    };
    expect(executor.queryTargets(query(tagged), context)).toEqual([targets[2]]);
    const buff = container.add(
      { id: 'mark', stackingType: 'unlimited', applyTags: ['Status/Marked'] },
      'caster',
    )!;
    expect(executor.queryTargets(query(tagged), context)).toEqual([targets[0], targets[2]]);
    expect(executor.queryTargets(query({ kind: 'id', buffIds: ['mark'] }, false), context)).toEqual(
      [targets[1], targets[2]],
    );
    container.finishInstance(buff, 'other', undefined);
    expect(executor.queryTargets(query(tagged), context)).toEqual([targets[2]]);
    expect(executor.queryTargets(query(tagged, false), context)).toEqual(targets);
    expect(context.targetContext.get('candidates')).toEqual(targets);
  });
  it('转移来源优先读取事件映射，回退 Buff 映射与原目标，并覆盖旧输出', () => {
    const executor = new TargetContextOperationExecutor('caster', terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
      actionOwnerId: 'enemy',
      partTransferInfo: {
        currentMainBodyId: 'enemy',
        mainBodyToPart: new Map([['enemy', 'ability-entity:7']]),
      },
    };
    const step = {
      kind: 'saveTransferredSource' as const,
      parameters: {
        source: { kind: 'owner' as const },
        saveToContextKey: 'saved',
      },
    };
    executor.execute(step, context);
    expect(context.targetContext.getOptional('saved')).toEqual([
      { kind: 'abilityEntity', instanceId: 7 },
    ]);
    executor.execute(step, {
      ...context,
      event: {
        event: 'afterKillEntity',
        payload: {
          ...createKillEvent().payload,
          partTransferInfo: {
            currentMainBodyId: 'enemy',
            mainBodyToPart: new Map([['enemy', 'ability-entity:8']]),
          },
        },
      },
    });
    expect(context.targetContext.getOptional('saved')).toEqual([
      { kind: 'abilityEntity', instanceId: 8 },
    ]);
    executor.execute(step, { ...context, partTransferInfo: undefined });
    expect(context.targetContext.getOptional('saved')).toEqual([
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
    executor.execute(step, { ...context, actionOwnerId: undefined });
    expect(context.targetContext.getOptional('saved')).toEqual([]);
    context.targetContext.set('mixed', [
      { kind: 'spatialPoint', pointId: 1 },
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
    executor.execute(
      {
        ...step,
        parameters: {
          ...step.parameters,
          source: { kind: 'context', key: 'mixed' },
        },
      },
      context,
    );
    expect(context.targetContext.getOptional('saved')).toEqual([
      { kind: 'abilityEntity', instanceId: 7 },
    ]);
  });
  it('排除按归一化身份比较，原位覆盖时保留其余目标的身份、顺序和重复项', () => {
    const executor = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => ({ kind: 'enemy', enemyId: 'enemy' }),
        ownerSpawned: () => [],
        exclusionTarget: target =>
          target.kind === 'abilityEntity' && target.instanceId === 7
            ? { kind: 'enemy', enemyId: 'enemy' }
            : target,
      },
    );
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
      actionInputTargets: singleTargetList({ kind: 'abilityEntity' as const, instanceId: 7 }),
    };
    const other = { kind: 'abilityEntity' as const, instanceId: 8 };
    context.targetContext.set('tar', [
      { kind: 'enemy', enemyId: 'enemy' },
      other,
      ...context.actionInputTargets,
      other,
    ]);
    const step = {
      kind: 'copyContextTargets',
      parameters: {
        source: { kind: 'context', key: 'tar' },
        excludeTargets: { kind: 'inputTarget' },
        saveToContextKey: 'tar',
      },
    } as const;
    executor.execute(step, context);
    expect(context.targetContext.get('tar')).toEqual([other, other]);
    executor.execute(step, { ...context, actionInputTargets: [] });
    expect(context.targetContext.get('tar')).toEqual([other, other]);
  });
  it('能力实体目标查询读取控制器的新目标，保留墨影身份并覆盖旧目标组', () => {
    let targets: RuntimeTargetRef[] = [
      { kind: 'abilityEntity', instanceId: 19 },
      { kind: 'enemy', enemyId: 'enemy:second' },
    ];
    const executor = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => ({ kind: 'enemy', enemyId: 'enemy' }),
        ownerSpawned: () => [],
        abilityEntityTarget: owner => {
          expect(owner).toEqual({ kind: 'abilityEntity', instanceId: 7 });
          return targets;
        },
      },
    );
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
      actionOwnerId: 'ability-entity:7',
      actionInputTargets: singleTargetList({ kind: 'enemy' as const, enemyId: 'enemy' }),
    };
    const step = {
      kind: 'findTargets',
      parameters: {
        owner: { kind: 'owner' },
        query: { kind: 'abilityEntityTarget', owner: { kind: 'owner' } },
        saveToContextKey: 'victim',
      },
    } as const;
    executor.execute(step, context);
    expect(context.targetContext.get('victim')).toEqual(targets);
    targets[0] = { kind: 'abilityEntity', instanceId: 20 };
    targets.pop();
    expect(context.targetContext.get('victim')).toEqual([
      { kind: 'abilityEntity', instanceId: 19 },
      { kind: 'enemy', enemyId: 'enemy:second' },
    ]);
    executor.execute(step, context);
    expect(context.targetContext.get('victim')).toEqual(targets);
    targets = [];
    executor.execute(step, context);
    expect(context.targetContext.get('victim')).toEqual([]);
  });
  it('下一存活槽位按完整槽位循环，跳空槽和死亡队员，最后允许原队员且失败保留原组', () => {
    const alive = new Set(['first', 'last']);
    const slots: (string | undefined)[] = ['first', undefined, 'dead', 'last'];
    const executor = new TargetContextOperationExecutor(
      'first',
      terminal,
      {
        squadSlotCount: slots.length,
        readSquadSlot: index => slots[index],
        listOperatorIds: () => slots.filter((id): id is string => id !== undefined),
        isOperatorControlled: () => false,
        resolveVitals: () => vitals(1000),
      },
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => ({ kind: 'enemy', enemyId: 'enemy' }),
        ownerSpawned: () => [],
        entityLifeState: target =>
          target.kind === 'operator' && alive.has(target.operatorId) ? 'alive' : 'dead',
      },
    );
    const blackboard = new ActionBlackboard({ start: 0 });
    const targetContext = new RuntimeTargetContext();
    const step = {
      kind: 'findNextAliveCharacterBySquadSlot',
      parameters: {
        slotIndex: numberInput({ kind: 'blackboard', key: 'start' }),
        saveToContextKey: 'next',
      },
    } as const;
    expect(executor.execute(step, { blackboard, targetContext })).toBe(true);
    expect(targetContext.get('next')).toEqual([{ kind: 'operator', operatorId: 'last' }]);
    blackboard.assign({ start: 3 });
    expect(executor.execute(step, { blackboard, targetContext })).toBe(true);
    expect(targetContext.get('next')).toEqual([{ kind: 'operator', operatorId: 'first' }]);
    alive.delete('first');
    expect(executor.execute(step, { blackboard, targetContext })).toBe(true);
    expect(targetContext.get('next')).toEqual([{ kind: 'operator', operatorId: 'last' }]);
    alive.clear();
    expect(executor.execute(step, { blackboard, targetContext })).toBe(false);
    expect(targetContext.get('next')).toEqual([{ kind: 'operator', operatorId: 'last' }]);
  });

  it('内联排除查询与目标组复制共用归一化规则，实时读取排除组且保留剩余顺序和重复项', () => {
    const executor = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => ({ kind: 'enemy', enemyId: 'enemy' }),
        ownerSpawned: () => [],
        exclusionTarget: target =>
          target.kind === 'abilityEntity' && target.instanceId === 7
            ? { kind: 'enemy', enemyId: 'enemy' }
            : target,
      },
    );
    const targetContext = new RuntimeTargetContext();
    const part = { kind: 'abilityEntity', instanceId: 7 } as const;
    const other = { kind: 'operator', operatorId: 'other' } as const;
    targetContext.set('candidates', [part, other, { kind: 'enemy', enemyId: 'enemy' }, other]);
    targetContext.set('excluded', [{ kind: 'enemy', enemyId: 'enemy' }]);
    const query = {
      kind: 'exclude',
      targets: { kind: 'context', key: 'candidates' },
      excludeTargets: { kind: 'context', key: 'excluded' },
    } as const;
    const context = { blackboard: new ActionBlackboard(), targetContext };
    expect(executor.queryTargets(query, context)).toEqual([other, other]);
    targetContext.set('excluded', [other]);
    expect(executor.queryTargets(query, context)).toEqual([
      part,
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
    expect(targetContext.get('candidates')).toEqual([
      part,
      other,
      { kind: 'enemy', enemyId: 'enemy' },
      other,
    ]);
  });

  it('固定槽位不跳过空槽，失败保留原目标组', () => {
    const executor = new TargetContextOperationExecutor('caster', terminal, {
      listOperatorIds: () => ['caster', 'ally'],
      isOperatorControlled: () => false,
      resolveVitals: () => vitals(1000),
      readSquadSlot: index => (index === 2 ? 'ally' : undefined),
    });
    const targetContext = new RuntimeTargetContext();
    const blackboard = new ActionBlackboard({ slot: 2 });
    const step = {
      kind: 'findCharacterBySquadSlot',
      parameters: {
        slotIndex: numberInput({ kind: 'blackboard', key: 'slot' }),
        saveToContextKey: 'selected',
      },
    } as const;
    expect(executor.execute(step, { blackboard, targetContext })).toBe(true);
    blackboard.assign({ slot: 1 });
    expect(executor.execute(step, { blackboard, targetContext })).toBe(false);
    expect(targetContext.get('selected')).toEqual([{ kind: 'operator', operatorId: 'ally' }]);
  });
  it('动作输入和来源写入 Context 时保留实体身份，不替换成事件目标或敌人', () => {
    const executor = new TargetContextOperationExecutor('caster', terminal);
    const targetContext = new RuntimeTargetContext();
    executor.execute(
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'attacker',
          sources: [{ kind: 'inputTarget' }],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        actionInputTargets: singleTargetList({ kind: 'abilityEntity', instanceId: 7 }),
        event: { event: 'hpChanged', payload: { sourceId: 'ability-entity:7', targetId: 'enemy' } },
      },
    );
    expect(targetContext.get('attacker')).toEqual([{ kind: 'abilityEntity', instanceId: 7 }]);
    for (const kind of ['inputTarget', 'source'] as const) {
      for (const [id, expected] of [
        ['ability-entity:7', { kind: 'abilityEntity', instanceId: 7 }],
        ['god-entity', { kind: 'godEntity' }],
      ] as const) {
        executor.execute(
          {
            kind: 'mergeContextTargets',
            parameters: { saveToContextKey: 'resolved', sources: [{ kind }] },
          },
          {
            blackboard: new ActionBlackboard(),
            targetContext,
            buffSourceId: id,
            actionSourceId: id,
            actionInputTargets: singleTargetList(expected),
            event: { event: 'hpChanged', payload: { sourceId: 'caster', targetId: id } },
          },
        );
        expect(targetContext.get('resolved')).toEqual([expected]);
      }
    }
    targetContext.setSingle('point', { kind: 'spatialPoint', pointId: 1 });
    expect(
      executor.evaluate(
        {
          kind: 'targetsEqual',
          first: { kind: 'context', key: 'point' },
          second: { kind: 'source' },
        },
        { blackboard: new ActionBlackboard(), targetContext, actionSourceId: 'enemy' },
      ),
    ).toBe(false);
    const equals = {
      kind: 'targetsEqual',
      first: { kind: 'context', key: 'left' },
      second: { kind: 'context', key: 'right' },
    } as const;
    const context = { blackboard: new ActionBlackboard(), targetContext };
    targetContext.set('left', []);
    targetContext.set('right', []);
    expect(executor.evaluate(equals, context)).toBe(true);
    targetContext.setSingle('left', { kind: 'enemy', enemyId: 'enemy' });
    expect(executor.evaluate(equals, context)).toBe(false);
    targetContext.set('right', [
      { kind: 'enemy', enemyId: 'enemy' },
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
    expect(executor.evaluate(equals, context)).toBe(true);
    // 动作绑定决定 Owner/Source，不偷用外层 Buff 或事件的身份。
    expect(
      executor.evaluate(
        {
          kind: 'targetsEqual',
          first: { kind: 'owner' },
          second: { kind: 'source' },
        },
        {
          ...context,
          actionOwnerId: 'ability-entity:7',
          actionSourceId: 'ability-entity:7',
          buffOwnerId: 'enemy',
          buffSourceId: 'caster',
        },
      ),
    ).toBe(true);
  });

  it('全局机制查询保持独立身份，并能从目标组状态恢复', () => {
    const executor = new TargetContextOperationExecutor('caster', terminal);
    const targetContext = new RuntimeTargetContext();
    executor.execute(
      {
        kind: 'findTargets',
        parameters: {
          owner: { kind: 'owner' },
          query: { kind: 'godEntity' },
          saveToContextKey: 'mechanism',
        },
      },
      { blackboard: new ActionBlackboard(), actionOwnerId: 'caster', targetContext },
    );
    const restored = new RuntimeTargetContext(structuredClone(targetContext.runtimeState));
    expect(
      executor.queryTargets(
        { kind: 'context', key: 'mechanism' },
        {
          blackboard: new ActionBlackboard(),
          targetContext: restored,
        },
      ),
    ).toEqual([{ kind: 'godEntity' }]);
  });

  it('投射物查询保存当时的候选，后续发射不混入旧结果，重新查询覆盖旧组', () => {
    const projectiles = new ProjectileLifecycleRuntime();
    const launch = () =>
      projectiles.launch({
        schedule: { endFrame: 30, callbacks: [] },
        recycleDelaySeconds: 1,
        resolveTickDeltaSeconds: () => 1,

        beforeReset: () => {},
      });
    const first = launch();
    const executor = new TargetContextOperationExecutor(
      'caster',
      terminal,
      undefined,
      undefined,
      undefined,
      () => projectiles.getUnfinishedTargets(),
    );
    const targetContext = new RuntimeTargetContext();
    const context = { blackboard: new ActionBlackboard(), targetContext, actionOwnerId: 'caster' };
    const query = {
      kind: 'findTargets',
      parameters: {
        owner: { kind: 'owner' },
        query: { kind: 'unfinishedProjectiles' },
        saveToContextKey: 'projectiles',
      },
    } as const;
    expect(executor.execute(query, context)).toBe(true);
    launch();
    expect(targetContext.get('projectiles')).toEqual([first.target]);
    projectiles.advanceFrame();
    expect(targetContext.get('projectiles')).toEqual([first.target]);
    executor.execute(query, context);
    expect(targetContext.get('projectiles')).toEqual([]);
    expect(projectiles.isActive(first.target)).toBe(true);
  });

  it('技能动作 Owner 优先于外层 Buff Owner 查询一层来源', () => {
    const query = vi.fn(() => ({ kind: 'operator' as const, operatorId: 'launcher' }));
    const executor = new TargetContextOperationExecutor(
      'definition-owner',
      terminal,
      undefined,
      query,
    );
    const targetContext = new RuntimeTargetContext();
    executor.execute(
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'source',
          sources: [{ kind: 'abilitySystemSource', owner: { kind: 'owner' } }],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        actionOwnerId: 'ability-entity:2',
        buffOwnerId: 'outer-buff-owner',
      },
    );
    expect(query).toHaveBeenCalledExactlyOnceWith('ability-entity:2');
    expect(targetContext.get('source')).toEqual([{ kind: 'operator', operatorId: 'launcher' }]);
  });
  it('SourceFinder 区分动作宿主与来源，只查一层并保留能力实体身份', () => {
    const query = vi.fn((id: string) =>
      id === 'ability-entity:2'
        ? { kind: 'abilityEntity' as const, instanceId: 1 }
        : { kind: 'operator' as const, operatorId: id },
    );
    const executor = new TargetContextOperationExecutor(
      'operator:root',
      terminal,
      undefined,
      query,
    );
    const targetContext = new RuntimeTargetContext();
    const context = {
      targetContext,
      blackboard: new ActionBlackboard(),
      buffOwnerId: 'operator:recipient',
      actionOwnerId: 'operator:recipient',
      buffSourceId: 'ability-entity:3',
      actionSourceId: 'ability-entity:2',
    };
    expect(
      executor.queryTargets({ kind: 'abilitySystemSource', owner: { kind: 'source' } }, context),
    ).toEqual([{ kind: 'abilityEntity', instanceId: 1 }]);
    expect(
      executor.queryTargets(
        { kind: 'abilitySystemSource', owner: { kind: 'inputTarget' } },
        context,
      ),
    ).toEqual([]);
    for (const owner of ['actionSource', 'actionOwner'] as const) {
      executor.execute(
        {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: owner,
            sources: [
              {
                kind: 'abilitySystemSource',
                owner: { kind: owner === 'actionSource' ? 'source' : 'owner' },
              },
            ],
          },
        },
        context,
      );
    }
    expect(targetContext.get('actionSource')).toEqual([{ kind: 'abilityEntity', instanceId: 1 }]);
    expect(targetContext.get('actionOwner')).toEqual([
      { kind: 'operator', operatorId: 'operator:recipient' },
    ]);
    expect(query.mock.calls).toEqual([
      ['ability-entity:2'],
      ['ability-entity:2'],
      ['operator:recipient'],
    ]);
    expect(context.buffSourceId).toBe('ability-entity:3');
    targetContext.set('mixedOwner', [
      { kind: 'spatialPoint', pointId: 1 },
      { kind: 'abilityEntity', instanceId: 2 },
      { kind: 'operator', operatorId: 'unrelated' },
    ]);
    expect(
      executor.queryTargets(
        { kind: 'abilitySystemSource', owner: { kind: 'context', key: 'mixedOwner' } },
        context,
      ),
    ).toEqual([{ kind: 'abilityEntity', instanceId: 1 }]);
    expect(query).toHaveBeenLastCalledWith('ability-entity:2');
  });

  it('未装配单层来源端口时明确失败，不能偷用递归解析器或原样返回', () => {
    const executor = new TargetContextOperationExecutor('operator', terminal);
    expect(() =>
      executor.execute(
        {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'source',
            sources: [{ kind: 'abilitySystemSource', owner: { kind: 'source' } }],
          },
        },
        {
          targetContext: new RuntimeTargetContext(),
          blackboard: new ActionBlackboard(),
          actionSourceId: 'operator',
        },
      ),
    ).toThrow('single-level AbilitySystem source query');
  });
  it('snapshots the controlled identity, then excludes it from lowest-health selection', () => {
    const ledgers = new Map([
      ['operator:main', vitals(100)],
      ['operator:z-lowest', vitals(500)],
      ['operator:a-near-tie', vitals(500.5)],
    ]);
    let controlledId = 'operator:main';
    const executor = new TargetContextOperationExecutor('operator:ember', terminal, {
      listOperatorIds: () => [...ledgers.keys()],
      isOperatorControlled: operatorId => operatorId === controlledId,
      resolveVitals: operatorId => ledgers.get(operatorId)!,
    });
    const targetContext = new RuntimeTargetContext();
    const context = { blackboard: new ActionBlackboard(), targetContext };

    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'Main',
          selection: { kind: 'controlledOperator' },
        },
      },
      context,
    );
    controlledId = 'operator:z-lowest';
    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'CureTarget',
          selection: {
            kind: 'lowestHealthRatioOperator',
            excludedContextKey: 'Main',
          },
        },
      },
      context,
    );

    expect(targetContext.get('Main')).toEqual([{ kind: 'operator', operatorId: 'operator:main' }]);
    // 0.001 内沿用文档化的稳定实例 ID 投影，不声称复现原生对象哈希。
    expect(targetContext.get('CureTarget')).toEqual([
      { kind: 'operator', operatorId: 'operator:a-near-tie' },
    ]);
    ledgers.get('operator:a-near-tie')!.heal(499.5);
    ledgers.get('operator:z-lowest')!.takeDamage(400);
    expect(targetContext.get('CureTarget')).toEqual([
      { kind: 'operator', operatorId: 'operator:a-near-tie' },
    ]);
  });

  it('overwrites a previous context group with an empty query result', () => {
    const targetContext = new RuntimeTargetContext();
    targetContext.set('Saved', [{ kind: 'operator', operatorId: 'operator:old' }]);
    const executor = new TargetContextOperationExecutor('operator', terminal, {
      listOperatorIds: () => [],
      isOperatorControlled: () => false,
      resolveVitals: () => {
        throw new Error('empty query must not resolve vitals');
      },
    });
    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'Saved',
          selection: { kind: 'lowestHealthRatioOperator' },
        },
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );
    expect(targetContext.get('Saved')).toEqual([]);
  });

  it('excludes the current skill caster before choosing the lowest-health teammate', () => {
    const ledgers = new Map([
      ['operator:catcher', vitals(100)],
      ['operator:ally', vitals(500)],
    ]);
    const targetContext = new RuntimeTargetContext();
    const executor = new TargetContextOperationExecutor('operator:catcher', terminal, {
      listOperatorIds: () => [...ledgers.keys()],
      isOperatorControlled: () => false,
      resolveVitals: operatorId => ledgers.get(operatorId)!,
    });

    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'Ally',
          selection: { kind: 'lowestHealthRatioOperator', excludeCaster: true },
        },
      },
      { blackboard: new ActionBlackboard(), targetContext },
    );

    expect(targetContext.get('Ally')).toEqual([{ kind: 'operator', operatorId: 'operator:ally' }]);
  });

  it('excludes the current forEach operator target before choosing the lowest-health teammate', () => {
    const ledgers = new Map([
      ['operator:main', vitals(100)],
      ['operator:ally', vitals(500)],
    ]);
    const targetContext = new RuntimeTargetContext();
    const executor = new TargetContextOperationExecutor('operator:aura-source', terminal, {
      listOperatorIds: () => [...ledgers.keys()],
      isOperatorControlled: operatorId => operatorId === 'operator:main',
      resolveVitals: operatorId => ledgers.get(operatorId)!,
    });
    executor.execute(
      {
        kind: 'findCharacterTeamTargets',
        parameters: {
          saveToContextKey: 'CureTarget',
          selection: { kind: 'lowestHealthRatioOperator', excludeCurrentTarget: true },
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        currentTarget: { kind: 'operator', operatorId: 'operator:main' },
      },
    );
    expect(targetContext.get('CureTarget')).toEqual([
      { kind: 'operator', operatorId: 'operator:ally' },
    ]);
  });

  it('读取 Buff 来源保留直接身份，不递归追溯为干员', () => {
    const executor = new TargetContextOperationExecutor('operator:holder', terminal);
    const targetContext = new RuntimeTargetContext();
    executor.execute(
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'seraph',
          sources: [{ kind: 'source' }],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        buffSourceId: 'ability-entity:7',
        actionSourceId: 'ability-entity:7',
      },
    );
    expect(targetContext.get('seraph')).toEqual([{ kind: 'abilityEntity', instanceId: 7 }]);
  });

  it('merges the current forEach target without re-resolving its identity', () => {
    const executor = new TargetContextOperationExecutor('operator:holder', terminal);
    const targetContext = new RuntimeTargetContext();
    executor.execute(
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'healTarget',
          sources: [{ kind: 'inputTarget' }],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        targetContext,
        currentTarget: { kind: 'operator', operatorId: 'operator:controlled' },
        actionInputTargets: singleTargetList({
          kind: 'operator',
          operatorId: 'operator:controlled',
        }),
      },
    );
    expect(targetContext.get('healTarget')).toEqual([
      { kind: 'operator', operatorId: 'operator:controlled' },
    ]);
  });

  it('initializes, merges and checks containment using resolved target groups', () => {
    const executor = new TargetContextOperationExecutor('operator', terminal);
    const targetContext = new RuntimeTargetContext();
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext,
      actionInputTargets: singleTargetList({ kind: 'enemy' as const, enemyId: 'enemy' }),
      event: {
        event: 'beforeTakeInfliction' as const,
        payload: {
          skillId: 'skill',
          isExtra: false,
          sourceId: 'operator',
          targetId: 'enemy',
          element: 'nature' as const,
        },
      },
    };

    expect(
      executor.evaluate(
        {
          kind: 'targetContains',
          parent: { kind: 'context', key: 'seen' },
          child: { kind: 'inputTarget' },
        },
        context,
      ),
    ).toBe(false);
    executor.execute(
      { kind: 'mergeContextTargets', parameters: { saveToContextKey: 'seen', sources: [] } },
      context,
    );
    expect(
      executor.evaluate(
        {
          kind: 'targetContains',
          parent: { kind: 'context', key: 'seen' },
          child: { kind: 'inputTarget' },
        },
        context,
      ),
    ).toBe(false);

    const merge = {
      kind: 'mergeContextTargets' as const,
      parameters: {
        saveToContextKey: 'seen',
        sources: [{ kind: 'inputTarget' as const }, { kind: 'context' as const, key: 'seen' }],
      },
    };
    executor.execute(merge, context);
    executor.execute(merge, context);
    expect(targetContext.get('seen')).toEqual([{ kind: 'enemy', enemyId: 'enemy' }]);
    const containsGroup = {
      kind: 'targetContains' as const,
      parent: { kind: 'context' as const, key: 'seen' },
      child: { kind: 'context' as const, key: 'children' },
    };
    expect(executor.evaluate(containsGroup, context)).toBe(true);
    targetContext.set('children', [
      { kind: 'enemy', enemyId: 'enemy' },
      { kind: 'operator', operatorId: 'operator' },
    ]);
    expect(executor.evaluate(containsGroup, context)).toBe(false);
    targetContext.set('children', [
      { kind: 'enemy', enemyId: 'enemy' },
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
    expect(executor.evaluate(containsGroup, context)).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'targetContains',
          parent: { kind: 'context', key: 'seen' },
          child: { kind: 'inputTarget' },
        },
        context,
      ),
    ).toBe(true);
  });
});

it('距离过滤每次读取阈值，空结果覆盖旧目标且缺少中心不当作零距离', () => {
  const executor = new TargetContextOperationExecutor(
    'caster',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      mainTarget: () => ({ kind: 'enemy', enemyId: 'enemy' }),
      ownerSpawned: () => [],
    },
  );
  const targetContext = new RuntimeTargetContext();
  targetContext.setSingle('center', { kind: 'enemy', enemyId: 'enemy' });
  const blackboard = new ActionBlackboard({ threshold: -1 });
  const query: CompiledTargetQuery = {
    kind: 'distanceFilter',
    targets: { kind: 'fixed', target: 'enemy' },
    center: { kind: 'context', key: 'center' },
    operator: 'greater',
    threshold: numberInput({ kind: 'blackboard', key: 'threshold' }),
    clampToXZ: true,
  };
  const step = {
    kind: 'findTargets' as const,
    parameters: {
      owner: { kind: 'owner' as const },
      query,
      saveToContextKey: 'result',
    },
  };
  const context = { blackboard, targetContext, actionOwnerId: 'enemy' };
  executor.execute(step, context);
  expect(targetContext.get('result')).toEqual([{ kind: 'enemy', enemyId: 'enemy' }]);
  blackboard.assignDynamicUnconditionally('threshold', 5);
  executor.execute(step, context);
  expect(targetContext.get('result')).toEqual([]);
  targetContext.set('mixedDistanceTargets', [
    { kind: 'enemy', enemyId: 'enemy' },
    { kind: 'spatialPoint', pointId: 1 },
  ]);
  expect(
    executor.queryTargets(
      {
        ...query,
        targets: { kind: 'context', key: 'mixedDistanceTargets' },
      },
      context,
    ),
  ).toEqual([{ kind: 'spatialPoint', pointId: 1 }]);
  blackboard.assignDynamicUnconditionally('threshold', -1);
  targetContext.set('center', []);
  executor.execute(step, context);
  expect(targetContext.get('result')).toEqual([]);
});

it('智能目标先选标签匹配者、否则回退；后处理排除不会重新选人', () => {
  const main: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy' };
  const extra: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:a' };
  let candidates: readonly RuntimeTargetRef[] = [extra];
  let fallback: RuntimeTargetRef | undefined = main;
  const executor = new TargetContextOperationExecutor(
    'caster',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      mainTarget: () => fallback,
      ownerSpawned: () => [],
      enemiesByTags: () => candidates,
      exclusionTarget: target => target,
    },
  );
  const context = {
    blackboard: new ActionBlackboard(),
    actionOwnerId: 'enemy:a',
    actionSourceId: 'caster',
  };
  const query: CompiledTargetQuery = {
    kind: 'smartTargetByTag',
    owner: { kind: 'source' },
    tags: ['Test/Target'],
    tagQueryType: 'hasAny',
  };
  expect(executor.queryTargets(query, context)).toEqual([extra]);
  expect(
    executor.queryTargets(
      { kind: 'exclude', targets: query, excludeTargets: { kind: 'owner' } },
      context,
    ),
  ).toEqual([]);
  expect(executor.queryTargets({ kind: 'battleMainTarget' }, context)).toEqual([main]);
  candidates = [];
  expect(executor.queryTargets(query, context)).toEqual([main]);
  fallback = extra;
  expect(executor.queryTargets({ kind: 'battleMainTarget' }, context)).toEqual([extra]);
  fallback = undefined;
  expect(executor.queryTargets({ kind: 'battleMainTarget' }, context)).toEqual([]);
  expect(executor.queryTargets(query, context)).toEqual([]);
});

it('范围查询缺少中心时保留旧组，保存的位置中心允许在没有实体目标时继续查找', () => {
  const executor = new TargetContextOperationExecutor('caster', terminal);
  const targetContext = new RuntimeTargetContext();
  targetContext.set('result', [{ kind: 'enemy', enemyId: 'enemy:old' }]);
  const context = { blackboard: new ActionBlackboard(), targetContext, actionOwnerId: 'caster' };
  const step = {
    kind: 'findTargets',
    parameters: {
      owner: { kind: 'owner' },
      center: { kind: 'context', key: 'center' },
      query: { kind: 'context', key: 'candidates' },
      saveToContextKey: 'result',
    },
  } as const;
  expect(executor.execute(step, context)).toBe(false);
  expect(targetContext.get('result')).toEqual([{ kind: 'enemy', enemyId: 'enemy:old' }]);
  targetContext.set('center', [{ kind: 'spatialPoint', pointId: 1 }]);
  targetContext.set('candidates', [{ kind: 'enemy', enemyId: 'enemy:new' }]);
  expect(executor.execute(step, context)).toBe(true);
  expect(targetContext.get('result')).toEqual([{ kind: 'enemy', enemyId: 'enemy:new' }]);
  targetContext.set('candidates', []);
  expect(executor.execute(step, context)).toBe(true);
  expect(targetContext.get('result')).toEqual([]);
});

it('瞄准 Finder 只复制已选列表，不重新查找敌人或回退主目标', () => {
  const selected: RuntimeTargetRef[] = [];
  const mainTarget = vi.fn(() => ({ kind: 'enemy' as const, enemyId: 'enemy' }));
  const enemiesByTags = vi.fn(() => [{ kind: 'enemy' as const, enemyId: 'enemy:unselected' }]);
  const executor = new TargetContextOperationExecutor(
    'caster',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      mainTarget,
      ownerSpawned: () => [],
      enemiesByTags,
      typhoeaArcherySelected: () => selected,
    },
  );
  const context = { blackboard: new ActionBlackboard() };
  expect(executor.queryTargets({ kind: 'typhoeaArcherySelected' }, context)).toEqual([]);
  selected.push({ kind: 'enemy', enemyId: 'enemy:second' });
  const result = executor.queryTargets({ kind: 'typhoeaArcherySelected' }, context);
  expect(result).toEqual(selected);
  expect(result).not.toBe(selected);
  selected.length = 0;
  expect(result).toHaveLength(1);
  expect(executor.queryTargets({ kind: 'typhoeaArcherySelected' }, context)).toEqual([]);
  expect(mainTarget).not.toHaveBeenCalled();
  expect(enemiesByTags).not.toHaveBeenCalled();
});

it('按 Buff 智能选敌动态读取次要敌人，失去标记后才回退主目标', () => {
  const main: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy' };
  const secondary: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:b' };
  let marked = true;
  let fallback: RuntimeTargetRef | undefined = main;
  const executor = new TargetContextOperationExecutor(
    'caster',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      mainTarget: () => fallback,
      ownerSpawned: () => [],
      enemiesByTags: () => [main, secondary],
      hasMatchingBuff: (target, lookup) =>
        marked && target === secondary && lookup.kind === 'id' && lookup.buffIds.includes('mark'),
    },
  );
  const query: CompiledTargetQuery = {
    kind: 'smartTargetByBuff',
    owner: { kind: 'source' },
    buffIds: ['mark'],
  };
  const context = { blackboard: new ActionBlackboard(), actionSourceId: 'caster' };
  expect(executor.queryTargets(query, context)).toEqual([secondary]);
  marked = false;
  expect(executor.queryTargets(query, context)).toEqual([main]);
  fallback = undefined;
  expect(executor.queryTargets(query, context)).toEqual([]);
});

it('距离写入动态解析双方目标，空组保留旧值且不截断后续动作', () => {
  const executor = new TargetContextOperationExecutor('caster', {
    execute: () => true,
    evaluate: () => true,
  });
  const targetContext = new RuntimeTargetContext();
  const blackboard = new ActionBlackboard();
  const context = { targetContext, blackboard };
  const step = {
    kind: 'saveTargetDistance',
    parameters: {
      source: { kind: 'context', key: 'source' },
      target: { kind: 'context', key: 'target' },
      outputKey: 'distance',
    },
  } as const;
  for (const missing of ['source', 'target']) {
    blackboard.assign({ distance: 7 });
    targetContext.set('source', [{ kind: 'operator', operatorId: 'caster' }]);
    targetContext.set('target', [{ kind: 'enemy', enemyId: 'enemy:second' }]);
    targetContext.set(missing, []);
    expect(executor.execute(step, context)).toBe(true);
    expect(blackboard.getValue('distance')).toBe(7);
  }
  targetContext.set('source', [{ kind: 'spatialPoint', pointId: 3 }]);
  targetContext.set('target', [{ kind: 'enemy', enemyId: 'enemy:second' }]);
  expect(executor.execute(step, context)).toBe(true);
  expect(blackboard.getValue('distance')).toBe(7);
  targetContext.set('source', [
    { kind: 'spatialPoint', pointId: 3 },
    { kind: 'operator', operatorId: 'caster' },
  ]);
  expect(executor.execute(step, context)).toBe(true);
  expect(blackboard.getValue('distance')).toBe(0);
  blackboard.assign({ distance: 9 });
  targetContext.set('target', []);
  expect(executor.execute(step, context)).toBe(true);
  expect(blackboard.getValue('distance')).toBe(9);
});

it('部位 Buff 来源查询保留普通查询身份，只按显式包装解析本体', () => {
  const part: RuntimeTargetRef = { kind: 'abilityEntity', instanceId: 7 };
  const main: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:second' };
  const targetContext = new RuntimeTargetContext();
  targetContext.set('hit', [part, main]);
  const executor = new TargetContextOperationExecutor(
    'caster',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      mainTarget: () => main,
      ownerSpawned: () => [],
      partBuffSource: target =>
        target.kind === 'abilityEntity' && target.instanceId === 7 ? main : target,
    },
  );
  const context = { blackboard: new ActionBlackboard(), targetContext };
  expect(executor.queryTargets({ kind: 'context', key: 'hit' }, context)).toEqual([part, main]);
  expect(
    executor.queryTargets(
      { kind: 'partBuffSource', targets: { kind: 'context', key: 'hit' } },
      context,
    ),
  ).toEqual([main, main]);
  targetContext.set('hit', []);
  expect(
    executor.queryTargets(
      { kind: 'partBuffSource', targets: { kind: 'context', key: 'hit' } },
      context,
    ),
  ).toEqual([]);
});

it('PushBack 保留来源存活、首实体和原始目标表规则，并按原生顺序短路查询', () => {
  const alive: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:alive' };
  const dead: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:dead' };
  const missing: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:missing' };
  const point: RuntimeTargetRef = { kind: 'spatialPoint', pointId: 1 };
  const executor = new TargetContextOperationExecutor(
    'caster',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      mainTarget: () => alive,
      ownerSpawned: () => [],
      entityLifeState: target =>
        target.kind !== 'enemy'
          ? undefined
          : target.enemyId === 'enemy:alive'
            ? 'alive'
            : target.enemyId === 'enemy:dead'
              ? 'dead'
              : undefined,
    },
  );
  const targetContext = new RuntimeTargetContext();
  const context = { blackboard: new ActionBlackboard(), targetContext };
  const step = {
    kind: 'pushBack',
    parameters: {
      source: { kind: 'context', key: 'source' },
      targets: { kind: 'context', key: 'targets' },
      sourcePoint: { kind: 'context', key: 'origin' },
    },
  } as const;
  const query = vi.spyOn(executor, 'queryTargets');
  for (const source of [[], [point], [dead, alive], [missing, alive]]) {
    targetContext.set('source', source);
    query.mockClear();
    expect(executor.execute(step, context)).toBe(false);
    expect(query.mock.calls.map(([input]) => input)).toEqual([step.parameters.source]);
  }
  targetContext.set('source', [point, alive]);
  targetContext.set('targets', []);
  query.mockClear();
  expect(executor.execute(step, context)).toBe(false);
  expect(query.mock.calls.map(([input]) => input)).toEqual([
    step.parameters.source,
    step.parameters.targets,
  ]);
  // 非空表即成功，即使候选无法产生位移、来源点为空；不要求存在活敌人。
  for (const targets of [[point], [missing], [dead], [alive, dead]]) {
    targetContext.set('targets', targets);
    query.mockClear();
    expect(executor.execute(step, context)).toBe(true);
    expect(query.mock.calls.map(([input]) => input)).toEqual([
      step.parameters.source,
      step.parameters.targets,
      step.parameters.sourcePoint,
    ]);
  }
});

it('Pull 处理全部匹配目标，目的地可取后项；不按主目标或生命状态替代查询', () => {
  const first: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:first' };
  const second: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:second' };
  const missing: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:unspawned' };
  const operator: RuntimeTargetRef = { kind: 'operator', operatorId: 'caster' };
  const point: RuntimeTargetRef = { kind: 'spatialPoint', pointId: 1 };
  const processPullTarget = vi.fn((_target: RuntimeTargetRef) => true);
  const executor = new TargetContextOperationExecutor(
    'caster',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      mainTarget: () => first,
      ownerSpawned: () => [],
      hasPosition: target => target.kind !== 'enemy' || target.enemyId !== 'enemy:unspawned',
      processPullTarget,
    },
  );
  const targetContext = new RuntimeTargetContext();
  const context = { blackboard: new ActionBlackboard(), targetContext };
  const step = {
    kind: 'pull',
    parameters: {
      targets: { kind: 'context', key: 'targets' },
      destination: { kind: 'context', key: 'destination' },
      targetType: 'Enemy',
      alwaysNext: false,
    },
  } as const;
  targetContext.set('targets', [missing, first, second, operator]);
  targetContext.set('destination', [missing, point]);
  expect(executor.execute(step, context)).toBe(true);
  expect(processPullTarget.mock.calls).toEqual([[first], [second]]);
  processPullTarget.mockClear();
  expect(
    executor.execute(
      { ...step, parameters: { ...step.parameters, targetType: 'Character' } },
      context,
    ),
  ).toBe(true);
  expect(processPullTarget.mock.calls).toEqual([[operator]]);

  for (const alwaysNext of [false, true]) {
    processPullTarget.mockClear();
    targetContext.set('destination', [missing]);
    expect(
      executor.execute({ ...step, parameters: { ...step.parameters, alwaysNext } }, context),
    ).toBe(alwaysNext);
    expect(processPullTarget).not.toHaveBeenCalled();
    targetContext.set('destination', [point]);
    processPullTarget.mockReturnValue(false);
    expect(
      executor.execute({ ...step, parameters: { ...step.parameters, alwaysNext } }, context),
    ).toBe(alwaysNext);
  }
});

it('BlowOffEnemy OnlyDead 不处理目标但保留来源和空表返回', () => {
  const alive: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:alive' };
  const dead: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:dead' };
  const missing: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:missing' };
  const point: RuntimeTargetRef = { kind: 'spatialPoint', pointId: 1 };
  const executor = new TargetContextOperationExecutor(
    'caster',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      mainTarget: () => alive,
      ownerSpawned: () => [],
      entityLifeState: target =>
        target.kind !== 'enemy'
          ? undefined
          : target.enemyId === 'enemy:alive'
            ? 'alive'
            : target.enemyId === 'enemy:dead'
              ? 'dead'
              : undefined,
    },
  );
  const targetContext = new RuntimeTargetContext();
  const context = { blackboard: new ActionBlackboard(), targetContext };
  const step = {
    kind: 'blowOffEnemy',
    parameters: {
      source: { kind: 'context', key: 'source' },
      targets: { kind: 'context', key: 'targets' },
      deadOption: 'OnlyDead',
    },
  } as const;
  const query = vi.spyOn(executor, 'queryTargets');
  for (const source of [[], [point], [dead, alive], [missing, alive]]) {
    targetContext.set('source', source);
    query.mockClear();
    expect(executor.execute(step, context)).toBe(false);
    expect(query.mock.calls.map(([input]) => input)).toEqual([step.parameters.source]);
  }
  targetContext.set('source', [point, alive]);
  targetContext.set('targets', []);
  query.mockClear();
  expect(executor.execute(step, context)).toBe(false);
  expect(query.mock.calls.map(([input]) => input)).toEqual([
    step.parameters.source,
    step.parameters.targets,
  ]);
  // 非空表即成功，即使候选无法产生位移、来源点为空；不要求存在活敌人。
  for (const targets of [[point], [missing], [dead], [alive, dead]]) {
    targetContext.set('targets', targets);
    query.mockClear();
    expect(executor.execute(step, context)).toBe(true);
    expect(query.mock.calls.map(([input]) => input)).toEqual([
      step.parameters.source,
      step.parameters.targets,
    ]);
  }
});

it('默认敌方查询读取当前主目标，来源句柄不随主目标切换，空目录不补造敌人', () => {
  let selected: RuntimeTargetRef | undefined = { kind: 'enemy', enemyId: 'enemy:second' };
  const executor = new TargetContextOperationExecutor(
    'caster',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      mainTarget: () => selected,
      ownerSpawned: () => [],
    },
  );
  const query = { kind: 'fixed', target: 'enemy' } as const;
  const context = { blackboard: new ActionBlackboard(), actionSourceId: 'enemy:first' };
  expect(resolveDirectActionTargets(query, context)).toBeUndefined();
  expect(executor.queryTargets(query, context)).toEqual([selected]);
  selected = { kind: 'enemy', enemyId: 'enemy:third' };
  expect(executor.queryTargets(query, context)).toEqual([selected]);
  expect(executor.queryTargets({ kind: 'source' }, context)).toEqual([
    { kind: 'enemy', enemyId: 'enemy:first' },
  ]);
  selected = undefined;
  expect(executor.queryTargets(query, context)).toEqual([]);
});
