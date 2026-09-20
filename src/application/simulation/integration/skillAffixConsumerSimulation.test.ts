import { expect, it } from 'vitest';
import { ExplicitCriticalSampleSource } from '../../../core/combat/random/criticalSampleSource';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { yvonne } from '../../../data/operators/yvonne.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { runStandardPlayerDamageScenarioSimulation } from '../runStandardPlayerDamageScenarioSimulation';

it.each([false, true])('伊冯正式战技 SkillAffix 生命周期 interruption=%s', interrupted => {
  const scenario = createEmptyScenario('affix:yvonne', '伊冯 SkillAffix 生命周期');
  scenario.battle.durationFrames = 300;
  scenario.enemy.editable.hp = 1e9;
  scenario.tracks[0] = {
    id: 'track:yvonne',
    operator: {
      operatorSlug: yvonne.slug,
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
  let placed = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: yvonne,
    skillGroupKey: 'battleSkill',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:yvonne:affix` },
  }).scenario;
  let nextInterruptCastId = 0;
  if (interrupted)
    placed = placeSkillGroup({
      scenario: placed,
      trackIndex: 0,
      operator: yvonne,
      skillGroupKey: 'basicAttack',
      startFrame: 10,
      ids: { allocate: kind => `${kind}:yvonne:interrupt:${++nextInterruptCastId}` },
    }).scenario;
  const result = runStandardPlayerDamageScenarioSimulation({
    scenario: placed,
    endFrame: 300,
    criticalSamples: new ExplicitCriticalSampleSource(Array(100).fill(1)),
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
    options: {
      index: gameDataRepository,
      resources: {
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecoveryPauseDuration: 1.5,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      },
    },
  });
  const entries = result.receiptEntries;
  const listenerEvents = entries.filter(
    entry => entry.data?.buffId === 'buff_chr_0017_yvonne_normal_skill_listener',
  );
  expect(listenerEvents.map(entry => entry.event)).toEqual([
    'BuffCreated',
    'BuffApplied',
    'BuffFinished',
  ]);
  const [created, applied, finished] = listenerEvents;
  expect(created!.subject).toMatchObject({
    kind: 'buff',
    ownerId: applied!.targetId,
    instanceId: applied!.data!.instanceId,
  });
  expect(created!.sequence).toBeLessThan(applied!.sequence);
  expect(applied!.frame).toBe(1);
  expect(finished!.data).toMatchObject({ instanceId: applied!.data!.instanceId, reason: 'other' });
  const damage = entries.filter(
    entry => entry.event === 'DamageApplied' && entry.data?.castId === 'skillCast:yvonne:affix',
  );
  expect(damage).toHaveLength(1);
  expect(damage[0]!.data!.stepKey).toContain('buff_chr_0017_yvonne_normal_skill_projectile:');
  const ends = entries.filter(
    entry =>
      entry.event === (interrupted ? 'SkillInterrupted' : 'SkillEnded') &&
      entry.data?.castId === 'skillCast:yvonne:affix',
  );
  expect(ends).toHaveLength(1);
  // 正式定义将投射物 Buff 绑定到动作区间：打断会同步执行其 finish 伤害。
  // 监听器必须活过这次伤害，随后才随施法引用归零结束；后续普攻不能复活它。
  expect(damage[0]!.sequence).toBeLessThan(ends[0]!.sequence);
  expect(ends[0]!.sequence).toBeLessThan(finished!.sequence);
  expect(finished!.frame).toBe(ends[0]!.frame);
  expect(damage[0]!.frame).toBe(interrupted ? 10 : 18);
  expect(ends[0]!.frame).toBe(interrupted ? 10 : 151);
});
