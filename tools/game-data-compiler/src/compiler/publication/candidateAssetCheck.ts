import fs from 'node:fs/promises';
import path from 'node:path';
import { readGameIconReferences } from './gameIconReferences.ts';

export interface CandidateAssetCheckArguments {
  readonly projectRoot: string;
  readonly candidateRoot: string;
  readonly replacementPaths: readonly string[];
}

/** 检查未发布候选定义引用的游戏图片已进入正式资源闭包。 */
export async function checkCandidateGameAssets(args: CandidateAssetCheckArguments) {
  const projectRoot = path.resolve(args.projectRoot);
  const candidateRoot = path.resolve(args.candidateRoot);
  const candidatePublicRoot = path.join(candidateRoot, 'public');
  // 完整重建必须验证隔离导出的资源闭包；旧的独立候选审计仍可在没有该目录时
  // 回退只读正式 public，保持工具的诊断用途。
  const publicRoot = (await exists(candidatePublicRoot))
    ? candidatePublicRoot
    : path.join(projectRoot, 'public');
  const references = new Map<string, Set<string>>();
  for (const relativePath of args.replacementPaths) {
    const root = path.resolve(candidateRoot, relativePath);
    if (!isWithin(candidateRoot, root) || !(await exists(root))) continue;
    for (const file of await walkFiles(root)) {
      if (!/\.(?:json|[cm]?ts|tsx)$/u.test(file)) continue;
      for (const publicPath of readGameIconReferences(await fs.readFile(file, 'utf8'))) {
        const owners = references.get(publicPath) ?? new Set<string>();
        owners.add(path.relative(candidateRoot, file).replaceAll('\\', '/'));
        references.set(publicPath, owners);
      }
    }
  }
  const missing: string[] = [];
  for (const publicPath of references.keys()) {
    const target = path.resolve(publicRoot, `.${publicPath}`);
    if (!isWithin(publicRoot, target))
      throw new Error(`unsafe candidate asset path: ${publicPath}`);
    if (!(await exists(target))) missing.push(publicPath);
  }
  missing.sort();
  if (missing.length)
    throw new Error(
      `candidate references ${missing.length} missing game asset(s): ${missing.join(', ')}`,
    );
  return {
    referencedAssetCount: references.size,
    referencingFileCount: new Set([...references.values()].flatMap(owners => [...owners])).size,
  };
}

async function walkFiles(root: string): Promise<string[]> {
  const stat = await fs.stat(root);
  if (stat.isFile()) return [root];
  const result: string[] = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const child = path.join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`candidate directory contains a link: ${child}`);
    if (entry.isDirectory()) result.push(...(await walkFiles(child)));
    else if (entry.isFile()) result.push(child);
  }
  return result;
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function isWithin(root: string, value: string): boolean {
  const relative = path.relative(root, value);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..');
}
