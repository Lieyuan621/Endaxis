import { operatorOwner } from '../../../core/project/scenarioMarkers';
import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { createScenarioSimulationService } from '../createScenarioSimulationService';
import { projectSkillAvailabilityDiagnostics } from '../../../core/projection/skillAvailabilityDiagnostics';

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

it.each(['manual', 'automatic', 'skill'] as const)(
  '切换标签仅诊断，不改变主控或技能执行：%s',
  kind => {
    const scenario = createControlSwitchScenario('laevatain');
    scenario.battle.automaticControlSwitches = kind === 'automatic';
    const runtime =
      createScenarioSimulationService(gameDataRepository).createBuildAttributeRuntime(scenario);
    runtime.applyInitialInput({});
    runtime.stateGraph.operators
      .get('track:0')!
      .buffs!.entityTagCounts.set('Status/CantSwitchOutCenter', 1);
    runtime.stateGraph.operators
      .get('track:1')!
      .buffs!.entityTagCounts.set('Status/Ability/Skill/CantSwitchTocCenter', 1);
    if (kind === 'manual') runtime.advanceInputFrame({ controlledOperatorId: 'track:1' });
    else
      expect(
        runtime.tryStartPlayerInput(
          'track:1',
          kind === 'skill' ? 'chr_0016_laevat_ultimate_skill' : 'chr_0016_laevat_attack1',
          'cast:switch',
          kind === 'skill' ? 'ultimate' : 'basicAttack',
        ),
      ).toBe(true);
    expect(runtime.stateGraph.inputs.control.get('track:1')).toBe(true);
    expect(runtime.stateGraph.inputs.control.get('track:0')).toBe(false);
    const warnings = runtime.receipt.entries.filter(
      entry => entry.event === 'ControlSwitchBlockedByTag',
    );
    expect(warnings.map(entry => [entry.targetId, entry.data?.blocker])).toEqual(
      kind === 'skill'
        ? [['track:1', 'CantSwitchToCenter']]
        : [
            ['track:0', 'CantMainCharSwitched'],
            ['track:1', 'CantSwitchToCenter'],
          ],
    );
    expect(
      warnings.every(entry => entry.sourceId === 'track:1' && entry.data?.switchKind === kind),
    ).toBe(true);
    if (kind !== 'manual') {
      expect(warnings.every(entry => entry.data?.castId === 'cast:switch')).toBe(true);
      expect(projectSkillAvailabilityDiagnostics(warnings)[0]?.reasons).toEqual(
        kind === 'skill'
          ? ['controlSwitchInUnavailable']
          : ['controlSwitchOutUnavailable', 'controlSwitchInUnavailable'],
      );
    } else expect(projectSkillAvailabilityDiagnostics(warnings)).toEqual([]);
    const count = warnings.length;
    runtime.advanceInputFrame({ controlledOperatorId: 'track:1' });
    expect(
      runtime.receipt.entries.filter(entry => entry.event === 'ControlSwitchBlockedByTag'),
    ).toHaveLength(count);
    runtime.stateGraph.operators.get('track:0')!.buffs!.entityTagCounts.clear();
    runtime.stateGraph.operators.get('track:1')!.buffs!.entityTagCounts.clear();
    runtime.advanceInputFrame({ controlledOperatorId: 'track:0' });
    expect(
      runtime.receipt.entries.filter(entry => entry.event === 'ControlSwitchBlockedByTag'),
    ).toHaveLength(count);
  },
);

it('切面恢复后仍诊断卡缪终结技禁止切入，保持事件和主控一致', () => {
  const scenario = createControlSwitchScenario('camille');
  scenario.markers = [
    ...scenario.markers.filter(marker => marker.kind !== 'controlSwitch'),
    {
      kind: 'controlSwitch' as const,
      id: 'switch:camille',
      frame: 2,
      owner: operatorOwner(scenario, 1),
    },
  ];
  scenario.tracks[1]!.skillCasts = [
    {
      id: 'camille:ultimate',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'ultimate',
        skillKey: 'chr_0033_camille_ultimate_skill',
      },
      placement: { startFrame: 0 },
    },
  ];
  const session = createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
  session.advanceToFrame(1);
  expect(
    session.runtime
      .readState()
      .operators.get('track:1')!
      .buffs!.entityTagCounts.get('Status/Ability/Skill/CantSwitchTocCenter'),
  ).toBe(1);
  const restored = session.fork(session.runtime.save());
  for (const branch of [session, restored]) branch.advanceToFrame(3);
  expect(restored.runtime.readReceipts().entries).toEqual(session.runtime.readReceipts().entries);
  expect(restored.runtime.readState().inputs.control.get('track:1')).toBe(true);
  expect(
    restored.runtime
      .readReceipts()
      .entries.filter(entry => entry.event === 'ControlSwitchBlockedByTag'),
  ).toEqual([
    expect.objectContaining({
      sourceId: 'track:1',
      targetId: 'track:1',
      data: { blocker: 'CantSwitchToCenter', switchKind: 'manual' },
    }),
  ]);
});

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
