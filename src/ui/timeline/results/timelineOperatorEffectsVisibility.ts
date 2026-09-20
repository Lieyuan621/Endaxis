import type { TrackIndex } from '../../../core/project/schema';

export const TIMELINE_OPERATOR_TRACK_COUNT = 4;
export type TimelineOperatorEffectsVisibility = readonly boolean[];

export function createDefaultTimelineOperatorEffectsVisibility(): TimelineOperatorEffectsVisibility {
  return Object.freeze(Array.from({ length: TIMELINE_OPERATOR_TRACK_COUNT }, () => true));
}

/** 缺失或损坏的本地偏好一律恢复显示，避免视觉内容静默消失。 */
export function normalizeTimelineOperatorEffectsVisibility(
  source: unknown,
): TimelineOperatorEffectsVisibility {
  if (!Array.isArray(source)) return createDefaultTimelineOperatorEffectsVisibility();
  return Object.freeze(
    Array.from({ length: TIMELINE_OPERATOR_TRACK_COUNT }, (_, index) => source[index] !== false),
  );
}

export function toggleTimelineOperatorEffectsVisibility(
  visibility: TimelineOperatorEffectsVisibility,
  trackIndex: TrackIndex,
): TimelineOperatorEffectsVisibility {
  const normalized = [...normalizeTimelineOperatorEffectsVisibility(visibility)];
  normalized[trackIndex] = !normalized[trackIndex];
  return Object.freeze(normalized);
}
