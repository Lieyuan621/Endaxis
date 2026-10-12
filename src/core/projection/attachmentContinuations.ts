import type { BuffTimelineSegment } from './buffTimelineViz';
import type { AttachmentConversion } from './enemyEffectViz';

/** 只消费执行端明确的输入/输出实例。输出隐藏或未投影时不猜测可见后继。 */
export function projectAttachmentConversionLinks<T extends BuffTimelineSegment>(
  segments: readonly T[],
  conversions: readonly AttachmentConversion[],
): ReadonlyMap<T, T> {
  const links = new Map<T, T>();
  for (const conversion of conversions) {
    const heads = segments.filter(
      segment =>
        segment.targetId === conversion.targetId &&
        segment.buffId === conversion.consumedBuffId &&
        segment.instanceId === conversion.consumedInstanceId &&
        segment.endFrame === conversion.frame &&
        segment.startFrame < conversion.frame,
    );
    const tails = segments.filter(
      segment =>
        segment.targetId === conversion.targetId &&
        segment.buffId === conversion.outputBuffId &&
        segment.instanceId === conversion.outputInstanceId &&
        segment.startFrame === conversion.frame,
    );
    if (heads.length === 1 && tails.length === 1) links.set(heads[0]!, tails[0]!);
  }
  return links;
}
