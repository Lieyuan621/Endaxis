import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileAbilitySystemBlackboardsSource } from '../src/compiler/abilities/abilitySystemBlackboards.ts';
import {
  compileComboSkillConditionDefinitionSource,
  createOperatorComboActionProjectionContext,
} from '../src/compiler/conditions/comboSkillConditions.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import { parseOperatorRuntimeTemplateSource } from '../src/source/operatorRuntimeTemplate.ts';
import { requireArray, requireNonEmptyString, requireRecord } from '../src/source/primitives.ts';
import { readGameplayTagPaths } from './generateOperatorActiveSkillRuntime.ts';

interface Arguments {
  readonly manifest: string;
  readonly sourceRoot: string;
  readonly gameplayTagCatalog: string;
  readonly auditOutput: string;
}

/**
 * 强制尝试 manifest 中每份 CharacterTemplate 的连携条件闭包。
 * 正式生成允许用 null 保留证据阻塞；本审计不能因此跳过公共来源解析与投影。
 */
export function auditOperatorRuntimeTemplates(args: Arguments) {
  const manifest = requireRecord(readJson(args.manifest), args.manifest);
  const operators = requireArray(manifest.operators, `${args.manifest}.operators`);
  const sourceRoot = path.resolve(args.sourceRoot);
  const gameplayTagRegistry = new GameplayTagRegistry(
    readGameplayTagPaths(args.gameplayTagCatalog),
  );
  const context = createOperatorComboActionProjectionContext(gameplayTagRegistry);

  const entries = operators.map((value, index) => {
    const rowPath = `${args.manifest}.operators[${index}]`;
    const row = requireRecord(value, rowPath);
    const slug = requireNonEmptyString(row.slug, `${rowPath}.slug`);
    const runtime = requireRecord(row.runtimeTemplate, `${rowPath}.runtimeTemplate`);
    const sourceFile = requireNonEmptyString(
      runtime.sourceFile,
      `${rowPath}.runtimeTemplate.sourceFile`,
    );
    const expectedSourceSha256 = requireNonEmptyString(
      runtime.sourceSha256,
      `${rowPath}.runtimeTemplate.sourceSha256`,
    );
    const expectedCharacterId = requireNonEmptyString(
      runtime.sourceCharacterId,
      `${rowPath}.runtimeTemplate.sourceCharacterId`,
    );
    const skillGroupKey =
      runtime.comboSkillGroupKey === null
        ? null
        : requireNonEmptyString(
            runtime.comboSkillGroupKey,
            `${rowPath}.runtimeTemplate.comboSkillGroupKey`,
          );
    const sourcePath = resolveSourceFile(sourceRoot, sourceFile, rowPath);

    try {
      const template = parseOperatorRuntimeTemplateSource(readJson(sourcePath), sourcePath, {
        parseComboConditions: true,
      });
      if (template.sourceSha256.toLowerCase() !== expectedSourceSha256.toLowerCase())
        throw new Error('runtime template source identity changed');
      if (template.characterId !== expectedCharacterId)
        throw new Error(
          `expected character ${JSON.stringify(expectedCharacterId)}, got ${JSON.stringify(template.characterId)}`,
        );
      const blackboards = compileAbilitySystemBlackboardsSource(template.blackboards);
      const conditions = (template.conditions?.conditions ?? []).map(
        (condition, conditionIndex) =>
          compileComboSkillConditionDefinitionSource(
            condition,
            blackboards,
            {
              key: `native-combo:${conditionIndex}`,
              skillKey: template.comboSkillId ?? 'audit-unbound-combo-skill',
            },
            context,
          ).definition,
      );
      return {
        slug,
        characterId: template.characterId,
        comboSkillId: template.comboSkillId,
        status:
          skillGroupKey === null ? ('compiled-unbound' as const) : ('compiled-and-bound' as const),
        skillGroupKey,
        conditionCount: conditions.length,
        events: conditions.map(condition => condition.event),
      };
    } catch (error) {
      return {
        slug,
        characterId: expectedCharacterId,
        status: 'blocked' as const,
        skillGroupKey,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const report = {
    scope: 'operator-runtime-template-conversion-v1',
    operatorCount: entries.length,
    compiledAndBoundCount: entries.filter(entry => entry.status === 'compiled-and-bound').length,
    compiledUnboundCount: entries.filter(entry => entry.status === 'compiled-unbound').length,
    blockedCount: entries.filter(entry => entry.status === 'blocked').length,
    entries,
  };
  const auditRoot = path.resolve(args.auditOutput);
  const allowedRoot = path.resolve('tmp/game-data-audit');
  const relativeAuditRoot = path.relative(allowedRoot, auditRoot);
  if (
    relativeAuditRoot === '' ||
    relativeAuditRoot.startsWith('..') ||
    path.isAbsolute(relativeAuditRoot)
  )
    throw new Error('--audit-output must be a child of tmp/game-data-audit');
  fs.mkdirSync(auditRoot, { recursive: true });
  const output = path.join(auditRoot, 'operator-runtime-template-conversion.json');
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { output, ...report };
}

function resolveSourceFile(sourceRoot: string, sourceFile: string, pathLabel: string): string {
  if (path.isAbsolute(sourceFile))
    throw new Error(`${pathLabel}.runtimeTemplate.sourceFile: expected a relative path`);
  const resolved = path.resolve(sourceRoot, sourceFile);
  const relative = path.relative(sourceRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error(`${pathLabel}.runtimeTemplate.sourceFile: escapes source root`);
  return resolved;
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const values = new Map<string, string>();
  const allowed = new Set([
    '--manifest',
    '--source-root',
    '--gameplay-tag-catalog',
    '--audit-output',
  ]);
  for (let index = 2; index < process.argv.length; index++) {
    const flag = process.argv[index]!;
    if (!allowed.has(flag)) throw new Error(`unsupported argument ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate argument ${flag}`);
    const value = process.argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
    values.set(flag, value);
  }
  const required = (flag: string) => {
    const value = values.get(flag);
    if (!value) throw new Error(`missing ${flag}`);
    return value;
  };
  console.log(
    auditOperatorRuntimeTemplates({
      manifest: required('--manifest'),
      sourceRoot: required('--source-root'),
      gameplayTagCatalog: required('--gameplay-tag-catalog'),
      auditOutput: required('--audit-output'),
    }),
  );
}
