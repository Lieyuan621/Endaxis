import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { EnemySuperArmorConditionExecutor } from './targetConditionExecutors';

const delegate = {
  execute: vi.fn(() => false),
  evaluate: vi.fn(() => false),
};

describe('EnemySuperArmorConditionExecutor', () => {
  it('compares the captured enemy value with a dynamic action operand', () => {
    const executor = new EnemySuperArmorConditionExecutor(30, delegate);

    expect(
      executor.evaluate(
        {
          kind: 'enemySuperArmorCompare',
          operator: 'greaterOrEqual',
          value: numberInput({ kind: 'blackboard', key: 'limit' }),
        },
        { blackboard: new ActionBlackboard({ limit: 30 }) },
      ),
    ).toBe(true);
  });

  it('requires the skill action blackboard for operand resolution', () => {
    const executor = new EnemySuperArmorConditionExecutor(30, delegate);

    expect(() =>
      executor.evaluate({
        kind: 'enemySuperArmorCompare',
        operator: 'equal',
        value: { kind: 'constant', value: 30 },
      }),
    ).toThrow('enemySuperArmorCompare requires a combat operation context');
  });
});
