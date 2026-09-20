import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { TrackDocument } from '../../../core/project/schema';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it.each([null, 0])('别礼开场普攻夹战技：切入帧 %s 决定旁路，不隐式切主控', async switchFrame => {
  const scenario = createEmptyScenario('last-rite-control', '公开轴主控最小对照');
  const track: TrackDocument = {
    id: 'last-rite',
    operator: {
      operatorSlug: 'last-rite',
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
        id: 'a1',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0026_lastrite_attack1',
        },
        placement: { startFrame: 3 },
      },
      {
        id: 'battle',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0026_lastrite_normal_skill',
        },
        placement: { startFrame: 16 },
      },
      {
        id: 'a2',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0026_lastrite_attack2',
        },
        placement: { startFrame: 24 },
      },
    ],
  };
  scenario.tracks[3] = track;
  scenario.tracks[0] = {
    ...structuredClone(track),
    id: 'arcane',
    operator: { ...track.operator!, operatorSlug: 'arcane' },
    skillCasts: [],
  };
  if (switchFrame !== null)
    scenario.battle.controlSwitches.push({ id: 'control', frame: switchFrame, trackIndex: 3 });
  const before = structuredClone(scenario);
  const run = await createEditorSimulationService().simulate(scenario, 60);
  const controlled = switchFrame !== null;
  expect(run.executionDiagnostics).toEqual([]);
  expect(
    run.receiptEntries.some(e => e.event === 'SkillSwitchedToBuff' && e.data?.castId === 'battle'),
  ).toBe(controlled);
  expect(
    run.receiptEntries.some(
      e => e.event === 'SkillInterrupted' && e.frame === 16 && e.data?.castId === 'a1',
    ),
  ).toBe(!controlled);
  expect(
    run.receiptEntries.some(
      e => e.event === 'SkillInputResolvedToDifferentSkill' && e.data?.castId === 'a2',
    ),
  ).toBe(!controlled);
  // 主控还有原生停帧，旧轴固定间隔不因此自动成为有效间隔；强制输入仍执行 A2。
  expect(
    run.receiptEntries.find(e => e.event === 'SkillInputProcessed' && e.data?.castId === 'a2')
      ?.data,
  ).toMatchObject({ skillId: 'chr_0026_lastrite_attack2', accepted: true });
  expect(run.receiptEntries.some(e => e.frame < 0)).toBe(false);
  expect(scenario).toEqual(before);
});
