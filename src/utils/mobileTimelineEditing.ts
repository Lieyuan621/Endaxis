export type PointerPosition = {
  x: number;
  y: number;
};

export function isTapGesture(start: PointerPosition | null, end: PointerPosition, threshold = 8) {
  if (!start) return false;
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  return distance <= Math.max(0, threshold);
}

export function snapTimelineTime(value: number, step: number, maxTime: number) {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const normalizedStep = Number.isFinite(step) && step > 0 ? step : 1 / 30;
  const normalizedMax = Number.isFinite(maxTime) ? Math.max(0, maxTime) : Infinity;
  const snapped = Math.round(normalizedValue / normalizedStep) * normalizedStep;
  return Math.min(normalizedMax, Math.max(0, snapped));
}

export function pointerYToTimelineTime({
  clientY,
  timelineTop,
  pixelsPerSecond,
  snapStep,
  maxTime,
}: {
  clientY: number;
  timelineTop: number;
  pixelsPerSecond: number;
  snapStep: number;
  maxTime: number;
}) {
  const scale = Number.isFinite(pixelsPerSecond) && pixelsPerSecond > 0 ? pixelsPerSecond : 1;
  return snapTimelineTime((clientY - timelineTop) / scale, snapStep, maxTime);
}

export function getStepSampleAtTime<T extends { time?: number }>(
  points: T[] | null | undefined,
  time: number,
): T | null {
  if (!Array.isArray(points) || points.length === 0) return null;

  let lo = 0;
  let hi = points.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if ((Number(points[mid]?.time) || 0) <= time) lo = mid + 1;
    else hi = mid - 1;
  }

  return points[Math.max(0, hi)] || null;
}

export function clampTimelineGroupDelta({
  desiredDelta,
  startTimes,
  minTime = 0,
  maxTime = Infinity,
}: {
  desiredDelta: number;
  startTimes: number[];
  minTime?: number;
  maxTime?: number;
}) {
  const normalizedStarts = startTimes.filter(Number.isFinite);
  if (normalizedStarts.length === 0) return 0;

  const delta = Number.isFinite(desiredDelta) ? desiredDelta : 0;
  const lower = (Number.isFinite(minTime) ? minTime : 0) - Math.min(...normalizedStarts);
  const upper = Number.isFinite(maxTime) ? maxTime - Math.max(...normalizedStarts) : Infinity;
  return Math.min(upper, Math.max(lower, delta));
}

export function getSnappedTimelineDragDelta({
  initialStart,
  pointerDelta,
  startTimes,
  snapStep,
  minTime = 0,
  maxTime = Infinity,
}: {
  initialStart: number;
  pointerDelta: number;
  startTimes: number[];
  snapStep: number;
  minTime?: number;
  maxTime?: number;
}) {
  const safeInitialStart = Number.isFinite(initialStart) ? initialStart : 0;
  const safePointerDelta = Number.isFinite(pointerDelta) ? pointerDelta : 0;
  const desiredStart = snapTimelineTime(
    safeInitialStart + safePointerDelta,
    snapStep,
    maxTime,
  );
  return clampTimelineGroupDelta({
    desiredDelta: desiredStart - safeInitialStart,
    startTimes,
    minTime,
    maxTime,
  });
}

export function getVerticalEdgeScrollSpeed({
  clientY,
  top,
  bottom,
  zone = 56,
  maxSpeed = 10,
}: {
  clientY: number;
  top: number;
  bottom: number;
  zone?: number;
  maxSpeed?: number;
}) {
  const safeZone = Math.max(1, Number(zone) || 1);
  const safeMax = Math.max(0, Number(maxSpeed) || 0);

  if (clientY < top + safeZone) {
    const ratio = Math.min(1, Math.max(0, (top + safeZone - clientY) / safeZone));
    return -safeMax * ratio;
  }
  if (clientY > bottom - safeZone) {
    const ratio = Math.min(1, Math.max(0, (clientY - (bottom - safeZone)) / safeZone));
    return safeMax * ratio;
  }
  return 0;
}
