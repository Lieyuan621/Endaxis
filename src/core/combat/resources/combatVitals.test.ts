import { describe, expect, it } from 'vitest';
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import { CombatVitals } from './combatVitals';
import { StateStepper } from '../runtime/stateStepper';
import {
  registerVitalsHealthFloor,
  removeVitalsHealthFloor,
  takeVitalsDamage,
  tickVitals,
} from './combatVitalsExecution';

function createVitals(overrides: Partial<ConstructorParameters<typeof CombatVitals>[0]> = {}) {
  return new CombatVitals({
    health: 1000,
    maxHealth: 1000,
    maxPoise: 100,
    poise: 100,
    poiseRecoveryTime: 1,
    poiseRecoveryTimeMultiplier: 1,
    poiseBrokenEndTime: 0,
    poiseImmune: false,
    ...overrides,
  });
}

describe('CombatVitals', () => {
  it('restores a running poise timer and the owning health floor handle together', () => {
    const vitals = createVitals({ poise: 0 });
    vitals.beginPoiseBreakIfZero();
    vitals.tick(0.25);
    const floorId = registerVitalsHealthFloor(vitals.runtimeState, 500);
    const session = new StateStepper(
      { vitals: vitals.runtimeState, floorId },
      (step, remove: boolean) => {
        if (remove) removeVitalsHealthFloor(step.state.vitals, step.state.floorId);
        const damage = takeVitalsDamage(step.state.vitals, 800);
        return { damage: damage.actualDamage, transitions: tickVitals(step.state.vitals, 0.75) };
      },
    );
    const root = session.save();
    expect(session.step(false)).toEqual({ damage: 500, transitions: ['poiseRecovered'] });
    session.restore(root);
    expect(session.read().vitals.poiseRecoveryTimer.remaining).toBe(0.75);
    expect(session.step(true)).toEqual({ damage: 800, transitions: ['poiseRecovered'] });
    expect(vitals.health).toBe(1000);
    expect(vitals.poise).toBe(0);
  });
  it('uses the highest active health floor without healing when a floor is installed', () => {
    const vitals = new CombatVitals({
      health: 800,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const removeLow = vitals.registerHealthFloor(500);
    const removeHigh = vitals.registerHealthFloor(650);

    expect(vitals.takeDamage(300).currentHealth).toBe(650);
    removeHigh();
    expect(vitals.takeDamage(300).currentHealth).toBe(500);
    removeLow();
    expect(vitals.takeDamage(300).currentHealth).toBe(200);

    const removeAboveCurrent = vitals.registerHealthFloor(900);
    expect(vitals.takeDamage(10).currentHealth).toBe(200);
    removeAboveCurrent();
  });

  it('requires a positive maximum health that covers current health', () => {
    expect(() => createVitals({ maxHealth: 0 })).toThrow('maxHealth must be positive');
    expect(() => createVitals({ health: 1001 })).toThrow('health exceeds maxHealth');
  });

  it('clamps health damage to zero and reports actual damage', () => {
    const vitals = createVitals({ health: 100 });
    expect(vitals.takeDamage(150)).toEqual({
      requestedDamage: 150,
      actualDamage: 100,
      previousHealth: 100,
      currentHealth: 0,
    });
  });

  it('records raw, actual, and overhealing even when already full', () => {
    const wounded = createVitals({ health: 900 });
    expect(wounded.heal(150)).toEqual({
      requestedHealing: 150,
      actualHealing: 100,
      overhealing: 50,
      previousHealth: 900,
      currentHealth: 1000,
    });
    expect(wounded.heal(80)).toEqual({
      requestedHealing: 80,
      actualHealing: 0,
      overhealing: 80,
      previousHealth: 1000,
      currentHealth: 1000,
    });
  });

  it('clamps poise damage, starts recovery, and supports pausing', () => {
    const vitals = createVitals({ poise: 80, poiseRecoveryTimeMultiplier: 0.5 });
    expect(vitals.applyPoiseDelta(-120)).toBe(-80);
    expect(vitals.beginPoiseBreakIfZero()).toBe(true);
    vitals.tick(COMBAT_FRAME_INTERVAL);
    const progress = vitals.poiseRecoveryProgress;
    vitals.stopPoiseRecovery = true;
    vitals.tick(COMBAT_FRAME_INTERVAL * 10);
    expect(vitals.poiseRecoveryProgress).toBe(progress);
    vitals.stopPoiseRecovery = false;
    expect(vitals.tick(COMBAT_FRAME_INTERVAL * 14)).toEqual(['poiseRecovered']);
    expect(vitals.poise).toBe(100);
    expect(vitals.hasPoiseBrokenTag).toBe(false);
  });

  it('exposes immunity while leaving its event-sensitive check to the executor', () => {
    const vitals = createVitals({ poiseImmune: true });
    expect(vitals.poiseImmune).toBe(true);
    expect(vitals.applyPoiseDelta(-25)).toBe(-25);
  });

  it('advances the broken-tag timer in the same tick that recovers poise', () => {
    const vitals = createVitals({
      poiseRecoveryTime: COMBAT_FRAME_INTERVAL,
      poiseBrokenEndTime: COMBAT_FRAME_INTERVAL,
    });
    vitals.applyPoiseDelta(-100);
    vitals.beginPoiseBreakIfZero();
    const observed: [string, boolean][] = [];
    expect(
      vitals.tick(COMBAT_FRAME_INTERVAL, transition => {
        observed.push([transition, vitals.hasPoiseBrokenTag]);
      }),
    ).toEqual(['poiseRecovered', 'poiseBrokenTagEnded']);
    expect(observed).toEqual([
      ['poiseRecovered', true],
      ['poiseBrokenTagEnded', false],
    ]);
    expect(vitals.hasPoiseBrokenTag).toBe(false);
  });
});
