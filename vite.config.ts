import { fileURLToPath, URL } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import sharedConfig from './vite.shared';

const normalizePath = (value: string) => {
  const path = value.replaceAll('\\', '/');
  return process.platform === 'win32' ? path.toLowerCase() : path;
};
const root = normalizePath(fileURLToPath(new URL('.', import.meta.url)));

function webBoundary(): Plugin {
  return {
    name: 'endaxis-web-boundary',
    apply: 'build',
    generateBundle(_options, bundle) {
      const modules = new Set(
        Object.values(bundle).flatMap(output =>
          output.type === 'chunk' ? Object.keys(output.modules) : [],
        ),
      );
      const desktopModules = [...modules].filter(id =>
        normalizePath(id).startsWith(`${root}desktop/`),
      );
      if (desktopModules.length)
        this.error(`Web build includes desktop modules:\n${desktopModules.join('\n')}`);
      this.info(`Verified ${modules.size} web modules: no desktop feature code included.`);
    },
  };
}

export default mergeConfig(
  sharedConfig,
  defineConfig({
    plugins: [webBoundary()],
    worker: { plugins: () => [webBoundary()] },
    test: { exclude: ['desktop/**'] },
  }),
);
