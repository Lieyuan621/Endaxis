import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// 显式参数与独占写入，避免误覆盖源存档或上一次成功结果。
const args = process.argv.slice(2);
if (args.length !== 2 && args.length !== 4)
  throw new Error(
    '用法：npm run convert:legacy-timeline -- <旧JSON> <新输出目录> [--mappings <映射JSON>]',
  );
if (args.length === 4 && args[2] !== '--mappings') throw new Error('未知参数');
const input = JSON.parse(await readFile(resolve(args[0]!), 'utf8'));
const mappings = args[3] ? JSON.parse(await readFile(resolve(args[3]), 'utf8')) : {};
const output = resolve(args[1]!);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({
  configFile: false,
  root,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true, watch: null, hmr: false },
  optimizeDeps: { noDiscovery: true },
});
try {
  const { gameDataRepository } = await server.ssrLoadModule('/src/data/gameDataRepository.ts');
  const { convertLegacyTimeline } = await server.ssrLoadModule('/src/application/legacyTimeline/convert.ts');
  const result = convertLegacyTimeline(input, gameDataRepository, mappings);
  await mkdir(output); // 必须使用新目录；失败不覆盖已有结果。
  await writeFile(resolve(output, 'report.json'), JSON.stringify(result.report, null, 2), {
    flag: 'wx',
  });
  if (result.project)
    await writeFile(resolve(output, 'project.json'), JSON.stringify(result.project, null, 2), {
      flag: 'wx',
    });
  console.log(
    JSON.stringify({ status: result.status, issues: result.report.issues, output }, null, 2),
  );
  if (!result.project) process.exitCode = 2;
} finally {
  await server.close();
}
