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
    element: 'nature',
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
    gaugeEfficiency: 100,
    originiumArtsPower: 0,
    linkCdReduction: 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
    ...patch,
  };
}

function resolveSkillHits(skillKey: 'comboSkill' | 'battleSkill', levelIndex = 11) {
  const intFormSheet = applyForm(arcaneSheet, 'int');
  const flatSkills = patchCombatSkills(intFormSheet, { talentStates: {}, potential: 0 });
  const segment = flatSkills[skillKey]?.segments?.[0];
  const rawEntries = extractRawEntries({ segments: [segment] }, 0);
  return resolveHitsFromSheet([], rawEntries, levelIndex, { preserveCondition: true });
}

describe('Arcane battle skill vs combo susceptibility', () => {
  it('clears combo susceptibility on detonate, then keeps the 2s grant through a later combo', () => {
    const comboHits = resolveSkillHits('comboSkill');
    const battleHits = resolveSkillHits('battleSkill');

    const arcane = {
      id: 'op_arcane',
      operatorSlug: 'arcane',
      level: 60,
      promoted: true,
      potential: 0,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
      trustLevel: 0,
    } satisfies OperatorInstance;

    const team: TeamInstance = {
      id: 'team',
      name: 't',
      slots: [
        {
          operatorId: 'op_arcane',
          weaponId: null,
          gear: { armor: null, gloves: null, kit1: null, kit2: null },
        },
        { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
        { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
        { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } },
      ],
    };

    const collected = collectTriggerEffects(team, [arcane], [], [], new Map()).map(entry => ({
      ...entry,
      sourceTrackId: 'arcane',
    }));

    const tracks = [
      createTrack('arcane', [
        createAction('combo1', 'comboSkill', {
          instanceId: 'combo1_inst',
          startTime: 0,
          duration: 1,
          hits: comboHits.map(h => ({
            ...h,
            spRecovery: Number(h.spRecovery) || 0,
            spReturn: Number(h.spReturn) || 0,
            stagger: Number(h.stagger) || 0,
          })) as any,
        }),
        createAction('battle', 'battleSkill', {
          instanceId: 'battle_inst',
          startTime: 1.2,
          duration: 1,
          hits: battleHits.map(h => ({
            ...h,
            offset: 0,
            spRecovery: Number(h.spRecovery) || 0,
            spReturn: Number(h.spReturn) || 0,
            stagger: Number(h.stagger) || 0,
          })) as any,
        }),
        // Second combo after detonate — must not cancel the 2s detonate susceptibility.
        createAction('combo2', 'comboSkill', {
          instanceId: 'combo2_inst',
          startTime: 1.8,
          duration: 1,
          hits: comboHits.map(h => ({
            ...h,
            spRecovery: Number(h.spRecovery) || 0,
            spReturn: Number(h.spReturn) || 0,
            stagger: Number(h.stagger) || 0,
          })) as any,
        }),
      ]),
    ];

    const { timeline, teamConfig, enemyConfig, actors } = compileScenario({
      tracks,
      connections: [],
    } satisfies ScenarioData);

    const result = simulate(
      timeline,
      teamConfig,
      enemyConfig,
      actors,
      new TriggerRegistry(collected),
      undefined,
      { baseStatsByTrack: new Map([['arcane', BASE_STATS]]), enemyDef: 100 },
    );

    const comboSuscConsumes = result.enemyLog.filter(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' &&
        e.kind === 'status' &&
        e.id === 'arcane-combo-susceptibility' &&
        e.consumed,
    );
    const detonateApplies = result.enemyLog.filter(
      e => e.type === 'ENEMY_STATUS_APPLY' && e.id === 'arcane-combo-susceptibility-detonate',
    );
    const detonateNaturalExpires = result.enemyLog.filter(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' &&
        e.kind === 'status' &&
        e.id === 'arcane-combo-susceptibility-detonate' &&
        !e.consumed,
    );

    expect(comboSuscConsumes.length).toBeGreaterThanOrEqual(1);
    expect(detonateApplies.length).toBeGreaterThanOrEqual(1);

    const detonate = detonateApplies[0]!;
    // Later combo must not cancel the detonate timer.
    expect(detonateNaturalExpires.some(e => Math.abs(e.time - detonate.expiresAt) < 0.05)).toBe(
      true,
    );
  });
});
