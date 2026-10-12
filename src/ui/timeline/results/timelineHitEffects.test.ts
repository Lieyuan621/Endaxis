import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { deriveHitId } from '../../../core/combat/timeline/deriveHitId';
import {
  projectTimelineHitOccurrences,
  projectTimelineHitDetailEntries,
} from './timelineHitEffects';

function baseDamage(): Record<string, number | boolean | string | null> {
  return {
    damageType: 'physical',
    value: 100,
    actualDamage: 95,
    remainingHealth: 9905,
    isCritical: false,
    criticalMultiplier: 1,
    defenseMultiplier: 1,
    resistanceMultiplier: 1,
    weaknessShelterMultiplier: 1,
    runtimeExtensionMultiplier: 1,
    igniteMultiplier: 1,
    physicalInflictionMultiplier: 1,
  };
}

it('keeps target-owned Buff receipts out of skill markers while retaining delegated Buff hits', () => {
  const direct: CombatReceiptEntry = {
    sequence: 1,
    frame: 30,
    time: 1,
    event: 'DamageApplied',
    sourceId: 'rossi',
    targetId: 'enemy',
    data: { ...baseDamage(), castId: 'cast', hitId: 'direct', stepKey: 'direct' },
  };
  const buff: CombatReceiptEntry = {
    ...direct,
    sequence: 2,
    data: {
      ...direct.data,
      hitId: 'bleed',
      stepKey: 'bleed',
      buffId: 'bleed',
      buffOwnerId: 'enemy',
      buffInstanceId: 1,
    },
  };
  const buffApplied: CombatReceiptEntry = {
    sequence: 0,
    frame: 20,
    time: 2 / 3,
    event: 'BuffApplied',
    sourceId: 'rossi',
    targetId: 'enemy',
    data: { buffId: 'bleed', instanceId: 1, layers: 1, enabled: true, visible: true },
  };
  const delegated = {
    ...buff,
    sequence: 3,
    sourceId: 'rossi',
    data: { ...buff.data, hitId: 'sword', stepKey: 'sword', buffOwnerId: 'ability-entity:2' },
  };
  const entries = [buffApplied, direct, buff, delegated];
  const entityHit = { ...direct, producedBy: { kind: 'abilityEntity' as const, instanceId: 7 } };
  expect(projectTimelineHitOccurrences([entityHit]).get('cast')?.[0]?.entityInstanceId).toBe(7);
  // 派生 Buff 即使归属实体，也不是该实体直接执行的伤害。
  expect(
    projectTimelineHitOccurrences([
      { ...entityHit, producedBy: { kind: 'buff', ownerId: 'ability-entity:7', instanceId: 1 } },
    ]).get('cast')?.[0]?.entityInstanceId,
  ).toBeUndefined();
  // 没有可见 Buff 段时也由敌人伤害入口展示，不能重复挂回技能块。
  expect(
    projectTimelineHitOccurrences([direct, buff, delegated])
      .get('cast')
      ?.map(hit => hit.hitId),
  ).toEqual(['direct', 'sword']);
  expect(
    projectTimelineHitOccurrences(entries)
      .get('cast')
      ?.map(hit => hit.hitId),
  ).toEqual(['direct', 'sword']);
  expect(
    projectTimelineHitOccurrences(entries)
      .get('cast')
      ?.map(hit => hit.triggered),
  ).toEqual([false, false]);
  const secondTriggered = {
    ...delegated,
    sequence: 4,
    data: { ...delegated.data, hitId: 'extra', stepKey: 'extra' },
  };
  expect(
    projectTimelineHitOccurrences([
      ...entries.map(entry =>
        entry === delegated
          ? {
              ...entry,
              producedBy: { kind: 'buff' as const, ownerId: 'operator', instanceId: 1 },
            }
          : entry,
      ),
      { ...secondTriggered, producedBy: { kind: 'buff', ownerId: 'operator', instanceId: 1 } },
    ])
      .get('cast')
      ?.map(hit => hit.stackIndex),
  ).toEqual([0, 1, 2]);
  // 执行者是投射物并不意味着追加触发；普通伤害仍保持红色。
  expect(
    projectTimelineHitOccurrences([{ ...direct, sourceId: 'ability-entity:99' }]).get('cast')?.[0]
      ?.triggered,
  ).toBe(false);
  expect(projectTimelineHitDetailEntries(entries, 'cast', 'bleed')).toEqual([]);
  expect(projectTimelineHitDetailEntries(entries, 'cast', 'bleed', 30)).toEqual([]);
  expect(projectTimelineHitDetailEntries(entries, 'cast', 'direct')).toEqual([direct]);
  expect(projectTimelineHitDetailEntries(entries, 'cast', 'sword')).toEqual([delegated]);
});

it('keeps spell-burst damage exclusively under its enemy effect marker', () => {
  const ordinary: CombatReceiptEntry = {
    sequence: 1,
    frame: 30,
    time: 1,
    event: 'DamageApplied',
    sourceId: 'typhoeus',
    targetId: 'enemy',
    data: { ...baseDamage(), castId: 'cast', hitId: 'hit', stepKey: 'enhanced-basic-hit' },
  };
  const burst: CombatReceiptEntry = {
    ...ordinary,
    sequence: 2,
    data: {
      ...ordinary.data,
      value: 160,
      actualDamage: 160,
      spellBurstType: 'Pulse',
    },
  };

  expect(projectTimelineHitOccurrences([ordinary, burst]).get('cast')).toEqual([
    expect.objectContaining({
      hitId: 'hit',
      label: expect.objectContaining({
        damage: [{ value: 100, damageType: 'physical', isCritical: false }],
      }),
    }),
  ]);
  expect(projectTimelineHitDetailEntries([ordinary, burst], 'cast', 'hit')).toEqual([ordinary]);
  expect(projectTimelineHitOccurrences([burst])).toEqual(new Map());
});

function damageEntry(
  sequence: number,
  frame: number,
  stepKey = 'step:damage',
  castId = 'cast:1',
): CombatReceiptEntry {
  return {
    sequence,
    frame,
    time: frame / 30,
    event: 'DamageApplied',
    sourceId: 'track:0',
    targetId: 'enemy',
    data: {
      ...baseDamage(),
      stepKey,
      castId,
      hitId: deriveHitId(castId, stepKey),
    },
  };
}

function inflictionEntry(sequence: number, frame: number): CombatReceiptEntry {
  return {
    sequence,
    frame,
    time: frame / 30,
    event: 'ElementalInflictionApplied',
    sourceId: 'track:0',
    targetId: 'enemy',
    data: {
      skillId: 'battleSkill',
      castId: 'cast:1',
      requestedElement: 'electric',
      isExtra: false,
      previousElement: null,
      previousLayers: 0,
      currentElement: 'electric',
      currentLayers: 1,
      outcomeKind: 'attachmentOnly',
      operationKinds: 'addAttachment',
    },
  };
}

describe('skill hit occurrences and details', () => {
  it('marks only the hit that actually received the common combo damage Buff', () => {
    const ownDamage: CombatReceiptEntry = {
      ...damageEntry(1, 60),
      appliedDamageModifiers: [
        {
          kind: 'damageScale',
          buffId: 'buff_common_affixes_skillimbue_atk',
          sourceId: 'track:0',
          side: 'attacker',
          zone: 'combo',
          addition: 0.3,
        },
      ],
    };
    const otherDamage = damageEntry(2, 60, 'step:damage', 'cast:2');

    expect(
      projectTimelineHitOccurrences([ownDamage, otherDamage]).get('cast:1')?.[0],
    ).toMatchObject({ linkBuffed: true });
    expect(
      projectTimelineHitOccurrences([ownDamage, otherDamage]).get('cast:2')?.[0],
    ).toMatchObject({ linkBuffed: false });
  });

  it('renders repeated executions separately and selects only the clicked frame', () => {
    const entries = [
      damageEntry(1, 60),
      damageEntry(2, 90),
      damageEntry(3, 90),
      inflictionEntry(4, 90),
      damageEntry(5, 90, 'step:damage', 'other'),
    ];
    const hitId = deriveHitId('cast:1', 'step:damage');
    const occurrences = projectTimelineHitOccurrences(entries);
    expect(occurrences.get('cast:1')?.map(hit => [hit.frame, hit.label.damage.length])).toEqual([
      [60, 1],
      [90, 2],
    ]);
    expect(
      projectTimelineHitDetailEntries(entries, 'cast:1', hitId, 90).map(entry => entry.sequence),
    ).toEqual([2, 3, 4]);
    expect(projectTimelineHitDetailEntries(entries, 'cast:1', hitId, 89)).toEqual([]);
    expect(
      projectTimelineHitDetailEntries(entries, 'cast:1', hitId).map(entry => entry.sequence),
    ).toEqual([1]);
  });
  it('selects detail receipts by stable hit identity without requiring the operator source id', () => {
    const hitId = deriveHitId('cast:1', 'step:damage');
    const damage = {
      ...damageEntry(1, 60),
      sourceId: 'ability-entity:7',
      data: { ...damageEntry(1, 60).data, stepKey: 'ability-child:damage' },
    };
    const infliction = { ...inflictionEntry(2, 60), sourceId: 'ability-entity:7' };

    expect(
      projectTimelineHitDetailEntries(
        [damage, infliction, damageEntry(3, 90), damageEntry(4, 60, 'step:unknown')],
        'cast:1',
        hitId,
      ).map(entry => entry.sequence),
    ).toEqual([1, 2]);
  });
});
