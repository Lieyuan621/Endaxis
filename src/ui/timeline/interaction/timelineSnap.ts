/**
 * 提供时间轴编辑器的帧网格规则。存档始终保存整数帧，吸附精度只属于当前 UI 会话，
 * 不参与模拟、持久化或撤销历史。
 */
import { PROJECT_FPS } from '../../../core/project/schema';

export const PRECISE_TIMELINE_SNAP_FRAMES = 1;
export const COARSE_TIMELINE_SNAP_FRAMES = PROJECT_FPS / 10;

export function snapTimelineFrame(
  frame: number,
  stepFrames: number,
  maximumFrame: number,
  minimumFrame = 0,
): number {
  if (!Number.isInteger(stepFrames) || stepFrames < 1) {
    throw new RangeError('stepFrames must be a positive integer');
  }
  if (!Number.isInteger(maximumFrame) || maximumFrame < 0) {
    throw new RangeError('maximumFrame must be a non-negative integer');
  }
  if (!Number.isInteger(minimumFrame) || minimumFrame > maximumFrame) {
    throw new RangeError('minimumFrame must be an integer within the timeline');
  }
  return Math.max(
    minimumFrame,
    Math.min(maximumFrame, Math.round(frame / stepFrames) * stepFrames),
  );
}
