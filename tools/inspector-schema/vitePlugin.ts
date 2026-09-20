import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import { normalizePath, type Plugin } from 'vite';
import { syncInspectorSchema } from './sync.ts';

/** 元数据属于编译缓存：开发启动、构建、测试及契约热更新都自动准备。 */
export function inspectorSchemaPlugin(): Plugin {
  let root = '';
  let contractRoot = '';
  let building = false;
  return {
    name: 'endaxis-inspector-metadata',
    configResolved(config) {
      root = config.root;
      building = config.command === 'build';
      contractRoot = normalizePath(resolve(root, 'packages/game-data-contract/src')) + '/';
      syncInspectorSchema(root);
    },
    configureServer(server) {
      // 类型引用不会成为浏览器模块；仍须显式监听整个契约目录。
      server.watcher.add(contractRoot);
    },
    buildStart() {
      if (!building) return;
      for (const file of readdirSync(contractRoot, { recursive: true }))
        if (typeof file === 'string' && file.endsWith('.ts'))
          this.addWatchFile(resolve(contractRoot, file));
      syncInspectorSchema(root);
    },
    async handleHotUpdate(context) {
      if (!normalizePath(context.file).startsWith(contractRoot)) return;
      // 等待编辑器完成本次文件写入，再由 TS 读取完整契约。
      await context.read();
      const changed = syncInspectorSchema(root);
      const modules = new Set(context.modules);
      for (const path of changed) {
        for (const module of context.server.moduleGraph.getModulesByFile(normalizePath(path)) ??
          []) {
          context.server.moduleGraph.invalidateModule(module);
          modules.add(module);
        }
      }
      return [...modules];
    },
  };
}
