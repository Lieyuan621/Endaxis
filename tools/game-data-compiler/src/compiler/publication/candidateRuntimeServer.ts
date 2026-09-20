import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';

import { createCandidateRuntimeOverlayPlugin } from './candidateRuntimeOverlay.ts';

interface CandidateRuntimeServerArguments {
  readonly projectRoot: string;
  readonly candidateRoot: string;
  readonly replacementPaths: readonly string[];
}

interface CompatModuleRunner {
  readonly transport?: { timeout?: number };
}

const CANDIDATE_MODULE_TIMEOUT_MS = 5 * 60_000;

/**
 * 候选审计只需要按需转换模块，不需要文件监听或 HMR。先加载一个很小的正式模块来创建
 * Vite 兼容 runner，再扩展其单次 transport 窗口；大型生成模块在低配置/高 IO 压力下
 * 可能超过 Vite 默认的 60 秒，但仍必须沿用同一个候选覆盖视图。
 */
export async function createCandidateRuntimeServer(
  args: CandidateRuntimeServerArguments,
): Promise<ViteDevServer> {
  const server = await createServer({
    configFile: false,
    root: args.projectRoot,
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true, watch: null, hmr: false },
    optimizeDeps: { noDiscovery: true },
    plugins: [
      createCandidateRuntimeOverlayPlugin({
        projectRoot: args.projectRoot,
        candidateRoot: args.candidateRoot,
        replacementPaths: args.replacementPaths,
      }),
    ],
  });
  try {
    await server.ssrLoadModule('/src/core/game-data/operatorDefinition.ts');
    const runner = (
      server as ViteDevServer & {
        _ssrCompatModuleRunner?: CompatModuleRunner;
      }
    )._ssrCompatModuleRunner;
    if (runner?.transport === undefined) {
      throw new Error('Vite candidate runtime runner was not initialized');
    }
    runner.transport.timeout = CANDIDATE_MODULE_TIMEOUT_MS;
    return server;
  } catch (error) {
    await server.close();
    throw error;
  }
}
