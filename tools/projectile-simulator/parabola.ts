/** Independent endpoint/apex calculator. Y is up; duration is in seconds. */
export function parabolaFromApex(input: {
  horizontalDistance: number;
  startY: number;
  endY: number;
  apexOffset: number;
  duration: number;
}) {
  const { horizontalDistance, startY, endY, apexOffset, duration } = input;
  if (
    Object.values(input).some(value => !Number.isFinite(value)) ||
    horizontalDistance < 0 ||
    apexOffset <= 0 ||
    duration <= 0
  )
    throw new Error('Invalid parabola parameters');
  const apexY = Math.max(startY, endY) + apexOffset;
  const rise = apexY - startY;
  const fall = apexY - endY;
  const ratio = Math.sqrt(rise / fall);
  const ascentSeconds = (duration * ratio) / (1 + ratio);
  const verticalSpeed = (2 * rise) / ascentSeconds;
  return {
    horizontalSpeed: horizontalDistance / duration,
    verticalSpeed,
    gravity: verticalSpeed / ascentSeconds,
    apexY,
    ascentSeconds,
  };
}
