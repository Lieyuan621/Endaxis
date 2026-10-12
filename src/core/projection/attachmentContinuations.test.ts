import { describe, expect, it } from 'vitest';
import { projectAttachmentConversionLinks } from './attachmentContinuations';
import type { BuffTimelineSegment } from './buffTimelineViz';

const segment = (
  startFrame: number,
  endFrame: number,
  extra: Partial<BuffTimelineSegment> = {},
): BuffTimelineSegment => ({
  targetId: 'enemy',
  buffId: 'attachment',
  instanceId: 1,
  startFrame,
  endFrame,
  layers: 1,
  enhanceCount: 1,
  enabled: true,
  placement: 'upper',
  ...extra,
});
describe('attachment continuations', () => {
  it('links only the exact consumed and output instances, ignoring simultaneous decoys', () => {
    const head = segment(0, 10);
    const tail = segment(10, 30, { buffId: 'compound', instanceId: 2 });
    const decoy = segment(10, 30, { buffId: 'compound', instanceId: 3 });
    const conversion = {
      frame: 10,
      targetId: 'enemy',
      consumedBuffId: 'attachment',
      consumedInstanceId: 1,
      outputBuffId: 'compound',
      outputInstanceId: 2,
    };
    expect([...projectAttachmentConversionLinks([head, decoy, tail], [conversion])]).toEqual([
      [head, tail],
    ]);
    expect(projectAttachmentConversionLinks([head, decoy], [conversion]).size).toBe(0);
    expect(projectAttachmentConversionLinks([head, tail], []).size).toBe(0);
  });
});
