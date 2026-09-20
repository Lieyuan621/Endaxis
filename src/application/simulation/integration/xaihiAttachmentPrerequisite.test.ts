import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { xaihi } from '../../../data/operators/xaihi.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('赛希连携先检查已有寒冷附着再施加本次附着；到期后不触发天赋或爆发', async () => {
  let scenario = createEmptyScenario('xaihi-prerequisite', '赛希附着前置');
  scenario.battle.durationFrames = 1300;
  scenario.tracks[0] = {
    id: 'xaihi',
    operator: {
      operatorSlug: xaihi.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: { 0: 2 },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  let id = 0;
  for (const startFrame of [1, 301, 1001])
    scenario = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: xaihi,
      skillGroupKey: 'comboSkill',
      startFrame,
      ids: { allocate: kind => `${kind}:${++id}` },
    }).scenario;
  const run = await createEditorSimulationService().simulate(scenario, 1300);
  const entries = run.receiptEntries;
  const inflictions = entries.filter(e => e.event === 'ElementalInflictionApplied');
  expect(inflictions.map(e => e.data?.outcomeKind)).toEqual([
    'attachmentOnly',
    'burst',
    'attachmentOnly',
  ]);
  const talent = entries.filter(
    e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0011_seraph_talent_1_crystup',
  );
  expect(talent).toHaveLength(1);
  expect(talent[0]!.frame).toBe(inflictions[1]!.frame);
  expect(entries.indexOf(talent[0]!)).toBeLessThan(entries.indexOf(inflictions[1]!));
  const expiration = entries.find(
    e =>
      e.event === 'BuffFinished' &&
      e.data?.buffId === 'buff_common_energy_shard_attached_cryst' &&
      e.data?.reason === 'lifetime',
  );
  expect(expiration).toBeDefined();
  expect(expiration!.frame).toBeGreaterThan(inflictions[1]!.frame);
  expect(expiration!.frame).toBeLessThan(inflictions[2]!.frame);
});
