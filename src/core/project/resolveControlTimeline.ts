/**
 * 将场景轨道和持久化的切换事件解析为战斗运行时使用的主控时间线。
 * 初始主控沿用编辑器既有语义：第 1 轨道的干员；切换事件从其所在帧起生效。
 */
import type { OperatorControlTimeline } from '../combat/skills/operatorControlTimeline';
import type { ControlSwitchDocument, TrackListDocument } from './schema';

/**
 * 解析主控时间线。同帧有多个切换事件时，存档数组中最后一项生效；切到空轨道表示无人主控。
 */
export function resolveControlTimeline(
  tracks: TrackListDocument,
  switches: readonly ControlSwitchDocument[],
  initialFrame = 0,
): OperatorControlTimeline {
  if (!Number.isInteger(initialFrame) || initialFrame > 0) {
    throw new RangeError('initial control frame must be a non-positive integer');
  }
  const operatorByFrame = new Map<number, string | null>();
  operatorByFrame.set(initialFrame, tracks[0]?.id ?? null);

  for (const controlSwitch of switches) {
    operatorByFrame.set(controlSwitch.frame, tracks[controlSwitch.trackIndex]?.id ?? null);
  }

  return {
    segments: [...operatorByFrame]
      .sort(([leftFrame], [rightFrame]) => leftFrame - rightFrame)
      .map(([startFrame, operatorId]) => ({ startFrame, operatorId })),
  };
}
