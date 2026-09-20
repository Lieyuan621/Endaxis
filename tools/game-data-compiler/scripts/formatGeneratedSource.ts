import fs from 'node:fs/promises';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';

/** 生成与校验使用同一份仓库格式，避免正式发布后再手工排版。 */
export async function formatGeneratedSource(content: string, output: string): Promise<string> {
  const options = await resolveConfig(output);
  return format(content, { ...options, filepath: output });
}

/** 只遍历正式发布清单，逐文件格式化，避免并行载入整批大型干员定义。 */
export async function formatGeneratedCandidate(
  candidateRoot: string,
  outputs: readonly string[],
): Promise<{ readonly fileCount: number }> {
  let fileCount = 0;

  async function visit(output: string): Promise<void> {
    const status = await fs.lstat(output);
    if (status.isSymbolicLink()) throw new Error(`generated output must not be a link: ${output}`);
    if (status.isDirectory()) {
      for (const entry of await fs.readdir(output)) await visit(path.join(output, entry));
      return;
    }
    if (!status.isFile()) throw new Error(`unsupported generated output: ${output}`);
    if (!output.endsWith('.ts') && !output.endsWith('.json')) return;
    const source = await fs.readFile(output, 'utf8');
    const formatted = await formatGeneratedSource(source, output);
    if (source.replaceAll('\r\n', '\n') !== formatted)
      await fs.writeFile(output, formatted, 'utf8');
    fileCount += 1;
  }

  for (const relative of outputs) {
    const output = path.join(candidateRoot, relative);
    // 图标目录可能没有任何被引用的资源；只跳过缺失的顶层目录。
    if (!path.extname(relative)) {
      try {
        await fs.lstat(output);
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'ENOENT'
        )
          continue;
        throw error;
      }
    }
    await visit(output);
  }
  return { fileCount };
}
