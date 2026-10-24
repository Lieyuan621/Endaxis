/** HUD 是偏好的唯一写入方，独立设置窗只通过命令更新它。 */

import { ref, watch, type Ref } from 'vue';

export interface OverlayPreferences {
  /** 传送带能看到的时间范围（秒）。 */
  secondsAhead: number;
  /** 整体缩放。 */
  scale: number;
  /** 是否显示普攻/下落/处决。 */
  showBasic: boolean;
  showHeavy: boolean;
  showStatusEffects: boolean;
  inputTolerance: number;
  playbackMode: 'timed' | 'practice';
  layoutMode: 'single' | 'staggered';
  labelMode: 'action' | 'keyboard' | 'gamepad';
  /** HUD 宽度（px）。 */
  width: number;
  /** 面板不透明度（0.25–1）：越低越透，越能看清后面的游戏画面。 */
  hudOpacity: number;
  compactMode: boolean;
  /** 每次重新开始前的等待时间（秒）；不改变轴内的准备动作。 */
  startDelaySeconds: number;
}

export const OVERLAY_PREFS_KEY = 'endaxis_overlay_prefs_v1';

export const DEFAULT_OVERLAY_PREFERENCES: OverlayPreferences = {
  secondsAhead: 3,
  scale: 1,
  showBasic: true,
  showHeavy: true,
  showStatusEffects: true,
  inputTolerance: 0.25,
  playbackMode: 'timed',
  layoutMode: 'single',
  labelMode: 'keyboard',
  width: 1080,
  hudOpacity: 1,
  compactMode: false,
  startDelaySeconds: 2,
};

export const OVERLAY_LIMITS = {
  inputTolerance: { min: 0.05, max: 1 },
  secondsAhead: { min: 1, max: 10 },
  scale: { min: 0.7, max: 1.8 },
  width: { min: 720, max: 1920 },
  hudOpacity: { min: 0.2, max: 1 },
  startDelaySeconds: { min: 0, max: 10 },
} as const;

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** 把任意来源的数据规整成合法偏好，避免旧版本/手改数据把 HUD 挤到屏幕外。 */
export function normalizeOverlayPreferences(raw: unknown): OverlayPreferences {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const defaults = DEFAULT_OVERLAY_PREFERENCES;
  const limits = OVERLAY_LIMITS;
  return {
    secondsAhead: clampNumber(
      source.secondsAhead,
      limits.secondsAhead.min,
      limits.secondsAhead.max,
      defaults.secondsAhead,
    ),
    scale: clampNumber(source.scale, limits.scale.min, limits.scale.max, defaults.scale),
    compactMode: readBoolean(source.compactMode, defaults.compactMode),
    showBasic: readBoolean(source.showBasic, defaults.showBasic),
    showHeavy: readBoolean(source.showHeavy, defaults.showHeavy),
    showStatusEffects: readBoolean(source.showStatusEffects, defaults.showStatusEffects),
    playbackMode: source.playbackMode === 'practice' ? 'practice' : defaults.playbackMode,
    inputTolerance: clampNumber(
      source.inputTolerance,
      limits.inputTolerance.min,
      limits.inputTolerance.max,
      defaults.inputTolerance,
    ),
    labelMode:
      source.labelMode === 'action' ||
      source.labelMode === 'keyboard' ||
      source.labelMode === 'gamepad'
        ? source.labelMode
        : defaults.labelMode,
    layoutMode: source.layoutMode === 'staggered' ? 'staggered' : defaults.layoutMode,
    width: clampNumber(source.width, limits.width.min, limits.width.max, defaults.width),
    hudOpacity: clampNumber(
      source.hudOpacity,
      limits.hudOpacity.min,
      limits.hudOpacity.max,
      defaults.hudOpacity,
    ),
    startDelaySeconds: clampNumber(
      typeof source.startDelaySeconds === 'number'
        ? source.startDelaySeconds
        : defaults.startDelaySeconds,
      limits.startDelaySeconds.min,
      limits.startDelaySeconds.max,
      defaults.startDelaySeconds,
    ),
  };
}

export function loadOverlayPreferences(): OverlayPreferences {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_OVERLAY_PREFERENCES };
  try {
    const raw = localStorage.getItem(OVERLAY_PREFS_KEY);
    if (!raw) return { ...DEFAULT_OVERLAY_PREFERENCES };
    return normalizeOverlayPreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_OVERLAY_PREFERENCES };
  }
}

export function saveOverlayPreferences(preferences: OverlayPreferences): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(OVERLAY_PREFS_KEY, JSON.stringify(preferences));
  } catch {
    /* 隐私模式下写入会失败，HUD 仍可正常使用 */
  }
}

/** 响应式偏好：改动即持久化。 */
export function useOverlayPreferences(): {
  preferences: Ref<OverlayPreferences>;
  patch: (next: Partial<OverlayPreferences>) => void;
  reset: () => void;
} {
  const preferences = ref<OverlayPreferences>(loadOverlayPreferences());

  watch(
    preferences,
    value => {
      saveOverlayPreferences(normalizeOverlayPreferences(value));
    },
    { deep: true },
  );

  function patch(next: Partial<OverlayPreferences>) {
    preferences.value = normalizeOverlayPreferences({ ...preferences.value, ...next });
  }

  function reset() {
    preferences.value = { ...DEFAULT_OVERLAY_PREFERENCES };
  }

  return { preferences, patch, reset };
}
