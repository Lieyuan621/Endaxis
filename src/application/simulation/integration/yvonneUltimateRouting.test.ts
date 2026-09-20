import { expect, it } from 'vitest';
import { ExplicitCriticalSampleSource } from '../../../core/combat/random/criticalSampleSource';
import { ExplicitProbabilitySampleSource } from '../../../core/combat/random/probabilitySampleSource';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { yvonne } from '../../../data/operators/yvonne.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { runStandardPlayerDamageScenarioSimulation } from '../runStandardPlayerDamageScenarioSimulation';

function simulate(attacks: readonly { key: string; frame: number }[] = []) {
  let scenario = createEmptyScenario('yvonne-routing', '伊冯终结技收尾');
  scenario.battle.durationFrames = 1000;
  scenario.enemy.editable.hp = 1e9;
  scenario.tracks[0] = {
    id: 'yvonne',
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
    initialState: { ultimateEnergy: 200 },
    skillCasts: [],
  };
  for (const [index, cast] of [
    { key: 'chr_0017_yvonne_ultimate_skill', frame: 1 },
    ...attacks,
  ].entries()) {
    scenario = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: yvonne,
      skillGroupKey: cast.key === 'chr_0017_yvonne_ultimate_skill' ? 'ultimate' : 'basicAttack',
      ...(cast.key.includes('_ult_attack') ? { variantKey: 'enhancedBasicAttack' } : {}),
      skillKey: cast.key,
      startFrame: cast.frame,
      ids: { allocate: kind => `${kind}:${index}` },
    }).scenario;
  }
  return runStandardPlayerDamageScenarioSimulation({
    scenario,
    endFrame: 1000,
    criticalSamples: new ExplicitCriticalSampleSource(Array(2000).fill(1)),
    probabilitySamples: new ExplicitProbabilitySampleSource(Array(2000).fill(1)),
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
  }).receiptEntries;
}

it('伊冯真实结束 Buff 覆盖3B循环路由，重击结束后撤销', () => {
  const baseline = simulate();
  const endBuff = baseline.find(
    entry =>
      entry.event === 'BuffApplied' &&
      entry.data?.buffId === 'buff_chr_0017_yvonne_ultimate_skill_end',
  );
  expect(endBuff).toBeDefined();
  const frame = endBuff!.frame;
  const entries = simulate([
    { key: 'chr_0017_yvonne_ult_attack3_2', frame: frame - 48 },
    { key: 'chr_0017_yvonne_ult_attack3_2', frame: frame - 32 },
    { key: 'chr_0017_yvonne_ult_attack3_2', frame: frame - 16 },
    { key: 'chr_0017_yvonne_ult_attack_end', frame: frame + 1 },
    { key: 'chr_0017_yvonne_attack1', frame: frame + 200 },
  ]);
  const routeErrors = entries.filter(
    entry =>
      ['skillCast:4', 'skillCast:5'].includes(String(entry.data?.castId)) &&
      entry.event.startsWith('SkillInput') &&
      entry.event !== 'SkillInputProcessed',
  );
  expect(routeErrors).toEqual([]);
  expect(
    entries.some(entry => entry.event === 'DamageApplied' && entry.data?.castId === 'skillCast:4'),
  ).toBe(true);
  expect(
    entries.some(
      entry =>
        entry.event === 'BuffFinished' &&
        entry.data?.buffId === 'buff_chr_0017_yvonne_ultimate_skill_end',
    ),
  ).toBe(true);

  const expired = baseline.find(
    entry =>
      entry.event === 'BuffFinished' &&
      entry.data?.buffId === 'buff_chr_0017_yvonne_ultimate_skill_end',
  )!;
  expect(expired).toBeDefined();
  for (const when of [frame - 1, expired.frame + 1]) {
    const outside = simulate([{ key: 'chr_0017_yvonne_ult_attack_end', frame: when }]);
    expect(
      outside.some(
        entry =>
          entry.event === 'SkillInputResolvedToDifferentSkill' &&
          entry.data?.castId === 'skillCast:1',
      ),
    ).toBe(true);
  }
  const afterExpiry = simulate([{ key: 'chr_0017_yvonne_attack1', frame: expired.frame + 1 }]);
  expect(
    afterExpiry.filter(
      entry =>
        entry.event.startsWith('SkillInput') &&
        entry.event !== 'SkillInputProcessed' &&
        entry.data?.castId === 'skillCast:1',
    ),
  ).toEqual([]);
});
