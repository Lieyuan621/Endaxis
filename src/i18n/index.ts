import { createI18n } from 'vue-i18n';
import { normalizeLocale, type SupportedLocale } from './elementPlusLocale';
import { gameLocaleRegistry } from './gameLocaleRegistry';
import {
  localeResourceLoaders,
  type GameTextFamily,
  type LocaleTable,
} from './localeResourceLoaders';

const STORAGE_KEY = 'endaxis_locale';

export function detectLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeLocale(saved);
  } catch {
    // ignore
  }

  // First visit: Chinese wins wherever it appears in the browser's list, not just when it is
  // first — zh-CN is the source language, so a reader who lists it at all is better served by
  // it than by English. Everyone else gets the English default.
  if (typeof navigator !== 'undefined') {
    const langs = Array.isArray(navigator.languages) ? navigator.languages : [];
    const preferences = langs.length > 0 ? langs : [navigator.language];
    if (preferences.some(lang => normalizeLocale(lang) === 'zh-CN')) return 'zh-CN';
  }

  return 'en';
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'zh-CN',
  messages: {},
});

export const ALL_GAME_TEXT_FAMILIES = [
  'contingency-contracts',
  'operators',
  'weapons',
  'gears',
  'enemies',
  'consumables',
  'terms',
] as const satisfies readonly GameTextFamily[];

export interface PreparedLocaleResources {
  readonly locale: SupportedLocale;
  readonly uiMessages: LocaleTable;
  readonly fallbackMessages?: LocaleTable;
}

/**
 * 只准备资源而不改变当前可见语言；页面可以按实际视图缩小资源集合。
 * 俄语 UI 尚未自包含，因此兼容阶段额外准备中文 fallback。
 */
export async function ensureLocaleResources(
  locale: unknown,
  gameTextFamilies: readonly GameTextFamily[] = [],
): Promise<PreparedLocaleResources> {
  const normalized = normalizeLocale(locale);
  const [[uiMessages, fallbackMessages]] = await Promise.all([
    Promise.all([
      localeResourceLoaders.loadUiLocale(normalized),
      normalized === 'ru'
        ? localeResourceLoaders.loadUiLocale('zh-CN')
        : Promise.resolve(undefined),
    ]),
    Promise.all(
      gameTextFamilies.map(family => gameLocaleRegistry.ensureFamily(normalized, family)),
    ),
  ]);
  return {
    locale: normalized,
    uiMessages,
    ...(fallbackMessages === undefined ? {} : { fallbackMessages }),
  };
}

let localeRequestId = 0;

/** 资源全部准备成功后再原子切换可见语言；较慢的旧请求不会覆盖更新的选择。 */
export async function setLocale(
  locale: unknown,
  gameTextFamilies: readonly GameTextFamily[] = [],
): Promise<SupportedLocale> {
  const requestId = ++localeRequestId;
  const prepared = await ensureLocaleResources(locale, gameTextFamilies);
  if (requestId !== localeRequestId) return normalizeLocale(i18n.global.locale.value);

  i18n.global.setLocaleMessage(prepared.locale, prepared.uiMessages);
  if (prepared.fallbackMessages !== undefined) {
    i18n.global.setLocaleMessage('zh-CN', prepared.fallbackMessages);
  }
  const normalized = prepared.locale;
  i18n.global.locale.value = normalized;

  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // ignore
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;
  }

  return normalized;
}
