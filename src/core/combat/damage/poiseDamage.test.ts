import { describe, expect, it } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { CombatVitals } from '../resources/combatVitals';
import { calculatePoiseDamage, executePoiseDamage } from './poiseDamage';

function createTarget(overrides: Partial<ConstructorParameters<typeof CombatVitals>[0]> = {}) {
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

describe('poise damage', () => {
  it('emits one knot event across multiple thresholds and re-arms after recovery and restore', () => {
    let target = createTarget({ poiseKnotThresholds: [0.25, 0.5, 0.75] });
    const events: string[] = [];
    const receipt = new CombatReceiptCollector();
    const hit = (value: number) =>
      executePoiseDamage({
        sourceId: 'operator',
        targetId: 'enemy',
        target,
        calculationValue: value,
        outputMultiplier: 1,
        takenMultiplier: 1,
        clock: new CombatClock(),
        receipt,
        emitSourceEvent: () => {},
        emitTargetEvent: event => events.push(event),
      });
    hit(50);
    expect(events.filter(event => event === 'poiseKnotBreak')).toHaveLength(1);
    expect(receipt.entries.find(entry => entry.event === 'PoiseKnotBroken')?.data).toEqual({
      previousKnotCount: 0,
      currentKnotCount: 2,
    });
    const saved = structuredClone(target.runtimeState);
    hit(1);
    expect(events.filter(event => event === 'poiseKnotBreak')).toHaveLength(1);
    target = CombatVitals.bindRuntimeState(saved);
    hit(-30);
    expect(target.brokenPoiseKnotCount).toBe(0);
    hit(30);
    expect(events.filter(event => event === 'poiseKnotBreak')).toHaveLength(2);
    hit(50);
    expect(events.slice(-3)).toEqual(['poiseKnotBreak', 'takePoiseDamage', 'poiseZero']);
    target.tick(1);
    expect(target.brokenPoiseKnotCount).toBe(0);
    hit(25);
    expect(events.filter(event => event === 'poiseKnotBreak')).toHaveLength(4);
  });

  it('does not break knots on immune damage', () => {
    const target = createTarget({ poiseKnotThresholds: [0.5], poiseImmune: true });
    const events: string[] = [];
    executePoiseDamage({
      sourceId: 'operator',
      targetId: 'enemy',
      target,
      calculationValue: 60,
      outputMultiplier: 1,
      takenMultiplier: 1,
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      emitSourceEvent: () => {},
      emitTargetEvent: event => events.push(event),
    });
    expect(events).not.toContain('poiseKnotBreak');
    expect(target.brokenPoiseKnotCount).toBe(0);
  });

  it('multiplies the recovered calculation, output, and taken values', () => {
    expect(
      calculatePoiseDamage({
        calculationValue: 20,
        outputMultiplier: 1.5,
        takenMultiplier: 0.8,
      }),
    ).toBeCloseTo(24);
  });

  it('allows before-events to modify the delta and preserves native event order', () => {
    const target = createTarget({ poise: 40 });
    const receipt = new CombatReceiptCollector();
    const events: string[] = [];

    const result = executePoiseDamage({
      sourceId: 'operator',
      targetId: 'enemy',
      target,
      calculationValue: 30,
      outputMultiplier: 1,
      takenMultiplier: 1,
      clock: new CombatClock(),
      receipt,
      emitSourceEvent: (event, modifier) => {
        events.push(`source:${event}`);
        modifier.finalDelta *= 2;
      },
      emitTargetEvent: event => events.push(`target:${event}`),
    });

    expect(events).toEqual([
      'source:beforeOutputPoiseDamage',
      'target:beforeTakePoiseDamage',
      'target:takePoiseDamage',
      'target:poiseZero',
    ]);
    expect(result).toMatchObject({ actualDelta: -40, brokePoise: true });
    expect(receipt.entries[0]).toMatchObject({
      event: 'PoiseApplied',
      data: {
        calculationValue: 30,
        calculatedDamage: 30,
        requestedDelta: -60,
        actualDelta: -40,
        previousPoise: 40,
        currentPoise: 0,
        cancelled: false,
        cancelledByImmunity: false,
        poiseImmune: false,
        ignorePoiseImmune: false,
        brokePoise: true,
        inPoiseRecovery: true,
        hasPoiseBrokenTag: true,
      },
    });
  });

  it('runs before-events before poise immunity cancels mutation', () => {
    const target = createTarget({ poiseImmune: true });
    const events: string[] = [];

    const receipt = new CombatReceiptCollector();
    const result = executePoiseDamage({
      sourceId: 'operator',
      targetId: 'enemy',
      target,
      calculationValue: 25,
      outputMultiplier: 1,
      takenMultiplier: 1,
      clock: new CombatClock(),
      receipt,
      emitSourceEvent: event => events.push(`source:${event}`),
      emitTargetEvent: event => events.push(`target:${event}`),
    });

    expect(events).toEqual(['source:beforeOutputPoiseDamage', 'target:beforeTakePoiseDamage']);
    expect(result).toMatchObject({ cancelled: true, actualDelta: 0 });
    expect(target.poise).toBe(100);
    expect(receipt.entries[0]?.data).toMatchObject({
      previousPoise: 100,
      currentPoise: 100,
      cancelled: true,
      cancelledByImmunity: true,
      poiseImmune: true,
      ignorePoiseImmune: false,
      brokePoise: false,
    });
  });

  it('does not repeat the epsilon filter after before-events mutate the delta', () => {
    const target = createTarget({ poise: 0 });
    const events: string[] = [];

    const result = executePoiseDamage({
      sourceId: 'operator',
      targetId: 'enemy',
      target,
      calculationValue: 10,
      outputMultiplier: 1,
      takenMultiplier: 1,
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      emitSourceEvent: (_event, modifier) => {
        modifier.finalDelta = 0;
      },
      emitTargetEvent: event => events.push(event),
    });

    expect(result.brokePoise).toBe(true);
    expect(events).toEqual(['beforeTakePoiseDamage', 'poiseZero']);
  });

  it('does not emit events or receipts for an epsilon-sized delta', () => {
    const receipt = new CombatReceiptCollector();
    const events: string[] = [];
    const target = createTarget();

    executePoiseDamage({
      sourceId: 'operator',
      targetId: 'enemy',
      target,
      calculationValue: 0.000001,
      outputMultiplier: 1,
      takenMultiplier: 1,
      clock: new CombatClock(),
      receipt,
      emitSourceEvent: event => events.push(event),
      emitTargetEvent: event => events.push(event),
    });

    expect(events).toEqual([]);
    expect(receipt.entries).toEqual([]);
  });
});
