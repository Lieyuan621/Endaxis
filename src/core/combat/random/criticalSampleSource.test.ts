import { describe, expect, it } from 'vitest';
import {
  EvenCriticalSampleSource,
  ExplicitCriticalSampleSource,
  SubtractiveBattleRandom,
} from './criticalSampleSource';

describe('critical sample sources', () => {
  it('evenly covers the unit interval with a stable short-prefix sequence', () => {
    const source = new EvenCriticalSampleSource();

    expect(Array.from({ length: 8 }, () => source.nextCriticalSample())).toEqual([
      0.5, 0.25, 0.75, 0.125, 0.625, 0.375, 0.875, 0.0625,
    ]);
  });

  it('reproduces and restores the recovered subtractive random step', () => {
    const values = Array.from({ length: 56 }, (_, index) => index * 1000);
    const random = new SubtractiveBattleRandom({ currentIndex: 0, pairedIndex: 30, values });

    const first = random.nextCriticalSample();
    const state = random.captureState();
    const second = random.nextCriticalSample();
    const restored = new SubtractiveBattleRandom(state);

    expect(first).toBe(Math.fround((1000 - 31000 + 0x7fffffff) / 0x7fffffff));
    expect(restored.nextCriticalSample()).toBe(second);
    expect(restored.captureState()).toEqual(random.captureState());
  });

  it('fails when an explicit comparison stream is exhausted', () => {
    const source = new ExplicitCriticalSampleSource([0.25]);

    expect(source.nextCriticalSample()).toBe(0.25);
    expect(() => source.nextCriticalSample()).toThrow('critical sample source is exhausted');
  });
});
