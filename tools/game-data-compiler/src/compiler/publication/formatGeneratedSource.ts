import fs from 'node:fs/promises';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';

/** 生成与校验使用同一份仓库格式，避免正式发布后再手工排版。 */
export async function formatGeneratedSource(content: string, output: string): Promise<string> {
  // 候选可以位于仓库外，仍使用编译器所属仓库的规范，不能随输出目录变化。
  const options = await resolveConfig(
    path.resolve(import.meta.dirname, '../../../../../.prettierrc.json'),
  );
  // Prettier 保留对象原有换行；先统一 JSON 输入，避免生成与再次格式化得到不同排版。
  const source = output.endsWith('.json') ? JSON.stringify(JSON.parse(content), null, 2) : content;
  const formatted = await format(source, { ...options, filepath: output });
  return /\/(?:zh|en)\/operators\.json$/.test(output.replaceAll('\\', '/'))
    ? formatLevelValueArrays(formatted)
    : formatted;
}

/** 等级及对应显示值横排；标准 JSON 排版后应用，防止全量格式化再次拆行。 */
function formatLevelValueArrays(json: string): string {
  return json.replace(
    /("(?:levels|values)": )\[\n((?:\s*(?:"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?)(?:,)?\n)+)\s*\]/g,
    (_match, key: string, items: string) =>
      `${key}[${(JSON.parse(`[${items}]`) as (string | number)[]).map(value => JSON.stringify(value)).join(', ')}]`,
  );
}

/** 只遍历正式发布清单，逐文件格式化，避免并行载入整批大型干员定义。 */
export async function formatGeneratedCandidate(
  candidateRoot: string,
  outputs: readonly string[],
  options: { readonly check?: boolean } = {},
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
    if (source.replaceAll('\r\n', '\n') !== formatted) {
      if (options.check) throw new Error(`Generated formatting differs: ${output}`);
      await fs.writeFile(output, formatted, 'utf8');
    }
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
