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
