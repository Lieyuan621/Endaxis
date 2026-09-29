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
});
