import { describe, expect, it } from 'vitest';
import arcaneSheet from '@/data/operators/arcane';
import { applyForm } from '@/data/forms';
import { collectTriggerEffects, patchCombatSkills } from '@/data/collect';
import type { Action, ScenarioData, ScenarioTrack } from './compiler/types';
import { compileScenario } from './compiler/compileScenario';
import { simulate } from './simulator';
import { TriggerRegistry } from './engine/TriggerRegistry';
import { createDefaultStats } from '@/simulation/defaultActorStats';
import { extractRawEntries, resolveHitsFromSheet } from '@/stores/timeline/resolveHits';
import type { BaseStatValues } from '@/data/stats/types';
import type { OperatorInstance, TeamInstance } from '@/types';

const BASE_STATS: BaseStatValues = {
  level: 60,
  baseAtk: 1000,
  baseHp: 1000,
  weaponAtk: 0,
  baseAttrs: {
    strength: 100,
    agility: 100,
    intellect: 120,
    will: 100,
  },
  mainAttributeName: 'intellect',
  secondaryAttributeName: 'will',
};

function createAction(id: string, type: Action['type'], patch: Partial<Action> = {}): Action {
  const startTime = Number(patch.startTime) || 0;
  return {
    id,
    instanceId: patch.instanceId || `${id}_inst`,
    type,
    skillId: patch.skillId || id,
    name: patch.name || id,
    startTime,
    logicalStartTime: patch.logicalStartTime ?? startTime,
    cooldown: 0,
    spCost: 0,
    spGain: 0,
    spGainKind: 'recover',
    element: 'physical',
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    enhancementTime: 0,
    duration: 1,
    triggerWindow: 0,
    animationTime: 0,
    isDisabled: false,
    hits: [],
    ...patch,
  };
}

function createTrack(id: string, actions: Action[], patch: Partial<ScenarioTrack> = {}): ScenarioTrack {
  const stats = { ...createDefaultStats(), ...(patch.stats || {}) } as ScenarioTrack['stats'];
  return {
    id,
    actions,
    stats,
    baseStats: BASE_STATS,
    gaugeEfficiency: Number(stats.ult_charge_eff) || 100,
    originiumArtsPower: Number(stats.originium_arts_power) || 0,
    linkCdReduction: Number(stats.link_cd_reduction) || 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
    ...patch,
  };
}

function resolveArcaneUltimateHits(levelIndex = 11) {
  const intFormSheet = applyForm(arcaneSheet, 'int');
  const flatSkills = patchCombatSkills(intFormSheet, { talentStates: {}, potential: 0 });
  const segment = flatSkills.ultimate?.segments?.[0];
  const rawEntries = extractRawEntries({ segments: [segment] }, 0);
  return resolveHitsFromSheet([], rawEntries, levelIndex, { preserveCondition: true });
}

function collectArcaneTriggers(tracks: ScenarioTrack[]) {
  const team: TeamInstance = {
    id: 'team',
    name: 'team',
    slots: [
      {
        operatorId: 'op_arcane',
        weaponId: null,
        gear: { armor: null, gloves: null, kit1: null, kit2: null },
      },
      {
        operatorId: 'op_ally',
        weaponId: null,
        gear: { armor: null, gloves: null, kit1: null, kit2: null },
      },
      { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
      { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
    ],
  };
  const arcane = {
    id: 'op_arcane',
    operatorSlug: 'arcane',
    level: 60,
    promoted: true,
    potential: 0,
    skillLevels: { basicAttack: 1, battleSkill: 9, comboSkill: 9, ultimate: 9 },
    talentStates: {},
    trustLevel: 0,
  } satisfies OperatorInstance;
  const ally = { ...arcane, id: 'op_ally', operatorSlug: 'estella' } satisfies OperatorInstance;
  const entries = collectTriggerEffects(team, [arcane, ally], [], [], new Map());
  return entries.map(entry => ({
    ...entry,
    sourceTrackId: tracks[entry.sourceSlotIndex]?.id ?? entry.sourceOperatorSlug,
  }));
}

function runArcaneScenario(
  allyAction: Action,
  options: {
    controlledOperatorSegments?: { startTime: number; operatorId: string | null }[];
    initialEnemyState?: any;
    systemConstants?: Record<string, any>;
  } = {},
) {
  const ultimateHits = resolveArcaneUltimateHits();
  const tracks = [
    createTrack('arcane', [
      createAction('arcane_ult', 'ultimate', {
        instanceId: 'arcane_ult_inst',
        startTime: 0,
        duration: 2.417,
        animationTime: 1.583,
        enhancementTime: 'arcane-gloompurger-array',
        gaugeCost: 100,
        element: 'nature',
        hits: ultimateHits,
      }),
    ], { initialGauge: 100, maxGaugeOverride: 100 }),
    createTrack('ally', [allyAction]),
  ];
  const triggerEffects = collectArcaneTriggers(tracks);
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(
    { tracks, connections: [] } satisfies ScenarioData,
    { systemConstants: options.systemConstants },
  );
  const baseStatsByTrack = new Map<string, BaseStatValues>(actors.map(a => [a.id, BASE_STATS]));
  return {
    tracks,
    triggerEffects,
    result: simulate(timeline, teamConfig, enemyConfig, actors, new TriggerRegistry(triggerEffects), undefined, {
      baseStatsByTrack,
      enemyDef: 100,
      controlledOperatorSegments: options.controlledOperatorSegments,
      initialEnemyState: options.initialEnemyState,
    }),
  };
}

function clusterLasers(simLog: ReturnType<typeof simulate>['simLog']) {
  return simLog.filter(
    entry =>
      entry.type === 'DAMAGE_HIT' &&
      entry.payload.sourceId === 'arcane' &&
      entry.payload.hitData?.triggered === true &&
      entry.payload.hitData?.triggeredBy === 'arcane-ultimate-cluster-strike-counter',
  );
}

/** Mirrors ActionItem.vue triggered-hit attribution for an action instance. */
function actionItemShowsTriggeredHit(
  actionInstanceId: string,
  trackId: string,
  actionStartsOnTrack: Array<{ id: string; start: number }>,
  actionMap: Map<string, { trackId: string }>,
  hitTime: number,
  hit: { sourceId?: string; actionId?: string; triggered?: boolean },
): boolean {
  if (!hit.triggered) return false;
  if (hit.sourceId !== trackId) return false;

  const timeOwnerOnThisTrack = () =>
    [...actionStartsOnTrack]
      .sort((a, b) => b.start - a.start)
      .find(item => item.start <= hitTime)?.id === actionInstanceId;

  const actionId = hit.actionId;
  if (
    !actionId ||
    String(actionId).startsWith('triggered:') ||
    String(actionId).startsWith('reaction:') ||
    String(actionId).startsWith('dot:')
  ) {
    return timeOwnerOnThisTrack();
  }

  const attributed = actionMap.get(String(actionId));
  if (!attributed || attributed.trackId !== trackId) {
    return timeOwnerOnThisTrack();
  }
  return actionId === actionInstanceId;
}

describe('Arcane ultimate cluster strike (集束打击)', () => {
  it('applies cluster counter from ultimate hit', () => {
    const { result } = runArcaneScenario(
      createAction('ally_ba', 'basicAttack', {
        instanceId: 'ally_ba_inst',
        startTime: 99,
        attackSequenceIndex: 5,
        attackSequenceTotal: 5,
        hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
      }),
    );
    expect(result.operatorLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'OPERATOR_EFFECT_APPLY',
          id: 'arcane-ultimate-cluster-strike-counter',
          targetTrackId: 'arcane',
          stacks: 2,
        }),
      ]),
    );
  });

  it('fires 4 triggered nature lasers on ally final basicAttack strike', () => {
    const allyFinal = createAction('ally_final', 'basicAttack', {
      instanceId: 'ally_final_inst',
      startTime: 5,
      attackSequenceIndex: 5,
      attackSequenceTotal: 5,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    });
    const { result } = runArcaneScenario(allyFinal);
    const lasers = clusterLasers(result.simLog);
    expect(lasers).toHaveLength(4);
    expect(lasers.every(l => l.payload.hitData.element === 'nature')).toBe(true);
    const offsets = lasers.map(l => l.time - 5).sort((a, b) => a - b);
    expect(offsets[0]).toBeCloseTo(0.4, 2);
    expect(offsets[3]).toBeCloseTo(0.799, 2);
    expect(lasers.every(l => l.payload.sourceId === 'arcane')).toBe(true);
    expect(lasers.every(l => l.payload.actionId === 'ally_final_inst')).toBe(true);
  });

  it('fires 4 triggered lasers on ally finisher', () => {
    const allyFinisher = createAction('ally_finisher', 'finisher', {
      instanceId: 'ally_finisher_inst',
      startTime: 5,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    });
    const { result } = runArcaneScenario(allyFinisher);
    const lasers = clusterLasers(result.simLog);
    expect(lasers).toHaveLength(4);
    expect(lasers.every(l => l.payload.actionId === 'ally_finisher_inst')).toBe(true);
  });

  it('does not apply finisher multiplier to cluster lasers triggered by a finisher', () => {
    const allyFinisher = createAction('ally_finisher', 'finisher', {
      instanceId: 'ally_finisher_inst',
      startTime: 5,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    });
    const { result } = runArcaneScenario(allyFinisher, {
      systemConstants: { finisherMultiplier: 1.75, tier: 'leader' },
      initialEnemyState: {
        stagger: {
          value: 300,
          maxStagger: 300,
          breakRemaining: 20,
          lockRemaining: 0,
        },
      },
    });

    const finisherHit = result.simLog.find(
      entry =>
        entry.type === 'DAMAGE_HIT' &&
        entry.payload.actionId === 'ally_finisher_inst' &&
        !entry.payload.hitData?.triggered,
    );
    expect(finisherHit?.type).toBe('DAMAGE_HIT');
    if (finisherHit?.type === 'DAMAGE_HIT') {
      expect(finisherHit.payload.hitData._finisherMult).toBeCloseTo(1.75, 5);
    }

    const lasers = clusterLasers(result.simLog);
    expect(lasers).toHaveLength(4);
    expect(lasers.every(l => Number(l.payload.hitData._finisherMult ?? 1) === 1)).toBe(true);
  });

  it('does not fire cluster lasers when ally basicAttack is not the final sequence hit', () => {
    const allyMidCombo = createAction('ally_mid', 'basicAttack', {
      instanceId: 'ally_mid_inst',
      startTime: 5,
      attackSequenceIndex: 2,
      attackSequenceTotal: 5,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    });
    const { result } = runArcaneScenario(allyMidCombo);
    expect(clusterLasers(result.simLog)).toHaveLength(0);
  });

  it('shows orange markers on Arcane ultimate when ally final strike triggers lasers', () => {
    const allyFinal = createAction('ally_final', 'basicAttack', {
      instanceId: 'ally_final_inst',
      startTime: 5,
      attackSequenceIndex: 5,
      attackSequenceTotal: 5,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    });
    const { result } = runArcaneScenario(allyFinal);
    const lasers = clusterLasers(result.simLog);
    expect(lasers.length).toBeGreaterThan(0);

    const trackStarts = [{ id: 'arcane_ult_inst', start: 0 }];
    const actionMap = new Map([
      ['arcane_ult_inst', { trackId: 'arcane' }],
      ['ally_final_inst', { trackId: 'ally' }],
    ]);

    for (const laser of lasers) {
      const hit = {
        ...laser.payload.hitData,
        actionId: laser.payload.actionId,
        sourceId: laser.payload.sourceId,
      };
      expect(laser.payload.actionId).toBe('ally_final_inst');
      expect(
        actionItemShowsTriggeredHit(
          'arcane_ult_inst',
          'arcane',
          trackStarts,
          actionMap,
          laser.time,
          hit,
        ),
      ).toBe(true);
    }
  });

  it('shows orange markers on Arcane ultimate when ally finisher triggers lasers', () => {
    const allyFinisher = createAction('ally_finisher', 'finisher', {
      instanceId: 'ally_finisher_inst',
      startTime: 5,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    });
    const { result } = runArcaneScenario(allyFinisher);
    const lasers = clusterLasers(result.simLog);
    const trackStarts = [{ id: 'arcane_ult_inst', start: 0 }];
    const actionMap = new Map([
      ['arcane_ult_inst', { trackId: 'arcane' }],
      ['ally_finisher_inst', { trackId: 'ally' }],
    ]);

    for (const laser of lasers) {
      expect(
        actionItemShowsTriggeredHit(
          'arcane_ult_inst',
          'arcane',
          trackStarts,
          actionMap,
          laser.time,
          {
            ...laser.payload.hitData,
            actionId: laser.payload.actionId,
            sourceId: laser.payload.sourceId,
          },
        ),
      ).toBe(true);
    }
  });
});
