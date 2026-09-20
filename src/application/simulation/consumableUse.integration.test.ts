import { describe, expect, it } from 'vitest';
import { ExplicitCriticalSampleSource } from '../../core/combat/random/criticalSampleSource';
import { createEmptyScenario } from '../../core/project/createProject';
import { gameDataRepository } from '../../data/gameDataRepository';
import { perlica } from '../../data/operators/perlica.generated';
import { runStandardPlayerDamageScenarioSimulation } from './runStandardPlayerDamageScenarioSimulation';

describe('active consumable input', () => {
  it('applies a generated Buff and replaces the previous consumable group on the same operator', () => {
    const [first, second] = gameDataRepository
      .getConsumables()
      .filter(
        (definition, index, values) =>
          index === 0 || definition.applications[0]?.buffId !== values[0]?.applications[0]?.buffId,
      );
    expect(first).toBeDefined();
    expect(second).toBeDefined();

    const scenario = createEmptyScenario('scenario:consumables', 'consumable integration');
    scenario.battle.durationFrames = 30;
    scenario.tracks[0] = {
      id: 'track:perlica',
      operator: {
        operatorSlug: perlica.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
      consumableUses: [
        { id: 'use:first', frame: 0, consumableId: first!.id },
        { id: 'use:second', frame: 10, consumableId: second!.id },
      ],
    };

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario,
      endFrame: 11,
      criticalSamples: new ExplicitCriticalSampleSource([]),
      resolveNonRandomRuntimeSnapshot: () => {
        throw new Error('consumable-only fixture must not resolve damage');
      },
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });

    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'ConsumableUsed')
        .map(entry => [entry.frame, entry.data?.consumableId]),
    ).toEqual([
      [0, first!.id],
      [10, second!.id],
    ]);
    expect(
      result.receiptEntries.some(
        entry =>
          entry.event === 'BuffFinished' &&
          entry.data?.buffId === first!.applications[0]!.buffId &&
          entry.frame === 10,
      ),
    ).toBe(true);
  });
});
