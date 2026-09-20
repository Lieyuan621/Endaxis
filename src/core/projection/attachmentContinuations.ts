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

/** 仅连接同一原生附着实例的相邻切段，不从同帧事件推断元素反应。 */
export function projectAttachmentContinuations<T extends BuffTimelineSegment>(
  segments: readonly T[],
  attachmentBuffIds: ReadonlySet<string>,
): ReadonlySet<T> {
  const previous = new Map<string, T>();
  const connected = new Set<T>();
  for (const segment of [...segments].sort((a, b) => a.startFrame - b.startFrame)) {
    if (!attachmentBuffIds.has(segment.buffId)) continue;
    const key = JSON.stringify([segment.targetId, segment.buffId, segment.instanceId]);
    const head = previous.get(key);
    if (
      head !== undefined &&
      head.endFrame === segment.startFrame &&
      head.endFrame > head.startFrame
    )
      connected.add(head);
    previous.set(key, segment);
  }
  return connected;
}
