import { expect, it } from 'vitest';
import { createLowStarShareRegressionScenario } from '../testSupport/publicShareRegressionFixture';
import { ScenarioSimulationService } from '../scenarioSimulationService';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillSettings } from '../../../data/combat/skillSettings';
import { projectBuffTimelineViz } from '../../../core/projection/buffTimelineViz';
import { projectEnemyEffectViz } from '../../../core/projection/enemyEffectViz';
import { findBuffDamageSegment } from '../../../ui/timeline/results/enemyBuffDamageHits';
import { layoutEnemyDamageHits } from '../../../ui/timeline/results/enemyDamageHitLayout';
import { ActionExecutionTrace } from '../../../core/combat/actions/actionExecutionTrace';
import { indexExecutionTrace, directTraceReceipts } from '../executionTraceNavigation';
import { getCompiledGraphLocation } from '../../../core/compiler/compileActionGraph';

it('伊冯重击的同步连携检查可进入，但不插入本图步进且不重复计入伤害回执', () => {
  const { scenario } = createLowStarShareRegressionScenario();
  const track = scenario.tracks[0]!;
  track.operator!.operatorSlug = 'yvonne';
  const group = gameDataRepository
    .getOperator('yvonne')!
    .skillGroups.find(g => g.key === 'basicAttack')!;
  const skill = (Array.isArray(group.skills) ? group.skills : [group.skills]).at(-1)!;
  track.skillCasts = [
    {
      id: 'trace-heavy',
      source: { kind: 'operatorSkill', skillGroupKey: group.key, skillKey: skill.key },
      placement: { startFrame: 0 },
    },
  ];
  for (const other of scenario.tracks.slice(1)) if (other) other.skillCasts = [];
  scenario.battle.durationFrames = 90;
  const service = new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
  });
  const trace = new ActionExecutionTrace('trace-heavy');
  const result = service.diagnoseExecution(scenario, trace);
  const index = indexExecutionTrace(
    trace.records,
    r => getCompiledGraphLocation(r.program, r.nodeId)?.resource === skill.actionGraph,
  );
  const steps = index.root.records.filter(r => r.phase === 'execute');
  const damageIndex = steps.findIndex(
    r => getCompiledGraphLocation(r.program, r.nodeId)?.nodeId === 'dealDamage_6',
  );
  const damage = steps[damageIndex]!;
  expect(
    getCompiledGraphLocation(steps[damageIndex + 1]!.program, steps[damageIndex + 1]!.nodeId)
      ?.nodeId,
  ).toBe('conditional_5');
  const calls = index.children.get(damage.sequence)!;
  expect(calls.length).toBeGreaterThan(0);
  expect(calls.every(call => call.parent === index.root && call.caller === damage)).toBe(true);
  const condition = calls.flatMap(call => call.records).find(record => record.callOutcome)!;
  expect(condition.callOutcome?.purpose).toBe('comboCandidate');
  // 同程序、同事件及同局部 invocation，仍必须按真实调用身份区分。
  const copied = [
    { ...damage, sequence: 0, parent: undefined },
    { ...condition, sequence: 1, parent: 0 },
    { ...condition, sequence: 2, parent: 0, callId: condition.callId! + 100 },
    { ...condition, sequence: 3, parent: 0, executionHostId: condition.executionHostId! + 100 },
  ];
  expect(indexExecutionTrace(copied).children.get(0)).toHaveLength(3);
  expect(
    calls.some(call => call.records.some(r => r.observations.some(o => o.kind === 'condition'))),
  ).toBe(true);
  const direct = trace.records.flatMap(r =>
    directTraceReceipts(r, trace.records, result.receiptEntries),
  );
  expect(new Set(direct.map(r => r.sequence)).size).toBe(direct.length);
});

it('does not quantize through legacy millisecond-rounded display times', () => {
  const { quantization } = createLowStarShareRegressionScenario();
  // Actual output of upstream 4dadc55f compileTimeline for source 623 / 60 is 10.383s.
  // Rounding that display value again would incorrectly choose frame 311 instead of 312.
  expect(quantization.find(row => row.sourceFrame === 623)?.frame).toBe(312);
  expect(quantization.find(row => row.sourceFrame === 943)?.frame).toBe(472);
  expect(quantization.find(row => row.sourceFrame === 965)?.frame).toBe(483);
});

it('runs the public low-star action sequence with native definitions without rewriting placements', async () => {
  const { scenario, quantization } = createLowStarShareRegressionScenario();
  expect(quantization.every(row => Math.abs(row.errorSeconds) <= 1 / 60 + 1e-12)).toBe(true);
  const before = JSON.stringify(scenario);
  const service = new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
  });
  const run = await service.simulate(scenario, scenario.battle.durationFrames);
  const trace = new ActionExecutionTrace(scenario.tracks[0]!.skillCasts[0]!.id);
  const diagnosed = service.diagnoseExecution(scenario, trace);
  expect(diagnosed.receiptEntries).toEqual(run.receiptEntries);
  expect(trace.records.some(record => record.phase === 'execute')).toBe(true);
  expect(trace.records.some(record => record.receiptEnd > record.receiptStart)).toBe(true);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(run.receiptEntries.some(entry => entry.event === 'DamageApplied')).toBe(true);
  const segments = projectBuffTimelineViz(run.receiptEntries, run.frame);
  const viz = projectEnemyEffectViz(run.receiptEntries, run.frame);
  const hits = viz.damageHits ?? [];
  expect(hits.length).toBeGreaterThan(0);
  const positionedHits = layoutEnemyDamageHits(
    run.receiptEntries,
    segments,
    viz.markers,
    new Set(),
  );
  const positionedSequences = new Set(
    positionedHits.flatMap(position => position.group.map(entry => entry.sequence)),
  );
  for (const hit of hits) {
    expect(positionedSequences.has(hit.sequence), JSON.stringify(hit)).toBe(true);
    // 隐藏子 Buff 的伤害可以挂到可见父 Buff；只有二者都没有时才独立显示。
    const displayOwner = viz.damageDisplayOwners?.[hit.sequence];
    if (findBuffDamageSegment(hit, segments) === undefined && displayOwner === undefined)
      expect(
        positionedHits.some(
          position =>
            position.standalone && position.group.some(entry => entry.sequence === hit.sequence),
        ),
      ).toBe(true);
    if (displayOwner !== undefined) {
      expect(
        positionedHits.some(
          position =>
            !position.standalone && position.group.some(entry => entry.sequence === hit.sequence),
        ),
        JSON.stringify(hit),
      ).toBe(true);
    }
  }
  expect(segments.some(segment => segment.buffId === 'buff_common_cryst_fire_triggered')).toBe(
    true,
  );
  // The test configuration deliberately differs from the author's loadout. Warnings are allowed;
  // they must not erase placements or force the editor to "repair" this imported action pattern.
});

it('公开轴动作序列从中途检查点续算与从头运行完全一致', () => {
  const { scenario } = createLowStarShareRegressionScenario();
  const service = new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
  });
  const original = service.createCombatSession(scenario);
  const checkpointFrame = Math.floor(scenario.battle.durationFrames / 2);
  original.advanceToFrame(checkpointFrame);
  const checkpoint = original.runtime.save();
  const restored = original.fork(checkpoint);

  original.advanceToFrame(scenario.battle.durationFrames);
  restored.advanceToFrame(scenario.battle.durationFrames);

  expect(restored.collectResult()).toEqual(original.collectResult());
});
