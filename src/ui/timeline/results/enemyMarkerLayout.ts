/** 固定事件的水平时间锚点，仅按图标实际宽度向下避让。输出顺序保持回执顺序。 */
export function layoutEnemyMarkerLanes(
  leftPositions: readonly number[],
  iconWidth = 20,
  gap = 2,
): number[] {
  const laneEnds: number[] = [];
  const lanes = new Array<number>(leftPositions.length);
  const sorted = leftPositions
    .map((left, index) => ({ left, index }))
    .sort((a, b) => a.left - b.left || a.index - b.index);
  for (const { left, index } of sorted) {
    let lane = laneEnds.findIndex(end => end + gap <= left);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = left + iconWidth;
    lanes[index] = lane;
  }
  return lanes;
}
