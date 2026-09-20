import { describe, expect, it } from 'vitest';
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import type { CombatEnemyProgram } from '../runtime/combatRuntimeAssembly';
import { createEnemyCombatVitals } from './combatVitalsFactory';

function enemy(overrides: Partial<CombatEnemyProgram> = {}): CombatEnemyProgram {
  return {
    source: { kind: 'custom', level: 90 },
    rank: 'mob',
    health: 10000,
    superArmor: 0,
    defenderAttributes: {
      defense: 100,
      shelterDamageMultiplier: 0,
      breakingAttackDamageTakenMultiplier: 1,
      resistances: {
        physical: { percent: 0, damageTakenMultiplier: 1 },
        heat: { percent: 0, damageTakenMultiplier: 1 },
        electric: { percent: 0, damageTakenMultiplier: 1 },
        cryo: { percent: 0, damageTakenMultiplier: 1 },
        nature: { percent: 0, damageTakenMultiplier: 1 },
        ether: { percent: 0, damageTakenMultiplier: 1 },
      },
    },
    stagger: {
      maximum: 300,
      knotThresholds: [0.5],
      knotBreakDurationFrames: 60,
      brokenDurationFrames: 300,
      finisherSpRecovery: 100,
    },
    ...overrides,
  };
}

describe('createEnemyCombatVitals', () => {
  it('creates a full-poise ledger whenever the enemy has a positive poise maximum', () => {
    const vitals = createEnemyCombatVitals(enemy());

    expect(vitals.health).toBe(10000);
    expect(vitals.maxHealth).toBe(10000);
    expect(vitals.maxPoise).toBe(300);
    expect(vitals.poise).toBe(300);
    expect(vitals.hasPoise).toBe(true);
  });

  it('keeps intermediate knots on the same poise ledger', () => {
    const vitals = createEnemyCombatVitals(
      enemy({ stagger: { ...enemy().stagger, knotThresholds: [0.33, 0.66] } }),
    );

    expect(vitals.maxPoise).toBe(300);
    expect(vitals.poise).toBe(300);
    expect(vitals.hasPoise).toBe(true);
  });

  it('creates the poise ledger even when there are no intermediate knots', () => {
    const vitals = createEnemyCombatVitals(
      enemy({ stagger: { ...enemy().stagger, knotThresholds: [] } }),
    );

    expect(vitals.maxPoise).toBe(300);
    expect(vitals.poise).toBe(300);
    expect(vitals.hasPoise).toBe(true);
  });

  it('does not create a poise ledger when the maximum is zero', () => {
    const vitals = createEnemyCombatVitals(
      enemy({ stagger: { ...enemy().stagger, maximum: 0, knotThresholds: [] } }),
    );

    expect(vitals.maxPoise).toBe(0);
    expect(vitals.hasPoise).toBe(false);
  });

  it('converts the broken-duration frames into recovery time on the combat clock', () => {
    const vitals = createEnemyCombatVitals(enemy());
    vitals.applyPoiseDelta(-300);
    vitals.beginPoiseBreakIfZero();
    // brokenDurationFrames=300 帧换算为 10 秒；推进超过该时长后失衡恢复为满值。
    vitals.tick(300 * COMBAT_FRAME_INTERVAL);
    expect(vitals.poise).toBe(300);
  });
});
