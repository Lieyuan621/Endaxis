import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectStatusChangePoints } from './statusChangePoints';

function statusReceipt(sequence: number, overrides: Partial<CombatReceiptEntry> = {}) {
  return {
    sequence,
    frame: 10,
    time: 1 / 3,
    event: 'StatusChanged',
    sourceId: 'operator',
    targetId: 'enemy',
    data: {
      skillId: 'battleSkill',
      statusKey: 'mark',
      reason: 'applied',
      requestedStacks: 1,
      requestedDurationFrames: 90,
      requestedMaxStacks: 3,
      previousStacks: 0,
      previousRemainingFrames: null,
      currentStacks: 1,
      currentRemainingFrames: 90,
    },
    ...overrides,
  } satisfies CombatReceiptEntry;
}

describe('projectStatusChangePoints', () => {
  it('projects application and consumption facts without recalculating snapshots', () => {
    const consumed = statusReceipt(2, {
      data: {
        ...statusReceipt(2).data,
        reason: 'consumed',
        requestedStacks: null,
        requestedDurationFrames: null,
        requestedMaxStacks: null,
        previousStacks: 1,
        previousRemainingFrames: 75,
        currentStacks: 0,
        currentRemainingFrames: null,
      },
    });

    expect(projectStatusChangePoints([statusReceipt(1), consumed])).toMatchObject([
      {
        sequence: 1,
        reason: 'applied',
        previousStacks: 0,
        currentStacks: 1,
        currentRemainingFrames: 90,
      },
      {
        sequence: 2,
        reason: 'consumed',
        requestedStacks: null,
        previousRemainingFrames: 75,
        currentStacks: 0,
      },
    ]);
  });

  it('keeps same-frame receipt order and ignores unrelated events', () => {
    const points = projectStatusChangePoints([
      { ...statusReceipt(4), frame: 20 },
      { sequence: 5, frame: 20, time: 2 / 3, event: 'SkillStarted' },
      { ...statusReceipt(6), frame: 20 },
    ]);
    expect(points.map(point => point.sequence)).toEqual([4, 6]);
  });

  it('accepts natural expiration facts recorded by the runtime owner', () => {
    const points = projectStatusChangePoints([
      statusReceipt(7, {
        data: {
          ...statusReceipt(7).data,
          reason: 'expired',
          requestedStacks: null,
          requestedDurationFrames: null,
          requestedMaxStacks: null,
          previousStacks: 1,
          previousRemainingFrames: 1,
          currentStacks: 0,
          currentRemainingFrames: null,
        },
      }),
    ]);
    expect(points[0]).toMatchObject({
      reason: 'expired',
      previousRemainingFrames: 1,
      currentStacks: 0,
    });
  });

  it('rejects malformed state facts instead of repairing them', () => {
    expect(() =>
      projectStatusChangePoints([
        statusReceipt(8, { data: { ...statusReceipt(8).data, currentStacks: -1 } }),
      ]),
    ).toThrow("receipt 8 'StatusChanged' has invalid currentStacks");
    expect(() =>
      projectStatusChangePoints([
        statusReceipt(9, { data: { ...statusReceipt(9).data, reason: 'unknown' } }),
      ]),
    ).toThrow("receipt 9 'StatusChanged' has invalid reason");
  });
});
