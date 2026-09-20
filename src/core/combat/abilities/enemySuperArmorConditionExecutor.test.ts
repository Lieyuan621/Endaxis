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
          value: { kind: 'blackboard', key: 'limit' },
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

  it('delegates unrelated conditions and operation lifecycle', () => {
    const end = vi.fn();
    const localDelegate = { ...delegate, end };
    const executor = new EnemySuperArmorConditionExecutor(30, localDelegate);
    const condition = { kind: 'combatActive' } as const;
    const context = { blackboard: new ActionBlackboard() };
    const step = { kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'frame' } } as const;

    executor.evaluate(condition, context);
    executor.execute(step, context);
    executor.end(step, context);

    expect(localDelegate.evaluate).toHaveBeenCalledWith(condition, context);
    expect(localDelegate.execute).toHaveBeenCalledWith(step, context);
    expect(end).toHaveBeenCalledWith(step, context);
  });
});
