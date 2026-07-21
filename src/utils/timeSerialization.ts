import { FPS } from './time';

const FRAME_TIME_META = Object.freeze({
  timeUnit: 'frame',
  timeUnitVersion: 2,
  fps: FPS,
});

type TimeMode = 'toFrame' | 'toTime';

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
  'battleDuration',
  'staggerBreakDuration',
  'staggerNodeDuration',
  'startTime',
  'time',
  'triggerWindow',
]);

const TIME_SUFFIX_PATTERNS = [/_animationTime$/, /_cooldown$/, /_duration$/, /_enhancementTime$/];

const OFFSET_CONTEXT_KEYS = new Set(['customBars', 'effects', 'hit', 'hits']);

function cloneJson(data: unknown): unknown {
  if (data === undefined) return undefined;
  return JSON.parse(JSON.stringify(data));
}

function shouldConvertKey(key: string, ancestors: string[]): boolean {
  if (DIRECT_TIME_KEYS.has(key)) return true;
  if (TIME_SUFFIX_PATTERNS.some(pattern => pattern.test(key))) return true;
  if (key === 'offset') {
    return ancestors.some(ancestor => OFFSET_CONTEXT_KEYS.has(ancestor));
  }
  return false;
}

function convertNumber(value: number, mode: TimeMode, fps: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (!Number.isFinite(fps) || fps <= 0) return value;
  if (mode === 'toFrame') return Math.round(num * fps);
  return num / fps;
}

function mapTimeUnit(value: unknown, mode: TimeMode, ancestors: string[], fps: number): unknown {
  if (Array.isArray(value)) {
    return value.map(item => mapTimeUnit(item, mode, ancestors, fps));
  }

  if (!value || typeof value !== 'object') return value;

  const out: Record<string, unknown> = {};
  for (const [key, current] of Object.entries(value as Record<string, unknown>)) {
    const nextAncestors = [...ancestors, key];
    if (typeof current === 'number' && shouldConvertKey(key, ancestors)) {
      out[key] = convertNumber(current, mode, fps);
      continue;
    }

    if (Array.isArray(current)) {
      out[key] = current.map(item => mapTimeUnit(item, mode, nextAncestors, fps));
      continue;
    }

    if (current && typeof current === 'object') {
      out[key] = mapTimeUnit(current, mode, nextAncestors, fps);
      continue;
    }

    out[key] = current;
  }

  return out;
}

function attachFrameMeta(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const obj = data as Record<string, unknown>;
  obj.timeUnit = FRAME_TIME_META.timeUnit;
  obj.timeUnitVersion = FRAME_TIME_META.timeUnitVersion;
  obj.fps = FRAME_TIME_META.fps;
  return obj;
}

function stripFrameMeta(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const obj = data as Record<string, unknown>;
  delete obj.timeUnit;
  delete obj.timeUnitVersion;
  delete obj.fps;
  return obj;
}

function isFrameSerialized(data: unknown): boolean {
  return (
    !!data &&
    typeof data === 'object' &&
    (data as Record<string, unknown>).timeUnit === FRAME_TIME_META.timeUnit
  );
}

function serializeFrameUnitData(data: unknown): unknown {
  const cloned = cloneJson(data);
  const converted = mapTimeUnit(cloned, 'toFrame', [], FRAME_TIME_META.fps);
  return attachFrameMeta(converted);
}

function deserializeFrameUnitData(data: unknown): unknown {
  const cloned = cloneJson(data);
  if (!isFrameSerialized(cloned)) return cloned;
  const fps = Number((cloned as Record<string, unknown>).fps) || FRAME_TIME_META.fps;
  const converted = mapTimeUnit(cloned, 'toTime', [], fps);
  return stripFrameMeta(converted);
}

export function serializeProjectData(data: unknown): unknown {
  return serializeFrameUnitData(data);
}

export function deserializeProjectData(data: unknown): unknown {
  return deserializeFrameUnitData(data);
}
