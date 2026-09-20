import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedDefinitionFiles } from '../src/compiler/publication/writeGeneratedDefinitionFiles.ts';
import { parseOperatorActiveSkillEntries } from '../src/domains/operator/activeSkills.ts';
import { requireArray, requireRecord } from '../src/source/primitives.ts';
import { generateOperatorDefinition } from './generateOperatorDefinition.ts';
import {
  planOperatorActiveSkillRuntime,
  type PlannedOperatorActiveSkillRuntime,
} from './generateOperatorActiveSkillRuntime.ts';

interface Arguments {
  readonly complete?: boolean;
  readonly tableRoot?: string;
  readonly manifest: string;
  readonly sourceRoot: string;
  readonly skillPatchTable: string;
  readonly buffDataRoot: string;
  readonly gameplayTagCatalog: string;
  readonly timeDilationCatalog: string;
  readonly globalBuffCatalog?: string;
  readonly skillSettingCatalog?: string;
  readonly slug: string;
  readonly supplementalBuffs: ReadonlyMap<string, readonly string[]>;
  readonly output: string;
  readonly auditOutput: string;
  readonly check: boolean;
}

/**
 * 编译一名干员 manifest 中声明的全部主动技能。
 * 任意技能失败时不会写入任何正式文件；全部成功后才一次性替换该干员的专属目录。
 */
export async function generateOperatorActiveSkillRuntimeBatch(args: Arguments) {
  if (args.complete) {
    if (!args.tableRoot) throw new Error('--complete requires --table-root');
    if (!args.globalBuffCatalog) throw new Error('--complete requires --global-buff-catalog');
    if (!args.skillSettingCatalog) throw new Error('--complete requires --skill-setting-catalog');
    if (args.supplementalBuffs.size)
      throw new Error('complete mode discovers Buff dependencies automatically');
    return generateOperatorDefinition({
      ...args,
      tableRoot: args.tableRoot,
      globalBuffCatalog: args.globalBuffCatalog,
      skillSettingCatalog: args.skillSettingCatalog,
    });
  }
  requireOwnedOperatorDirectory(
    args.output,
    path.resolve('tmp/game-data-generated/operator-active-skills'),
    args.slug,
  );
  requireOwnedOperatorDirectory(
    args.auditOutput,
    path.resolve('tmp/game-data-audit/operator-active-skills'),
    args.slug,
  );
  const manifest = requireRecord(readJson(args.manifest), args.manifest);
  const operators = requireArray(manifest.operators, `${args.manifest}.operators`);
  const matches = operators
    .map((value, index) => ({
      value: requireRecord(value, `${args.manifest}.operators[${index}]`),
      index,
    }))
    .filter(item => item.value.slug === args.slug);
  if (matches.length !== 1) {
    throw new Error(`${args.manifest}: expected exactly one operator with slug '${args.slug}'`);
  }
  const operator = matches[0]!;
  const entries = parseOperatorActiveSkillEntries(
    operator.value.skills,
    `${args.manifest}.operators[${operator.index}].skills`,
  );
  if (entries.length === 0) throw new Error(`${args.slug}: expected at least one active skill`);
  const entryKeys = new Set(entries.map(entry => entry.key));
  for (const key of args.supplementalBuffs.keys()) {
    if (!entryKeys.has(key))
      throw new Error(`${args.slug}: supplemental Buffs reference unknown skill '${key}'`);
  }

  const shared = {
    sourceRoot: args.sourceRoot,
    skillPatchTable: args.skillPatchTable,
    buffDataRoot: args.buffDataRoot,
    gameplayTagCatalog: args.gameplayTagCatalog,
    timeDilationCatalog: args.timeDilationCatalog,
    slug: args.slug,
    output: args.output,
    auditOutput: args.auditOutput,
  } as const;
  const planned: PlannedOperatorActiveSkillRuntime[] = [];
  for (const entry of entries) {
    planned.push(
      planOperatorActiveSkillRuntime({
        ...shared,
        sourceFile: entry.sourceFile,
        key: entry.key,
        skillType: entry.skillType,
        supplementalBuffIds: args.supplementalBuffs.get(entry.key) ?? [],
      }),
    );
  }

  requireExactPlan(
    args.output,
    planned.map(item => item.file.relativePath),
    'formal',
  );
  if (args.check) {
    checkPlannedFiles(
      args.output,
      planned.map(item => item.file),
    );
  } else {
    requireExactPlan(
      args.auditOutput,
      planned.map(item => item.auditFile.relativePath),
      'audit',
    );
    // 审计目录位于 tmp。先提交审计，失败时正式目录仍保持上一份完整快照。
    await writeGeneratedDefinitionFiles(
      args.auditOutput,
      planned.map(item => item.auditFile),
    );
    await writeGeneratedDefinitionFiles(
      args.output,
      planned.map(item => item.file),
    );
  }
  return {
    slug: args.slug,
    skillCount: planned.length,
    sequenceCount: planned.reduce((sum, item) => sum + item.sequences, 0),
    skillIds: planned.map(item => item.skillId),
  };
}

function requireOwnedOperatorDirectory(directory: string, parent: string, slug: string): void {
  const resolved = path.resolve(directory);
  if (path.dirname(resolved) !== parent || path.basename(resolved) !== slug)
    throw new Error(`directory must be exactly ${path.join(parent, slug)}`);
}

function requireExactPlan(directory: string, expectedNames: readonly string[], kind: string): void {
  if (!fs.existsSync(directory)) return;
  const actual = fs.readdirSync(directory).sort();
  const expected = [...expectedNames].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${kind} operator directory does not exactly match the manifest plan: ${directory}`,
    );
  }
}

function checkPlannedFiles(
  directory: string,
  files: readonly { readonly relativePath: string; readonly content: string }[],
): void {
  for (const file of files) {
    const destination = path.resolve(directory, file.relativePath);
    if (
      !fs.existsSync(destination) ||
      normalize(fs.readFileSync(destination, 'utf8')) !== file.content
    ) {
      throw new Error(`operator active skill runtime is stale: ${destination}`);
    }
  }
}

function parseSupplementalBuff(value: string): readonly [string, string] {
  const separator = value.indexOf('=');
  const key = value.slice(0, separator).trim();
  const buffId = value.slice(separator + 1).trim();
  if (separator <= 0 || !key || !buffId) {
    throw new Error(
      `--supplemental-buff expects <skillKey>=<buffId>, got ${JSON.stringify(value)}`,
    );
  }
  return [key, buffId];
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const normalize = (value: string) => value.replaceAll('\r\n', '\n');

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const values = new Map<string, string>();
  const supplements = new Map<string, string[]>();
  let check = false;
  let complete = false;
  const allowed = new Set([
    '--table-root',
    '--manifest',
    '--source-root',
    '--skill-patch-table',
    '--buff-data-root',
    '--gameplay-tag-catalog',
    '--time-dilation-catalog',
    '--global-buff-catalog',
    '--skill-setting-catalog',
    '--slug',
    '--supplemental-buff',
    '--output',
    '--audit-output',
  ]);
  for (let index = 2; index < process.argv.length; index++) {
    const flag = process.argv[index]!;
    if (flag === '--complete') {
      complete = true;
      continue;
    }
    if (flag === '--check') {
      check = true;
      continue;
    }
    if (!allowed.has(flag)) throw new Error(`unsupported argument ${flag}`);
    const value = process.argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
    if (flag === '--supplemental-buff') {
      const [key, buffId] = parseSupplementalBuff(value);
      const ids = supplements.get(key) ?? [];
      if (ids.includes(buffId)) throw new Error(`duplicate supplemental Buff ${key}=${buffId}`);
      supplements.set(key, [...ids, buffId]);
      continue;
    }
    if (values.has(flag)) throw new Error(`duplicate argument ${flag}`);
    values.set(flag, value);
  }
  const required = (flag: string) => {
    const value = values.get(flag);
    if (!value) throw new Error(`missing ${flag}`);
    return value;
  };
  const runtimeArgs: Arguments = {
    complete,
    ...(complete ? { tableRoot: required('--table-root') } : {}),
    manifest: required('--manifest'),
    sourceRoot: required('--source-root'),
    skillPatchTable: required('--skill-patch-table'),
    buffDataRoot: required('--buff-data-root'),
    gameplayTagCatalog: required('--gameplay-tag-catalog'),
    timeDilationCatalog: required('--time-dilation-catalog'),
    ...(complete ? { globalBuffCatalog: required('--global-buff-catalog') } : {}),
    ...(complete ? { skillSettingCatalog: required('--skill-setting-catalog') } : {}),
    slug: required('--slug'),
    supplementalBuffs: supplements,
    output: required('--output'),
    auditOutput: required('--audit-output'),
    check,
  };
  console.log(await generateOperatorActiveSkillRuntimeBatch(runtimeArgs));
}
