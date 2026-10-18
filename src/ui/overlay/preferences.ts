/**
 * 游戏内提示条的偏好设置（跨会话持久化）。
 *
 * 叠加窗口通常是「全屏透明 + HUD 绝对定位」，所以位置用相对屏幕中心的偏移量表示，
 * 玩家拖动一次即可放到游戏时间显示的下方。
 */

import { computed, ref, watch, type Ref } from 'vue';

export type OverlayIconMode = 'skill' | 'portrait';

export interface OverlayPreferences {
  /** 图标来源：技能图标 / 干员头像。 */
  iconMode: OverlayIconMode;
  /** 传送带能看到的时间范围（秒）。 */
  secondsAhead: number;
  /** 整体缩放。 */
  scale: number;
  /** 相对屏幕水平中心的偏移（px）。 */
  offsetX: number;
  /** 相对屏幕顶部的偏移（px）。 */
  offsetY: number;
  /** 是否显示普攻/下落/处决。 */
  showBasic: boolean;
  /** 是否显示下方的技力/连携/终结技能量条。 */
  showResources: boolean;
  /** 透明背景（用于叠加到游戏/OBS）；关闭时显示调试底色。 */
  transparent: boolean;
  /** HUD 宽度（px）。 */
  width: number;
  /** 面板不透明度（0.25–1）：越低越透，越能看清后面的游戏画面。 */
  hudOpacity: number;
  /** 打开页面后自动开始计时。 */
  autoStart: boolean;
}

export const OVERLAY_PREFS_KEY = 'endaxis_overlay_prefs_v1';

export const DEFAULT_OVERLAY_PREFERENCES: OverlayPreferences = {
  iconMode: 'skill',
  secondsAhead: 9,
  scale: 1,
  offsetX: 0,
  // 默认贴着顶部：小弹窗（工具栏「游戏内提示」打开的窗口）里就是「游戏时间下方一点点」，
  // 全屏叠加时也可以直接拖到想要的位置。
  offsetY: 40,
  showBasic: false,
  showResources: true,
  transparent: true,
  width: 1080,
  // 默认偏透：叠在游戏画面上时只保留一层很薄的底，文字靠描边和阴影保证可读。
  hudOpacity: 0.52,
  autoStart: false,
};

export const OVERLAY_LIMITS = {
  secondsAhead: { min: 4, max: 20 },
  scale: { min: 0.7, max: 1.8 },
  offsetX: { min: -2000, max: 2000 },
  offsetY: { min: -200, max: 1600 },
  width: { min: 720, max: 1920 },
  hudOpacity: { min: 0.2, max: 1 },
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
    iconMode: source.iconMode === 'portrait' ? 'portrait' : defaults.iconMode,
    secondsAhead: clampNumber(
      source.secondsAhead,
      limits.secondsAhead.min,
      limits.secondsAhead.max,
      defaults.secondsAhead,
    ),
    scale: clampNumber(source.scale, limits.scale.min, limits.scale.max, defaults.scale),
    offsetX: clampNumber(source.offsetX, limits.offsetX.min, limits.offsetX.max, defaults.offsetX),
    offsetY: clampNumber(source.offsetY, limits.offsetY.min, limits.offsetY.max, defaults.offsetY),
    showBasic: readBoolean(source.showBasic, defaults.showBasic),
    showResources: readBoolean(source.showResources, defaults.showResources),
    transparent: readBoolean(source.transparent, defaults.transparent),
    width: clampNumber(source.width, limits.width.min, limits.width.max, defaults.width),
    hudOpacity: clampNumber(
      source.hudOpacity,
      limits.hudOpacity.min,
      limits.hudOpacity.max,
      defaults.hudOpacity,
    ),
    autoStart: readBoolean(source.autoStart, defaults.autoStart),
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

export function useOverlayIconMode(preferences: Ref<OverlayPreferences>) {
  return computed(() => preferences.value.iconMode);
}
