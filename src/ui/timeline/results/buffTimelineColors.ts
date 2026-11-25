import type { BuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import type { AttachmentConversion } from '../../../core/projection/enemyEffectViz';
import { projectAttachmentConversionLinks } from '../../../core/projection/attachmentContinuations';
import {
  resolveDurationBarColor,
  type DurationBarColorPrefs,
  type DurationColorSurface,
} from './durationBarColor';

/** 颜色跟随明确的转换实例；布局、可见性和坐标由调用方决定。 */
export function projectBuffTimelineColors<T extends BuffTimelineSegment>(
  segments: readonly T[],
  conversions: readonly AttachmentConversion[],
  preferences: DurationBarColorPrefs,
  surface: DurationColorSurface,
) {
  const links = projectAttachmentConversionLinks(segments, conversions);
  return new Map(
    segments.map(segment => [
      segment,
      {
        color: resolveDurationBarColor(preferences, surface, segment),
        endColor: resolveDurationBarColor(preferences, surface, links.get(segment) ?? segment),
      },
    ]),
  );
}
