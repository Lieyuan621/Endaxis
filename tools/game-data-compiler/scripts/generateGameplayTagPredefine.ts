import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GameplayTagPredefineDocument } from '../../../packages/game-data-contract/src/gameplayTags.ts';
import { parseGameplayTagPredefineTableSource } from '../src/source/gameplayTagPredefineTable.ts';
import { compileGameplayTagPredefine } from '../src/compiler/catalogs/gameplayTagPredefine.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';
import { formatGeneratedSource } from './formatGeneratedSource.ts';

// 生成内容描述的是未来正式文件，而不是候选暂存文件的物理位置。
const GAMEPLAY_TAG_CONTRACT_IMPORT = '../../../packages/game-data-contract/src/gameplayTags.ts';

/** 输入必须是下载器管理的原始表；只负责转换，不隐式寻找外部仓库或旧生成数据。 */
export async function generateGameplayTagPredefine(
  input: string,
  output: string,
  revision: string,
  catalog: string,
  check = false,
) {
  if (!revision.trim()) throw new Error('GameplayTagPredefine revision must not be empty');
  if (!output.endsWith('.ts')) throw new Error('GameplayTagPredefine output must be a .ts module');
  const bytes = await fs.readFile(input);
  const definition = compileGameplayTagPredefine(
    parseGameplayTagPredefineTableSource(JSON.parse(bytes.toString('utf8')), input),
    new GameplayTagRegistry(readGameplayTagPaths(catalog)),
  );
  const document: GameplayTagPredefineDocument = {
    schemaVersion: 1,
    revision,
    sourceSha256: createHash('sha256').update(bytes).digest('hex'),
    ...definition,
  };
  const content = await formatGeneratedSource(
    `/** 由原生 GameplayTagPredefineTable 生成；请通过 generate:game-data:tag-predefine 重建。 */\nimport type { GameplayTagPredefineDocument } from ${JSON.stringify(GAMEPLAY_TAG_CONTRACT_IMPORT)};\n\nexport const GAMEPLAY_TAG_PREDEFINE: GameplayTagPredefineDocument = ${JSON.stringify(document, null, 2)};\n`,
    output,
  );
  if (check) {
    if ((await fs.readFile(output, 'utf8')) !== content)
      throw new Error(`${output}: generated GameplayTag predefine is stale`);
  } else {
    // 此目录还保存其他全局资源；只能原子替换本文件，不能调用整目录发布器。
    await writeAtomicBytes(output, new TextEncoder().encode(content));
  }
  return {
    tags: Object.keys(document.tags).length,
    queries: Object.keys(document.queries).length,
    immunityQueries: document.immunityQueries.length,
    sourceSha256: document.sourceSha256,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const check = args.at(-1) === '--check';
  if (check) args.pop();
  if (args.length !== 4 || args.some(arg => arg.startsWith('--')))
    throw new Error(
      'expected <source JSON> <output TS> <revision> <tag-path-catalog TS> [--check]',
    );
  console.log(await generateGameplayTagPredefine(args[0]!, args[1]!, args[2]!, args[3]!, check));
}
