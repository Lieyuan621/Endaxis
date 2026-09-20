import { describe, expect, it } from 'vitest';
import { summarizeLastHitBuffs } from './lastHitBuffSummary';

const buff = (buffId: string, startFrame = 0, endFrame = 10, layers = 1) => ({
  buffId,
  startFrame,
  endFrame,
  layers,
});

describe('last hit buff summary', () => {
  it('has no snapshot before any hit', () => {
    expect(summarizeLastHitBuffs([buff('a')], null)).toEqual({ buffs: [], overflow: 0 });
  });
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
  it('keeps the maximum layer count per definition without conflating distinct definitions', () => {
    expect(
      summarizeLastHitBuffs([buff('a'), buff('a', 2, 10, 3), buff('b', 0, 10, 2)], 10).buffs.map(
        b => [b.buffId, b.layers],
      ),
    ).toEqual([
      ['a', 3],
      ['b', 2],
    ]);
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
