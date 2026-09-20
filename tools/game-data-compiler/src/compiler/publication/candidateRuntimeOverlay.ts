import fs from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'vite';

export interface CandidateRuntimeOverlayArguments {
  readonly projectRoot: string;
  readonly candidateRoot: string;
  /** 相对项目根目录；文件按单文件覆盖，目录按完整目录替换。 */
  readonly replacementPaths: readonly string[];
}

interface CandidateReplacement {
  readonly formalPath: string;
  readonly candidatePath: string;
  readonly directory: boolean;
}

/**
 * 为 Vite SSR 建立只读候选视图：正式路径优先读取候选；候选文件的相对 import
 * 若落到候选树中不存在的手写代码，则回到正式工作树。整个过程不复制也不发布文件。
 */
export function createCandidateRuntimeOverlayPlugin(
  args: CandidateRuntimeOverlayArguments,
): Plugin {
  const projectRoot = fs.realpathSync.native(args.projectRoot);
  const candidateRoot = fs.realpathSync.native(args.candidateRoot);
  const replacements = collectReplacements(projectRoot, candidateRoot, args.replacementPaths);
  if (replacements.length === 0)
    throw new Error('candidate runtime overlay has no generated files');
  let extensions: readonly string[] = [];

  return {
    name: 'endaxis-candidate-runtime-overlay',
    enforce: 'pre',
    configResolved(config) {
      extensions = config.resolve.extensions;
    },
    resolveId(source, importer) {
      const importedPath = resolveImportPath(source, importer, projectRoot);
      if (importedPath === null) return null;
      const requested = resolvePhysicalPath(importedPath);

      const candidate = mapFormalToCandidate(requested, replacements, extensions);
      if (candidate !== null) return candidate;

      if (isWithin(candidateRoot, requested)) {
        // 相对导入常省略 .ts；先完整解析候选，不能因字面路径不存在而回退正式库。
        const resolvedCandidate = resolveExistingModule(requested, extensions);
        if (resolvedCandidate !== null) return resolvedCandidate;
        const fallback = path.join(projectRoot, path.relative(candidateRoot, requested));
        // 缺少的候选若属于完整替换目录，必须失败；只有未替换的手写模块允许回退。
        const mappedFallback = mapFormalToCandidate(fallback, replacements, extensions);
        if (mappedFallback !== null) return mappedFallback;
        const resolvedFallback = isWithin(projectRoot, fallback)
          ? resolveExistingModule(fallback, extensions)
          : null;
        if (resolvedFallback !== null) return resolvedFallback;
      }
      return null;
    },
  };
}

function collectReplacements(
  projectRoot: string,
  candidateRoot: string,
  replacementPaths: readonly string[],
): CandidateReplacement[] {
  return replacementPaths.flatMap(relativePath => {
    const candidatePath = path.resolve(candidateRoot, relativePath);
    const formalPath = path.resolve(projectRoot, relativePath);
    if (!isWithin(candidateRoot, candidatePath) || !isWithin(projectRoot, formalPath)) {
      throw new Error(`candidate runtime replacement escapes its root: ${relativePath}`);
    }
    if (!fs.existsSync(candidatePath)) return [];
    const stat = fs.statSync(candidatePath);
    if (!stat.isDirectory() && !stat.isFile()) {
      throw new Error(
        `candidate runtime replacement is neither file nor directory: ${candidatePath}`,
      );
    }
    return [{ formalPath, candidatePath, directory: stat.isDirectory() }];
  });
}

function resolveImportPath(source: string, importer: string | undefined, projectRoot: string) {
  // Windows 盘符路径（如 C:/...）不是 URL 协议，仍须参与候选覆盖。
  if (source.startsWith('\0') || (!path.isAbsolute(source) && /^[a-z][a-z+.-]*:/iu.test(source)))
    return null;
  const cleanSource = source.split('?')[0]!.split('#')[0]!;
  if (cleanSource.startsWith('/@fs/')) return path.resolve(cleanSource.slice('/@fs/'.length));
  if (cleanSource.startsWith('/src/') || cleanSource.startsWith('/packages/')) {
    return path.resolve(projectRoot, `.${cleanSource}`);
  }
  if (path.isAbsolute(cleanSource)) return path.resolve(cleanSource);
  if (!cleanSource.startsWith('.') || importer === undefined) return null;
  const cleanImporter = importer.split('?')[0]!.split('#')[0]!;
  return path.resolve(path.dirname(cleanImporter), cleanSource);
}

/**
 * 根目录和导入路径都用 native 展开 Windows 短路径；普通 realpathSync 可能保留
 * RUNNER~1，无法与 Vite 传入的 runneradmin 匹配。新增模块和省略扩展名的路径
 * 可能不存在，向上找到已存在的父目录后再拼回余下路径，不能因此回退到正式库。
 */
function resolvePhysicalPath(value: string): string {
  let existing = value;
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) return value;
    existing = parent;
  }
  return path.resolve(fs.realpathSync.native(existing), path.relative(existing, value));
}

function mapFormalToCandidate(
  requested: string,
  replacements: readonly CandidateReplacement[],
  extensions: readonly string[],
): string | null {
  // 正式模块存在时沿用它的解析结果；首次生成的新文件则按同样的后缀顺序匹配候选清单。
  const resolvedRequested =
    resolveExistingModule(requested, extensions) ??
    moduleCandidatePaths(requested, extensions).find(candidate =>
      replacements.some(
        replacement =>
          !replacement.directory && normalize(candidate) === normalize(replacement.formalPath),
      ),
    );
  for (const replacement of replacements) {
    if (replacement.directory) {
      if (!isWithin(replacement.formalPath, requested)) continue;
      const candidate = path.join(
        replacement.candidatePath,
        path.relative(replacement.formalPath, requested),
      );
      // 目录替换具有完整替换语义；候选中没有的旧正式文件不能漏入运行视图。
      const resolved = resolveExistingModule(candidate, extensions);
      if (resolved === null) {
        throw new Error(`candidate runtime replacement is missing module: ${candidate}`);
      }
      return resolved;
    }
    if (
      normalize(requested) === normalize(replacement.formalPath) ||
      (resolvedRequested !== undefined &&
        normalize(resolvedRequested) === normalize(replacement.formalPath))
    ) {
      return replacement.candidatePath;
    }
  }
  return null;
}

function resolveExistingModule(value: string, extensions: readonly string[]): string | null {
  for (const candidate of moduleCandidatePaths(value, extensions)) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function moduleCandidatePaths(value: string, extensions: readonly string[]): readonly string[] {
  return [
    value,
    ...extensions.map(extension => `${value}${extension}`),
    ...extensions.map(extension => path.join(value, `index${extension}`)),
  ];
}

function isWithin(root: string, value: string): boolean {
  const relative = path.relative(root, path.resolve(value));
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

function normalize(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}
