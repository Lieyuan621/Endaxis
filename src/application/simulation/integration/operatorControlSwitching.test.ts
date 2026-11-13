import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { createScenarioSimulationService } from '../createScenarioSimulationService';

it.each([
  ['laevatain', 'chr_0016_laevat_ultimate_skill'],
  ['yvonne', 'chr_0017_yvonne_ultimate_skill'],
])('终结技按原生配置切换主控，即使关闭自动切人：%s', async (slug, skillKey) => {
  const scenario = createControlSwitchScenario(slug);
  const service = createScenarioSimulationService(gameDataRepository);
  const runtime = service.createBuildAttributeRuntime(scenario);
  const first = runtime.stateGraph.operators.get('track:0')!.ability;
  const second = runtime.stateGraph.operators.get('track:1')!.ability;
  first.comboOffsetTargetSkillKey = [...first.nativeSkillTypeBySkillId].find(
    ([, type]) => type === 'attack',
  )![0];
  second.comboOffsetTargetSkillKey = [...second.nativeSkillTypeBySkillId].find(
    ([, type]) => type === 'attack',
  )![0];
  // 手动切人经过同一入口；切回并重新准备残留进度后再验证终结技强制切人。
  const oldCenter = runtime.stateGraph.operators.get('track:0')!.center;
  oldCenter.state = 'dash';
  oldCenter.dashId = 'dash:old';
  runtime.applyInitialInput({ controlledOperatorId: 'track:1' });
  expect(oldCenter.state).toBe('free');
  expect(oldCenter.dashId).toBeNull();
  expect(first.comboOffsetTargetSkillKey).toBeNull();
  expect(second.comboOffsetTargetSkillKey).toBeNull();
  runtime.advanceInputFrame({ controlledOperatorId: 'track:0' });
  first.comboOffsetTargetSkillKey = [...first.nativeSkillTypeBySkillId].find(
    ([, type]) => type === 'attack',
  )![0];
  second.comboOffsetTargetSkillKey = [...second.nativeSkillTypeBySkillId].find(
    ([, type]) => type === 'attack',
  )![0];
  runtime.tryStartPlayerInput('track:1', skillKey, 'ultimate:1', 'ultimate');
  expect(runtime.stateGraph.inputs.control.get('track:1')).toBe(true);
  expect(runtime.stateGraph.inputs.control.get('track:0')).toBe(false);
  expect(first.comboOffsetTargetSkillKey).toBeNull();
  expect(second.comboOffsetTargetSkillKey).toBeNull();
  expect(runtime.receipt.entries).toContainEqual(
    expect.objectContaining({ event: 'SkillControlSwitched', sourceId: 'track:1' }),
  );
});

function createControlSwitchScenario(slug: string) {
  const scenario = createEmptyScenario('control-switch', 'control-switch');
  scenario.battle.automaticControlSwitches = false;
  for (let i = 0; i < 2; i++)
    scenario.tracks[i] = {
      id: `track:${i}`,
      operator: {
        operatorSlug: i === 0 ? 'perlica' : slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
      skillCasts: [],
    };
  return scenario;
}

it.each([
  ['manual', false, true],
  ['automatic', false, true],
  ['manual', true, false],
  ['unchanged', false, false],
] as const)('普攻接续检查：切换=%s，保留技能=%s', (mode, keepSkill, mismatched) => {
  const scenario = createControlSwitchScenario('laevatain');
  scenario.battle.automaticControlSwitches = mode === 'automatic';
  const runtime =
    createScenarioSimulationService(gameDataRepository).createBuildAttributeRuntime(scenario);
  runtime.applyInitialInput({});
  expect(
    runtime.tryStartPlayerInput('track:0', 'chr_0004_pelica_attack1', 'a1', 'basicAttack'),
  ).toBe(true);
  for (let frame = 0; frame < 10; frame++) runtime.advanceInputFrame({});
  expect(runtime.stateGraph.operators.get('track:0')!.ability.comboOffsetTargetSkillKey).toBe(
    'chr_0004_pelica_attack2',
  );
  if (keepSkill)
    runtime.stateGraph.operators
      .get('track:0')!
      .buffs!.entityTagCounts.set('Status/DontInterruptSkillBySwitchIn', 1);
  if (mode !== 'unchanged') runtime.advanceInputFrame({ controlledOperatorId: 'track:1' });
  else runtime.advanceInputFrame({ controlledOperatorId: 'track:0' });
  if (mode === 'manual') runtime.advanceInputFrame({ controlledOperatorId: 'track:0' });
  runtime.tryStartPlayerInput('track:0', 'chr_0004_pelica_attack2', 'a2', 'basicAttack');
  const interrupted = runtime.receipt.entries.find(
    entry =>
      entry.event === 'SkillInterrupted' &&
      entry.data?.castId === 'a1' &&
      entry.data?.reason === 'enterFreeState',
  );
  if (mismatched) expect(interrupted?.data?.reason).toBe('enterFreeState');
  else expect(interrupted).toBeUndefined();
  const mismatch = runtime.receipt.entries.find(
    entry => entry.event === 'SkillInputResolvedToDifferentSkill' && entry.data?.castId === 'a2',
  );
  if (mismatched)
    expect(mismatch).toMatchObject({
      sourceId: 'track:0',
      data: { skillId: 'chr_0004_pelica_attack2', actualSkillId: 'chr_0004_pelica_attack1' },
    });
  else expect(mismatch).toBeUndefined();
});
