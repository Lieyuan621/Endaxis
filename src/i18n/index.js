import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ru from './locales/ru.json'
import zhCN from './locales/zh-CN.json'
import { normalizeLocale, SUPPORTED_LOCALES } from './elementPlusLocale.js'

const STORAGE_KEY = 'endaxis_locale'

export function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return normalizeLocale(saved)
  } catch {
    // ignore
  }

  if (typeof navigator !== 'undefined') {
    const langs = Array.isArray(navigator.languages) ? navigator.languages : []
    for (const l of langs) {
      const n = normalizeLocale(l)
      if (SUPPORTED_LOCALES.includes(n)) return n
    }
    return normalizeLocale(navigator.language)
  }

  return 'zh-CN'
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    en,
    ru,
    'zh-CN': zhCN,
  },
})

export function setLocale(locale) {
  const normalized = normalizeLocale(locale)
  i18n.global.locale.value = normalized

  try {
    localStorage.setItem(STORAGE_KEY, normalized)
  } catch {
    // ignore
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized
  }

  return normalized
}