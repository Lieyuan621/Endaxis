import { fileURLToPath, URL } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from '../vite.shared';

/** 独立入口决定依赖图；网页构建无需知道任何桌面功能。 */
export default mergeConfig(
  sharedConfig,
  defineConfig({
    root: fileURLToPath(new URL('..', import.meta.url)),
    publicDir: fileURLToPath(new URL('../public', import.meta.url)),
    plugins: [
      {
        name: 'endaxis-desktop-editor-route',
        configureServer(server) {
          // 刷新 /timeline 仍返回桌面入口，不能回落到网页 index.html。
          server.middlewares.use((request, _response, next) => {
            const url = new URL(request.url ?? '/', 'http://localhost');
            if (url.pathname === '/' || url.pathname === '/timeline')
              request.url = `/desktop/renderer/editor/index.html${url.search}`;
            next();
          });
        },
      },
    ],
    build: {
      outDir: fileURLToPath(new URL('./dist', import.meta.url)),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          toolbar: fileURLToPath(
            new URL('./features/overlay/renderer/toolbar.html', import.meta.url),
          ),
          editor: fileURLToPath(new URL('./renderer/editor/index.html', import.meta.url)),
          overlay: fileURLToPath(
            new URL('./features/overlay/renderer/index.html', import.meta.url),
          ),
          overlaySettings: fileURLToPath(
            new URL('./features/overlay/renderer/settings.html', import.meta.url),
          ),
        },
      },
    },
    test: {
      include: ['desktop/renderer/**/*.test.ts', 'desktop/features/**/renderer/**/*.test.ts'],
    },
  }),
);
