import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { TrackDocument } from '../../../core/project/schema';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

function track(slug: string, weaponSlug: string, casts: [string, string, number][]): TrackDocument {
  return {
    id: slug,
    operator: {
      operatorSlug: slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: { '0': 2, '1': 2 },
    },
    weapon: { weaponSlug, level: 90, tuned: true, potential: 0, traitLevels: [9, 9, 4] },
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: casts.map(([group, key, frame], index) => ({
      id: `${slug}:${index}`,
      source: { kind: 'operatorSkill', skillGroupKey: group, skillKey: key },
      placement: { startFrame: frame },
    })),
  };
}

it('别礼普攻触发的幻影仍继承战技来源，并触发赫拉芬格战技附着增益', async () => {
  const scenario = createEmptyScenario('phantom-origin', '幻影来源');
  scenario.tracks[0] = track('last-rite', 'wpn_claym_0013', [
    ['basicAttack', 'chr_0026_lastrite_attack1', 3],
    ['battleSkill', 'chr_0026_lastrite_normal_skill', 16],
    ['basicAttack', 'chr_0026_lastrite_attack4', 100],
  ]);
  const before = structuredClone(scenario);
  const run = await createEditorSimulationService().simulate(scenario, 300);
  expect(run.executionDiagnostics).toEqual([]);
  const infliction = run.receiptEntries.find(
    e => e.event === 'ElementalInflictionApplied' && e.sourceId === 'last-rite',
  );
  expect(infliction?.data).toMatchObject({
    skillId: 'chr_0026_lastrite_normal_skill',
    castId: 'last-rite:1',
    requestedElement: 'cryo',
  });
  expect(
    run.receiptEntries.find(
      e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_wpn_claym_0013_normal_skill',
    ),
  ).toMatchObject({ frame: infliction!.frame });
  expect(scenario).toEqual(before);
});

it('同一装备被动创建的多个持续动作Buff各自持有执行状态', async () => {
  const scenario = createEmptyScenario('passive-buff-instances', '武器Buff实例隔离');
  scenario.tracks[0] = track('arcane', 'wpn_funnel_0016', [
    ['comboSkill', 'chr_0032_lizhiyan_combo_skill', 1],
    ['comboSkill', 'chr_0032_lizhiyan_combo_skill', 100],
  ]);
  scenario.tracks[0]!.gears = {
    armor: { gearSlug: 'item_equip_t4_suit_usp02_body_03', artificingLevels: [3, 3] },
    gloves: { gearSlug: 'item_equip_t4_suit_usp02_hand_03', artificingLevels: [3, 3, 3] },
    accessory1: { gearSlug: 'item_equip_t4_suit_usp02_edc_04', artificingLevels: [3, 3] },
    accessory2: { gearSlug: 'item_equip_t4_suit_usp02_edc_04', artificingLevels: [3, 3] },
  };
  const run = await createEditorSimulationService().simulate(scenario, 700);
  expect(run.executionDiagnostics).toEqual([]);
  const buffs = run.receiptEntries.filter(
    e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_wpn_funnel_0016_will_dmg',
  );
  expect(new Set(buffs.map(e => e.data?.instanceId)).size).toBeGreaterThan(1);
});
