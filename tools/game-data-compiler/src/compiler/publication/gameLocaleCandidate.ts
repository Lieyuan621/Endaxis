import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {
  compileGameLocales,
  operatorLocaleIdentities,
  type LocaleTables,
} from '../../domains/locales/gameLocales.ts';
import { requireRecord } from '../../source/primitives.ts';

export interface GameLocaleCandidateInput {
  readonly tableRoot: string;
  readonly operatorManifest: string;
  readonly weaponDefinitionRoot: string;
  readonly gearDefinitionRoot: string;
  readonly gearSetDefinitionRoot: string;
  readonly uiLocaleRoot: string;
  readonly output: string;
}

async function readRecord(file: string) {
  const source = await fs.readFile(file, 'utf8');
  // Native text IDs may exceed JS's exact integer range. Preserve their decimal identity,
  // as in the contingency-contract source reader, before JSON decoding.
  return requireRecord(
    JSON.parse(source.replace(/("id"\s*:\s*)(-?\d{16,})(?=\s*[,}])/g, '$1"$2"')),
    file,
  );
}

/** 读取本轮候选定义的顶层身份，不执行 TS，也不从图标或旧语言文件反推身份。 */
async function candidateIdentities(
  root: string,
  kind: 'weapon' | 'gear' | 'gearSet',
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  async function walk(directory: string): Promise<void> {
    for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(file);
        continue;
      }
      if (!entry.name.endsWith('.generated.ts') || entry.name === 'index.generated.ts') continue;
      const source = ts.createSourceFile(
        file,
        await fs.readFile(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      const fields: Record<string, string> = {};
      for (const statement of source.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaration of statement.declarationList.declarations) {
          let initializer = declaration.initializer;
          while (
            initializer &&
            (ts.isAsExpression(initializer) ||
              ts.isSatisfiesExpression(initializer) ||
              ts.isParenthesizedExpression(initializer))
          )
            initializer = initializer.expression;
          if (!initializer || !ts.isObjectLiteralExpression(initializer)) continue;
          for (const property of initializer.properties) {
            if (
              !ts.isPropertyAssignment(property) ||
              (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))
            )
              continue;
            const key = property.name.text;
            if (!['slug', 'assetSlug'].includes(key)) continue;
            if (!ts.isStringLiteral(property.initializer))
              throw new Error(`${file}: non-literal ${key}`);
            const value = property.initializer.text;
            if (fields[key] !== undefined && fields[key] !== value)
              throw new Error(`${file}: ambiguous ${key}`);
            fields[key] = value;
          }
        }
      }
      const slug = fields.slug;
      if (!slug) throw new Error(`${file}: missing ${kind} slug`);
      const value = kind === 'weapon' ? fields.assetSlug || slug : slug;
      if (Object.hasOwn(result, slug) && (kind === 'gear' || result[slug] !== value))
        throw new Error(`${file}: conflicting ${kind} identity ${slug}`);
      result[slug] = value;
    }
  }
  await walk(path.resolve(root));
  if (!Object.keys(result).length) throw new Error(`${root}: contains no ${kind} definitions`);
  return result;
}

/** 重建流水线的本地化候选阶段。来源缺失即失败；下载和正式发布由外层流水线负责。 */
export async function generateGameLocaleCandidate(input: GameLocaleCandidateInput): Promise<void> {
  const tables: Record<string, LocaleTables[string]> = {};
  for (const name of [
    'CharacterTable',
    'CharacterPotentialTable',
    'PotentialTalentEffectTable',
    'CharGrowthTable',
    'SkillPatchTable',
    'I18nTextTable_EN',
    'HyperlinkTextTable',
    'WeaponBasicTable',
    'ItemTable',
    'EquipSuitTable',
    'EquipTable',
    'EnemyTemplateDisplayInfoTable',
    'UseItemTable',
  ])
    tables[name] = await readRecord(path.join(input.tableRoot, `${name}.json`));
  const identities = {
    ...operatorLocaleIdentities(await readRecord(input.operatorManifest)),
    weapons: await candidateIdentities(input.weaponDefinitionRoot, 'weapon'),
    gears: await candidateIdentities(input.gearDefinitionRoot, 'gear'),
    gearSets: await candidateIdentities(input.gearSetDefinitionRoot, 'gearSet'),
  };
  for (const [language, tableName, uiFile] of [
    ['zh', 'CN', 'zh-CN'],
    ['en', 'EN', 'en'],
  ]) {
    const texts =
      tableName === 'EN'
        ? tables.I18nTextTable_EN
        : await readRecord(path.join(input.tableRoot, 'I18nTextTable_CN.json'));
    const ui = await readRecord(path.join(input.uiLocaleRoot, `${uiFile}.json`));
    const documents = compileGameLocales(
      tables,
      texts,
      identities,
      requireRecord(ui.enumTerms, `${uiFile}.enumTerms`),
    );
    const directory = path.join(input.output, language);
    await fs.mkdir(directory, { recursive: true });
    for (const [name, document] of Object.entries(documents))
      await fs.writeFile(
        path.join(directory, `${name}.json`),
        `${JSON.stringify(document, null, 2)}\n`,
        'utf8',
      );
  }
}
