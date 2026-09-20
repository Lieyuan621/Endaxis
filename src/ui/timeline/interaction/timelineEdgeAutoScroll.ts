export interface TimelineEdgeAutoScrollInput {
  readonly pointerX: number;
  readonly pointerY: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly thresholdPx?: number;
  readonly maximumStepPx?: number;
}

export interface TimelineEdgeAutoScrollDelta {
  readonly x: number;
  readonly y: number;
}

function axisDelta(
  pointer: number,
  start: number,
  end: number,
  threshold: number,
  maximum: number,
): number {
  if (pointer < start + threshold) {
    return -Math.ceil(maximum * Math.min(1, (start + threshold - pointer) / threshold));
  }
  if (pointer > end - threshold) {
    return Math.ceil(maximum * Math.min(1, (pointer - (end - threshold)) / threshold));
  }
  return 0;
}

/** 每个动画帧的边缘滚动增量；越靠近或越过边缘，滚动越快。 */
export function projectTimelineEdgeAutoScrollDelta(
  input: TimelineEdgeAutoScrollInput,
): TimelineEdgeAutoScrollDelta {
  const threshold = Math.max(1, input.thresholdPx ?? 36);
  const maximum = Math.max(1, input.maximumStepPx ?? 18);
  return {
    x: axisDelta(input.pointerX, input.left, input.right, threshold, maximum),
    y: axisDelta(input.pointerY, input.top, input.bottom, threshold, maximum),
  };
}
