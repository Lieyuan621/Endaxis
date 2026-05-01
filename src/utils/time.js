export const FPS = 60
export const FRAME_DURATION = 1 / FPS

export function timeToFrame(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.round(num * FPS)
}

export function frameToTime(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return num / FPS
}

export function snapTimeToFrame(value) {
  return frameToTime(timeToFrame(value))
}

export function formatFrameCount(value) {
  const frames = timeToFrame(value)
  return `${frames}f`
}

export function formatTimeWithFrames(value) {
  const frames = timeToFrame(value)
  const sign = frames < 0 ? '-' : ''
  const absFrames = Math.abs(frames)
  const seconds = Math.floor(absFrames / FPS)
  const remainFrames = absFrames % FPS
  return `${sign}${seconds}s${remainFrames}f`
}