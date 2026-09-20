import { expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { BuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import { layoutEnemyDamageHits } from './enemyDamageHitLayout';

const buff = (instanceId: number, startFrame: number, endFrame: number): BuffTimelineSegment => ({
  buffId: 'status',
  instanceId,
  targetId: 'enemy',
  startFrame,
  endFrame,
  layers: 1,
  placement: 'upper',
  iconStyleInSquad: 'SpellAbnormal',
});
const hit = (sequence: number, instanceId: number): CombatReceiptEntry => ({
  sequence,
  frame: 10,
  time: 1 / 3,
  event: 'DamageApplied',
  targetId: 'enemy',
  data: { buffId: 'status', buffOwnerId: 'enemy', buffInstanceId: instanceId, value: sequence },
});

it('shares an entry at an instance boundary while retaining all receipt identities and order', () => {
  const a = hit(1, 1),
    b = hit(2, 2),
    c = hit(3, 1);
  const buffs = [buff(1, 0, 10), buff(2, 10, 20)];
  const entries = [c, b, a];
  const before = JSON.stringify({ entries, buffs });
  const positions = layoutEnemyDamageHits(entries, buffs, [], new Set());
  expect(positions).toHaveLength(1);
  expect(positions[0]!.group).toEqual([a, b, c]);
  expect(positions[0]!.group[0]).toBe(a);
  expect(positions[0]!.group[1]).toBe(b);
  expect(JSON.stringify({ entries, buffs })).toBe(before);
});

it('keeps hidden-source damage accessible while excluding audit records', () => {
  const a = hit(1, 1),
    b = hit(2, 2);
  const later = { ...hit(3, 1), frame: 11 };
  const hidden = hit(4, 99);
  const audit = { ...hit(5, 1), event: 'BuffDamageApplied' };
  const positions = layoutEnemyDamageHits(
    [a, b, later, hidden, audit],
    [buff(1, 0, 20), buff(2, 0, 20)],
    [],
    new Set(),
  );
  expect(positions).toHaveLength(4);
  expect(positions.flatMap(p => p.group)).toEqual([a, b, later, hidden]);
  expect(positions.find(p => p.group.includes(hidden))).toMatchObject({ standalone: true });
  expect(positions.find(p => p.group.includes(a))!.row).not.toBe(
    positions.find(p => p.group.includes(b))!.row,
  );
});

it('retains damage without any visible Buff or icon metadata', () => {
  const entry = hit(1, 1);
  const positions = layoutEnemyDamageHits([entry], [], [], new Set());
  expect(positions).toEqual([{ group: [entry], row: 3, standalone: true }]);
});

it('shares a burst and an explicitly visible attachment hit without counting a receipt twice', () => {
  const a = hit(1, 1);
  const burst = { ...hit(2, 1), data: { ...hit(2, 1).data, spellBurstType: 'Fire' } };
  const other = { ...burst, sequence: 3, targetId: 'other' };
  const positions = layoutEnemyDamageHits(
    [burst, a, other],
    [buff(1, 0, 20)],
    [],
    new Set(['status']),
  );
  expect(positions).toHaveLength(2);
  expect(positions[0]!.group).toEqual([a, burst]);
  expect(positions[1]!.group).toEqual([other]);
});
