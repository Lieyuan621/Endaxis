import { FPS } from './time.js'

const FRAME_TIME_META = Object.freeze({
  timeUnit: 'frame',
  timeUnitVersion: 2,
  fps: FPS,
})

const DIRECT_TIME_KEYS = new Set([
  'animationTime',
  'consumptionOffset',
  'cooldown',
  'duration',
  'enhancementTime',
  'followupDelay',
  'followup_delay',
  'logicalStartTime',
  'prepDuration',
  'staggerBreakDuration',
  'staggerNodeDuration',
  'startTime',
  'time',
  'triggerWindow',
])

const TIME_SUFFIX_PATTERNS = [
  /_animationTime$/,
  /_cooldown$/,
  /_duration$/,
  /_enhancementTime$/,
]

const OFFSET_CONTEXT_KEYS = new Set([
  'anomalies',
  'customBars',
  'damageTicks',
  'damage_ticks',
  'physicalAnomaly',
])

function cloneJson(data) {
  if (data === undefined) return undefined
  return JSON.parse(JSON.stringify(data))
}

function shouldConvertKey(key, ancestors) {
  if (DIRECT_TIME_KEYS.has(key)) return true
  if (TIME_SUFFIX_PATTERNS.some((pattern) => pattern.test(key))) return true
  if (key === 'offset') {
    return ancestors.some((ancestor) => OFFSET_CONTEXT_KEYS.has(ancestor))
  }
  return false
}

function convertNumber(value, mode, fps) {
  const num = Number(value)
  if (!Number.isFinite(num)) return value
  if (!Number.isFinite(fps) || fps <= 0) return value
  if (mode === 'toFrame') return Math.round(num * fps)
  return num / fps
}

function mapTimeUnit(value, mode, ancestors, fps) {
  if (Array.isArray(value)) {
    return value.map((item) => mapTimeUnit(item, mode, ancestors, fps))
  }

  if (!value || typeof value !== 'object') return value

  const out = {}
  for (const [key, current] of Object.entries(value)) {
    const nextAncestors = [...ancestors, key]
    if (typeof current === 'number' && shouldConvertKey(key, ancestors)) {
      out[key] = convertNumber(current, mode, fps)
      continue
    }

    if (Array.isArray(current)) {
      out[key] = current.map((item) => mapTimeUnit(item, mode, nextAncestors, fps))
      continue
    }

    if (current && typeof current === 'object') {
      out[key] = mapTimeUnit(current, mode, nextAncestors, fps)
      continue
    }

    out[key] = current
  }

  return out
}

function attachFrameMeta(data) {
  if (!data || typeof data !== 'object') return data
  data.timeUnit = FRAME_TIME_META.timeUnit
  data.timeUnitVersion = FRAME_TIME_META.timeUnitVersion
  data.fps = FRAME_TIME_META.fps
  return data
}

function stripFrameMeta(data) {
  if (!data || typeof data !== 'object') return data
  delete data.timeUnit
  delete data.timeUnitVersion
  delete data.fps
  return data
}

function isFrameSerialized(data) {
  return !!data && typeof data === 'object' && data.timeUnit === FRAME_TIME_META.timeUnit
}

function serializeFrameUnitData(data) {
  const cloned = cloneJson(data)
  const converted = mapTimeUnit(cloned, 'toFrame', [], FRAME_TIME_META.fps)
  return attachFrameMeta(converted)
}

function deserializeFrameUnitData(data) {
  const cloned = cloneJson(data)
  if (!isFrameSerialized(cloned)) return cloned
  const fps = Number(cloned.fps) || FRAME_TIME_META.fps
  const converted = mapTimeUnit(cloned, 'toTime', [], fps)
  return stripFrameMeta(converted)
}

export function serializeGameData(data) {
  return serializeFrameUnitData(data)
}

export function deserializeGameData(data) {
  return deserializeFrameUnitData(data)
}

export function serializeProjectData(data) {
  return serializeFrameUnitData(data)
}

export function deserializeProjectData(data) {
  return deserializeFrameUnitData(data)
}