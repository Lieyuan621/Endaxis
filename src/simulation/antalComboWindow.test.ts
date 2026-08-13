import { describe, expect, it } from 'vitest';
import { collectTriggerEffects } from '@/data/collect';
import type { Effect } from '@/data/types';
import { createDefaultStats } from '@/simulation/defaultActorStats';
import type { OperatorInstance, TeamInstance } from '@/types';
import { compileScenario } from './compiler/compileScenario';
import type { Action, ScenarioData, ScenarioTrack } from './compiler/types';
import { TriggerRegistry } from './engine/TriggerRegistry';
import { simulate } from './simulator';

function createAction(id: string, startTime: number, effects: Effect[]): Action {
  return {
    id,
    instanceId: `${id}_inst`,
    type: 'battleSkill',
    skillId: id,
    name: id,
    startTime,
    logicalStartTime: startTime,
    cooldown: 0,
    spCost: 0,
    spGain: 0,
    spGainKind: 'recover',
    element: 'heat',
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    enhancementTime: 0,
    duration: 0.1,
    triggerWindow: 0,
    animationTime: 0,
    isDisabled: false,
    hits: [
      {
        offset: 0,
        multiplier: 0,
        spRecovery: 0,
        spReturn: 0,
        stagger: 0,
        effects,
      },
    ],
  };
}

function runAntalScenario(withFocus: boolean) {
  const antal: OperatorInstance = {
    id: 'op_antal',
    operatorSlug: 'antal',
    level: 60,
    promoted: true,
    potential: 0,
    skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
    talentStates: { '0': 2, '1': 2 },
    trustLevel: 0,
  };
  const team: TeamInstance = {
    id: 'team',
    name: 'Antal combo window',
    slots: [
      {
        operatorId: antal.id,
        weaponId: null,
        gear: { armor: null, gloves: null, kit1: null, kit2: null },
      },
      {
        operatorId: null,
        weaponId: null,
        gear: { armor: null, gloves: null, kit1: null, kit2: null },
      },
      {
        operatorId: null,
        weaponId: null,
        gear: { armor: null, gloves: null, kit1: null, kit2: null },
      },
      {
        operatorId: null,
        weaponId: null,
        gear: { armor: null, gloves: null, kit1: null, kit2: null },
      },
    ],
  };

  const actions: Action[] = [];
  if (withFocus) {
    actions.push(
      createAction('focus', 0, [
        {
          id: 'antal-battle-focus',
          kind: 'status',
          target: 'enemy',
          value: 10,
          duration: 60,
        },
      ]),
    );
  }
  actions.push(createAction('infliction', 1, [{ kind: 'infliction', element: 'heat', stacks: 1 }]));

  const track: ScenarioTrack = {
    id: 'antal',
    actions,
    stats: createDefaultStats(),
    gaugeEfficiency: 100,
    originiumArtsPower: 0,
    linkCdReduction: 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
  };
  const triggers = collectTriggerEffects(team, [antal], [], [], new Map()).map(entry => ({
    ...entry,
    sourceTrackId: 'antal',
  }));
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario({
    tracks: [track],
    connections: [],
  } satisfies ScenarioData);

  return simulate(timeline, teamConfig, enemyConfig, actors, new TriggerRegistry(triggers));
}

describe('Antal combo window', () => {
  it('opens only when the triggering enemy status is applied during Focus', () => {
    const withoutFocus = runAntalScenario(false);
    const withFocus = runAntalScenario(true);
    const hasComboWindow = (result: ReturnType<typeof runAntalScenario>) =>
      result.operatorLog.some(
        entry => entry.type === 'OPERATOR_EFFECT_APPLY' && entry.id === 'antal-combo-window',
      );

    expect(hasComboWindow(withoutFocus)).toBe(false);
    expect(hasComboWindow(withFocus)).toBe(true);
  });
});
