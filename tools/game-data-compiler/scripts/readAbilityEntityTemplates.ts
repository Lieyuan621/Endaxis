import fs from 'node:fs';
import path from 'node:path';
import { compileAbilityEntityTemplateCatalogSource } from '../src/compiler/abilities/abilityEntityCatalog.ts';

/**
 * 直接读取当前来源中的 AbilityEntityData 目录。
 * 不接受旧聚合证据文件，也不从正式目录补缺或写聚合中间产物。
 */
export function readAbilityEntityTemplates(
  input: string,
  readJson: (file: string) => unknown = file => JSON.parse(fs.readFileSync(file, 'utf8')),
) {
  const stat = fs.lstatSync(input);
  if (stat.isSymbolicLink()) throw new Error(`ability entity source is a link: ${input}`);
  if (!stat.isDirectory()) {
    throw new Error(`ability entity source is not a directory: ${input}`);
  }
  const records: Record<string, unknown> = {};
  for (const entry of fs.readdirSync(input, { withFileTypes: true })) {
    if (!entry.isFile() || !/^[A-Za-z0-9_-]+\.json$/.test(entry.name))
      throw new Error(`unexpected ability entity source entry: ${entry.name}`);
    records[entry.name.slice(0, -5)] = readJson(path.join(input, entry.name));
  }
  return compileAbilityEntityTemplateCatalogSource(records, input);
}
