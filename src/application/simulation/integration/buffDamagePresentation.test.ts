import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillSettings } from '../../../data/combat/skillSettings';
import { ScenarioSimulationService } from '../scenarioSimulationService';
import { projectBuffTimelineViz } from '../../../core/projection/buffTimelineViz';
import { projectEnemyEffectViz } from '../../../core/projection/enemyEffectViz';
import { findBuffDamageSegment } from '../../../ui/timeline/results/enemyBuffDamageHits';

it('links real Perlica then Wulfgard burning damage to visible status segments', async () => {
  const scenario = createEmptyScenario('burn-qa', 'burn-qa');
  scenario.battle.durationFrames = 600;
  for (const [index, slug] of ['perlica', 'wulfgard'].entries()) {
    scenario.tracks[index as 0 | 1] = {
      id: `track:${index}`,
      operator: {
        operatorSlug: slug,
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
      skillCasts: [
        {
          id: `cast:${index}`,
          source: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey:
              slug === 'perlica' ? 'chr_0004_pelica_normal_skill' : 'chr_0006_wolfgd_normal_skill',
          },
          placement: { startFrame: index === 0 ? 1 : 100 },
        },
      ],
    };
  }
  const run = await new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
  }).simulate(scenario, 600);
  const segments = projectBuffTimelineViz(run.receiptEntries, 600);
  const hits = projectEnemyEffectViz(run.receiptEntries, 600).damageHits ?? [];
  expect(hits.length).toBeGreaterThan(1);
  for (const hit of hits)
    expect(findBuffDamageSegment(hit, segments), JSON.stringify(hit)).toBeDefined();
});
