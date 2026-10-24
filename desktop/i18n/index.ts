import { createI18n } from 'vue-i18n';
import { normalizeLocale, type SupportedLocale } from '@/i18n/elementPlusLocale';
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

export const desktopMessages = { 'zh-CN': zhCN, en };
export const desktopI18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: normalizeLocale(typeof navigator === 'undefined' ? 'en' : navigator.language),
  fallbackLocale: 'zh-CN',
  messages: desktopMessages,
});

/** 每个桌面窗口跟随自己的展示状态，不读写编辑器语言偏好。 */
export function setDesktopLocale(value: unknown): SupportedLocale {
  const locale = normalizeLocale(value);
  desktopI18n.global.locale.value = locale;
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
  return locale;
}
