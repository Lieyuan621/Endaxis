import { describe, expect, it, vi } from 'vitest';
import { CombatClock } from '../time/combatClock';
import { CombatSimulation } from './combatSimulation';

describe('CombatSimulation', () => {
  it('每帧只调用本次传入的输入，保持输入前后的系统顺序', () => {
    const clock = new CombatClock();
    const simulation = new CombatSimulation(clock);
    const order: string[] = [];
    simulation.add({ advanceFrame: () => order.push('before') });
    simulation.addInputPhase('skillInputs');
    simulation.add({ advanceFrame: () => order.push('skills') });
    simulation.addInputPhase('externalEvents');
    simulation.advanceFrame({
      skillInputs: () => order.push('input A'),
      externalEvents: () => order.push('external A'),
    });
    simulation.advanceFrame({
      skillInputs: () => order.push('input B'),
      externalEvents: () => order.push('external B'),
    });
    expect(order).toEqual([
      'before',
      'input A',
      'skills',
      'external A',
      'before',
      'input B',
      'skills',
      'external B',
    ]);
    expect(() => simulation.advanceFrame()).toThrow('requires external input phases');
    expect(clock.frame).toBe(2);
    expect(order).toHaveLength(8);
  });

  it('advances the shared clock before runtime systems', () => {
    const clock = new CombatClock();
    const observedFrames: number[] = [];
    const simulation = new CombatSimulation(clock);
    simulation.add({ advanceFrame: () => observedFrames.push(clock.frame) });

    simulation.advanceFrames(3);

    expect(observedFrames).toEqual([1, 2, 3]);
    expect(clock.time).toBe(0.1);
  });

  it('ticks systems in registration order', () => {
    const simulation = new CombatSimulation(new CombatClock());
    const order: string[] = [];
    simulation.add({ advanceFrame: vi.fn(() => order.push('first')) });
    simulation.add({ advanceFrame: vi.fn(() => order.push('second')) });

    simulation.advanceFrame();

    expect(order).toEqual(['first', 'second']);
  });
});
