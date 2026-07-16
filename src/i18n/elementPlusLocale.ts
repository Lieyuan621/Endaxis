import en from 'element-plus/es/locale/lang/en';
import ru from 'element-plus/es/locale/lang/ru';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

export type SupportedLocale = 'zh-CN' | 'en' | 'ru';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['zh-CN', 'en', 'ru'];

export function normalizeLocale(raw: unknown): SupportedLocale {
  if (!raw) return 'zh-CN';
  const v = String(raw).trim();
  if (!v) return 'zh-CN';

  const lower = v.toLowerCase();
  if (lower === 'zh' || lower === 'zh-cn' || lower === 'zh-hans') return 'zh-CN';
  if (lower === 'en' || lower.startsWith('en-')) return 'en';
  if (lower === 'ru' || lower.startsWith('ru-')) return 'ru';

  return 'zh-CN';
}

export function getElementPlusLocale(locale: unknown) {
  const normalized = normalizeLocale(locale);
  if (normalized === 'en') return en;
  if (normalized === 'ru') return ru;
  return zhCn;
}
