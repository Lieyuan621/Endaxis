import { describe, expect, it } from 'vitest';
import { ExplicitProbabilitySampleSource } from './probabilitySampleSource';

describe('ExplicitProbabilitySampleSource', () => {
  it('replays samples in order and reports exhaustion', () => {
    const source = new ExplicitProbabilitySampleSource([0, 0.5, 1]);

    expect(source.nextProbabilitySample()).toBe(0);
    expect(source.nextProbabilitySample()).toBe(0.5);
    expect(source.nextProbabilitySample()).toBe(1);
    expect(() => source.nextProbabilitySample()).toThrow('probability sample source is exhausted');
  });

  it.each([-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid sample %s',
    sample => {
      expect(() => new ExplicitProbabilitySampleSource([sample])).toThrow(
        'probability samples must be finite values in [0, 1]',
      );
    },
  );
});
