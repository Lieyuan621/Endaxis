import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { ScenarioDocument } from '../../../core/project/schema';
import { deriveHitId } from '../../../core/combat/timeline/deriveHitId';
import {
  projectHitEffectsByCast,
  projectTimelineHitReceipts,
  projectTimelineHitOccurrences,
  projectTimelineHitActualFrames,
  projectTimelineHitDetailEntries,
} from './timelineHitEffects';
import { projectCastGraphHitMarkers } from './timelineHitProjection';
import { perlica } from '../../../data/operators/perlica.generated';
import { prepareActionGraphIdentities } from '../../../../tools/game-data-compiler/src/compiler/optimization/actionGraphProjection';

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
    data: { buffId: 'bleed', instanceId: 1, layers: 1, visible: true },
  };
  const delegated = {
    ...buff,
    sequence: 3,
    sourceId: 'rossi',
    data: { ...buff.data, hitId: 'sword', stepKey: 'sword', buffOwnerId: 'ability-entity:2' },
  };
  const entries = [buffApplied, direct, buff, delegated];
  // 没有可见 Buff 段时也由敌人伤害入口展示，不能重复挂回技能块。
  expect(
    projectTimelineHitOccurrences([direct, buff, delegated])
      .get('cast')
      ?.map(hit => hit.hitId),
  ).toEqual(['direct', 'sword']);
  expect(projectTimelineHitActualFrames(entries)).toEqual(
    new Map([
      ['direct', 30],
      ['sword', 30],
    ]),
  );
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
      ?.map(hit => hit.triggeredStackIndex),
  ).toEqual([0, 0, 1]);
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
  expect(projectTimelineHitActualFrames([burst])).toEqual(new Map());
  expect(projectTimelineHitOccurrences([burst])).toEqual(new Map());
});

function scenarioWithCast(): ScenarioDocument {
  return {
    id: 'scenario:hit-effects',
    name: '命中效果',
    tracks: [
      {
        id: 'track:0',
        operator: {
          operatorSlug: 'perlica',
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: {},
          talentStates: {},
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [
          {
            id: 'cast:1',
            source: {
              kind: 'operatorSkill',
              skillGroupKey: 'battleSkill',
              skillKey: 'battleSkill',
            },
            placement: { startFrame: 30 },
            presentation: {
              locked: false,
              disabled: false,
            },
            customDefinition: {
              key: 'battleSkill',
              timelineBlockFrames: 30,
              scheduledSequences: [
                {
                  startFrame: 10,
                  sequence: { $sequence: 'step-0' },
                },
              ],
              actionGraph: {
                main: {
                  nodes: {
                    'step-0': {
                      action: {
                        kind: 'dealDamage',
                        parameters: { damageType: 'electric', attackScale: 1, tags: [] },
                        key: 'step:damage',
                      },
                      next: 'step-1',
                    },
                    'step-1': {
                      action: {
                        kind: 'dealDamage',
                        parameters: { damageType: 'physical', attackScale: 1, tags: [] },
                        key: 'step:secondary',
                      },
                      next: null,
                    },
                  },
                },
                macros: {},
              },
            },
          },
        ],
      },
      null,
      null,
      null,
    ],
    connections: [],
    enemy: {
      source: { kind: 'custom', level: 90 },
      rank: 'mob',
      editable: {
        hp: 10000,
        defense: 100,
        superArmor: 0,
        finisherMultiplier: 1,
        resistances: {},
        stagger: {
          maximum: 300,
          knotThresholds: [0.5],
          knotBreakDurationFrames: 60,
          brokenDurationFrames: 300,
          finisherSpRecovery: 100,
        },
      },
      edited: [],
    },
    battle: {
      prepFrames: 150,
      durationFrames: 3600,
      resourceRules: {
        maxSp: 300,
        initialSp: 300,
        spRecoveryPerSecond: 10,
        defaultSkillSpCost: 100,
      },
      cycleBoundaries: [],
      controlSwitches: [],
    },
    mechanics: { selections: [] },
    globalConfig: { modifiers: [] },
    editor: { trackHeightWeights: [1, 1, 1, 1], prepExpanded: true },
  };
}

function markersForCast(scenario: ScenarioDocument, castId: string) {
  const cast = scenario.tracks.flatMap(track => track?.skillCasts ?? []).find(c => c.id === castId);
  if (cast === undefined || cast.customDefinition === undefined) return [];
  return projectCastGraphHitMarkers(
    cast,
    cast.customDefinition,
    prepareActionGraphIdentities(perlica),
  );
}

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

describe('projectHitEffectsByCast', () => {
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
  it('keeps ability-owned hit effects when cast and hit identities match', () => {
    const scenario = scenarioWithCast();
    const entries = [damageEntry(1, 60), inflictionEntry(2, 60)];
    const delegated = entries.map(entry => ({ ...entry, sourceId: 'ability-entity:7' }));
    const markers = markersForCast(scenario, 'cast:1');
    expect(projectHitEffectsByCast(scenario, delegated, 'cast:1', markers)).toEqual(
      projectHitEffectsByCast(scenario, entries, 'cast:1', markers),
    );
    expect(projectHitEffectsByCast(scenario, delegated, 'cast:1', markers).size).toBe(1);
    expect(projectTimelineHitDetailEntries(delegated, 'cast:1', markers[0]!.hitId)).toEqual(
      delegated,
    );
  });
  it('复用同次模拟的解析结果不改变命中归因，也不混入其他释放', () => {
    const scenario = scenarioWithCast();
    const entries = [damageEntry(1, 40), damageEntry(2, 41, 'step:damage', 'other')];
    const receipts = projectTimelineHitReceipts(entries);
    const markers = markersForCast(scenario, 'cast:1');
    expect(projectHitEffectsByCast(scenario, entries, 'cast:1', markers, receipts)).toEqual(
      projectHitEffectsByCast(scenario, entries, 'cast:1', markers),
    );
    expect(projectHitEffectsByCast(scenario, entries, 'missing', markers, receipts).size).toBe(0);
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

  it('uses exact cast and hit identities instead of authored local-frame offsets', () => {
    const scenario = scenarioWithCast();
    const effects = projectHitEffectsByCast(
      scenario,
      [
        damageEntry(1, 60),
        damageEntry(2, 60, 'step:unknown'),
        damageEntry(3, 60, 'step:damage', 'cast:other'),
      ],
      'cast:1',
      markersForCast(scenario, 'cast:1'),
    );

    const hitId = deriveHitId('cast:1', 'step:damage');
    expect(effects.get(hitId)).toEqual({
      damage: [{ value: 100, damageType: 'physical', isCritical: false }],
      infliction: [],
      reactions: [],
    });
    expect(effects.size).toBe(1);
  });

  it('projects the first actual execution frame for each stable hit identity', () => {
    const hitId = deriveHitId('cast:1', 'step:damage');
    expect(
      projectTimelineHitActualFrames([
        damageEntry(1, 60),
        damageEntry(2, 90),
        damageEntry(3, 70, 'step:secondary'),
      ]),
    ).toEqual(
      new Map([
        [hitId, 60],
        [deriveHitId('cast:1', 'step:secondary'), 70],
      ]),
    );
  });

  it('把同帧附着归因到命中标记', () => {
    const scenario = scenarioWithCast();
    const effects = projectHitEffectsByCast(
      scenario,
      [damageEntry(1, 60), inflictionEntry(2, 60)],
      'cast:1',
      markersForCast(scenario, 'cast:1'),
    );

    expect(effects.get(deriveHitId('cast:1', 'step:damage'))?.infliction).toEqual([
      { element: 'electric', outcomeKind: 'attachmentOnly', currentLayers: 1 },
    ]);
  });

  it('把同帧反应事实归因到命中标记', () => {
    const scenario = scenarioWithCast();
    const effects = projectHitEffectsByCast(
      scenario,
      [
        damageEntry(1, 60),
        {
          sequence: 2,
          frame: 60,
          time: 2,
          event: 'ElementalReactionApplied',
          sourceId: 'track:0',
          targetId: 'enemy',
          data: {
            reaction: 'electrification',
            castId: 'cast:1',
            previousLevel: 0,
            level: 1,
            durationSeconds: 5,
            effectiveness: 1,
          },
        },
      ],
      'cast:1',
      markersForCast(scenario, 'cast:1'),
    );

    expect(effects.get(deriveHitId('cast:1', 'step:damage'))?.reactions).toEqual([
      { reaction: 'electrification', applied: true, level: 1, previousLevel: 0 },
    ]);
  });

  it('无匹配事实的命中标记不出现，未知释放返回空映射', () => {
    const scenario = scenarioWithCast();
    const effects = projectHitEffectsByCast(
      scenario,
      [damageEntry(1, 999, 'step:unknown')],
      'cast:1',
      markersForCast(scenario, 'cast:1'),
    );
    expect(effects.size).toBe(0);
    expect(
      projectHitEffectsByCast(
        scenario,
        [damageEntry(1, 40)],
        'cast:missing',
        markersForCast(scenario, 'cast:1'),
      ).size,
    ).toBe(0);
  });
});
