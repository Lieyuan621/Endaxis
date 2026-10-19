import { describe, expect, it } from 'vitest';
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import { CombatVitals } from './combatVitals';
import {
  CombatAttributeSet,
  attributeModifierValues,
  createCombatAttributeModifier,
} from '../attributes/combatAttributes';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import { createStateTestSession } from '../../../test/stateTestSession';
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
  it('最大生命修正保留比例，重复登记不重算，切面恢复后移除仍正确', () => {
    const vitals = createVitals({ health: 400 });
    const attributes = new CombatAttributeSet<string>();
    attributes.define('MaxHp', 1000, { minimum: 0 });
    attributes.bindChangeObserver('MaxHp', (value, previous) =>
      vitals.synchronizeMaxHealth(value, previous),
    );
    const modifier = createCombatAttributeModifier(
      'MaxHp',
      attributeModifierValues('finalMultiplier', 1.5),
      ATTRIBUTE_MODIFIER_SOURCES.buff,
      'runtime',
    );
    const changes: number[] = [];
    vitals.bindHealthChangeObserver(() => changes.push(vitals.health));
    attributes.addModifier(modifier);
    attributes.addModifier(modifier);
    const replacement = { ...modifier };
    attributes.batchChanges(() => {
      attributes.addModifier(replacement);
      attributes.removeModifier(modifier);
    });
    expect([vitals.health, vitals.maxHealth]).toEqual([600, 1500]);
    expect(changes).toEqual([600]);
    const state = structuredClone({
      vitals: vitals.runtimeState,
      attributes: attributes.runtimeState,
    });
    const restored = CombatVitals.bindRuntimeState(state.vitals);
    const restoredAttributes = new CombatAttributeSet(state.attributes);
    restoredAttributes.bindChangeObserver('MaxHp', (value, previous) =>
      restored.synchronizeMaxHealth(value, previous),
    );
    const restoredChanges: number[] = [];
    restored.bindHealthChangeObserver(() => restoredChanges.push(restored.health));
    expect(restoredChanges).toEqual([]);
    restoredAttributes.removeModifier(state.attributes.modifiers[0]!);
    expect([restored.health, restored.maxHealth]).toEqual([400, 1000]);
    expect(restoredChanges).toEqual([400]);
    expect(vitals.health).toBe(600);
  });
  it('生命上限下降仍受生命下限限制，零上限后不产生 NaN', () => {
    const vitals = createVitals({ health: 400 });
    vitals.requestHealthFloor(400);
    vitals.synchronizeMaxHealth(500, 1000);
    expect(vitals.health).toBe(400);
    vitals.synchronizeMaxHealth(0, 500);
    expect(vitals.health).toBe(0);
    vitals.synchronizeMaxHealth(1000, 0);
    expect(vitals.health).toBe(0);
  });
  it('生命写入后同步通知，满血治疗不通知，切面恢复不重放通知', () => {
    const vitals = createVitals();
    const changes: number[] = [];
    vitals.bindHealthChangeObserver(() => changes.push(vitals.health));
    vitals.heal(50);
    vitals.takeDamage(100);
    vitals.heal(20);
    expect(changes).toEqual([900, 920]);
    const restored = CombatVitals.bindRuntimeState(structuredClone(vitals.runtimeState));
    const restoredChanges: number[] = [];
    restored.bindHealthChangeObserver(() => restoredChanges.push(restored.health));
    expect(restoredChanges).toEqual([]);
    restored.takeDamage(20);
    expect(restoredChanges).toEqual([900]);
    expect(vitals.health).toBe(920);
  });
  it('restores a running poise timer and the owning health floor handle together', () => {
    const vitals = createVitals({ poise: 0 });
    vitals.beginPoiseBreakIfZero();
    vitals.tick(0.25);
    const floorId = registerVitalsHealthFloor(vitals.runtimeState, 500);
    const session = createStateTestSession(
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
