import { describe, expect, it } from 'vitest';
import { compileScenario } from './compiler/compileScenario';
import type { Action, ScenarioData, ScenarioTrack } from './compiler/types';
import { simulate } from './simulator';
import { TriggerRegistry } from './engine/TriggerRegistry';
import { createDefaultStats } from '@/simulation/defaultActorStats';
import type { BaseStatValues } from '@/data/stats/types';
import type { Effect } from '@/data/types';

/**
 * `EffectTarget.classes` / `.elements` narrow the resolved targets for every scope.
 * `classes` used to be honored only by the static consumers and silently dropped by the sim.
 */

const BASE_STATS: BaseStatValues = {
  level: 60,
  baseAtk: 1000,
  baseHp: 1000,
  weaponAtk: 0,
  baseAttrs: { strength: 100, agility: 100, intellect: 100, will: 100 },
  mainAttributeName: 'agility',
  secondaryAttributeName: 'intellect',
};

const BUFF_ID = 'target-filter-buff';

function createTrack(id: string, element?: string, klass?: string, actions: Action[] = []) {
  const stats = createDefaultStats() as ScenarioTrack['stats'];
  return {
    id,
    element,
    class: klass,
    actions,
    stats,
    baseStats: BASE_STATS,
    gaugeEfficiency: 100,
    originiumArtsPower: 0,
    linkCdReduction: 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
  } as ScenarioTrack;
}

function buffAction(target: any): Action {
  const effect: Effect = {
    id: BUFF_ID,
    kind: 'status',
    stat: { modifier: 'atkPercent' },
    target,
    value: 10,
    duration: 20,
  } as Effect;
  return {
    id: 'buff',
    instanceId: 'buff_inst',
    type: 'battleSkill',
    skillId: 'buff',
    name: 'buff',
    startTime: 1,
    logicalStartTime: 1,
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
    hits: [{ offset: 0, spRecovery: 0, spReturn: 0, stagger: 0, effects: [effect] } as any],
  } as Action;
}

/** alpha = electric/guard, beta = nature/caster, gamma = electric/defender, delta = no metadata. */
function runWithTarget(target: any) {
  const tracks = [
    createTrack('alpha', 'electric', 'guard', [buffAction(target)]),
    createTrack('beta', 'nature', 'caster'),
    createTrack('gamma', 'electric', 'defender'),
    createTrack('delta', undefined, undefined),
  ];
  const scenario: ScenarioData = { tracks, connections: [] };
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(scenario);
  const result = simulate(
    timeline,
    teamConfig,
    enemyConfig,
    actors,
    new TriggerRegistry([]),
    undefined,
    { baseStatsByTrack: new Map(actors.map(a => [a.id, BASE_STATS])), enemyDef: 100 },
  );
  return [
    ...new Set(
      (result.operatorLog as any[])
        .filter(e => e.type === 'OPERATOR_EFFECT_APPLY' && e.id === BUFF_ID)
        .map(e => e.targetTrackId),
    ),
  ].sort();
}

describe('EffectTarget class/element filters', () => {
  it('applies to the whole team when no filter is given', () => {
    expect(runWithTarget('team')).toEqual(['alpha', 'beta', 'delta', 'gamma']);
    // The object form with empty arrays must behave identically to the bare string.
    expect(runWithTarget({ scope: 'team', classes: [], elements: [] })).toEqual([
      'alpha',
      'beta',
      'delta',
      'gamma',
    ]);
  });

  it('narrows by operator element', () => {
    expect(runWithTarget({ scope: 'team', elements: ['electric'] })).toEqual(['alpha', 'gamma']);
    expect(runWithTarget({ scope: 'team', elements: ['electric', 'nature'] })).toEqual([
      'alpha',
      'beta',
      'gamma',
    ]);
  });

  it('narrows by operator class at runtime', () => {
    // Fails before this change: the sim dropped `classes` entirely and buffed all four tracks.
    expect(runWithTarget({ scope: 'team', classes: ['guard'] })).toEqual(['alpha']);
    expect(runWithTarget({ scope: 'team', classes: ['guard', 'defender'] })).toEqual([
      'alpha',
      'gamma',
    ]);
  });

  it('intersects the two filters', () => {
    expect(
      runWithTarget({ scope: 'team', classes: ['guard', 'defender'], elements: ['electric'] }),
    ).toEqual(['alpha', 'gamma']);
    // Class matches alpha, element matches only beta -> empty intersection.
    expect(runWithTarget({ scope: 'team', classes: ['guard'], elements: ['nature'] })).toEqual([]);
  });

  it('excludes tracks with unknown element or class', () => {
    // `delta` has neither, so it can never satisfy a non-empty filter.
    expect(runWithTarget({ scope: 'team', elements: ['electric', 'nature'] })).not.toContain(
      'delta',
    );
    expect(
      runWithTarget({ scope: 'team', classes: ['guard', 'caster', 'defender'] }),
    ).not.toContain('delta');
  });

  it('narrows non-team scopes too', () => {
    expect(runWithTarget({ scope: 'teamExcludeSelf', elements: ['electric'] })).toEqual(['gamma']);
    // Self is electric, so the filter passes; a non-matching filter empties even 'self'.
    expect(runWithTarget({ scope: 'self', elements: ['electric'] })).toEqual(['alpha']);
    expect(runWithTarget({ scope: 'self', elements: ['nature'] })).toEqual([]);
  });
});
