import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { createCompilerTemporaryDirectory, renameWithRetry } from '../../io.ts';

export interface RenderedDefinitionFileSource {
  readonly relativePath: string;
  readonly content: string;
}

/** 混合目录只替换指定生成文件，保留相邻的手写入口、helper和测试。 */
export async function writeGeneratedDefinitionFile(
  outputDirectory: string,
  file: RenderedDefinitionFileSource,
): Promise<void> {
  const destination = resolveGeneratedPath(resolve(outputDirectory), file.relativePath);
  const parent = dirname(destination);
  await mkdir(parent, { recursive: true });
  const workspace = await createCompilerTemporaryDirectory('definition-file', parent);
  const temporary = join(workspace, 'generated');
  try {
    await writeFile(temporary, file.content, { encoding: 'utf8', flag: 'wx' });
    await renameWithRetry(temporary, destination);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

/**
 * 只读核对完整生成目录。除 CRLF/LF 外不忽略任何内容差异，也会报告多余或缺失文件。
 */
export function checkGeneratedDefinitionFiles(
  outputDirectory: string,
  files: readonly RenderedDefinitionFileSource[],
): void {
  const target = resolve(outputDirectory);
  const expected = new Map<string, string>();
  for (const file of files) {
    const destination = resolveGeneratedPath(target, file.relativePath);
    const normalized = relative(target, destination).split(sep).join('/');
    if (expected.has(normalized)) {
      throw new Error(`duplicate rendered definition path ${JSON.stringify(file.relativePath)}`);
    }
    expected.set(normalized, normalizeLineEndings(file.content));
  }

  const expectedPaths = [...expected.keys()].sort((left, right) => left.localeCompare(right));
  const actualPaths = listGeneratedFiles(target).map(file =>
    relative(target, file).split(sep).join('/'),
  );
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error('generated definition file set is stale');
  }
  for (const relativePath of expectedPaths) {
    const actual = readFileSync(join(target, relativePath), 'utf8');
    if (normalizeLineEndings(actual) !== expected.get(relativePath)) {
      throw new Error(`generated definition file is stale: ${relativePath}`);
    }
  }
}

/** 在目标同级目录生成完整新数据区，完成后在同一卷内一次性替换目标目录。 */
export async function writeGeneratedDefinitionFiles(
  outputDirectory: string,
  files: readonly RenderedDefinitionFileSource[],
): Promise<void> {
  const target = resolve(outputDirectory);
  const parent = dirname(target);
  if (target === parent) {
    throw new Error(`unsafe generated definition output directory ${JSON.stringify(target)}`);
  }
  await mkdir(parent, { recursive: true });
  const workspace = await createCompilerTemporaryDirectory('definition-directory', parent);
  const staging = join(workspace, 'staging');
  const backup = join(workspace, 'backup');
  await mkdir(staging, { recursive: false });
  let movedExistingTarget = false;
  let installedNewTarget = false;
  try {
    const seen = new Set<string>();
    for (const file of [...files].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    )) {
      const destination = resolveGeneratedPath(staging, file.relativePath);
      const normalized = relative(staging, destination).split(sep).join('/');
      if (seen.has(normalized)) {
        throw new Error(`duplicate rendered definition path ${JSON.stringify(file.relativePath)}`);
      }
      seen.add(normalized);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, file.content, { encoding: 'utf8', flag: 'wx' });
    }
    if (await pathExists(target)) {
      await renameWithRetry(target, backup);
      movedExistingTarget = true;
    }
    await renameWithRetry(staging, target);
    installedNewTarget = true;
    if (movedExistingTarget) await rm(backup, { recursive: true, force: false });
  } catch (error) {
    if (movedExistingTarget && !installedNewTarget && !(await pathExists(target))) {
      await renameWithRetry(backup, target);
      movedExistingTarget = false;
    }
    throw error;
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

function resolveGeneratedPath(root: string, relativePath: string): string {
  if (relativePath.length === 0 || isAbsolute(relativePath)) {
    throw new Error(`unsafe rendered definition path ${JSON.stringify(relativePath)}`);
  }
  const destination = resolve(root, relativePath);
  const fromRoot = relative(root, destination);
  if (fromRoot === '' || fromRoot === '..' || fromRoot.startsWith(`..${sep}`)) {
    throw new Error(`unsafe rendered definition path ${JSON.stringify(relativePath)}`);
  }
  return destination;
}

function listGeneratedFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .flatMap(entry => {
      const child = join(directory, entry.name);
      return entry.isDirectory() ? listGeneratedFiles(child) : [child];
    })
    .sort((left, right) => left.localeCompare(right));
}

function normalizeLineEndings(value: string): string {
  return value.replaceAll('\r\n', '\n');
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
