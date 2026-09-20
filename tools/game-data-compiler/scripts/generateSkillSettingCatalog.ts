import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseSkillSettingDumpSource,
  renderSkillSettingDocument,
} from '../src/source/skillSettingDumpSource.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';
import { formatGeneratedSource } from './formatGeneratedSource.ts';

export async function generateSkillSettingCatalog(args: {
  readonly sourceUrl: string;
  readonly revision: string;
  readonly output: string;
  readonly check: boolean;
  readonly runtimeOutput?: string;
}) {
  const response = await fetch(args.sourceUrl);
  if (!response.ok) throw new Error(`${args.sourceUrl}: HTTP ${response.status}`);
  const preview = (await response.json()) as {
    asset?: { Name?: unknown; Container?: unknown };
    text?: unknown;
  };
  if (
    preview.asset?.Name !== 'skillsetting' ||
    preview.asset.Container !==
      'assets/beyond/dynamicassets/gamedata/gameplayconfig/skillsetting.asset'
  )
    throw new Error(`${args.sourceUrl}: response is not the canonical SkillSetting asset`);
  if (typeof preview.text !== 'string')
    throw new Error(`${args.sourceUrl}: missing TypeTree dump text`);
  const source = parseSkillSettingDumpSource(preview.text, args.sourceUrl);
  const content = await formatGeneratedSource(
    renderSkillSettingDocument(source, args.revision),
    args.output,
  );
  const runtimeContent =
    args.runtimeOutput === undefined
      ? undefined
      : await formatGeneratedSource(
          renderRuntimeSkillSettings(source, args.revision),
          args.runtimeOutput,
        );
  if (args.check) {
    if ((await fs.readFile(args.output, 'utf8')).replaceAll('\r\n', '\n') !== content)
      throw new Error(`${args.output}: generated SkillSetting catalog is stale`);
    if (
      runtimeContent !== undefined &&
      args.runtimeOutput !== undefined &&
      (await fs.readFile(args.runtimeOutput, 'utf8')).replaceAll('\r\n', '\n') !== runtimeContent
    )
      throw new Error(`${args.runtimeOutput}: generated runtime SkillSetting data is stale`);
  } else {
    await writeAtomicBytes(args.output, new TextEncoder().encode(content));
    if (runtimeContent !== undefined && args.runtimeOutput !== undefined) {
      await writeAtomicBytes(args.runtimeOutput, new TextEncoder().encode(runtimeContent));
    }
  }
  return {
    dataCount: source.data.length,
    formulaCount: source.enhanceFormulas.length,
    sourceSha256: source.sha256,
  };
}

const RUNTIME_SETTING_KEYS = [
  '异常初始伤害倍率',
  '导电法术伤害提高',
  '燃烧每跳伤害',
  '腐蚀每跳减抗',
  '腐蚀减抗上限',
  '碎冰倍率',
  '冰冻持续时间',
  '法术爆发伤害倍率',
  '导电持续时间',
  '腐蚀初始减抗',
  '腐蚀持续时间',
] as const;

function renderRuntimeSkillSettings(
  source: ReturnType<typeof parseSkillSettingDumpSource>,
  revision: string,
): string {
  const data = RUNTIME_SETTING_KEYS.map(key => {
    const entry = source.data.find(candidate => candidate.key === key);
    if (entry === undefined) throw new Error(`runtime SkillSetting row is missing: ${key}`);
    return entry;
  });
  const formulaKeys = new Set(data.map(entry => entry.enhanceFormulaKey).filter(Boolean));
  const enhanceFormulas = source.enhanceFormulas
    .filter(formula => formulaKeys.has(formula.key))
    .map(formula => {
      switch (formula.formulaType) {
        case 'none':
          return { key: formula.key, kind: 'none' as const };
        case 'linear':
          return { key: formula.key, kind: 'linear' as const, paramA: formula.paramA };
        case 'saturating':
          return {
            key: formula.key,
            kind: 'saturating' as const,
            paramA: formula.paramA,
            paramB: formula.paramB,
          };
      }
    });
  const document = {
    schemaVersion: 1,
    revision,
    data,
    enhanceFormulas,
    resources: source.resources,
  };
  return `// Generated from the current native SkillSetting during the same rebuild. Do not edit manually.\nimport type { SkillSettingsDocument } from '../../core/combat/infliction/skillSettings';\nimport type { SkillSettingResources } from '../../../packages/game-data-contract/src/skillSettingResources';\n\nexport const generatedSkillSettings = ${JSON.stringify(document, null, 2)} as const satisfies SkillSettingsDocument & { readonly resources: SkillSettingResources };\n`;
}

function parseArguments(values: readonly string[]) {
  let check = false;
  const positional: string[] = [];
  for (const value of values) {
    if (value === '--check') check = true;
    else if (value.startsWith('--')) throw new Error(`unsupported argument ${value}`);
    else positional.push(value);
  }
  if (positional.length !== 3) throw new Error('expected <VFS preview URL> <revision> <output>');
  return {
    sourceUrl: positional[0]!,
    revision: positional[1]!,
    output: path.resolve(positional[2]!),
    check,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await generateSkillSettingCatalog(parseArguments(process.argv.slice(2)));
  process.stdout.write(
    `SkillSetting rows: ${result.dataCount}; formulas: ${result.formulaCount}; SHA-256: ${result.sourceSha256}\n`,
  );
}
