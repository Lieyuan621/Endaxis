/**
 * Vitest 不经过应用 bootstrap 和路由守卫，因此在每个测试 worker 中显式准备完整语言夹具。
 * 这只影响测试环境；生产构建仍按 UI locale 与路由声明的游戏文本 family 动态加载。
 */
import { ALL_GAME_TEXT_FAMILIES, ensureLocaleResources, i18n } from '../i18n';
import { SUPPORTED_LOCALES } from '../i18n/elementPlusLocale';

for (const locale of SUPPORTED_LOCALES) {
  const prepared = await ensureLocaleResources(locale, ALL_GAME_TEXT_FAMILIES);
  i18n.global.setLocaleMessage(prepared.locale, prepared.uiMessages);
  if (prepared.fallbackMessages !== undefined) {
    i18n.global.setLocaleMessage('zh-CN', prepared.fallbackMessages);
  }
}

i18n.global.locale.value = 'zh-CN';
