import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { skillSettings } from '../../../data/combat/skillSettings';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../scenarioSimulationService';

it.each([
  ['perlica', 52],
  ['arclight', 55],
] as const)('%s 终结技按原生 HideUI 时间结束演出', async (slug, endFrame) => {
  const operator = gameDataRepository.getOperator(slug)!;
  const scenario = createEmptyScenario(`hide-ui:${slug}`, '终结技演出时序');
  scenario.battle.durationFrames = 180;
  scenario.enemy.editable.hp = 1_000_000_000;
  scenario.battle.resourceRules = {
    maxSp: 1000,
    initialSp: 1000,
    spRecoveryPerSecond: 100,
    defaultSkillSpCost: 100,
  };
  scenario.tracks[0] = {
    id: `track:${slug}`,
    operator: {
      operatorSlug: slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: Object.fromEntries(operator.talents.map((_, index) => [index, 0])),
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
    skillCasts: [],
  };
  const placed = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator,
    skillGroupKey: 'ultimate',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:${slug}:ultimate` },
  }).scenario;
  const service = new ScenarioSimulationService({
    index: gameDataRepository,
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
    elementalInflictionDocument: elementalAttachments,
    spellInflictionSettings: skillSettings,
  });

  const result = await service.simulate(placed, 180);
  expect(
    result.receiptEntries
      .filter(entry => entry.event === 'UltimatePresentationChanged')
      .map(entry => [entry.frame, entry.data?.active]),
  ).toEqual([
    [1, true],
    [1 + endFrame, false],
  ]);
});
