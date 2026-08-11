import { sampleStepSeriesAtTime } from './timelineGuideData';

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

export function timelineYToTime({
  offsetY,
  pixelsPerSecond,
  prepDuration = 0,
  prepExpanded = true,
  collapsedPrepPx = 18,
}: {
  offsetY: number;
  pixelsPerSecond: number;
  prepDuration?: number;
  prepExpanded?: boolean;
  collapsedPrepPx?: number;
}) {
  const y = Number.isFinite(offsetY) ? offsetY : 0;
  const scale = Number.isFinite(pixelsPerSecond) && pixelsPerSecond > 0 ? pixelsPerSecond : 1;
  const prep = Number.isFinite(prepDuration) ? Math.max(0, prepDuration) : 0;
  const collapsedHeight = Number.isFinite(collapsedPrepPx) ? Math.max(1, collapsedPrepPx) : 18;

  if (prep <= 0 || prepExpanded) return y / scale;
  if (y <= collapsedHeight) return (y / collapsedHeight) * prep;
  return prep + (y - collapsedHeight) / scale;
}

export function pointerYToTimelineTime({
  clientY,
  timelineTop,
  pixelsPerSecond,
  snapStep,
  maxTime,
  prepDuration = 0,
  prepExpanded = true,
  collapsedPrepPx = 18,
}: {
  clientY: number;
  timelineTop: number;
  pixelsPerSecond: number;
  snapStep: number;
  maxTime: number;
  prepDuration?: number;
  prepExpanded?: boolean;
  collapsedPrepPx?: number;
}) {
  return snapTimelineTime(
    timelineYToTime({
      offsetY: clientY - timelineTop,
      pixelsPerSecond,
      prepDuration,
      prepExpanded,
      collapsedPrepPx,
    }),
    snapStep,
    maxTime,
  );
}

export function getStepSampleAtTime<T extends { time?: number }>(
  points: T[] | null | undefined,
  time: number,
): T | null {
  return sampleStepSeriesAtTime(points, time);
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
