/** 通过真实 Vite SSR 验证候选覆盖；仅测试 resolveId 返回值不能证明最终加载了哪套数据。 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { createCandidateRuntimeOverlayPlugin } from '../../src/compiler/publication/candidateRuntimeOverlay.ts';

let root: string;
let projectRoot: string;
let candidateRoot: string;
beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'candidate-runtime-overlay-'));
  projectRoot = path.join(root, 'formal');
  candidateRoot = path.join(root, 'candidate');
  const absoluteImport = (file: string) =>
    `export { value } from ${JSON.stringify(path.join(projectRoot, file).replaceAll('\\', '/'))};`;
  const modules = {
    'formal/src/absolute-directory.js': absoluteImport('src/generated/item'),
    'formal/src/absolute-missing.js': absoluteImport('src/generated/removed'),
    'formal/src/absolute-new-file.js': absoluteImport('src/mixed/new-item'),
    'formal/src/directory.js': "export { value } from './generated/item';",
    'formal/src/explicit-extension.js': "export { default as value } from './mixed/new-item.json';",
    'formal/src/helper.js': "export const helper = 'formal shared helper';",
    'formal/src/missing.js': "export { value } from './generated/removed';",
    'formal/src/new-file.js': "export { value } from './mixed/new-item';",
    'formal/src/single.js':
      "export { value } from './mixed/item';\r\nexport { helper } from './mixed/helper';",
    'candidate/src/generated/item.js':
      "import { sibling } from './sibling';\r\nimport { helper } from '../helper';\r\n\r\nexport const value = `${sibling} / ${helper}`;",
    'candidate/src/generated/sibling.js': "export const sibling = 'candidate sibling';",
    'candidate/src/mixed/item.js': "export const value = 'candidate item';",
    'candidate/src/mixed/new-item.js': "export const value = 'new candidate item';",
    'formal/src/generated/item.js': "export const value = 'formal generated item';",
    'formal/src/generated/removed.js': "export const value = 'formal removed item';",
    'formal/src/generated/sibling.js': "export const sibling = 'formal sibling';",
    'formal/src/mixed/helper.js': "export const helper = 'formal mixed helper';",
    'formal/src/mixed/item.js': "export const value = 'formal item';",
  };
  for (const [relativePath, source] of Object.entries(modules)) {
    const file = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source);
  }
  fs.symlinkSync(projectRoot, path.join(root, 'formal-link'), 'junction');
});
afterAll(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
});

async function withServer(
  replacementPaths: readonly string[],
  run: (server: ViteDevServer) => Promise<void>,
) {
  const resolutions: unknown[] = [];
  const overlay = createCandidateRuntimeOverlayPlugin({
    projectRoot,
    candidateRoot,
    replacementPaths,
  });
  const resolveId = overlay.resolveId;
  if (typeof resolveId !== 'function') throw new Error('候选加载器缺少 resolveId 函数');
  overlay.resolveId = async function (source, importer, options) {
    try {
      const result = await resolveId.call(this, source, importer, options);
      resolutions.push({ source, importer, result });
      return result;
    } catch (error) {
      resolutions.push({ source, importer, error: String(error) });
      throw error;
    }
  };
  const server = await createServer({
    configFile: false,
    root: projectRoot,
    appType: 'custom',
    logLevel: 'silent',
    // 链接场景保留导入路径的别名，确保插件自身能识别真实目录，不依赖 Vite 代为修正。
    resolve: { preserveSymlinks: projectRoot === path.join(root, 'formal-link') },
    server: { middlewareMode: true, watch: null, hmr: false },
    optimizeDeps: { noDiscovery: true },
    plugins: [overlay],
  });
  try {
    await run(server);
  } catch (error) {
    // 仅失败时记录真实输入与输出，供 Windows CI 和本机对照；不修改解析结果。
    console.error(
      '候选模块解析诊断',
      JSON.stringify(
        {
          platform: process.platform,
          node: process.version,
          cwd: process.cwd(),
          projectRoot,
          candidateRoot,
          projectRealPath: fs.realpathSync(projectRoot),
          projectNativeRealPath: fs.realpathSync.native(projectRoot),
          candidateRealPath: fs.realpathSync(candidateRoot),
          replacementPaths,
          preserveSymlinks: server.config.resolve.preserveSymlinks,
          extensions: server.config.resolve.extensions,
          resolutions,
        },
        null,
        2,
      ),
    );
    throw error;
  } finally {
    await server.close();
  }
}

describe.each(['formal', 'formal-link'])('候选运行视图的实际模块加载：%s', directory => {
  beforeAll(() => {
    projectRoot = path.join(root, directory);
  });
  it('无扩展名的 re-export 使用单文件候选，同目录手写模块保留正式版本', async () => {
    await withServer(['src/mixed/item.js'], async server => {
      const module = await server.ssrLoadModule('/src/single.js');
      expect(module.value).toBe('candidate item');
      expect(module.helper).toBe('formal mixed helper');
      expect((await server.ssrLoadModule('/src/mixed/item.js')).value).toBe('candidate item');
    });
  });

  it.each(['directory', 'absolute-directory'])(
    '无扩展名导入 %s 优先使用候选，未替换手写依赖才回退正式库',
    async entry => {
      await withServer(['src/generated'], async server => {
        const module = await server.ssrLoadModule(`/src/${entry}.js`);
        expect(module.value).toBe('candidate sibling / formal shared helper');
      });
    },
  );

  it.each(['missing', 'absolute-missing'])(
    '完整替换目录缺少旧文件时 %s 明确失败，不允许偷偷加载正式旧文件',
    async entry => {
      await withServer(['src/generated'], async server => {
        await expect(server.ssrLoadModule(`/src/${entry}.js`)).rejects.toThrow(
          'candidate runtime replacement is missing module',
        );
      });
    },
  );

  it.each(['new-file', 'absolute-new-file'])(
    '正式库尚无新增文件时 %s 的无扩展名导出仍能解析单文件候选',
    async entry => {
      await withServer(['src/mixed/new-item.js'], async server => {
        expect((await server.ssrLoadModule(`/src/${entry}.js`)).value).toBe('new candidate item');
      });
    },
  );

  it('显式 JSON 导入不能错误匹配同名 JS 候选', async () => {
    await withServer(['src/mixed/new-item.js'], async server => {
      await expect(server.ssrLoadModule('/src/explicit-extension.js')).rejects.toThrow();
    });
  });
});
