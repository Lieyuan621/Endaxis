import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { TargetContextOperationExecutor } from '../abilities/targetContextOperationExecutor';
import { BuffOperationExecutor } from '../buffs/buffOperationExecutor';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { GameplayTagRegistry } from '../tags/gameplayTags';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { validateSkillDefinition } from '../../game-data/validateSkillDefinition';

const terminal = {
  execute: () => false,
  evaluate: () => {
    throw new Error('unsupported');
  },
};

it('目标查询重建执行器及恢复切面后继续使用已保存的空间点身份序列', () => {
  const state = { nextSpatialPointId: 1 };
  const create = (host: typeof state) =>
    new TargetContextOperationExecutor(
      'owner',
      terminal,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      host,
    );
  const context = { blackboard: new ActionBlackboard(), targetContext: new RuntimeTargetContext() };
  const action = {
    kind: 'createSpatialPointTargets',
    parameters: { count: { kind: 'constant', value: 1 }, saveToContextKey: 'points' },
  } as const;
  create(state).execute(action, context);
  const saved = structuredClone(state);
  create(state).execute(action, context);
  const continuous = context.targetContext.get('points');
  create(structuredClone(saved)).execute(action, context);
  expect(context.targetContext.get('points')).toEqual(continuous);
  expect(continuous).toEqual([{ kind: 'spatialPoint', pointId: 2 }]);
});
describe('Context 条件查询', () => {
  it('以同一命名 Context 比较 trigger 与主控、ActionSource 身份', () => {
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
      actionSourceId: 'source',
    };
    context.targetContext.setSingle('trigger', { kind: 'operator', operatorId: 'source' });
    const executor = new TargetContextOperationExecutor('owner', terminal, id => id, {
      listOperatorIds: () => ['source'],
      isOperatorControlled: id => id === 'source',
      resolveVitals: () => {
        throw new Error('identity queries must not read vitals');
      },
    });
    expect(
      executor.evaluate(
        {
          kind: 'targetsEqual',
          first: { kind: 'context', key: 'trigger' },
          second: { kind: 'mainCharacter' },
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'targetsEqual',
          first: { kind: 'context', key: 'trigger' },
          second: { kind: 'source' },
        },
        context,
      ),
    ).toBe(true);
    const controlled = { kind: 'operator', operatorId: 'source' } as const;
    const enemy = { kind: 'enemy' } as const;
    for (const [targets, allMatch] of [
      [[], false],
      [[controlled], true],
      [[controlled, enemy], false],
      [[enemy, controlled], false],
    ] as const) {
      context.targetContext.set('trigger', targets);
      const condition = {
        kind: 'targetsEqual',
        first: { kind: 'context', key: 'trigger' },
        second: { kind: 'mainCharacter' },
      } as const;
      expect(executor.evaluate(condition, context)).toBe(allMatch);
    }
  });

  it('目标相等要求双向包含，空组只与空组相等', () => {
    const targetContext = new RuntimeTargetContext();
    const executor = new TargetContextOperationExecutor('owner', terminal);
    const context = { blackboard: new ActionBlackboard(), targetContext, actionSourceId: 'source' };
    const condition = {
      kind: 'targetsEqual',
      first: { kind: 'context', key: 'targets' },
      second: { kind: 'source' },
    } as const;
    const source = { kind: 'operator', operatorId: 'source' } as const;
    for (const [targets, expected] of [
      [[], false],
      [[source], true],
      [[source, source], true],
      [[source, { kind: 'enemy' }], false],
      [[{ kind: 'enemy' }, source], false],
    ] as const) {
      targetContext.set('targets', targets);
      expect(executor.evaluate(condition, context)).toBe(expected);
    }
    expect(executor.evaluate(condition, { blackboard: context.blackboard, targetContext })).toBe(
      false,
    );
    targetContext.set('targets', []);
    expect(executor.evaluate(condition, { blackboard: context.blackboard, targetContext })).toBe(
      true,
    );
  });

  it.each([
    [['enemy'], { kind: 'enemy' }, true],
    [['enemy'], { kind: 'operator', operatorId: 'ally' }, false],
    [['character'], { kind: 'operator', operatorId: 'ally' }, true],
    [['abilityEntity'], { kind: 'abilityEntity', instanceId: 1 }, true],
    [[], { kind: 'enemy' }, false],
    ['all', { kind: 'enemy' }, true],
  ] as const)('mask=%s 查询 %j → %s', (mask, target, expected) => {
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    context.targetContext.setSingle('trigger', target as RuntimeTargetRef);
    expect(
      new TargetContextOperationExecutor(
        'owner',
        terminal,
        undefined,
        undefined,
        undefined,
        () => 'abilityEntity',
      ).evaluate(
        {
          kind: 'targetObjectTypeMatch',
          target: { kind: 'context' as const, key: 'trigger' },
          objectTypes: mask,
        },
        context,
      ),
    ).toBe(expected);
  });
  it('对象类型检查是任一对象匹配；缺失/空组不凭木桩假设补敌人', () => {
    const executor = new TargetContextOperationExecutor('owner', terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    const condition = {
      kind: 'targetObjectTypeMatch' as const,
      target: { kind: 'context' as const, key: 'trigger' },
      objectTypes: ['enemy'] as const,
    };
    expect(executor.evaluate(condition, context)).toBe(false);
    context.targetContext.set('trigger', []);
    expect(executor.evaluate(condition, context)).toBe(false);
    context.targetContext.set('trigger', [
      { kind: 'operator', operatorId: 'ally' },
      { kind: 'enemy' },
    ]);
    expect(executor.evaluate(condition, context)).toBe(true);
  });
  it('ByTag 只读取首目标增强层数；空组不求值缺失阈值，非空组严格读取黑板', () => {
    const path = 'test/tag';
    const tag = path;
    const buffs = new CombatBuffContainer(
      'ally',
      new CombatAttributeSet(),
      new GameplayTagRegistry([path]),
    );
    for (let i = 0; i < 3; i++)
      buffs.add({ id: 'buff', stackingType: 'enhance', applyTags: [tag] }, 'owner');
    const resolve = vi.fn((id: string) => {
      expect(id).toBe('ally');
      return buffs;
    });
    const executor = new BuffOperationExecutor({
      sourceId: 'owner',
      resolveTarget: () => buffs,
      resolveEventTarget: resolve,
      delegate: terminal,
      queryTargets: (query, context) =>
        new TargetContextOperationExecutor('owner', terminal).queryTargets(query, context),
    });
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    const condition = {
      kind: 'buffStackCompare' as const,
      compareZeroWhenTargetMissing: false,
      target: { kind: 'context' as const, key: 'trigger' },
      tagQueryType: 'hasAny' as const,
      buffTags: [tag],
      operator: 'equal' as const,
      value: numberInput({ kind: 'blackboard' as const, key: 'threshold' }),
    };
    expect(executor.evaluate(condition, context)).toBe(false);
    expect(resolve).not.toHaveBeenCalled();
    expect(() =>
      executor.evaluate({ ...condition, compareZeroWhenTargetMissing: true }, context),
    ).toThrow('threshold');
    expect(
      executor.evaluate(
        { ...condition, compareZeroWhenTargetMissing: true, value: { kind: 'constant', value: 0 } },
        context,
      ),
    ).toBe(true);
    context.targetContext.set('trigger', [
      { kind: 'operator', operatorId: 'ally' },
      { kind: 'enemy' },
    ]);
    expect(() => executor.evaluate(condition, context)).toThrow('threshold');
    context.blackboard.assign({ threshold: 3 });
    expect(executor.evaluate(condition, context)).toBe(true);
    context.blackboard.assign({ threshold: 1 });
    expect(executor.evaluate(condition, context)).toBe(false);
    buffs.finishByIds(['buff'], 'other');
    context.blackboard.assign({ threshold: 0 });
    expect(executor.evaluate(condition, context)).toBe(true);
  });
  it('Advanced(Id) 复用同一 Buff 容器并按 ID 汇总首目标增强层数', () => {
    const buffs = new CombatBuffContainer(
      'ally',
      new CombatAttributeSet(),
      new GameplayTagRegistry([]),
    );
    buffs.add({ id: 'buff-a', stackingType: 'enhance', applyTags: [] }, 'owner');
    buffs.add({ id: 'buff-a', stackingType: 'enhance', applyTags: [] }, 'owner');
    buffs.add({ id: 'buff-b', stackingType: 'enhance', applyTags: [] }, 'owner');
    const executor = new BuffOperationExecutor({
      sourceId: 'owner',
      resolveTarget: () => buffs,
      resolveEventTarget: id => {
        expect(id).toBe('ally');
        return buffs;
      },
      delegate: terminal,
      queryTargets: (query, context) =>
        new TargetContextOperationExecutor('owner', terminal).queryTargets(query, context),
    });
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    const condition = {
      kind: 'buffIdStackCompare' as const,
      compareZeroWhenTargetMissing: true,
      target: { kind: 'context' as const, key: 'trigger' },
      buffIds: ['buff-a'],
      operator: 'equal' as const,
      value: { kind: 'constant' as const, value: 2 },
    };
    expect(executor.evaluate(condition, context)).toBe(false);
    expect(
      executor.evaluate({ ...condition, value: { kind: 'constant', value: 0 } }, context),
    ).toBe(true);
    context.targetContext.setSingle('trigger', { kind: 'operator', operatorId: 'ally' });
    expect(executor.evaluate(condition, context)).toBe(true);
    expect(
      executor.evaluate(
        { ...condition, buffIds: ['buff-a', 'buff-b'], value: { kind: 'constant', value: 3 } },
        context,
      ),
    ).toBe(true);
  });
  it.each([16, '16', ['64'], ['unknown'], null])('正式定义拒绝非法 mask %j', objectTypes => {
    expect(
      validateSkillDefinition({
        key: 'test',
        timelineBlockFrames: 1,
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'conditional',
                  parameters: {
                    condition: {
                      kind: 'targetObjectTypeMatch',
                      target: { kind: 'context' as const, key: 'trigger' },
                      objectTypes,
                    },
                  },
                  whenTrue: { steps: [] },
                },
              ],
            },
          },
        ],
      }),
    ).not.toEqual([]);
  });
});

it('复制Context保留重复目标及顺序，独立保存输出，空来源覆盖旧组', () => {
  const targets = new RuntimeTargetContext();
  targets.set('source', [
    { kind: 'enemy' },
    { kind: 'enemy' },
    { kind: 'operator', operatorId: 'a' },
  ]);
  const executor = new TargetContextOperationExecutor('a', terminal);
  const action = {
    kind: 'copyContextTargets',
    parameters: { source: { kind: 'context', key: 'source' }, saveToContextKey: 'copy' },
  } as const;
  const context = { blackboard: new ActionBlackboard(), targetContext: targets };
  expect(executor.execute(action, context)).toBe(true);
  expect(targets.get('copy')).toEqual(targets.get('source'));
  expect(targets.get('copy')).not.toBe(targets.get('source'));
  targets.remove('source');
  expect(targets.get('copy')).toHaveLength(3);
  expect(executor.execute(action, context)).toBe(true);
  expect(targets.get('copy')).toEqual([]);
});

it('实体计数排除位置点、保留重复项，仅比较成功后写回已有变量', () => {
  const executor = new TargetContextOperationExecutor(
    'owner',
    terminal,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      entityLifeState: () => 'alive',
      mainTarget: () => undefined,
      ownerSpawned: () => [],
    },
  );
  const targetContext = new RuntimeTargetContext();
  targetContext.set('targets', [
    { kind: 'enemy' },
    { kind: 'spatialPoint', pointId: 1 },
    { kind: 'enemy' },
  ]);
  const blackboard = new ActionBlackboard({ count: 9 });
  const condition = {
    kind: 'entityCountCompare',
    target: { kind: 'context', key: 'targets' },
    containsHittableTarget: false,
    excludeDeadEntity: false,
    operator: 'equal',
    value: 2,
    outputKey: 'count',
  } as const;
  expect(executor.evaluate({ ...condition, value: 3 }, { blackboard, targetContext })).toBe(false);
  expect(blackboard.getNumber('count')).toBe(9);
  expect(executor.evaluate(condition, { blackboard, targetContext })).toBe(true);
  expect(blackboard.getNumber('count')).toBe(2);
  // 原生 float32 差值超过容差；不能再用双精度差值跳过已经决定的写入。
  const nearBoundary = new ActionBlackboard({ count: 2.00000999 });
  expect(executor.evaluate(condition, { blackboard: nearBoundary, targetContext })).toBe(true);
  expect(nearBoundary.getNumber('count')).toBe(2);
  targetContext.remove('targets');
  expect(executor.evaluate({ ...condition, value: 0 }, { blackboard, targetContext })).toBe(true);
  expect(blackboard.getNumber('count')).toBe(0);
  expect(() =>
    executor.evaluate(
      { ...condition, value: 0, outputKey: 'missing' },
      { blackboard, targetContext },
    ),
  ).toThrow("action blackboard value 'missing' is missing");
});
