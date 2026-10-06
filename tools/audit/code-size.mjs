import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.json',
  '.jsonc',
  '.md',
  '.txt',
  '.yaml',
  '.yml',
  '.toml',
  '.xml',
  '.svg',
  '.py',
  '.ps1',
  '.sh',
  '.bat',
  '.cmd',
  '.gitignore',
]);
const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--json')) {
  console.error('Usage: npm run audit:size [-- --json tmp/code-size-audit.json]');
  process.exit(1);
}

function category(path) {
  if (/(^|\/)(test|tests|__tests__|fixtures)(\/|$)|\.(test|spec|bench)\.[^.]+$/.test(path))
    return '测试与夹具';
  if (/\.generated\.|(^|\/)generated[^/]*\//i.test(path)) return '生成产物';
  if (/^(public|assets)\//.test(path)) return '静态资源';
  if (path.startsWith('docs/') || /(^|\/)(README|CONTRIBUTING)\.md$/i.test(path)) return '文档';
  if (path.startsWith('tools/')) return '工具';
  if (path.startsWith('src/i18n/')) return '国际化';
  if (path.startsWith('src/')) return '应用源码';
  if (path.startsWith('packages/')) return '公共包';
  return '配置及其他';
}

function moduleName(path) {
  const parts = path.split('/');
  if (parts[0] === 'src' && ['core', 'ui', 'application', 'data'].includes(parts[1]))
    return parts.slice(0, Math.min(3, parts.length - 1)).join('/');
  return parts.slice(0, Math.min(2, parts.length - 1)).join('/') || '(根目录)';
}

async function measure(path, scope) {
  const absolute = resolve(root, path);
  let stat;
  try {
    stat = await lstat(absolute);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  // 不跟随工作树依赖、链接目录或链接文件。
  if (!stat.isFile()) return null;
  const extension = extname(path).toLowerCase();
  const isText =
    textExtensions.has(extension) ||
    /(^|\/)(LICENSE|\.gitignore|\.prettierignore|\.node-version)$/.test(path);
  let lines = null;
  if (isText) {
    let newlines = 0,
      last = -1;
    for await (const chunk of createReadStream(absolute)) {
      for (const byte of chunk) if (byte === 10) newlines++;
      if (chunk.length) last = chunk[chunk.length - 1];
    }
    lines = newlines + (last !== -1 && last !== 10 ? 1 : 0);
  }
  return {
    path,
    scope,
    category: scope === 'dist' ? '构建产物' : category(path),
    module: moduleName(path),
    extension: extension || '(无扩展名)',
    suffix:
      path.match(/\.(?:generated|test|spec|bench|d)\.[^./]+$/i)?.[0].toLowerCase() ||
      extension ||
      '(无扩展名)',
    files: 1,
    bytes: stat.size,
    lines,
  };
}

async function* buildFiles(directory = 'dist') {
  let entries;
  try {
    entries = await readdir(resolve(root, directory), { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink()) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) yield* buildFiles(path);
    else if (entry.isFile()) yield path;
  }
}

function aggregate(files, key) {
  const groups = new Map();
  for (const file of files) {
    const label = key(file);
    const row = groups.get(label) ?? { label, files: 0, textFiles: 0, lines: 0, bytes: 0 };
    row.files++;
    row.bytes += file.bytes;
    if (file.lines !== null) {
      row.textFiles++;
      row.lines += file.lines;
    }
    groups.set(label, row);
  }
  return [...groups.values()].sort((a, b) => b.bytes - a.bytes || a.label.localeCompare(b.label));
}

function size(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
}
function table(title, rows) {
  console.log(`\n${title}`);
  console.table(
    rows.map(row => ({
      分类: row.label,
      文件数: row.files,
      文本文件: row.textFiles,
      行数: row.lines,
      体积: size(row.bytes),
    })),
  );
}

const paths = [
  ...new Set(
    execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
      .split('\0')
      .filter(Boolean),
  ),
].sort();
const files = [];
for (const path of paths) {
  const file = await measure(path, 'repository');
  if (file) files.push(file);
}
const build = [];
for await (const path of buildFiles()) {
  const file = await measure(path, 'dist');
  if (file) build.push(file);
}
const totals = aggregate(files, () => '仓库总计');
const categories = aggregate(files, file => file.category);
const suffixes = aggregate(files, file => file.suffix);
const modules = aggregate(files, file => `${file.category} / ${file.module}`);
const resources = aggregate(
  files.filter(file => file.category === '静态资源'),
  file => `${file.module} / ${file.extension}`,
);
const buildSummary = aggregate(build, file => file.extension);
console.log('统计当前工作树：Git 跟踪文件及未忽略的新文件；忽略依赖、临时目录和符号链接。');
console.log('行数为文本物理行（含空行、注释），二进制不计行；体积为未压缩文件字节数。');
console.log(
  '各分类互斥，优先级：测试/夹具 > 生成产物 > 静态资源 > 文档 > 工具 > 国际化 > 应用源码 > 公共包 > 其他。',
);
table('仓库汇总（不含 dist）', totals);
table('按类型', categories);
table('按后缀名（复合后缀单独统计）', suffixes);
table('按类型与模块', modules);
table('静态资源目录与格式', resources);
table('本机 dist（单独统计，不代表已重新构建）', buildSummary);
console.log('\n仓库中体积最大的 20 个文件');
console.table(
  [...files]
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 20)
    .map(file => ({ 文件: file.path, 行数: file.lines ?? '—', 体积: size(file.bytes) })),
);
if (args[0] === '--json') {
  const output = resolve(root, args[1]);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        totals,
        categories,
        suffixes,
        modules,
        resources,
        buildSummary,
        files,
        buildFiles: build,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`\nJSON: ${output}`);
}
