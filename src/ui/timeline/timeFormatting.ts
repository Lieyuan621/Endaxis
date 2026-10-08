/** 时间轴现有秒数标签按 60 FPS 格式化；不是项目模拟帧率定义。 */
const FPS = 60;

function timeToFrame(value: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * FPS);
}

export function formatTimeWithFrames(value: number): string {
  const frames = timeToFrame(value);
  const sign = frames < 0 ? '-' : '';
  const absFrames = Math.abs(frames);
  const seconds = Math.floor(absFrames / FPS);
  const remainFrames = absFrames % FPS;
  return `${sign}${seconds}s${remainFrames}f`;
}
