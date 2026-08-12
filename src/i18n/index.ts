import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import { normalizeLocale, type SupportedLocale } from './elementPlusLocale';

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
  messages: {
    en,
    'zh-CN': zhCN,
  },
});

export function setLocale(locale: unknown): SupportedLocale {
  const normalized = normalizeLocale(locale);
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
