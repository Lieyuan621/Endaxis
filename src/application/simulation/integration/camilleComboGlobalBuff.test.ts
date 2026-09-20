import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { ScenarioDocument } from '../../../core/project/schema';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

function createScenario(camilleTalentLevel: number): ScenarioDocument {
  const scenario = createEmptyScenario('camille-combo-global-buff', '卡米拉连携增伤');
  scenario.battle.durationFrames = 480;
  scenario.tracks[0] = {
    id: 'camille',
    operator: {
      operatorSlug: 'camille',
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: { '0': camilleTalentLevel },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'camille:battle',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0033_camille_normal_skill',
        },
        placement: { startFrame: 1 },
      },
      {
        id: 'camille:combo',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
        },
        placement: { startFrame: 220 },
      },
    ],
  };
  scenario.tracks[1] = {
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
        id: 'rossi:battle',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0028_wulfa_normal_skill',
        },
        placement: { startFrame: 300 },
      },
    ],
  };
  return scenario;
}

function expectedDamageForCast(
  entries: Awaited<
    ReturnType<ReturnType<typeof createEditorSimulationService>['simulate']>
  >['receiptEntries'],
  castId: string,
): number {
  return entries
    .filter(entry => entry.event === 'DamageApplied' && entry.data?.castId === castId)
    .reduce((total, entry) => total + Number(entry.data?.expectedDamage ?? 0), 0);
}

it('卡米拉天赋连携创建一层公共增益并由下一次洛茜战技按30%消费', async () => {
  const service = createEditorSimulationService();
  const [withoutTalent, withTalent] = await Promise.all([
    service.simulate(createScenario(0), 480),
    service.simulate(createScenario(1), 480),
  ]);

  const applied = withTalent.receiptEntries.filter(
    entry =>
      entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_common_affixes_combo_trigger',
  );
  expect(applied).toHaveLength(2);

  const instanceIds = new Set(applied.map(entry => entry.data?.instanceId));
  const consumed = withTalent.receiptEntries.filter(
    entry =>
      entry.event === 'BuffFinished' &&
      instanceIds.has(entry.data?.instanceId) &&
      entry.data?.reason === 'other',
  );
  expect(consumed).toHaveLength(2);
  expect(consumed.every(entry => entry.frame > applied[0]!.frame)).toBe(true);

  const baselineDamage = expectedDamageForCast(withoutTalent.receiptEntries, 'rossi:battle');
  const imbuedDamage = expectedDamageForCast(withTalent.receiptEntries, 'rossi:battle');
  expect(baselineDamage).toBeGreaterThan(0);
  expect(imbuedDamage / baselineDamage).toBeCloseTo(1.3, 6);
});
