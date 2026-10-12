import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('佩丽卡战技先扣费，再依次附着、造成伤害和失衡、回复终结技能量', async () => {
  const scenario = createEmptyScenario('perlica-order', 'perlica');
  scenario.tracks[0] = {
    id: 'perlica',
    operator: {
      operatorSlug: 'perlica',
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
        id: 'battle',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0004_pelica_normal_skill',
        },
        placement: { startFrame: 0 },
      },
    ],
  };
  const run = await createEditorSimulationService().simulate(scenario, 20);
  expect(
    run.receiptEntries.filter(
      entry =>
        entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_common_obtain_ultimate_sp',
    ),
  ).toHaveLength(1);
  const events = run.receiptEntries
    .filter(entry =>
      [
        'SkillCostApplied',
        'ElementalInflictionApplied',
        'DamageApplied',
        'PoiseApplied',
        'UltimateEnergyChanged',
      ].includes(entry.event),
    )
    .map(entry => entry.event);
  expect(events).toEqual([
    'SkillCostApplied',
    'ElementalInflictionApplied',
    'DamageApplied',
    'PoiseApplied',
    'UltimateEnergyChanged',
  ]);
});
