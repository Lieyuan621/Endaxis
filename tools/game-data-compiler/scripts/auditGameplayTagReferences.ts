import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { auditGameplayTagReferences } from '../src/audits/gameplayTagReferences.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';

// 参数仅选择盘点范围；不会自动添加根动作支持或改写任何游戏定义。
const directories: string[] = [];
const tags: string[] = [];
let catalog: string | undefined;
let output: string | undefined;
const values = process.argv.slice(2);
for (let i = 0; i < values.length; i += 2) {
  const name = values[i];
  const value = values[i + 1];
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${name}`);
  if (name === '--sources') directories.push(value);
  else if (name === '--tag') tags.push(value);
  else if (name === '--catalog') catalog = value;
  else if (name === '--output') output = value;
  else throw new Error(`unknown argument ${name}`);
}
if (!catalog || !output || directories.length === 0 || tags.length === 0)
  throw new Error(
    'required: --sources <directory> (repeatable) --catalog <paths.ts> --tag <path> (repeatable) --output <report.json>',
  );
const paths = readGameplayTagPaths(catalog);
for (const tag of tags)
  if (!paths.includes(tag)) throw new Error(`unregistered watched tag ${tag}`);
const registry = new GameplayTagRegistry(paths);
const files = directories.flatMap(directory =>
  fs
    .readdirSync(directory)
    .filter(name => name.endsWith('.json'))
    .sort()
    .map(name => {
      const file = path.join(directory, name);
      const bytes = fs.readFileSync(file);
      return {
        file,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        ...auditGameplayTagReferences(JSON.parse(bytes.toString('utf8')), file, registry, tags),
      };
    }),
);
const counts = {
  files: files.length,
  references: files.reduce((sum, file) => sum + file.references.length, 0),
  entityQueries: files.reduce(
    (sum, file) => sum + file.references.filter(ref => ref.role === 'entity-query').length,
    0,
  ),
  unresolved: files.reduce((sum, file) => sum + file.unresolved.length, 0),
};
const report = {
  scope: 'source-candidates-only',
  watchedTags: tags,
  counts,
  limitations:
    '不是运行可达性证明：须继续核对领域入口、闭包、目标归属、场景过滤、动态值与原生预定义查询。',
  files,
};
await writeAtomicBytes(output, new TextEncoder().encode(JSON.stringify(report, null, 2) + '\n'));
console.log(JSON.stringify(counts));
