import { expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { BuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import { projectEnemyEffectViz } from '../../../core/projection/enemyEffectViz';
import {
  findBuffDamageSegment,
  groupEnemyBuffDamageHits,
  selectEnemyBuffDamageEntries,
} from './enemyBuffDamageHits';

const hit = (sequence = 1): CombatReceiptEntry => ({
  sequence,
  event: 'DamageApplied',
  frame: 10,
  time: 1 / 3,
  sourceId: 'operator',
  targetId: 'enemy',
  data: { buffId: 'status', buffInstanceId: 2, buffOwnerId: 'enemy', value: 0 },
});
const segment: BuffTimelineSegment = {
  buffId: 'status',
  instanceId: 2,
  targetId: 'enemy',
  startFrame: 0,
  endFrame: 10,
  layers: 1,
  placement: 'upper',
};
const applied: CombatReceiptEntry = {
  sequence: 0,
  event: 'BuffApplied',
  frame: 0,
  time: 0,
  sourceId: 'operator',
  targetId: 'enemy',
  data: { buffId: 'status', instanceId: 2, layers: 1, visible: true },
};

it('retains actual damage only and opens each receipt without counting the audit twice', () => {
  const a = hit(),
    b = hit(2),
    audit = { ...hit(3), event: 'BuffDamageApplied' };
  const ordinary = { ...hit(4), data: { value: 9 } };
  expect(projectEnemyEffectViz([applied, a, b, audit, ordinary], 30).damageHits).toEqual([a, b]);
  expect(groupEnemyBuffDamageHits([a, b, audit, ordinary])).toEqual([[a, b]]);
  expect(selectEnemyBuffDamageEntries([a, b], 2)).toEqual([a, b]);
  expect(selectEnemyBuffDamageEntries([a], null)).toEqual([]);
});

it('leaves ability-entity-owned Buff damage to the source skill timeline', () => {
  const delegated = {
    ...hit(),
    data: { ...hit().data, buffOwnerId: 'ability-entity:2' },
  };
  expect(projectEnemyEffectViz([delegated], 30).damageHits).toBeUndefined();
  expect(groupEnemyBuffDamageHits([delegated])).toEqual([]);
});

it('keeps hidden airborne damage and its icon without requiring a headbar row', () => {
  const start = {
    ...applied,
    data: {
      ...applied.data,
      iconPath: '/icons/airborne.webp',
      showInHeadBarCommon: false,
      showInHeadBarAttached: false,
    },
  };
  const result = projectEnemyEffectViz([start, hit()], 30);
  expect(result.damageHits).toEqual([hit()]);
  expect(findBuffDamageSegment(hit(), result.damageBuffs ?? [])?.iconPath).toBe(
    '/icons/airborne.webp',
  );
  expect(projectEnemyEffectViz([hit()], 30).damageHits).toEqual([hit()]);
});

it('does not confuse instance, owner, target, frame or hidden helper identities', () => {
  expect(findBuffDamageSegment(hit(), [segment])).toBe(segment);
  for (const changed of [
    { instanceId: 3 },
    { targetId: 'operator' },
    { buffId: 'helper' },
    { startFrame: 11 },
    { endFrame: 9 },
  ]) {
    expect(findBuffDamageSegment(hit(), [{ ...segment, ...changed }])).toBeUndefined();
  }
  expect(
    findBuffDamageSegment({ ...hit(), data: { ...hit().data, buffOwnerId: 'operator' } }, [
      segment,
    ]),
  ).toBeUndefined();
  const next = { ...segment, startFrame: 10, endFrame: 20, layers: 2 };
  expect(findBuffDamageSegment(hit(), [segment, next])).toBe(next);
  const others = [
    { ...hit(2), frame: 11 },
    { ...hit(3), data: { ...hit().data, buffInstanceId: 3 } },
    { ...hit(4), targetId: 'other' },
    { ...hit(5), data: { ...hit().data, buffOwnerId: 'operator' } },
  ];
  expect(groupEnemyBuffDamageHits([hit(), ...others])).toHaveLength(3);
});
