import en from 'element-plus/es/locale/lang/en';
import ru from 'element-plus/es/locale/lang/ru';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

export type SupportedLocale = 'zh-CN' | 'en' | 'ru';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['zh-CN', 'en', 'ru'];

/** Any Chinese tag selects zh-CN; everything else — including no preference at all — is English. */
export function normalizeLocale(raw: unknown): SupportedLocale {
  const lower = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (lower === 'zh' || lower.startsWith('zh-')) return 'zh-CN';
  if (lower === 'ru' || lower.startsWith('ru-')) return 'ru';
  return 'en';
}

export function getElementPlusLocale(locale: unknown) {
  const normalized = normalizeLocale(locale);
  if (normalized === 'en') return en;
  if (normalized === 'ru') return ru;
  return zhCn;
}
