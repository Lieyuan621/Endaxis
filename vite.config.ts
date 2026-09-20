/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { inspectorSchemaPlugin } from './tools/inspector-schema/vitePlugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    inspectorSchemaPlugin(),
    // public 绝对 URL 保持浏览器路径，不能在 Windows SSR 测试中转为无盘符的文件导入。
    vue({ template: { transformAssetUrls: { includeAbsolute: false } } }),
    vueDevTools(),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Rebuilds create thousands of short-lived source, audit, and WebP files. They are loaded
    // explicitly by the compiler when needed; watching them only causes Windows directory locks
    // and unnecessary dev-server reload work.
    watch: { ignored: ['**/tmp/**'] },
  },
  test: {
    // 超时用于发现卡死，不作为性能断言。完整编译和源码扫描在 CI 上可能超过 5 秒。
    // 初始化也可能生成整份候选，采用相同预算；更重的类型检查单独声明上限。
    testTimeout: 30_000,
    hookTimeout: 30_000,
    setupFiles: ['./src/test/prepareLocalization.ts'],
    // Rebuild/audit evidence belongs in the ignored temporary workspace and may
    // itself contain focused Vitest probes. It must never become part of the
    // repository test suite.
    exclude: [...configDefaults.exclude, 'tmp/**'],
  },
});
