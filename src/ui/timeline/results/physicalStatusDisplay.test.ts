import { expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { isPhysicalStatusRowBuff, projectPhysicalStatusDisplay } from './physicalStatusDisplay';
import { layoutEnemyStatusRows } from './enemyStatusRows';
import { layoutEnemyDamageHits } from './enemyDamageHitLayout';

it('only admits the four physical abnormalities and guard to the physical row', () => {
  for (const buffId of [
    'buff_physical_airborne',
    'buff_physical_knockdown',
    'buff_physical_crushed',
    'buff_physical_do_fracture',
    'buff_physical_no_guard',
  ]) {
    expect(isPhysicalStatusRowBuff({ buffId })).toBe(true);
  }
  const other = {
    buffId: 'unrelated',
    abnormalColorType: 'Physical',
    showInHeadBarAttached: true,
    targetId: 'enemy',
    instanceId: 1,
    layers: 1,
    startFrame: 0,
    endFrame: 100,
    placement: 'upper' as const,
  };
  expect(isPhysicalStatusRowBuff(other)).toBe(false);
  expect(layoutEnemyStatusRows([other], [], new Set()).lanes.get(other)).toBe(3);
});

const guardId = 'buff_physical_no_guard';
function applied(
  sequence: number,
  frame: number,
  buffId: string,
  instanceId: number,
  layers = 1,
  producedBy?: CombatReceiptEntry['producedBy'],
): CombatReceiptEntry {
  return {
    sequence,
    frame,
    time: frame / 30,
    event: 'BuffApplied',
    targetId: 'enemy',
    sourceId: 'operator',
    ...(producedBy ? { producedBy } : {}),
    data: { buffId, instanceId, layers, visible: true, abnormalColorType: 'Physical' },
  };
}

it('merges airborne and the guard it creates, preserving both identities and the damage entry', () => {
  const entries = [
    applied(1, 10, 'buff_physical_airborne', 1),
    applied(2, 10, guardId, 2, 2, { kind: 'buff', ownerId: 'enemy', instanceId: 1 }),
  ];
  const before = JSON.stringify(entries);
  const segments = projectPhysicalStatusDisplay(entries, 100);
  expect(segments).toHaveLength(1);
  expect(segments[0]).toMatchObject({ iconPath: '/icons/icon_term_ba_airborne.webp', layers: 2 });
  expect(segments[0]!.windows.map(buff => buff.instanceId)).toEqual([1, 2]);
  const hit: CombatReceiptEntry = {
    sequence: 3,
    frame: 10,
    time: 1 / 3,
    event: 'DamageApplied',
    targetId: 'enemy',
    data: { buffId: 'buff_physical_airborne', buffInstanceId: 1, buffOwnerId: 'enemy', value: 120 },
  };
  expect(layoutEnemyDamageHits([hit], segments, [], new Set())).toEqual([
    { group: [hit], row: 0, standalone: false },
  ]);
  expect(JSON.stringify(entries)).toBe(before);
});

it('does not merge unrelated same-frame states or states on another target', () => {
  const entries = [
    applied(1, 10, 'buff_physical_airborne', 1),
    applied(2, 10, guardId, 2),
    {
      ...applied(3, 10, guardId, 3, 1, { kind: 'buff', ownerId: 'enemy', instanceId: 1 }),
      targetId: 'other',
    },
  ];
  const segments = projectPhysicalStatusDisplay(entries, 100);
  expect(segments).toHaveLength(3);
  expect(segments.every(segment => segment.windows.length === 1)).toBe(true);
  const rows = layoutEnemyStatusRows(segments, [], new Set());
  expect([...rows.lanes.values()]).toEqual([0, 0, 0]);
  expect(rows.rowCount).toBe(3);
  expect([...rows.iconSlots.values()]).toEqual([0, 1, 0]);
});

it.each([
  ['airborne', '/icons/icon_term_ba_airborne.webp'],
  ['knockDown', '/icons/icon_term_ba_knockdown.webp'],
  ['crush', '/icons/icon_term_ba_crush.webp'],
  ['fracture', '/icons/icon_term_ba_fracture.webp'],
])(
  'shows %s input when it only creates guard, without fabricating a second Buff',
  (type, iconPath) => {
    const entry = applied(1, 0, guardId, 1);
    const [display] = projectPhysicalStatusDisplay(
      [{ ...entry, data: { ...entry.data, physicalInflictionType: type } }],
      100,
    );
    expect(display!.iconPath).toBe(iconPath);
    expect(display!.windows).toHaveLength(1);
    expect(display!.windows[0]!.buffId).toBe(guardId);
  },
);

it('keeps successive stacking causes separate and puts consuming fracture on the same row', () => {
  const entries = [
    applied(1, 0, 'buff_physical_airborne', 1),
    applied(2, 0, guardId, 2, 1, { kind: 'buff', ownerId: 'enemy', instanceId: 1 }),
    applied(3, 20, 'buff_physical_knockdown', 3),
    applied(4, 20, guardId, 2, 2, { kind: 'buff', ownerId: 'enemy', instanceId: 3 }),
    applied(5, 40, 'buff_physical_do_fracture', 4),
    {
      ...applied(6, 40, guardId, 2),
      event: 'BuffFinished',
      data: { buffId: guardId, instanceId: 2, reason: 'early' },
    },
  ];
  const segments = projectPhysicalStatusDisplay(entries, 100);
  expect(segments.map(segment => segment.layers)).toEqual([1, 2, 0]);
  expect(segments.map(segment => segment.iconPath)).toEqual([
    '/icons/icon_term_ba_airborne.webp',
    '/icons/icon_term_ba_knockdown.webp',
    '/icons/icon_term_ba_fracture.webp',
  ]);
  expect(segments.map(segment => segment.durationEndFrame)).toEqual([20, 40, 100]);
  expect([...layoutEnemyStatusRows(segments, [], new Set()).lanes.values()]).toEqual([0, 0, 0]);
  expect(segments[0]!.windows[0]!.endFrame).toBe(100);
});
