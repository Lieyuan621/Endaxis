import en from 'element-plus/es/locale/lang/en';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

export type SupportedLocale = 'zh-CN' | 'en';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['zh-CN', 'en'];

/** Any Chinese tag selects zh-CN; everything else — including no preference at all — is English. */
export function normalizeLocale(raw: unknown): SupportedLocale {
  const lower = String(raw ?? '')
    .trim()
    .toLowerCase();
  return lower === 'zh' || lower.startsWith('zh-') ? 'zh-CN' : 'en';
}

export function getElementPlusLocale(locale: unknown) {
  const normalized = normalizeLocale(locale);
  if (normalized === 'en') return en;
  return zhCn;
}
