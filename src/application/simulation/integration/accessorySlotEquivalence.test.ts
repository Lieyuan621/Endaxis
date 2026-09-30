import { expect, it } from 'vitest';

import { createEmptyScenario } from '../../../core/project/createProject';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { skillSettings } from '../../../data/combat/skillSettings';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../scenarioSimulationService';

it('同一饰品放入任一槽位产生相同属性和伤害', async () => {
  const operator = gameDataRepository
    .getOperators()
    .find(candidate => candidate.skillGroups.some(group => group.key === 'basicAttack'));
  const gear = gameDataRepository.getGear('item_equip_t4_suit_burst01_edc_02');
  if (operator === undefined || gear === null)
    throw new Error('missing equipment test definitions');

  const simulate = async (slot: 'accessory1' | 'accessory2') => {
    const scenario = createEmptyScenario(`audit:equipment:${slot}`, '饰品槽位回归');
    scenario.battle.durationFrames = 300;
    scenario.enemy.editable.hp = 1_000_000_000;
    scenario.battle.resourceRules = {
      maxSp: 1000,
      initialSp: 1000,
      spRecoveryPerSecond: 100,
      defaultSkillSpCost: 100,
    };
    scenario.tracks[0] = {
      id: `track:equipment:${slot}`,
      operator: {
        operatorSlug: operator.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: Object.fromEntries(operator.skillGroups.map(group => [group.key, 12])),
        talentStates: Object.fromEntries(operator.talents.map((_, index) => [index, 0])),
      },
      weapon: null,
      gears: {
        armor: null,
        gloves: null,
        accessory1:
          slot === 'accessory1'
            ? {
                gearSlug: gear.slug,
                artificingLevels: gear.traits.map(trait => trait.levelCount - 1),
              }
            : null,
        accessory2:
          slot === 'accessory2'
            ? {
                gearSlug: gear.slug,
                artificingLevels: gear.traits.map(trait => trait.levelCount - 1),
              }
            : null,
      },
      initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
      skillCasts: [],
    };
    let nextId = 0;
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator,
      skillGroupKey: 'basicAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:${slot}:${++nextId}` },
    }).scenario;
    return new ScenarioSimulationService({
      index: gameDataRepository,
      resources: {
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecoveryPauseDuration: 1.5,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      },
      elementalInflictionDocument: elementalAttachments,
      spellInflictionSettings: skillSettings,
    }).simulate(placed, 300);
  };

  const first = await simulate('accessory1');
  const second = await simulate('accessory2');
  expect(second.operatorPanels[0]).toEqual({
    ...first.operatorPanels[0],
    operatorId: second.operatorPanels[0]!.operatorId,
  });
  expect(second.finalEnemyHealth).toBe(first.finalEnemyHealth);
});
