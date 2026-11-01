import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import {
  EnemyRankConditionExecutor,
  EnemySuperArmorConditionExecutor,
} from './targetConditionExecutors';

const delegate = {
  execute: vi.fn(() => false),
  evaluate: vi.fn(() => false),
};

describe('EnemySuperArmorConditionExecutor', () => {
  it('compares the captured enemy value with a dynamic action operand', () => {
    const executor = new EnemySuperArmorConditionExecutor(
      () => 30,
      delegate,
      () => [
        { kind: 'spatialPoint', pointId: 1 },
        { kind: 'enemy', enemyId: 'enemy' },
      ],
    );

    expect(
      executor.evaluate(
        {
          kind: 'enemySuperArmorCompare',
          target: { kind: 'inputTarget' },
          operator: 'greaterOrEqual',
          value: numberInput({ kind: 'blackboard', key: 'limit' }),
        },
        { blackboard: new ActionBlackboard({ limit: 30 }) },
      ),
    ).toBe(true);
  });

  it('requires the skill action blackboard for operand resolution', () => {
    const executor = new EnemySuperArmorConditionExecutor(
      () => 30,
      delegate,
      () => [],
    );

    expect(() =>
      executor.evaluate({
        kind: 'enemySuperArmorCompare',
        target: { kind: 'inputTarget' },
        operator: 'equal',
        value: { kind: 'constant', value: 30 },
      }),
    ).toThrow('enemySuperArmorCompare requires a combat operation context');
    expect(
      executor.evaluate(
        {
          kind: 'enemySuperArmorCompare',
          target: { kind: 'inputTarget' },
          operator: 'equal',
          value: numberInput({ kind: 'blackboard', key: 'missing' }),
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(false);
  });
});

it('目标切换时按实例读取阶级与超级护甲，未知敌人不借用主敌人的属性', () => {
  let target: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy' };
  const query = (): RuntimeTargetRef[] => [{ kind: 'spatialPoint', pointId: 1 }, target];
  const armor = new EnemySuperArmorConditionExecutor(
    value =>
      value.kind !== 'enemy'
        ? undefined
        : value.enemyId === 'enemy'
          ? 30
          : value.enemyId === 'enemy:boss'
            ? 90
            : undefined,
    delegate,
    query,
  );
  const rank = new EnemyRankConditionExecutor(
    value =>
      value.kind !== 'enemy'
        ? undefined
        : value.enemyId === 'enemy'
          ? 'mob'
          : value.enemyId === 'enemy:boss'
            ? 'boss'
            : undefined,
    armor,
    query,
  );
  const context = { blackboard: new ActionBlackboard() };
  const evaluate = () => [
    rank.evaluate(
      { kind: 'enemyRankIn', target: { kind: 'inputTarget' }, ranks: ['boss'] },
      context,
    ),
    rank.evaluate(
      {
        kind: 'enemySuperArmorCompare',
        target: { kind: 'inputTarget' },
        operator: 'greaterOrEqual',
        value: { kind: 'constant', value: 60 },
      },
      context,
    ),
  ];
  expect(evaluate()).toEqual([false, false]);
  target = { kind: 'enemy', enemyId: 'enemy:boss' };
  expect(evaluate()).toEqual([true, true]);
  target = { kind: 'enemy', enemyId: 'enemy:unknown' };
  expect(evaluate()).toEqual([false, false]);
  target = { kind: 'enemy', enemyId: 'enemy' };
  expect(evaluate()).toEqual([false, false]);
});
