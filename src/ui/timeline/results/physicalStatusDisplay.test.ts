import { expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { isPhysicalStatusRowBuff, projectPhysicalStatusDisplay } from './physicalStatusDisplay';
import { layoutEnemyStatusRows } from './enemyStatusRows';
import { layoutEnemyDamageHits } from './enemyDamageHitLayout';

const guardId = 'buff_physical_no_guard';

it('only admits the four physical abnormalities and guard to the physical row', () => {
  for (const buffId of [
    'buff_physical_airborne',
    'buff_physical_knockdown',
    'buff_physical_crushed',
    'buff_physical_do_fracture',
    guardId,
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

function receipt(
  sequence: number,
  frame: number,
  event: string,
  buffId: string,
  instanceId: number,
  data: CombatReceiptEntry['data'] = {},
  options: Pick<CombatReceiptEntry, 'sourceId' | 'targetId' | 'producedBy'> = {},
): CombatReceiptEntry {
  return {
    sequence,
    frame,
    time: frame / 30,
    event,
    sourceId: options.sourceId ?? 'operator',
    targetId: options.targetId ?? 'enemy',
    ...(options.producedBy === undefined ? {} : { producedBy: options.producedBy }),
    data: { buffId, instanceId, ...data },
  };
}

function applied(
  sequence: number,
  frame: number,
  buffId: string,
  instanceId: number,
  layers: number,
  data: CombatReceiptEntry['data'] = {},
  options: Pick<CombatReceiptEntry, 'sourceId' | 'targetId' | 'producedBy'> = {},
): CombatReceiptEntry {
  return receipt(
    sequence,
    frame,
    'BuffApplied',
    buffId,
    instanceId,
    {
      layers,
      visible: true,
      abnormalColorType: 'Physical',
      ...(buffId === guardId ? { iconPath: '/icons/icon_shadow_attribute_penetrate.webp' } : {}),
      ...data,
    },
    options,
  );
}

it.each(['airborne', 'knockDown', 'crush', 'fracture'])(
  'shows vulnerability 1 without a duration bar when %s only seeds guard',
  physicalInflictionType => {
    const [display] = projectPhysicalStatusDisplay(
      [applied(1, 10, guardId, 1, 1, { physicalInflictionType })],
      100,
      { enemySuperArmor: 0 },
    );
    expect(display).toMatchObject({
      buffId: guardId,
      layers: 1,
      startFrame: 10,
      durationEndFrame: 10,
      iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
    });
    expect(display!.windows).toHaveLength(1);
  },
);

it('shows the consumed guard count on a crush marker and does not draw a crush duration bar', () => {
  const entries = [
    applied(1, 0, guardId, 1, 2),
    receipt(2, 40, 'BuffFinished', guardId, 1, { layers: 2, reason: 'early' }),
    receipt(3, 40, 'BuffConsumed', guardId, 1, { layers: 2, castId: 'cast:crush' }),
    applied(
      4,
      40,
      'buff_physical_crushed',
      2,
      1,
      { physicalInflictionType: 'crush', castId: 'cast:crush' },
      { sourceId: 'operator' },
    ),
  ];
  const [display] = projectPhysicalStatusDisplay(entries, 100, { enemySuperArmor: 0 });
  expect(display).toMatchObject({
    buffId: 'buff_physical_crushed',
    layers: 2,
    startFrame: 40,
    durationEndFrame: 40,
    iconPath: '/icons/icon_term_ba_crush.webp',
  });
});

it('shows the consumed guard count and real debuff duration for fracture', () => {
  const entries = [
    applied(1, 0, guardId, 1, 2),
    receipt(2, 40, 'BuffFinished', guardId, 1, { layers: 2, reason: 'early' }),
    receipt(3, 40, 'BuffConsumed', guardId, 1, { layers: 2, castId: 'cast:fracture' }),
    applied(
      4,
      40,
      'buff_physical_do_fracture',
      2,
      1,
      { physicalInflictionType: 'fracture', castId: 'cast:fracture' },
      { sourceId: 'operator' },
    ),
    receipt(5, 80, 'BuffFinished', 'buff_physical_do_fracture', 2, {
      layers: 1,
      reason: 'lifetime',
    }),
  ];
  const [display] = projectPhysicalStatusDisplay(entries, 100, { enemySuperArmor: 0 });
  expect(display).toMatchObject({
    buffId: 'buff_physical_do_fracture',
    layers: 2,
    startFrame: 40,
    durationEndFrame: 80,
    iconPath: '/icons/icon_term_ba_fracture.webp',
  });
});

it('uses the updated guard count and real control duration for airborne', () => {
  const entries = [
    applied(1, 0, guardId, 1, 1),
    receipt(
      2,
      20,
      'BuffStackChanged',
      guardId,
      1,
      { previousLayers: 1, layers: 2, delta: 1 },
      { producedBy: { kind: 'buff', ownerId: 'enemy', instanceId: 2 } },
    ),
    applied(3, 20, 'buff_physical_airborne', 2, 1, {
      physicalInflictionType: 'airborne',
    }),
    receipt(4, 50, 'BuffFinished', 'buff_physical_airborne', 2, {
      layers: 1,
      reason: 'lifetime',
    }),
  ];
  const [display] = projectPhysicalStatusDisplay(entries, 100, { enemySuperArmor: 0 });
  expect(display).toMatchObject({
    buffId: 'buff_physical_airborne',
    layers: 2,
    startFrame: 20,
    durationEndFrame: 50,
    iconPath: '/icons/icon_term_ba_airborne.webp',
  });
  expect(display!.windows.map(buff => buff.buffId)).toContain('buff_physical_airborne');

  const hit: CombatReceiptEntry = {
    sequence: 5,
    frame: 25,
    time: 25 / 30,
    event: 'DamageApplied',
    targetId: 'enemy',
    data: {
      buffId: 'buff_physical_airborne',
      buffInstanceId: 2,
      buffOwnerId: 'enemy',
      value: 120,
    },
  };
  expect(layoutEnemyDamageHits([hit], [display!], [], new Set())).toEqual([
    { group: [hit], row: 0, standalone: false },
  ]);
});

it.each([
  ['buff_physical_airborne', 'airborne'],
  ['buff_physical_knockdown', 'knockDown'],
] as const)(
  'shows the final same-frame guard count after %s, without borrowing a later frame',
  (buffId, physicalInflictionType) => {
    const entries = [
      applied(1, 0, guardId, 1, 3),
      applied(2, 20, buffId, 2, 1, { physicalInflictionType }),
      // Rossi's follow-up uses a separate plain applyBuff after the physical input.
      applied(3, 20, guardId, 1, 4),
      applied(4, 21, guardId, 1, 1, {}, { targetId: 'other-enemy' }),
      receipt(5, 110, 'BuffFinished', buffId, 2, { layers: 1, reason: 'lifetime' }),
    ];
    const [display] = projectPhysicalStatusDisplay(entries, 120, { enemySuperArmor: 0 });
    expect(display).toMatchObject({ buffId, layers: 4, startFrame: 20 });

    const laterOnly = [entries[0]!, entries[1]!, applied(3, 21, guardId, 1, 4)];
    expect(projectPhysicalStatusDisplay(laterOnly, 120, { enemySuperArmor: 0 })[0]!.layers).toBe(3);

    const otherTargetOnly = [
      entries[0]!,
      entries[1]!,
      applied(3, 20, guardId, 1, 4, {}, { targetId: 'other-enemy' }),
    ];
    expect(
      projectPhysicalStatusDisplay(otherTargetOnly, 120, { enemySuperArmor: 0 })[0]!.layers,
    ).toBe(3);
  },
);

it('keeps a consumed crush count when guard is re-added after it in the same frame', () => {
  const entries = [
    applied(1, 0, guardId, 1, 4),
    receipt(2, 20, 'BuffFinished', guardId, 1, { layers: 4, reason: 'early' }),
    receipt(3, 20, 'BuffConsumed', guardId, 1, { layers: 4 }),
    applied(4, 20, 'buff_physical_crushed', 2, 1, { physicalInflictionType: 'crush' }),
    applied(5, 20, guardId, 3, 1),
  ];
  const [display] = projectPhysicalStatusDisplay(entries, 100, { enemySuperArmor: 0 });
  expect(display).toMatchObject({ buffId: 'buff_physical_crushed', layers: 4 });
});

it('does not use an earlier same-frame guard peak after those stacks are consumed', () => {
  const entries = [
    applied(1, 20, guardId, 1, 4),
    receipt(2, 20, 'BuffFinished', guardId, 1, { layers: 4, reason: 'early' }),
    applied(3, 20, guardId, 2, 1),
    applied(4, 20, 'buff_physical_airborne', 3, 1, { physicalInflictionType: 'airborne' }),
  ];
  const display = projectPhysicalStatusDisplay(entries, 100, { enemySuperArmor: 0 }).find(
    segment => segment.buffId === 'buff_physical_airborne',
  );
  expect(display?.layers).toBe(1);
});

it.each([
  ['buff_physical_airborne', 'airborne'],
  ['buff_physical_knockdown', 'knockDown'],
] as const)(
  'suppresses the %s control duration when enemy super armor reaches Main threshold',
  (buffId, physicalInflictionType) => {
    const entries = [
      applied(1, 0, guardId, 1, 1),
      receipt(
        2,
        20,
        'BuffStackChanged',
        guardId,
        1,
        { previousLayers: 1, layers: 2, delta: 1 },
        { producedBy: { kind: 'buff', ownerId: 'enemy', instanceId: 2 } },
      ),
      applied(3, 20, buffId, 2, 1, { physicalInflictionType }),
      receipt(4, 110, 'BuffFinished', buffId, 2, { layers: 1, reason: 'lifetime' }),
    ];

    const [controllable] = projectPhysicalStatusDisplay(entries, 120, { enemySuperArmor: 20 });
    const [armored] = projectPhysicalStatusDisplay(entries, 120, { enemySuperArmor: 30 });

    expect(controllable).toMatchObject({ buffId, startFrame: 20, durationEndFrame: 110 });
    expect(armored).toMatchObject({ buffId, startFrame: 20, durationEndFrame: 20 });
  },
);

it('keeps physical markers on one row and selects the Main priority at the same frame', () => {
  const entries = [
    applied(1, 10, guardId, 1, 1, { physicalInflictionType: 'crush' }),
    applied(2, 10, 'buff_physical_airborne', 2, 1, { physicalInflictionType: 'airborne' }),
    applied(3, 10, 'buff_physical_do_fracture', 3, 1, {
      physicalInflictionType: 'fracture',
    }),
  ];
  const displays = projectPhysicalStatusDisplay(entries, 100, { enemySuperArmor: 0 });
  const rows = layoutEnemyStatusRows(displays, [], new Set());
  expect([...rows.lanes.values()]).toEqual([0, 0, 0]);
  expect([...rows.hiddenIcons].map(display => display.buffId)).toEqual([
    guardId,
    'buff_physical_airborne',
  ]);
});
