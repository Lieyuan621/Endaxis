import { describe, expect, it, vi } from 'vitest';
import { OperatorControlConditionExecutor } from './operatorControlConditionExecutor';

describe('OperatorControlConditionExecutor', () => {
  it.each([true, false])('evaluates the caster control state as %s', controlled => {
    const executor = new OperatorControlConditionExecutor({
      isCasterControlled: () => controlled,
      delegate: { execute: () => false, evaluate: () => false },
    });

    expect(executor.evaluate({ kind: 'casterControlled' })).toBe(controlled);
  });

  it('delegates unrelated conditions', () => {
    const evaluate = vi.fn(() => true);
    const executor = new OperatorControlConditionExecutor({
      isCasterControlled: () => false,
      delegate: { execute: () => false, evaluate },
    });

    expect(executor.evaluate({ kind: 'combatActive' })).toBe(true);
    expect(evaluate).toHaveBeenCalledWith({ kind: 'combatActive' });
  });
});
