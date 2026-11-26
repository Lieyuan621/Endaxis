/** 第一条尚未执行的固定输入。相同帧的输入一起落在边界的同一侧。 */
export function firstInputAtOrAfter(inputs: readonly { frame: number }[], frame: number): number {
  let low = 0;
  let high = inputs.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (inputs[middle]!.frame < frame) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function sameScheduledPrefix<T extends { frame: number }>(
  left: readonly T[],
  right: readonly T[],
  boundary: number,
  equal: (a: T, b: T) => boolean,
): boolean {
  if (left === right) return true;
  const count = firstInputAtOrAfter(left, boundary);
  if (count !== firstInputAtOrAfter(right, boundary)) return false;
  for (let index = 0; index < count; index++) {
    if (!equal(left[index]!, right[index]!)) return false;
  }
  return true;
}
