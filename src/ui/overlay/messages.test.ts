import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import { i18n, setLocale } from '../../i18n';
import { mountSetup } from '../../test/componentSetup';
import { useOverlayI18n } from './messages';

it('两种局部文案在主程序替换字典后仍可用，且不污染全局文案', async () => {
  const originalLocale = i18n.global.locale.value;
  try {
    for (const locale of ['zh-CN', 'en'] as const) {
      await setLocale(locale);
      const mounted = await mountSetup({ setup: () => useOverlayI18n() }, {});
      try {
        await setLocale(locale);
        await nextTick();
        expect(mounted.state.t('overlay.open')).toBe(locale === 'en' ? 'Overlay' : '游戏内提示');
        expect(i18n.global.te('overlay.open', locale)).toBe(false);
      } finally {
        mounted.stop();
      }
    }
  } finally {
    await setLocale(originalLocale);
  }
});
