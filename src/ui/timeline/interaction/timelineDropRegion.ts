export interface DropRegionRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** The visible lane, not its incidental child under the pointer, owns a library drop. */
export function isInsideTimelineDropRegion(input: {
  readonly x: number;
  readonly y: number;
  readonly lane: DropRegionRect;
  readonly viewport: DropRegionRect;
  readonly headerWidth: number;
  readonly rulerHeight: number;
}): boolean {
  const { x, y, lane, viewport, headerWidth, rulerHeight } = input;
  return (
    x >= Math.max(lane.left, viewport.left + headerWidth) &&
    x < Math.min(lane.right, viewport.right) &&
    y >= Math.max(lane.top, viewport.top + rulerHeight) &&
    y < Math.min(lane.bottom, viewport.bottom)
  );
}
