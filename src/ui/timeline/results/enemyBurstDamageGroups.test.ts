import { describe, expect, it } from 'vitest';
import { groupEnemyBurstDamageHits, selectEnemyBurstDamageEntries } from './enemyBurstDamageGroups';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
const hit = (
  sequence: number,
  frame = 10,
  sourceId = 'a',
  targetId = 'enemy',
): CombatReceiptEntry => ({
  sequence,
  frame,
  time: frame / 30,
  event: 'DamageApplied',
  sourceId,
  targetId,
  data: { spellBurstType: 'Pulse', value: sequence, sourceActionId: `cast:${sourceId}` },
});
describe('enemy burst damage shared hit entries', () => {
  it('shares the point but preserves separate sources, amounts, and receipt identity', () => {
    const a = hit(0),
      b = hit(1, 10, 'b');
    expect(groupEnemyBurstDamageHits([a, b])).toEqual([[a, b]]);
    expect(selectEnemyBurstDamageEntries([a, b], 1)).toEqual([a, b]);
    expect(selectEnemyBurstDamageEntries([a, b], 0)[0]).toBe(a);
  });
  it('never groups different targets, frames, or ordinary skill damage', () => {
    const a = hit(0),
      b = hit(1, 11),
      c = hit(2, 10, 'a', 'other');
    const ordinary = { ...hit(3), data: { value: 999 } };
    expect(groupEnemyBurstDamageHits([a, b, c, ordinary])).toEqual([[a], [b], [c]]);
    expect(selectEnemyBurstDamageEntries([a, b, c, ordinary], 3)).toEqual([]);
    expect(selectEnemyBurstDamageEntries([a], null)).toEqual([]);
    expect(selectEnemyBurstDamageEntries([a], 42)).toEqual([]);
  });
});
