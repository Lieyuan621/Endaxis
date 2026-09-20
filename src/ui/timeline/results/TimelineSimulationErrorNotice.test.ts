import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it } from 'vitest';
import messages from '../../../i18n/locales/zh-CN.json';
import TimelineSimulationErrorNotice from './TimelineSimulationErrorNotice.vue';

async function render(error: string | null) {
  const app = createSSRApp(TimelineSimulationErrorNotice, { error });
  app.use(createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': messages } }));
  return renderToString(app);
}

it('does not reserve space without a simulation error', async () => {
  expect(await render(null)).toBe('<!---->');
});

it('renders only the fixed simulation error notice', async () => {
  const html = await render('bad data');
  expect(html).toContain('simulation-error-notice');
  expect(html).toContain('模拟失败');
  expect(html).toContain('bad data');
  expect(html).toContain('<textarea');
  expect(html).toContain('readonly');
  expect(html).toContain('复制');
  expect(html).not.toContain('等待模拟');
  expect(html).not.toContain('上次结果');
});
