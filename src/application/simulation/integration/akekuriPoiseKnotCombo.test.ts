import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { akekuri } from '../../../data/operators/akekuri.generated';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('秋栗在敌人跨过中间失衡节点时开窗，无需完全失衡', async () => {
  const scenario = createEmptyScenario('akekuri-knot', '秋栗节点连携');
  scenario.enemy.editable.stagger.maximum = 20;
  scenario.enemy.editable.stagger.knotThresholds = [0.25, 0.5];
  scenario.tracks[0] = {
    id: 'akekuri',
    operator: {
      operatorSlug: akekuri.slug,
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
          skillKey: 'chr_0019_karin_normal_skill',
        },
        placement: { startFrame: 1 },
      },
    ],
  };
  const run = await createEditorSimulationService().simulate(scenario, 120);
  const knot = run.receiptEntries.find(entry => entry.event === 'PoiseKnotBroken');
  expect(knot).toBeDefined();
  const windows = run.receiptEntries.filter(entry => entry.event === 'ComboWindowOpened');
  expect(windows).toHaveLength(1);
  expect(windows[0]?.data?.nextSkillKey).toBe('chr_0019_karin_combo_skill');
  expect(windows[0]!.frame).toBeGreaterThanOrEqual(knot!.frame);
  expect(
    run.receiptEntries
      .filter(entry => entry.event === 'PoiseApplied')
      .some(entry => entry.data?.brokePoise === true),
  ).toBe(false);
});
