import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { contingencyContractMechanicId } from '../../../data/contingencyContract/contingencyContractCatalog';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

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

it('失温叠满中断技能，冻结切面恢复后仅由对应属性的队友战技解冻', () => {
  const scenario = createEmptyScenario('cold-contract', '失温与解冻');
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

it('受控回血合约按敌人生命账本治疗，冻结后的切面保持治疗和生命曲线一致', () => {
  const scenario = createEmptyScenario('enemy-heal-contract', '冻结回血');
  scenario.tracks[0] = makeTrack('tangtang', 'chr_0027_tangtang_normal_skill', [0]);
  scenario.tracks[1] = makeTrack('yvonne', 'chr_0017_yvonne_normal_skill', [111]);
  scenario.mechanics.selections = [
    {
      id: 'heal',
      mechanicId: contingencyContractMechanicId(101101),
      enabled: true,
      parameters: {},
    },
  ];
  const session = createEditorSimulationService().createCombatSession(scenario, 240);
  session.advanceToFrame(160);
  const checkpoint = session.runtime.save();
  session.advanceToFrame(240);
  const result = session.collectResult();
  const heals = result.receiptEntries.filter(
    entry => entry.event === 'HealingApplied' && entry.targetId === 'enemy',
  );
  expect(heals.length).toBeGreaterThan(1);
  for (const heal of heals) {
    expect(heal.sourceId).toBe('enemy');
    expect(heal.data?.attributeValue).toBe(scenario.enemy.editable.hp);
    expect(heal.data?.requestedHealing).toBeCloseTo(scenario.enemy.editable.hp * 0.05);
  }
  expect(heals.some(heal => Number(heal.data?.actualHealing) > 0)).toBe(true);
  const branch = session.fork(checkpoint);
  branch.advanceToFrame(240);
  expect(branch.collectResult()).toEqual(result);
});

it.each([0, 1])('萤石终结技按正式天赋配置驱散合约寒冷，切面恢复一致：天赋 %i', talent => {
  const scenario = createEmptyScenario('dispel-contract', '合约寒冷驱散');
  scenario.tracks[0] = makeTrack('perlica', 'chr_0004_pelica_normal_skill', [1, 95]);
  const healer = makeTrack('xaihi', 'chr_0011_seraph_ultimate_skill', [120]);
  healer.initialState.ultimateEnergy = 80;
  healer.operator.talentStates = { '1': talent };
  healer.skillCasts[0]!.source.skillGroupKey = 'ultimate';
  scenario.tracks[1] = healer;
  scenario.mechanics.selections = [
    {
      id: 'cold',
      mechanicId: contingencyContractMechanicId(100302),
      enabled: true,
      parameters: {},
    },
  ];
  const session = createEditorSimulationService().createCombatSession(scenario, 260);
  session.advanceToFrame(110);
  const checkpoint = session.runtime.save();
  session.advanceToFrame(260);
  const result = session.collectResult();
  const cold = result.receiptEntries.filter(
    entry =>
      entry.data?.buffId === 'buff_common_enemy_spell_cryst_attached' &&
      entry.targetId === 'perlica',
  );
  expect(cold.some(entry => entry.event === 'BuffApplied')).toBe(true);
  expect(
    cold.some(entry => entry.event === 'BuffFinished' && entry.data?.reason === 'dispelled'),
  ).toBe(talent === 1);
  const branch = session.fork(checkpoint);
  branch.advanceToFrame(260);
  expect(branch.collectResult()).toEqual(result);
});
