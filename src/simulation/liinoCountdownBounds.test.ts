import { describe, expect, it } from 'vitest';
import { compileScenario } from './compiler/compileScenario';
import type { Action, ScenarioData, ScenarioTrack } from './compiler/types';
import { simulate } from './simulator';
import { TriggerRegistry } from './engine/TriggerRegistry';
import { createDefaultStats } from '@/simulation/defaultActorStats';
import { collectTriggerEffects } from '@/data/collect';
import { extractRawEntries, resolveHitsFromSheet } from '@/stores/timeline/resolveHits';
import liinoSheet from '@/data/operators/liino';
import type { BaseStatValues } from '@/data/stats/types';

/**
 * Liino's three tickers are self-rearming expiring statuses. Each is bounded by a stance
 * condition; without it they re-arm forever and an endline-less scenario never terminates.
 */

const BASE_STATS: BaseStatValues = {
  level: 90,
  baseAtk: 1000,
  baseHp: 1000,
  weaponAtk: 0,
  baseAttrs: { strength: 100, agility: 100, intellect: 100, will: 100 },
  mainAttributeName: 'will',
  secondaryAttributeName: 'agility',
};

const emptyGear = { armor: null, gloves: null, kit1: null, kit2: null };
const emptySlot = { operatorId: null, weaponId: null, gear: emptyGear };

function liinoTriggerEntries() {
  const team: any = {
    id: 't',
    name: 't',
    slots: [{ operatorId: 'op', weaponId: null, gear: emptyGear }, emptySlot, emptySlot, emptySlot],
  };
  const ops: any = [
    {
      id: 'op',
      operatorSlug: 'liino',
      level: 90,
      promoted: true,
      potential: 0,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: { '0': 2, '1': 2 },
      trustLevel: 0,
    },
  ];
  return collectTriggerEffects(team, ops, [], [], new Map()).map((e: any) => ({
    sourceTrackId: 'liino',
    sourceSkillType: e.sourceSkillType,
    triggerEffect: e.triggerEffect,
  }));
}

function skillAction(
  id: string,
  type: Action['type'],
  sheetSkill: any,
  startTime: number,
  levelIndex = 11,
): Action {
  const hits = resolveHitsFromSheet([], extractRawEntries(sheetSkill, 0), levelIndex, {
    preserveCondition: true,
  } as any);
  return {
    id,
    instanceId: `${id}_inst`,
    type,
    skillId: type,
    name: id,
    startTime,
    logicalStartTime: startTime,
    cooldown: 0,
    spCost: 0,
    spGain: 0,
    spGainKind: 'recover',
    element: 'electric',
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    enhancementTime: 0,
    duration: 3,
    triggerWindow: 0,
    animationTime: 0,
    isDisabled: false,
    hits,
  } as Action;
}

function createTrack(id: string, actions: Action[]): ScenarioTrack {
  const stats = createDefaultStats() as ScenarioTrack['stats'];
  return {
    id,
    actions,
    stats,
    baseStats: BASE_STATS,
    gaugeEfficiency: 100,
    originiumArtsPower: 0,
    linkCdReduction: 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
  };
}

function run(actions: Action[], endlineTime?: number) {
  const tracks = [createTrack('liino', actions), createTrack('beta', [])];
  const scenario: ScenarioData = { tracks, connections: [] };
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(scenario);
  return simulate(
    timeline,
    teamConfig,
    enemyConfig,
    actors,
    new TriggerRegistry(liinoTriggerEntries() as any),
    undefined,
    {
      baseStatsByTrack: new Map(actors.map(a => [a.id, BASE_STATS])),
      enemyDef: 100,
      ...(endlineTime !== undefined ? { endlineTime } : {}),
    },
  );
}

const rearmsOf = (result: any, id: string) =>
  result.operatorLog
    .filter((e: any) => e.type === 'OPERATOR_EFFECT_APPLY' && e.id === id)
    .map((e: any) => e.time);

const expiryOf = (result: any, id: string) =>
  result.operatorLog.find((e: any) => e.type === 'OPERATOR_EFFECT_EXPIRE' && e.id === id)?.time;

describe('Liino countdown loops are bounded by their stance', () => {
  it('terminates with no endline set', () => {
    // The regression: previously this ran until the heap died.
    const result = run([
      skillAction('bs', 'battleSkill', liinoSheet.combatSkills.battleSkill, 1),
      skillAction('ult', 'ultimate', liinoSheet.combatSkills.ultimate, 70),
    ]);
    expect(result.operatorLog.length).toBeGreaterThan(0);
  });

  it('stops both battle-skill tickers when the vocalist stance ends', () => {
    const result = run(
      [skillAction('bs', 'battleSkill', liinoSheet.combatSkills.battleSkill, 1)],
      300,
    );
    const stanceEnd = expiryOf(result, 'liino-vocalist-stance');
    expect(stanceEnd).toBeDefined();

    for (const id of ['liino-battle-heal-countdown', 'liino-battle-hit-countdown']) {
      const rearms = rearmsOf(result, id);
      // Nothing re-arms at or after the stance's expiry instant.
      expect(rearms.filter((t: number) => t >= stanceEnd!)).toEqual([]);
      expect(rearms.length).toBeGreaterThan(0);
    }
  });

  it('emits 19 heal ticks and 5 damage ticks per battle skill, none at the boundary', () => {
    const result = run(
      [skillAction('bs', 'battleSkill', liinoSheet.combatSkills.battleSkill, 1)],
      300,
    );
    // Seeded at t=1.533 alongside the 60s stance, so the boundary lands exactly on 1.533+60.
    expect(rearmsOf(result, 'liino-battle-heal-countdown')).toHaveLength(19 + 1); // 1 seed + 19 re-arms
    expect(rearmsOf(result, 'liino-battle-hit-countdown')).toHaveLength(5 + 1);
  });

  it('stops the ultimate ticker when the cosmovoice stance ends', () => {
    const result = run([skillAction('ult', 'ultimate', liinoSheet.combatSkills.ultimate, 1)], 300);
    const stanceEnd = expiryOf(result, 'liino-cosmovoice-stance');
    expect(stanceEnd).toBeDefined();

    const rearms = rearmsOf(result, 'liino-ultimate-hit-countdown');
    expect(rearms.filter((t: number) => t >= stanceEnd!)).toEqual([]);
    // 15s stance / 1.5s interval, seeded with the stance: 9 ticks, boundary tick suppressed.
    expect(rearms).toHaveLength(9 + 1); // 1 seed + 9 re-arms
  });

  it('fires the 3x stance-end burst exactly once', () => {
    const result = run([skillAction('ult', 'ultimate', liinoSheet.combatSkills.ultimate, 1)], 300);
    const stanceEnd = expiryOf(result, 'liino-cosmovoice-stance')!;
    const bursts = (result.simLog as any[]).filter(
      e => e.type === 'DAMAGE_HIT' && Math.abs(e.time - stanceEnd) < 1e-6,
    );
    expect(bursts).toHaveLength(1);
  });
});
