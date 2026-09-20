import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { tangtang } from '../../../data/operators/tangtang.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it.each([0, 1, 2])('汤汤预先放 %i 次连携后，战技水体分别独立按原生周期结算', async comboCount => {
  let scenario = createEmptyScenario('tangtang-water', '单水体');
  scenario.tracks[0] = {
    id: 'tangtang',
    operator: {
      operatorSlug: tangtang.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: { 0: 2, 1: 2 },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  let id = 0;
  for (let combo = 0; combo < comboCount; combo++) {
    scenario = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: tangtang,
      skillGroupKey: 'comboSkill',
      startFrame: 1 + combo * 300,
      ids: { allocate: kind => `${kind}:${++id}` },
    }).scenario;
  }
  const battleFrame = 1 + comboCount * 300;
  scenario = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: tangtang,
    skillGroupKey: 'battleSkill',
    startFrame: battleFrame,
    ids: { allocate: kind => `${kind}:${++id}` },
  }).scenario;
  const run = await createEditorSimulationService().simulate(scenario, battleFrame + 250);
  const hits = run.receiptEntries.filter(
    e => e.event === 'DamageApplied' && e.data?.skillType === 'battleSkill',
  );
  const water = hits.filter(e => e.data?.usesAttackSnapshot === true);
  const direct = hits.filter(e => e.data?.usesAttackSnapshot !== true);
  expect(water).toHaveLength(12 * (comboCount + 1));
  const waterByStep = new Map<string, number>();
  for (const hit of water) {
    const key = String(hit.data?.stepKey);
    waterByStep.set(key, (waterByStep.get(key) ?? 0) + 1);
  }
  expect(waterByStep.size).toBe(comboCount + 1);
  expect([...waterByStep.values()]).toEqual(Array(comboCount + 1).fill(12));
  expect(direct).toHaveLength(5);
  expect(water.every(e => e.data?.skillMultiplierPercent === 25)).toBe(true);
  expect(direct.every(e => e.data?.skillMultiplierPercent === 36)).toBe(true);
  expect(hits.every(e => e.data?.damageType === 'cryo')).toBe(true);
  expect(hits.reduce((sum, e) => sum + Number(e.data?.skillMultiplierPercent), 0)).toBe(
    480 + comboCount * 300,
  );
});
