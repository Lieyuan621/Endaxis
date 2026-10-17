import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { perlica } from '../../../data/operators/perlica.generated';
import { tangtang } from '../../../data/operators/tangtang.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';
import { projectSkillCastInterruptionFrames } from '../../../core/projection/timelineDisplayTime';
import { CombatReceiptHistory } from '../../../core/combat/receipt/combatReceiptHistory';
import { SkillInputGroupTiming } from '../../../core/combat/skills/skillInputGroupTiming';

it.each([
  [true, 75, false, 'comboSkill'],
  [false, 75, true, 'comboSkill'],
  [true, 350, true, 'comboSkill'],
  [true, 65, false, 'plungingAttack'],
  [true, 150, true, 'plungingAttack'],
  [true, 30, false, 'plungingAttack'],
  [true, 21, false, 'plungingAttack'],
] as const)(
  '插入技能保留主控普攻连段且缓存会到期：主控=%s，接续帧=%s，身份错配=%s，操作=%s',
  async (controlled, nextFrame, mismatch, insertedType) => {
    const scenario = createEmptyScenario('tangtang-offset', '连携插入普攻');
    scenario.battle.automaticControlSwitches = false;
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
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
    }
    if (!controlled)
      scenario.battle.controlSwitches.push({ id: 'control', frame: 0, trackIndex: 1 });
    scenario.tracks[0]!.skillCasts = [
      {
        id: 'a1',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0027_tangtang_attack1',
        },
        placement: { startFrame: 0 },
      },
      {
        id: 'combo',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: insertedType,
          skillKey:
            insertedType === 'comboSkill'
              ? 'chr_0027_tangtang_combo_skill'
              : 'chr_0027_tangtang_plunging_attack_end',
        },
        placement: { startFrame: 20 },
      },
      {
        id: 'a2',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0027_tangtang_attack2',
        },
        placement: { startFrame: nextFrame },
      },
    ];
    const session = createEditorSimulationService().createCombatSession(scenario);
    session.advanceToFrame(Math.min(40, nextFrame + 1));
    if (insertedType === 'plungingAttack' && nextFrame <= 30) {
      const motion = session.runtime.readState().operators.get('tangtang')!.ability.plungingAttack;
      expect(motion?.cancelled).toBe(true);
      expect(motion?.motion.stage).toBe(nextFrame === 21 ? 'landed' : 'freeFall');
      if (nextFrame > 21) expect(motion!.motion.height).toBeGreaterThan(0);
    }
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(nextFrame + 40);
    restored.advanceToFrame(nextFrame + 40);
    const result = session.collectResult();
    expect(restored.collectResult()).toEqual(result);
    if (insertedType === 'plungingAttack') {
      const starts = result.receiptEntries.filter(
        e => e.event === 'SkillStarted' && e.data?.castId === 'combo',
      );
      const cancelled = nextFrame <= 30;
      expect(starts.map(e => e.data?.skillId)).toEqual(
        nextFrame === 21
          ? []
          : cancelled
            ? ['chr_0027_tangtang_plunging_attack_start']
            : ['chr_0027_tangtang_plunging_attack_start', 'chr_0027_tangtang_plunging_attack_end'],
      );
      if (starts.length) expect(starts[0]!.frame).toBeGreaterThan(20);
      const hits = result.receiptEntries.filter(
        e => e.event === 'DamageApplied' && e.data?.castId === 'combo',
      );
      if (cancelled) {
        expect(hits).toHaveLength(0);
        const history = new CombatReceiptHistory();
        for (const entry of result.receiptEntries) history.append(entry);
        const timing = new SkillInputGroupTiming(history, () => 1);
        expect(timing.find('combo', 'SkillInputInterrupted')?.frame).toBe(nextFrame);
        expect(projectSkillCastInterruptionFrames(result.receiptEntries).get('combo')).toBe(
          nextFrame,
        );
        expect(
          session.runtime.readState().operators.get('tangtang')!.ability.plungingAttack?.motion,
        ).toMatchObject({ stage: 'landed', height: 0, velocity: 0 });
      } else {
        expect(starts[1]!.frame).toBeGreaterThan(starts[0]!.frame + 18);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.every(e => e.frame >= starts[1]!.frame)).toBe(true);
      }
    }
    expect(
      result.receiptEntries.some(
        e => e.event === 'SkillInputResolvedToDifferentSkill' && e.data?.castId === 'a2',
      ),
    ).toBe(mismatch);
  },
);

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
