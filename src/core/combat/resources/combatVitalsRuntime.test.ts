import { describe, expect, it } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { CombatSimulation } from '../runtime/combatSimulation';
import { CombatVitals } from './combatVitals';
import { CombatVitalsRuntime } from './combatVitalsRuntime';

describe('CombatVitalsRuntime', () => {
  it('publishes recovery before advancing the broken-tag end timer in the same frame', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const vitals = new CombatVitals({
      health: 1,
      maxHealth: 1,
      maxPoise: 100,
      poise: 100,
      poiseRecoveryTime: 1 / 30,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 1 / 30,
      poiseImmune: false,
    });
    vitals.applyPoiseDelta(-100);
    vitals.beginPoiseBreakIfZero();
    const eventStates: boolean[] = [];
    const runtime = new CombatVitalsRuntime({
      ownerId: 'enemy',
      clock,
      vitals,
      receipt,
      emitOwnerEvent: () => eventStates.push(vitals.hasPoiseBrokenTag),
    });
    const simulation = new CombatSimulation(clock);
    simulation.add(runtime);

    simulation.advanceFrame();

    expect(eventStates).toEqual([true]);
    expect(receipt.entries.map(entry => [entry.event, entry.data?.hasPoiseBrokenTag])).toEqual([
      ['PoiseRecovered', true],
      ['PoiseBrokenTagEnded', false],
    ]);
  });
});
