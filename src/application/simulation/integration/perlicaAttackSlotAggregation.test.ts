import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { resolveScenarioBuilds } from '../../../core/compiler/resolveScenarioBuilds';
import { resolveScenarioOperatorPanels } from '../../../core/compiler/resolveOperatorPanel';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { perlica } from '../../../data/operators/perlica.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('佩丽卡潜能的攻击 Buff 与武器攻击词条按同槽加算，而非在成品面板上相乘', async () => {
  let scenario = createEmptyScenario('perlica-attack-slots', '攻击槽位');
  scenario.tracks[0] = {
    id: 'perlica',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 3,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: {
      weaponSlug: 'wpn_funnel_0005',
      level: 90,
      tuned: true,
      potential: 5,
      traitLevels: [9, 9, 9],
    },
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  let id = 0;
  scenario = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: perlica,
    skillGroupKey: 'comboSkill',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:${++id}` },
  }).scenario;
  const panel = resolveScenarioOperatorPanels(
    resolveScenarioBuilds(scenario, gameDataRepository),
  )[0]!;
  expect(panel.attackBase).toEqual({ rawValue: 714, baseMultiplier: 0.312, baseFinalAddition: 0 });
  const run = await createEditorSimulationService().simulate(scenario, 100);
  const buff = run.receiptEntries.find(
    e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0004_pelica_potential_3_atkup',
  );
  expect(buff).toBeDefined();
  const damage = run.receiptEntries.find(e => e.event === 'DamageApplied');
  expect(damage).toBeDefined();
  // 当前生成潜能 3 的 atk_up 为 0.2；四维仍来自正式构筑，不手造额外 Buff。
  const attributeScalar =
    1 +
    panel.attributes.intellect * Math.fround(0.005) +
    panel.attributes.will * Math.fround(0.002);
  expect(damage!.data?.attack).toBe(Math.floor(714 * (1 + 0.312 + 0.2) * attributeScalar));
  expect(damage!.data?.attack).not.toBe(
    Math.floor(panel.attackBeforeAttributeScalar * 1.2 * attributeScalar),
  );
});
