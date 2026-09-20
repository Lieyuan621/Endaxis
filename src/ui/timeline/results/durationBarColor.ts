/** UI-only duration-bar preferences. No simulation or legacy store dependency. */
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
export const DURATION_COLOR_SOURCES = ['anomaly', 'weapon', 'gearSet', 'operator'] as const;
export const DURATION_COLOR_SURFACES = ['track', 'enemy'] as const;
export type DurationColorSource = (typeof DURATION_COLOR_SOURCES)[number];
export type DurationColorSurface = (typeof DURATION_COLOR_SURFACES)[number];
/** 原生异常颜色语义，不枚举 Buff ID；同一异常的不同工厂输出共享颜色。 */
const ANOMALY_COLORS: Readonly<Record<string, string>> = {
  Fire: '#ff5a5f',
  Pulse: '#ffec3d',
  Cryst: '#69c0ff',
  Natural: '#52c41a',
};
// 附着的原生 abnormalColorType 是 Physical，用已有 role.element 区分元素。
const ELEMENT_COLOR_TYPES = {
  heat: 'Fire',
  electric: 'Pulse',
  cryo: 'Cryst',
  nature: 'Natural',
} as const;
const attachmentColors: Readonly<Record<string, string>> = Object.fromEntries(
  elementalAttachments.buffs.flatMap(buff =>
    buff.role?.kind === 'elementalAttachment'
      ? [[buff.id, ANOMALY_COLORS[ELEMENT_COLOR_TYPES[buff.role.element]]!]]
      : [],
  ),
);
export interface DurationBarColorPrefs {
  enabled: boolean;
  saturation: number;
  lightness: number;
  sources: Record<DurationColorSource, boolean>;
  surfaces: Record<DurationColorSurface, boolean>;
}
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
export function normalizeDurationBarColorPrefs(value: unknown): DurationBarColorPrefs {
  const input = record(value);
  const percent = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v)
      ? Math.max(0, Math.min(100, Math.round(v)))
      : fallback;
  const sources = record(input.sources);
  const surfaces = record(input.surfaces);
  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : true,
    saturation: percent(input.saturation, 50),
    lightness: percent(input.lightness, 90),
    sources: {
      weapon: sources.weapon === true,
      gearSet: sources.gearSet === true,
      operator: sources.operator === true,
      anomaly: sources.anomaly !== false,
    },
    surfaces: { track: surfaces.track !== false, enemy: surfaces.enemy !== false },
  };
}

/** Classify emitted provenance, never translated labels or guessed buff names. */
export function durationColorSource(
  sourceActionId: string | undefined,
): 'weapon' | 'gearSet' | 'operator' {
  const kind = /^(?:equipment:|upgrade-initialization:)([^:]+):/.exec(sourceActionId ?? '')?.[1];
  if (kind === 'weaponTrait' || kind === 'weapon-trait') return 'weapon';
  if (kind === 'gearTrait' || kind === 'gear-trait' || kind === 'gearSet' || kind === 'gear-set')
    return 'gearSet';
  return 'operator';
}

function hsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2;
  if (d === 0) return [0, 0, l];
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, d / (1 - Math.abs(2 * l - 1)), l];
}

export function resolveDurationBarColor(
  prefs: DurationBarColorPrefs,
  surface: DurationColorSurface,
  buff: {
    readonly buffId: string;
    readonly sourceActionId?: string;
    readonly abnormalColorType?: string;
  },
  anomalyColor = attachmentColors[buff.buffId] ?? ANOMALY_COLORS[buff.abnormalColorType ?? ''],
): string {
  const neutral = '#8c8c8c';
  if (!prefs.enabled || !prefs.surfaces[surface]) return neutral;
  const source = durationColorSource(buff.sourceActionId);
  // Preserve upstream precedence: equipment dye does not fall through to operator dye.
  const anomaly = source === 'operator' && anomalyColor !== undefined;
  if (!prefs.sources[anomaly ? 'anomaly' : source])
    return anomaly ? neutral : (anomalyColor ?? neutral);
  const base = anomaly
    ? anomalyColor!
    : source === 'weapon'
      ? '#c5a3ff'
      : source === 'gearSet'
        ? '#2dd4bf'
        : '#5dade2';
  let [h, s, l] = hsl(base);
  if (!anomaly) {
    let hash = 2166136261;
    for (const char of `${source}|${buff.buffId}`)
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    hash >>>= 0;
    h += (hash % 37) - 18;
    l = Math.min(0.78, Math.max(0.38, l + (((hash >>> 16) % 9) - 4) / 100));
  }
  return `hsl(${((h % 360) + 360) % 360} ${s * prefs.saturation}% ${l * prefs.lightness}%)`;
}
