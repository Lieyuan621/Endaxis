export const TIMELINE_DRAG_THRESHOLD_PX = 5;

/** 旧版时间轴元素只有离开点击抖动半径后才进入拖动。 */
export function passedTimelineDragThreshold(
  originX: number,
  originY: number,
  currentX: number,
  currentY: number,
): boolean {
  return Math.hypot(currentX - originX, currentY - originY) >= TIMELINE_DRAG_THRESHOLD_PX;
}
