import { afterEach, expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Laevatain from './LaevatainPassiveUi.vue';
import Liino from './LiinoPassiveUi.vue';
import Typhoea from './TyphoeaPassiveUi.vue';
import ZhuangFangyi from './ZhuangFangyiPassiveUi.vue';

afterEach(() => vi.unstubAllEnvs());

it.each(['normal', 'ultimate'] as const)('专属状态的 %s 外观图片遵循子目录部署路径', async mode => {
  vi.stubEnv('BASE_URL', '/Endaxis/');
  for (const component of [Laevatain, Liino, Typhoea, ZhuangFangyi]) {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(component, { value: 2, maximum: 4, active: true, mode, ratio: 0.5, points: 2 }),
      }),
    );
    const sources = [...html.matchAll(/src="([^"]+)"/g)].map(match => match[1]);
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) expect(source).toMatch(/^\/Endaxis\/next\/passive-ui\//);
  }
});
