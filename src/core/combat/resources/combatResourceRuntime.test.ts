import { describe, expect, it } from 'vitest';
import { CombatClock } from '../time/combatClock';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatResourceRuntime } from './combatResourceRuntime';
import { CombatResources } from './combatResources';
import { CombatSimulation } from '../runtime/combatSimulation';

describe('CombatResourceRuntime', () => {
  it('makes the frame recovery visible to later ability systems', () => {
    const resources = new CombatResources({
      sp: 99,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 30, pauseDuration: 1, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [],
    });
    const observedSp: number[] = [];
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const simulation = new CombatSimulation(clock);
    simulation.add(new CombatResourceRuntime(resources, clock, receipt));
    simulation.add({ advanceFrame: () => observedSp.push(resources.sp) });

    clock.initializeFrame(-2);
    simulation.advanceFrames(2);
    expect(resources.sp).toBe(99);
    expect(receipt.entries).toEqual([]);
    observedSp.length = 0;
    simulation.advanceFrame();

    expect(observedSp).toEqual([100]);
    expect(receipt.entries).toEqual([
      {
        sequence: 0,
        frame: 1,
        time: 1 / 30,
        event: 'SpChanged',
        data: {
          recipient: 'team',
          baseValue: 1,
          requestedValue: 1,
          actualValue: 1,
          previousValue: 99,
          currentValue: 100,
          gainKind: 'gain',
          source: 'autoRecovery',
        },
      },
    ]);
  });
});
