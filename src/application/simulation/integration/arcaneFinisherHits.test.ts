import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { arcane } from '../../../data/operators/arcane.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('诀处决按原生分段与目标触发间隔执行，不合并成旧版单次伤害', async () => {
  let scenario = createEmptyScenario('arcane-finisher', '诀处决');
  scenario.tracks[0] = {
    id: 'arcane',
    operator: {
      operatorSlug: arcane.slug,
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
  };
  let id = 0;
  scenario = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: arcane,
    skillGroupKey: 'finisher',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:${++id}` },
  }).scenario;
  const run = await createEditorSimulationService().simulate(scenario, 200);
  const damage = run.receiptEntries.filter(e => e.event === 'DamageApplied');
  expect(damage).toHaveLength(6);
  expect(damage.every(e => e.data?.skillType === 'finisher')).toBe(true);
  const base = damage.map(e => e.data?.baseDamage as number);
  for (const value of base.slice(0, 5)) expect(value).toBeCloseTo(base[0]!, 4);
  expect(base[5]! / base[0]!).toBeCloseTo(5, 5);
  expect(new Set(damage.map(e => e.data?.castId)).size).toBe(1);
  // 原生时间轴包含结束帧：局部 32 帧立即命中，35 帧已超过 0.067 秒间隔。
  expect(damage.map(hit => hit.frame)).toEqual([8, 11, 14, 33, 36, 37]);
});
