import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { perlica } from '../../../data/operators/perlica.generated';
import { tangtang } from '../../../data/operators/tangtang.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('汤汤连携造成寒冷伤害，清波独立按全局时钟到期', async () => {
  async function simulate(withUltimate: boolean) {
    let scenario = createEmptyScenario('tangtang-qingbo', '连携与清波');
    for (const [index, operator] of [tangtang, perlica].entries()) {
      scenario.tracks[index as 0 | 1] = {
        id: operator.slug,
        operator: {
          operatorSlug: operator.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: {},
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: index === 0 ? 0 : 80 },
        skillCasts: [],
      };
    }
    scenario.tracks[0]!.gears = {
      armor: { gearSlug: 'item_equip_t4_suit_combo_cd01_body_01', artificingLevels: [0, 0, 0] },
      gloves: { gearSlug: 'item_equip_t4_suit_combo_cd01_hand_01', artificingLevels: [0, 0, 0] },
      accessory1: {
        gearSlug: 'item_equip_t4_suit_combo_cd01_edc_01',
        artificingLevels: [0, 0, 0],
      },
      accessory2: null,
    };
    let id = 0;
    for (const startFrame of [1, 301, 801]) {
      scenario = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: tangtang,
        skillGroupKey: 'comboSkill',
        startFrame,
        ids: { allocate: kind => `${kind}:${++id}` },
      }).scenario;
    }
    if (withUltimate) {
      scenario = placeSkillGroup({
        scenario,
        trackIndex: 1,
        operator: perlica,
        skillGroupKey: 'ultimate',
        startFrame: 400,
        ids: { allocate: kind => `${kind}:${++id}` },
      }).scenario;
    }
    const run = await createEditorSimulationService().simulate(scenario, 1400);
    const entries = run.receiptEntries;
    const damage = entries.filter(
      e =>
        e.event === 'DamageApplied' &&
        e.sourceId === tangtang.slug &&
        e.data?.skillType === 'comboSkill' &&
        e.data?.skillMultiplierPercent === 240,
    );
    expect(damage).toHaveLength(3);
    expect(damage.every(e => e.data?.damageType === 'cryo')).toBe(true);
    expect(
      entries.some(e => e.event === 'TimeDilationStarted' && e.sourceId === perlica.slug),
    ).toBe(withUltimate);
    const applied = entries.filter(
      e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_equipsuit_combo_cd01_spellup',
    );
    expect(applied).toHaveLength(3);
    const finished = applied.map(start => {
      const end = entries.find(
        e =>
          e.event === 'BuffFinished' &&
          e.data?.buffId === start.data?.buffId &&
          e.data?.instanceId === start.data?.instanceId,
      );
      expect(end?.data?.reason).toBe('lifetime');
      return end!;
    });
    return { applied, finished };
  }

  const normal = await simulate(false);
  const slowed = await simulate(true);
  const normalDurations = normal.finished.map(
    (end, index) => end.frame - normal.applied[index]!.frame,
  );
  const slowedDurations = slowed.finished.map(
    (end, index) => end.frame - slowed.applied[index]!.frame,
  );
  // 汤汤连携自身也会产生全局膨胀，故无队友终结技时的墙钟寿命也会超过 449 帧。
  expect(normalDurations.every(duration => duration >= 449)).toBe(true);
  expect(slowedDurations.every((duration, index) => duration >= normalDurations[index]!)).toBe(
    true,
  );
  expect(slowedDurations.some((duration, index) => duration > normalDurations[index]!)).toBe(true);
  expect(slowed.finished[0]!.frame).toBeGreaterThan(slowed.applied[1]!.frame);
  expect(slowed.finished[1]!.frame).toBeGreaterThan(slowed.applied[2]!.frame);
  expect(slowed.finished[0]!.frame).toBeLessThan(slowed.finished[1]!.frame);
});
