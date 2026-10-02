import { describe, expect, it } from 'vitest';
import { summarizeLastHitBuffs } from './lastHitBuffSummary';

const buff = (buffId: string, startFrame = 0, endFrame = 10, layers = 1) => ({
  buffId,
  startFrame,
  endFrame,
  layers,
});

describe('last hit buff summary', () => {
  it('includes both endpoints but excludes instantaneous and out-of-range segments', () => {
    expect(
      summarizeLastHitBuffs(
        [
          buff('ending'),
          buff('starting', 10, 20),
          buff('past', 0, 9),
          buff('future', 11, 20),
          buff('instant', 10, 10),
        ],
        10,
      ).buffs.map(b => b.buffId),
    ).toEqual(['ending', 'starting']);
  });
  it('uses the new phase at a decrease boundary rather than the previous maximum', () => {
    const phases = [buff('a', 0, 10, 4), buff('a', 10, 20, 3), buff('a', 20, 30, 1)];
    for (const values of [phases, [...phases].reverse()]) {
      expect(summarizeLastHitBuffs(values, 10).buffs.map(b => b.layers)).toEqual([3]);
      expect(summarizeLastHitBuffs(values, 20).buffs.map(b => b.layers)).toEqual([1]);
      expect(summarizeLastHitBuffs(values, 30).buffs.map(b => b.layers)).toEqual([1]);
    }
  });
  it('keeps a terminal damage endpoint but does not resurrect a just-suppressed or zero-count state', () => {
    expect(
      summarizeLastHitBuffs(
        [
          { ...buff('suppressed'), endReason: 'enabledChanged' },
          { ...buff('zero'), endReason: 'stackChanged' },
          { ...buff('expired'), endReason: 'lifetime' },
        ],
        10,
      ).buffs.map(b => b.buffId),
    ).toEqual(['expired']);
  });
  it('orders consistently and reports overflow after eight distinct buffs', () => {
    const result = summarizeLastHitBuffs(
      Array.from({ length: 10 }, (_, i) => buff(`buff${9 - i}`)),
      5,
    );
    expect(result.buffs.map(b => b.buffId)).toEqual(
      Array.from({ length: 8 }, (_, i) => `buff${i}`),
    );
    expect(result.overflow).toBe(2);
  });
});
