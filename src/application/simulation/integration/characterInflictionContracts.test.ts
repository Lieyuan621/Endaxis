import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { contingencyContractMechanicId } from '../../../data/mechanics/contingencyContractCatalog';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('失温叠满中断技能，冻结切面恢复后仅由对应属性的队友战技解冻', () => {
  const scenario = createEmptyScenario('cold-contract', '失温与解冻');
  const makeTrack = (slug: string, skillKey: string, frames: number[]) => ({
    id: slug,
    operator: {
      operatorSlug: slug,
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
    skillCasts: frames.map((frame, index) => ({
      id: `${slug}-${index}`,
      source: { kind: 'operatorSkill' as const, skillGroupKey: 'battleSkill', skillKey },
      placement: { startFrame: frame },
    })),
  });
  scenario.tracks[0] = makeTrack('perlica', 'chr_0004_pelica_normal_skill', [1, 95, 189, 283, 320]);
  scenario.tracks[1] = makeTrack('avywenna', 'chr_0012_avywen_normal_skill', [350]);
  scenario.tracks[2] = makeTrack('laevatain', 'chr_0016_laevat_normal_skill', [400]);
  scenario.mechanics.selections = [100302, 101701].map(tag => ({
    id: String(tag),
    mechanicId: contingencyContractMechanicId(tag),
    enabled: true,
    parameters: {},
  }));
  const session = createEditorSimulationService().createCombatSession(scenario, 450);
  session.advanceToFrame(250);
  const cold = session.runtime.save();
  session.advanceToFrame(300);
  const frozen = session.runtime.save();
  session.advanceToFrame(450);
  const result = session.collectResult();
  const freeze = result.receiptEntries.filter(
    entry => entry.data?.buffId === 'buff_common_enemy_spell_cryst_triggered_frozen',
  );
  expect(freeze.filter(entry => entry.event === 'BuffApplied').map(entry => entry.frame)).toEqual([
    283,
  ]);
  expect(freeze.filter(entry => entry.event === 'BuffFinished').map(entry => entry.frame)).toEqual([
    400,
  ]);
  expect(
    result.receiptEntries.some(
      entry =>
        entry.event === 'SkillInterrupted' && entry.sourceId === 'perlica' && entry.frame === 283,
    ),
  ).toBe(true);
  // 人工放置的非法输入保留执行，并让技能块显示无法行动的告警。
  expect(
    result.receiptEntries.some(
      entry => entry.event === 'SkillInputBlockedByCommonTag' && entry.data?.castId === 'perlica-4',
    ),
  ).toBe(true);
  expect(
    result.receiptEntries.some(
      entry => entry.event === 'SkillStarted' && entry.data?.castId === 'perlica-4',
    ),
  ).toBe(true);
  for (const checkpoint of [cold, frozen]) {
    const branch = session.fork(checkpoint);
    branch.advanceToFrame(450);
    expect(branch.collectResult()).toEqual(result);
  }
});
