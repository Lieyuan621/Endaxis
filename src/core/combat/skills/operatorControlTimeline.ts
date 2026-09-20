/**
 * 表示模拟期间的主控干员时间线，并提供按帧查询能力。
 * 本模块只处理运行时干员 ID，不依赖项目存档或轨道结构；调用方必须先完成场景解析。
 */

/** 从该帧起（含该帧）生效的一段主控状态。 */
export interface OperatorControlSegment {
  readonly startFrame: number;
  readonly operatorId: string | null;
}

/** 已按起始帧升序归一化，且同一帧最多保留一项的主控时间线。 */
export interface OperatorControlTimeline {
  readonly segments: readonly OperatorControlSegment[];
}

/** 查询指定帧的主控干员；首段开始前没有主控干员。 */
export function resolveControlledOperator(
  timeline: OperatorControlTimeline,
  frame: number,
): string | null {
  const segments = timeline.segments;
  let low = 0;
  let high = segments.length - 1;
  let match = -1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const segment = segments[middle]!;
    if (segment.startFrame <= frame) {
      match = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return match < 0 ? null : segments[match]!.operatorId;
}

/** 判断指定运行时干员在该帧是否为主控。 */
export function isOperatorControlledAt(
  timeline: OperatorControlTimeline,
  operatorId: string,
  frame: number,
): boolean {
  return resolveControlledOperator(timeline, frame) === operatorId;
}
