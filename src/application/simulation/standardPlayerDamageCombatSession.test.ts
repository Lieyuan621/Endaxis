import { expect, it } from 'vitest';
import { CombatVitals } from '../../core/combat/resources/combatVitals';
import { StandardPlayerDamageEnvironment } from '../../core/combat/runtime/standardPlayerDamageEnvironment';
import { createStandardPlayerDamageCombatSession } from './standardPlayerDamageCombatSession';

const enemy = {
  source: { kind: 'custom' as const, level: 1 },
  rank: 'mob' as const,
  health: 100,
  superArmor: 0,
  defenderAttributes: {
    defense: 0,
    shelterDamageMultiplier: 0,
    breakingAttackDamageTakenMultiplier: 1,
    resistances: Object.fromEntries(
      ['physical', 'heat', 'electric', 'cryo', 'nature', 'ether'].map(element => [
        element,
        { percent: 0, damageTakenMultiplier: 1 },
      ]),
    ) as Record<
      'physical' | 'heat' | 'electric' | 'cryo' | 'nature' | 'ether',
      { percent: number; damageTakenMultiplier: number }
    >,
  },
  stagger: {
    maximum: 0,
    knotThresholds: [],
    knotBreakDurationFrames: 0,
    brokenDurationFrames: 0,
    finisherSpRecovery: 0,
  },
};

const resources = {
  sp: 0,
  maxSp: 300,
  returnedSp: 0,
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecovery: { valuePerSecond: 3, pauseDuration: 0, pauseRemaining: 0 },
  ultimateEnergySystemUnlocked: false,
  normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
  squad: [],
};

const environmentInput = {
  criticalSamples: { nextCriticalSample: () => 1 },
  resolveNonRandomRuntimeSnapshot: () => ({
    runtimeExtensionMultiplier: 1,
    appliesIgniteDamageMultiplier: false,
    appliesPhysicalInflictionDamageMultiplier: false,
  }),
};

it('应用会话从检查点分叉并用同一状态图投影结果', () => {
  const environment = new StandardPlayerDamageEnvironment({
    ...environmentInput,
    enemyVitals: new CombatVitals({
      health: 100,
      maxHealth: 100,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    }),
  });
  const compiled = {
    ...environment.runtimeOptions,
    resources,
    enemy,
    operators: [],
  };
  const session = createStandardPlayerDamageCombatSession(compiled, environmentInput);
  session.advanceToFrame(3);
  const checkpoint = session.runtime.save();
  const parent = session.collectResult();

  const trial = session.fork(checkpoint);
  trial.advanceToFrame(5);
  const result = trial.collectResult();

  expect(parent.frame).toBe(3);
  expect(result.frame).toBe(5);
  expect(session.runtime.frame).toBe(3);
  expect(result.finalEnemyHealth).toBe(100);
  expect(result.enemyVitals).toEqual({
    initialHealth: 100,
    maxHealth: 100,
    initialPoise: 0,
    maxPoise: 0,
    finalPoise: 0,
  });
  expect(result.finalResources.sp).toBeGreaterThan(parent.finalResources.sp);
});
