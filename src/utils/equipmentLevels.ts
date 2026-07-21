/** Level filter chips in the equipment picker (descending). */
export const EQUIPMENT_LEVELS = Object.freeze([70, 60, 50, 36, 28, 20, 10]);

/** Border / accent color by level requirement. Gold = artificable tiers (60+). */
const EQUIPMENT_LEVEL_COLORS = Object.freeze({
  70: '#ffd700',
  60: '#ffd700',
  50: '#b37feb',
  36: '#4a90e2',
  28: '#73c94f',
  20: '#95de64',
  10: '#888888',
} as const);

/** Matches `getQualityTier()` gold threshold — Lv60+ can 精锻. */
const EQUIPMENT_ARTIFICING_MIN_LEVEL = 60;

export function getEquipmentLevelColor(level: number | string | null | undefined): string {
  const key = Number(level);
  return (
    EQUIPMENT_LEVEL_COLORS[key as keyof typeof EQUIPMENT_LEVEL_COLORS] || '#888888'
  );
}

export function isEquipmentArtificable(level: number | string | null | undefined): boolean {
  return Number(level) >= EQUIPMENT_ARTIFICING_MIN_LEVEL;
}
