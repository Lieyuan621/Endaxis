import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('伊冯和卡契尔同队时，自身 Buff 的施法状态检查不阻止模拟', async () => {
  const scenario = createEmptyScenario('yvonne-catcher', '倒地与自身施法检查');
  for (const [index, slug] of ['catcher', 'yvonne'].entries()) {
    scenario.tracks[index] = {
      id: `track:${slug}`,
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
      skillCasts:
        slug === 'yvonne'
          ? [
              {
                id: 'yvonne:battle',
                source: {
                  kind: 'operatorSkill',
                  skillGroupKey: 'battleSkill',
                  skillKey: 'chr_0017_yvonne_normal_skill',
                },
                placement: { startFrame: 1 },
              },
            ]
          : [],
    };
  }
  const result = await createEditorSimulationService().simulate(scenario, 120);
  expect(
    result.receiptEntries.some(
      entry => entry.event === 'SkillStarted' && entry.data?.castId === 'yvonne:battle',
    ),
  ).toBe(true);
});
