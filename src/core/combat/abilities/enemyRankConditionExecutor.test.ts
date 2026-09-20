import { describe, expect, it, vi } from 'vitest';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { EnemyRankConditionExecutor } from './targetConditionExecutors';

describe('EnemyRankConditionExecutor', () => {
  it('matches only the captured native enemy rank', () => {
    const delegate: CombatOperationExecutor = {
      execute: vi.fn(() => true),
      evaluate: vi.fn(() => false),
    };
    const executor = new EnemyRankConditionExecutor('elite', delegate);

    expect(executor.evaluate({ kind: 'enemyRankIn', ranks: ['elite', 'boss'] })).toBe(true);
    expect(executor.evaluate({ kind: 'enemyRankIn', ranks: ['mob'] })).toBe(false);
    expect(delegate.evaluate).not.toHaveBeenCalled();
  });

  it('delegates unrelated conditions', () => {
    const context = { blackboard: {} } as Parameters<CombatOperationExecutor['evaluate']>[1];
    const delegate: CombatOperationExecutor = {
      execute: vi.fn(() => true),
      evaluate: vi.fn(() => true),
    };
    const executor = new EnemyRankConditionExecutor('boss', delegate);
    const condition = { kind: 'combatActive' } as const;

    expect(executor.evaluate(condition, context)).toBe(true);
    expect(delegate.evaluate).toHaveBeenCalledWith(condition, context);
  });

  it('forwards operation lifecycle end to the wrapped executor', () => {
    const end = vi.fn();
    const delegate: CombatOperationExecutor = {
      execute: vi.fn(() => true),
      end,
      evaluate: vi.fn(() => true),
    };
    const executor = new EnemyRankConditionExecutor('boss', delegate);
    const step = {
      kind: 'startUltimateTimeDilation',
      parameters: {
        priority: 100,
        targetScale: { kind: 'constant', value: 0 },
        ignoredTargets: [],
      },
    } as const;

    executor.end(step);

    expect(end).toHaveBeenCalledWith(step, undefined);
  });
});
