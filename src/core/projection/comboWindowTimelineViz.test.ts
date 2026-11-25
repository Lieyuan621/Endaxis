import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectComboWindowTimelineViz } from './comboWindowTimelineViz';

function receipt(
  sequence: number,
  frame: number,
  event: string,
  sourceId: string,
  windowSequence: number,
  nextSkillKey = 'combo:1',
): CombatReceiptEntry {
  return {
    sequence,
    frame,
    time: frame / 30,
    event,
    sourceId,
    data: { windowSequence, nextSkillKey },
  };
}

describe('combo window timeline projection', () => {
  it('marks only windows behind queue locks, splitting at the final overlapping lock expiry', () => {
    const lock = (
      sequence: number,
      frame: number,
      event: string,
      lockSequence: number,
    ): CombatReceiptEntry => ({
      sequence,
      frame,
      time: frame / 30,
      event,
      data: { lockSequence },
    });
    const segments = projectComboWindowTimelineViz(
      [
        receipt(0, 0, 'ComboWindowOpened', 'before', 0),
        lock(1, 5, 'ComboLockQueued', 1),
        lock(2, 5, 'ComboLockQueued', 2),
        receipt(3, 5, 'ComboWindowOpened', 'after', 3),
        lock(4, 10, 'ComboLockExpired', 1),
        lock(5, 20, 'ComboLockExpired', 2),
        receipt(6, 30, 'ComboWindowConsumed', 'after', 3),
      ],
      40,
    );
    expect(segments.filter(segment => segment.operatorId === 'before')).toEqual([
      expect.objectContaining({ startFrame: 0, endFrame: 40 }),
    ]);
    expect(
      segments.filter(segment => segment.operatorId === 'before').some(segment => segment.locked),
    ).toBe(false);
    expect(
      segments
        .filter(segment => segment.operatorId === 'after')
        .map(segment => [segment.startFrame, segment.endFrame, segment.locked ?? false]),
    ).toEqual([
      [5, 10, true],
      [10, 20, true],
      [20, 30, false],
    ]);
  });
  it('renders one operator record while preserving multiple target candidates underneath', () => {
    const segments = projectComboWindowTimelineViz(
      [
        receipt(0, 10, 'ComboWindowOpened', 'track:1', 0, 'combo:old'),
        receipt(1, 12, 'ComboWindowOpened', 'track:1', 1, 'combo:new'),
        receipt(2, 20, 'ComboWindowConsumed', 'track:1', 1, 'combo:new'),
      ],
      60,
    );

    expect(segments).toEqual([
      {
        sequence: 0,
        operatorId: 'track:1',
        nextSkillKey: 'combo:old',
        startFrame: 10,
        endFrame: 20,
        outcome: 'consumed',
      },
    ]);
  });

  it('keeps expiration operator-local and extends pending windows to the published frame', () => {
    const segments = projectComboWindowTimelineViz(
      [
        receipt(0, 5, 'ComboWindowOpened', 'track:1', 0),
        receipt(1, 7, 'ComboWindowOpened', 'track:2', 1, 'combo:2'),
        receipt(2, 25, 'ComboWindowExpired', 'track:1', 0),
      ],
      40,
    );
    expect(segments[0]).toMatchObject({ operatorId: 'track:1', endFrame: 24, outcome: 'expired' });
    expect(segments[1]).toMatchObject({ operatorId: 'track:2', endFrame: 40, outcome: 'pending' });
  });

  it('renders the runtime removal receipt as an exact five-second half-open interval', () => {
    const segments = projectComboWindowTimelineViz(
      [
        receipt(0, 10, 'ComboWindowOpened', 'track:1', 0),
        receipt(1, 161, 'ComboWindowExpired', 'track:1', 0),
      ],
      200,
    );

    expect(segments[0]).toMatchObject({ startFrame: 10, endFrame: 160, outcome: 'expired' });
    expect(segments[0]!.endFrame - segments[0]!.startFrame).toBe(150);
  });

  it('extends one visible operator window until its last overlapping candidate expires', () => {
    const segments = projectComboWindowTimelineViz(
      [
        receipt(0, 10, 'ComboWindowOpened', 'track:1', 0),
        receipt(1, 100, 'ComboWindowOpened', 'track:1', 1),
        receipt(2, 161, 'ComboWindowExpired', 'track:1', 0),
        receipt(3, 251, 'ComboWindowExpired', 'track:1', 1),
      ],
      300,
    );

    expect(segments).toEqual([
      {
        sequence: 0,
        operatorId: 'track:1',
        nextSkillKey: 'combo:1',
        startFrame: 10,
        endFrame: 250,
        outcome: 'expired',
      },
    ]);
  });

  it('rejects malformed lifecycle facts instead of inventing an identity', () => {
    expect(() =>
      projectComboWindowTimelineViz(
        [{ sequence: 0, frame: 0, time: 0, event: 'ComboWindowOpened', data: {} }],
        30,
      ),
    ).toThrow('sourceId');
    expect(() => projectComboWindowTimelineViz([], -1)).toThrow('endFrame');
  });
});
