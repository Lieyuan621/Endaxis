// ─── Element colors (canonical palette) ─────────────────────────────────────

export const elementColors: Record<string, string> = {
  heat: '#e85d3a',
  electric: '#f0b23c',
  cryo: '#5ec5e5',
  nature: '#8bc34a',
  physical: '#d4c5a0',
};

// ─── Extended color map (elements + action types + reactions + default) ──────

export const ELEMENT_COLORS: Record<string, string> = {
  // Base elements
  ...elementColors,

  // Action types
  comboSkill: '#fdd900',
  dive: '#5ec5e5',
  finisher: '#a61d24',
  battleSkill: '#ffffff',
  ultimate: '#4a90d9',
  basicAttack: '#aaaaaa',
  attack: '#aaaaaa',
  skill: '#ffffff',
  link: '#fdd900',
  execution: '#a61d24',
  dodge: '#5ec5e5',
  default: '#8c8c8c',

  // Heat reactions
  heat_infliction: '#e85d3a',
  heat_burst: '#f09070',
  combustion: '#c43a1a',

  // Cryo reactions
  cryo_infliction: '#5ec5e5',
  cryo_burst: '#40a9ff',
  solidification: '#1890ff',
  shatter: '#bae7ff',

  // Electric reactions
  electric_infliction: '#f0b23c',
  electric_burst: '#f5d060',
  electrification: '#f0c23c',

  // Nature reactions
  nature_infliction: '#8bc34a',
  nature_burst: '#73d13d',
  corrosion: '#6aad38',

  // Physical reactions
  vulnerability: '#d9d9d9',
  breach: '#d9d9d9',
  crush: '#d9d9d9',
  knockdown: '#d9d9d9',
  lift: '#d9d9d9',
};

// ─── Rarity colors ──────────────────────────────────────────────────────────

export const rarityColors: Record<number, string> = {
  3: '#5c98c9',
  4: '#b388e8',
  5: '#e5a63e',
  6: '#ff6e40',
};

// ─── Gear quality colors ────────────────────────────────────────────────────

export const qualityColors: Record<string, string> = {
  green: '#4caf50',
  blue: '#2196f3',
  purple: '#ab47bc',
  gold: '#ffa726',
};

// ─── Enemy tiers ────────────────────────────────────────────────────────────

export const ENEMY_TIERS = [
  { labelKey: 'enemyTier.normal', label: '普通', value: 'normal', color: '#a0a0a0' },
  { labelKey: 'enemyTier.advanced', label: '进阶', value: 'advanced', color: '#52c41a' },
  { labelKey: 'enemyTier.elite', label: '精英', value: 'elite', color: '#d8b4fe' },
  { labelKey: 'enemyTier.boss', label: '头目', value: 'boss', color: '#ffd700' },
  { labelKey: 'enemyTier.leader', label: '领袖', value: 'leader', color: '#ff4d4f' },
] as const;

// ─── Effect / status bar colors ─────────────────────────────────────────────
// Used by simulation projection for effect status bars on the timeline.
// Distinct from ELEMENT_COLORS which colors action bars.

export const EFFECT_COLORS: Record<string, string> = {
  // Inflictions
  heat_infliction: '#ff4d4f',
  electric_infliction: '#ffd700',
  cryo_infliction: '#1890ff',
  nature_infliction: '#52c41a',
  // Bursts
  heat_burst: '#ff4d4f',
  electric_burst: '#ffd700',
  cryo_burst: '#00e5ff',
  nature_burst: '#52c41a',
  // Reactions
  combustion: '#f5222d',
  electrification: '#ffec3d',
  solidification: '#1890ff',
  corrosion: '#52c41a',
  shatter: '#bae7ff',
  // Physical statuses
  vulnerability: '#d9d9d9',
  breach: '#d9d9d9',
  crush: '#d9d9d9',
  knockdown: '#d9d9d9',
  lift: '#d9d9d9',
};

export const FALLBACK_EFFECT_COLOR = '#8c8c8c';

// ─── Color utilities ────────────────────────────────────────────────────────

/** Convert hex color to rgba string with given alpha. */
export function hexToRgba(hex: string | undefined | null, alpha: number): string {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  let c = hex.substring(1).split('');
  if (c.length === 3) {
    const [r = '0', g = '0', b = '0'] = c;
    c = [r, r, g, g, b, b];
  }
  const n = parseInt(c.join(''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Lighten a hex color by mixing with white. Amount 0–1. */
export function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}
