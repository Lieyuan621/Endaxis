import type { Effect } from '@/data/types';
import { getEffectColor } from '@/data/effectPresets';
import { FALLBACK_EFFECT_COLOR } from '@/utils/theme';

/** Bright lavender matched to weapon buff bar reference (not theme purple). */
const WEAPON_BUFF_BAR_COLOR = '#c5a3ff';
/** Matches gear-set bonus accent in equipment dialog / timeline gear UI. */
const GEAR_SET_BUFF_BAR_COLOR = '#2dd4bf';
/** Operator fallback family when getEffectColor returns gray. */
const OPERATOR_FALLBACK_FAMILY = '#5dade2';

export type DurationBarColorSource = 'weapon' | 'gearSet' | 'operator' | 'anomaly';
export type DurationBarColorSurface = 'track' | 'enemy';

export interface DurationBarColorSources {
  weapon: boolean;
  gearSet: boolean;
  operator: boolean;
  /** Elemental / physical / reaction affliction bars (type colors + sat/lit). */
  anomaly: boolean;
}

export interface DurationBarColorSurfaces {
  track: boolean;
  enemy: boolean;
}

/** Persisted / UI preference for duration-bar dyeing. */
export interface DurationBarColorPrefs {
  enabled: boolean;
  /** 0–100. Scales HSL S on source-family dyes and anomaly type colors. */
  saturation: number;
  /** 0–100. Scales HSL L on source-family dyes and anomaly type colors. */
  lightness: number;
  sources: DurationBarColorSources;
  surfaces: DurationBarColorSurfaces;
}

export const DEFAULT_DURATION_BAR_COLOR_PREFS: DurationBarColorPrefs = {
  enabled: true,
  saturation: 50,
  lightness: 90,
  sources: { weapon: false, gearSet: false, operator: false, anomaly: true },
  surfaces: { track: true, enemy: true },
};

/** Options passed into projection / color resolver. */
export interface DurationBarColorOptions {
  enabled?: boolean;
  /** 0–100. Default matches prefs default. */
  saturation?: number;
  /** 0–100. Default matches prefs default. */
  lightness?: number;
  sources?: Partial<DurationBarColorSources>;
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!match) return null;
  const n = parseInt(match[1]!, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toByte = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

function clampDurationBarPercent(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function clampDurationBarSaturation(value: unknown): number {
  return clampDurationBarPercent(value, DEFAULT_DURATION_BAR_COLOR_PREFS.saturation);
}

export function clampDurationBarLightness(value: unknown): number {
  return clampDurationBarPercent(value, DEFAULT_DURATION_BAR_COLOR_PREFS.lightness);
}

export function normalizeDurationBarColorPrefs(source: unknown): DurationBarColorPrefs {
  const defaults = {
    ...DEFAULT_DURATION_BAR_COLOR_PREFS,
    sources: { ...DEFAULT_DURATION_BAR_COLOR_PREFS.sources },
    surfaces: { ...DEFAULT_DURATION_BAR_COLOR_PREFS.surfaces },
  };
  if (!source || typeof source !== 'object') return defaults;
  const input = source as Record<string, unknown>;
  if ('enabled' in input) defaults.enabled = input.enabled === true;
  defaults.saturation = clampDurationBarSaturation(input.saturation);
  defaults.lightness =
    input.lightness == null
      ? DEFAULT_DURATION_BAR_COLOR_PREFS.lightness
      : clampDurationBarLightness(input.lightness);
  const sources = input.sources;
  if (sources && typeof sources === 'object') {
    const s = sources as Record<string, unknown>;
    // Opt-in sources default off when key missing; anomaly defaults on.
    defaults.sources.weapon = s.weapon === true;
    defaults.sources.gearSet = s.gearSet === true;
    defaults.sources.operator = s.operator === true;
    defaults.sources.anomaly = s.anomaly !== false;
  }
  const surfaces = input.surfaces;
  if (surfaces && typeof surfaces === 'object') {
    const s = surfaces as Record<string, unknown>;
    defaults.surfaces.track = s.track !== false;
    defaults.surfaces.enemy = s.enemy !== false;
  }
  return defaults;
}

function applyFamilyScales(hex: string, saturation01: number, lightness01: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const sScale = Math.min(1, Math.max(0, saturation01));
  const lScale = Math.min(1, Math.max(0, lightness01));
  return hslToHex(hsl.h, hsl.s * sScale, hsl.l * lScale);
}

function varyInFamily(
  baseHex: string,
  key: string,
  saturation01: number,
  lightness01: number,
): string {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return baseHex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hash = hashString(key);
  const hueShift = (hash % 37) - 18;
  const litShift = ((hash >>> 16) % 9) - 4;
  const l = Math.min(0.78, Math.max(0.38, hsl.l + litShift / 100));
  const varied = hslToHex(hsl.h + hueShift, hsl.s, l);
  return applyFamilyScales(varied, saturation01, lightness01);
}

function getEffectIdentityKey(effect?: Effect | null, title?: string): string {
  if (!effect) return title || 'buff';
  const anyEffect = effect as Effect & { id?: string; name?: string; stat?: unknown };
  if (anyEffect.id) return String(anyEffect.id);
  if (anyEffect.name) return String(anyEffect.name);
  const stat = anyEffect.stat;
  if (typeof stat === 'string' && stat) return stat;
  if (stat && typeof stat === 'object') {
    try {
      return JSON.stringify(stat);
    } catch {
      return 'stat';
    }
  }
  return title || anyEffect.kind || 'buff';
}

function buildDurationBarColorKey(
  sourceGroup: unknown,
  effect?: Effect | null,
  title?: string,
): string {
  const group = sourceGroup || 'operator';
  return `${group}|${getEffectIdentityKey(effect, title)}`;
}

function resolveEquipmentSourceId(
  sourceGroup: unknown,
): 'weapon' | 'gearSet' | 'operator' {
  if (sourceGroup === 'weapon') return 'weapon';
  if (sourceGroup === 'gearSet') return 'gearSet';
  return 'operator';
}

function isAnomalyEffect(effect?: Effect | null): boolean {
  const kind = effect?.kind;
  return (
    kind === 'infliction' ||
    kind === 'burst' ||
    kind === 'reaction' ||
    kind === 'physicalStatus'
  );
}

export interface ResolveDurationBarColorOptions extends DurationBarColorOptions {
  sourceGroup?: unknown;
  effect?: Effect | null;
  title?: string;
}

/**
 * Duration-bar color when dyeing is enabled:
 * weapon/gearSet families, anomaly type colors (sat/lit), or operator family/type.
 * When dyeing is off, all bars use neutral fallback (no type tint).
 */
export function resolveDurationBarColor(opts: ResolveDurationBarColorOptions): string {
  if (opts.enabled !== true) return FALLBACK_EFFECT_COLOR;

  const typeColor =
    opts.effect != null ? getEffectColor(opts.effect) : FALLBACK_EFFECT_COLOR;

  const group =
    opts.sourceGroup ?? (opts.effect as Effect | null | undefined)?.sourceGroup ?? 'operator';
  const equipmentId = resolveEquipmentSourceId(group);
  const saturation01 =
    clampDurationBarSaturation(opts.saturation ?? DEFAULT_DURATION_BAR_COLOR_PREFS.saturation) / 100;
  const lightness01 =
    clampDurationBarLightness(opts.lightness ?? DEFAULT_DURATION_BAR_COLOR_PREFS.lightness) / 100;
  const key = buildDurationBarColorKey(group, opts.effect, opts.title);

  const weaponOn = opts.sources?.weapon === true;
  const gearOn = opts.sources?.gearSet === true;
  const operatorOn = opts.sources?.operator === true;
  const anomalyOn = opts.sources?.anomaly !== false;

  // Weapon/gear keep their own lane: when that source is off, use plain type color
  // (do not fall through into operator dyeing).
  if (equipmentId === 'weapon') {
    if (!weaponOn) return typeColor;
    return varyInFamily(WEAPON_BUFF_BAR_COLOR, key, saturation01, lightness01);
  }
  if (equipmentId === 'gearSet') {
    if (!gearOn) return typeColor;
    return varyInFamily(GEAR_SET_BUFF_BAR_COLOR, key, saturation01, lightness01);
  }

  if (isAnomalyEffect(opts.effect)) {
    if (!anomalyOn) return FALLBACK_EFFECT_COLOR;
    return applyFamilyScales(typeColor, saturation01, lightness01);
  }

  if (!operatorOn) return typeColor;

  if (typeColor.toLowerCase() !== FALLBACK_EFFECT_COLOR.toLowerCase()) {
    return applyFamilyScales(typeColor, saturation01, lightness01);
  }
  return varyInFamily(OPERATOR_FALLBACK_FAMILY, key, saturation01, lightness01);
}

/** Build projection color options for one surface from full prefs. */
export function durationBarColorOptionsForSurface(
  prefs: DurationBarColorPrefs,
  surface: DurationBarColorSurface,
): DurationBarColorOptions {
  return {
    enabled: prefs.enabled === true && prefs.surfaces[surface] !== false,
    saturation: prefs.saturation,
    lightness: prefs.lightness,
    sources: { ...prefs.sources },
  };
}
