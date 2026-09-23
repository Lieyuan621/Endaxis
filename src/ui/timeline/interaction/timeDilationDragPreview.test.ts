import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { TimelineTimeDilationBand } from '../../../core/projection/timelineDisplayTime';
import {
  prepareTimeDilationDragPreview,
  projectTimeDilationDragPreview,
} from './timeDilationDragPreview';

function entry(
  sequence: number,
  frame: number,
  event: string,
  data: Record<string, string | number>,
): CombatReceiptEntry {
  return { sequence, frame, time: frame / 30, event, data };
}

const bands: readonly TimelineTimeDilationBand[] = [
  { instanceId: 1, kind: 'global', startFrame: 10, endFrame: 20, sourceCastId: 'a' },
  { instanceId: 2, kind: 'global', startFrame: 20, endFrame: 51, sourceCastId: 'b' },
  { instanceId: 3, kind: 'global', startFrame: 12, endFrame: 43, sourceCastId: 'other' },
];
const entries = [
  entry(1, 10, 'TimeDilationStarted', {
    instanceId: 1,
    kind: 'global',
    sourceCastId: 'a',
    slot: 'combo',
    priority: 30,
    durationSeconds: 1,
  }),
  entry(2, 12, 'TimeDilationStarted', {
    instanceId: 3,
    kind: 'global',
    sourceCastId: 'other',
    slot: 'ultimate',
    priority: 100,
    durationSeconds: 1,
  }),
  entry(3, 20, 'TimeDilationEnded', { instanceId: 1, reason: 'replaced' }),
  entry(4, 20, 'TimeDilationStarted', {
    instanceId: 2,
    kind: 'global',
    sourceCastId: 'b',
    slot: 'combo',
    priority: 30,
    durationSeconds: 1,
  }),
  entry(5, 43, 'TimeDilationEnded', { instanceId: 3, reason: 'natural' }),
  entry(6, 51, 'TimeDilationEnded', { instanceId: 2, reason: 'natural' }),
];

describe('time-dilation drag preview', () => {
  const facts = prepareTimeDilationDragPreview(entries, bands, 100);

  it('restores an interrupted band immediately when its replacement moves later', () => {
    expect(projectTimeDilationDragPreview(bands, facts, new Map([['b', 25]]))).toEqual(
      [
        { ...bands[0]!, endFrame: 41 },
        bands[2]!,
        { ...bands[1]!, startFrame: 45, endFrame: 76 },
      ].sort((a, b) => a.startFrame - b.startFrame),
    );
    expect(bands[0]!.endFrame).toBe(20);
  });

  it('clips the interrupted band at the moving replacement start', () => {
    expect(projectTimeDilationDragPreview(bands, facts, new Map([['b', -4]]))).toEqual(
      [
        { ...bands[0]!, endFrame: 16 },
        bands[2]!,
        { ...bands[1]!, startFrame: 16, endFrame: 47 },
      ].sort((a, b) => a.startFrame - b.startFrame),
    );
    expect(
      projectTimeDilationDragPreview(bands, facts, new Map([['b', 15]])).find(
        band => band.instanceId === 1,
      )?.endFrame,
    ).toBe(35);
  });

  it('does not render a lower-priority same-slot attempt while the stronger band is active', () => {
    const priorityBands: readonly TimelineTimeDilationBand[] = [
      { instanceId: 1, kind: 'global', startFrame: 10, endFrame: 41, sourceCastId: 'a' },
      { instanceId: 2, kind: 'global', startFrame: 50, endFrame: 81, sourceCastId: 'b' },
    ];
    const priorityEntries = [
      entry(1, 10, 'TimeDilationStarted', {
        instanceId: 1,
        kind: 'global',
        sourceCastId: 'a',
        slot: 'combo',
        priority: 50,
        durationSeconds: 1,
      }),
      entry(2, 41, 'TimeDilationEnded', { instanceId: 1, reason: 'natural' }),
      entry(3, 50, 'TimeDilationStarted', {
        instanceId: 2,
        kind: 'global',
        sourceCastId: 'b',
        slot: 'combo',
        priority: 30,
        durationSeconds: 1,
      }),
      entry(4, 81, 'TimeDilationEnded', { instanceId: 2, reason: 'natural' }),
    ];
    const preview = projectTimeDilationDragPreview(
      priorityBands,
      prepareTimeDilationDragPreview(priorityEntries, priorityBands, 100),
      new Map([['b', -34]]),
    );
    expect(preview.find(band => band.instanceId === 2)).toBeUndefined();
    expect(preview.find(band => band.instanceId === 1)?.endFrame).toBe(41);
  });

  it('previews a previously rejected freeze when its blocker moves away', () => {
    const publishedBands: readonly TimelineTimeDilationBand[] = [
      { instanceId: 1, kind: 'global', startFrame: 10, endFrame: 41, sourceCastId: 'a' },
    ];
    const receipt = [
      entry(1, 10, 'TimeDilationStarted', {
        instanceId: 1,
        kind: 'global',
        sourceCastId: 'a',
        slot: 'combo',
        priority: 50,
        durationSeconds: 1,
      }),
      entry(2, 20, 'TimeDilationRejected', {
        instanceId: 2,
        kind: 'global',
        sourceCastId: 'b',
        slot: 'combo',
        priority: 30,
        durationSeconds: 1,
      }),
      entry(3, 41, 'TimeDilationEnded', { instanceId: 1, reason: 'natural' }),
    ];
    expect(
      projectTimeDilationDragPreview(
        publishedBands,
        prepareTimeDilationDragPreview(receipt, publishedBands, 100),
        new Map([['a', 40]]),
      ),
    ).toEqual([
      { instanceId: 2, kind: 'global', startFrame: 20, endFrame: 50, sourceCastId: 'b' },
      { ...publishedBands[0]!, startFrame: 50, endFrame: 81 },
    ]);
  });

  it('returns published bands unchanged without a move', () => {
    expect(projectTimeDilationDragPreview(bands, facts, new Map())).toBe(bands);
  });
});
