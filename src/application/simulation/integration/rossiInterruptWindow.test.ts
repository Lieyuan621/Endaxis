import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { projectSkillCastActualDurationFrames } from '../../../core/projection/timelineDisplayTime';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('洛茜二段窗口过期后恢复一段槽位，冷却期间不能持续触发新窗口', async () => {
  const scenario = createEmptyScenario('rossi-combo-expiry', '洛茜连携过期');
  scenario.battle.durationFrames = 850;
  scenario.tracks[0] = {
    id: 'rossi',
    operator: {
      operatorSlug: 'rossi',
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
        id: 'combo',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0028_wulfa_combo_2_skill',
        },
        placement: { startFrame: 1 },
      },
      ...[300, 400, 500, 700].map(frame => ({
        id: `battle:${frame}`,
        source: {
          kind: 'operatorSkill' as const,
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0028_wulfa_normal_skill',
        },
        placement: { startFrame: frame },
      })),
    ],
  };
  scenario.tracks[1] = {
    ...structuredClone(scenario.tracks[0]!),
    id: 'perlica',
    operator: { ...scenario.tracks[0]!.operator!, operatorSlug: 'perlica' },
    skillCasts: [350, 450, 550, 750].map(frame => ({
      id: `infliction:${frame}`,
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'battleSkill',
        skillKey: 'chr_0004_pelica_normal_skill',
      },
      placement: { startFrame: frame },
    })),
  };
  const result = await createEditorSimulationService().simulate(scenario, 850);
  const entries = result.receiptEntries;
  const reset = entries.find(
    entry => entry.event === 'SkillCooldownAdjusted' && entry.data?.ready === false,
  )!;
  const ready = entries.find(
    entry => entry.event === 'SkillCooldownReady' && entry.frame > reset.frame,
  )!;
  expect(
    entries.some(
      entry =>
        entry.event === 'SkillSlotChanged' &&
        entry.frame === reset.frame &&
        entry.data?.previousSkillKey === 'chr_0028_wulfa_combo_3_skill' &&
        entry.data?.targetSkillKey === 'chr_0028_wulfa_combo_2_skill',
    ),
  ).toBe(true);
  expect(
    entries.some(
      entry =>
        entry.event === 'BuffApplied' &&
        entry.frame >= 300 &&
        entry.frame < ready.frame &&
        entry.data?.buffId === 'buff_physical_no_guard',
    ),
  ).toBe(true);
  expect(
    entries.filter(
      entry =>
        entry.event === 'ComboWindowOpened' &&
        entry.sourceId === 'rossi' &&
        entry.frame >= 300 &&
        entry.frame < ready.frame,
    ),
  ).toEqual([]);
  expect(
    entries.some(
      entry =>
        entry.event === 'ComboWindowOpened' &&
        entry.sourceId === 'rossi' &&
        entry.frame > ready.frame,
    ),
  ).toBe(true);
});

it('洛茜战技执行可中断标记后结束块体，块尾可接普攻', async () => {
  const scenario = createEmptyScenario('rossi-interrupt', '洛茜接续');
  scenario.tracks[0] = {
    id: 'rossi',
    operator: {
      operatorSlug: 'rossi',
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
          skillKey: 'chr_0028_wulfa_normal_skill',
        },
        placement: { startFrame: 1 },
      },
    ],
  };
  const service = createEditorSimulationService();
  const result = await service.simulate(scenario, 300);
  const duration = projectSkillCastActualDurationFrames(result.receiptEntries).get('battle');
  expect(duration).toBeDefined();
  expect(duration).toBeLessThan(100);
  scenario.tracks[0]!.skillCasts.push({
    id: 'attack',
    source: {
      kind: 'operatorSkill',
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0028_wulfa_attack1',
    },
    placement: { startFrame: 1 + duration! },
  });
  const continued = await service.simulate(scenario, 300);
  expect(
    continued.receiptEntries.filter(
      entry => entry.event === 'SkillInputCannotInterruptCurrentSkill',
    ),
  ).toEqual([]);
});
