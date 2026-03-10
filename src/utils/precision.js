export function snapMs(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return num
  return Math.round(num * 1000) / 1000
}