import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';

import {
  collectBuffRuntimeClosure,
  compileBuffRuntimeDefinitionSource,
  compileWeaponStaticDefinitionBatchSource,
  isAfterEnemyDefeatedOnlyBuffRuntime,
  isPresentationOnlyBuffStackEffect,
  standardStumpBuffAbilityEventOmissionReason,
} from '../src/index.ts';

interface Arguments {
  readonly tables: string;
  readonly skillData: string;
  readonly buffData?: string;
  readonly gameplayTagCatalog?: string;
}

interface WeaponAuditFailure {
  readonly weaponId: string;
  readonly reasons: readonly string[];
}

/**
 * 对 WeaponBasicTable 中每把武器独立执行静态正式定义编译。
 *
 * 独立审计很重要：某一把武器出现陌生 SkillData 语义时，不能阻止报告其余武器的真实边界。
 * 本命令只读来源并输出诊断，不生成可提交的中间产物。
 */
export function auditWeaponStaticDefinitions(args: Arguments): {
  readonly total: number;
  readonly complete: number;
  readonly runtimeDependencyCount: number;
  readonly referencedBuffIds: readonly string[];
  readonly missingBuffIds: readonly string[];
  readonly buffClosureCount: number;
  readonly compiledBuffCount: number;
  readonly omittedBuffIds: readonly string[];
  readonly buffFailures: readonly WeaponAuditFailure[];
  readonly scenarioOmissions: readonly WeaponAuditFailure[];
  readonly failures: readonly WeaponAuditFailure[];
} {
  const weaponTable = readJson(path.join(args.tables, 'WeaponBasicTable.json'));
  const upgradeTable = readJson(path.join(args.tables, 'WeaponUpgradeTemplateTable.json'));
  const skillPatchTable = readJson(path.join(args.tables, 'SkillPatchTable.json'));
  const skillData = readSkillDataDirectory(args.skillData);
  const weaponIds = Object.keys(requireRecord(weaponTable, 'WeaponBasicTable')).sort(
    (left, right) => left.localeCompare(right),
  );
  const failures: WeaponAuditFailure[] = [];
  const scenarioOmissions: WeaponAuditFailure[] = [];
  let complete = 0;
  let runtimeDependencyCount = 0;
  const referencedBuffIds = new Set<string>();

  for (const weaponId of weaponIds) {
    try {
      const result = compileWeaponStaticDefinitionBatchSource(
        weaponTable,
        upgradeTable,
        skillData,
        skillPatchTable,
        [weaponId],
      );
      runtimeDependencyCount += result.runtimeDependencies.length;
      for (const dependency of result.runtimeDependencies) {
        for (const buffId of dependency.referencedBuffIds) referencedBuffIds.add(buffId);
      }
      const blockedReasons = result.diagnostics
        .filter(diagnostic => diagnostic.status === 'blocked')
        .map(diagnostic => `${diagnostic.status}: ${diagnostic.sourcePath}: ${diagnostic.reason}`);
      const omittedReasons = result.diagnostics
        .filter(diagnostic => diagnostic.status === 'scenario-omitted')
        .map(diagnostic => `${diagnostic.status}: ${diagnostic.sourcePath}: ${diagnostic.reason}`);
      if (omittedReasons.length > 0) {
        scenarioOmissions.push({ weaponId, reasons: omittedReasons });
      }
      if (result.definitions.length === 1 && blockedReasons.length === 0) complete += 1;
      else {
        if (result.definitions.length !== 1) {
          blockedReasons.unshift(
            `blocked: expected one static definition, found ${result.definitions.length}`,
          );
        }
        failures.push({ weaponId, reasons: blockedReasons });
      }
    } catch (error) {
      failures.push({ weaponId, reasons: [formatError(error)] });
    }
  }

  const sortedReferencedBuffIds = [...referencedBuffIds].sort((left, right) =>
    left.localeCompare(right),
  );
  const buffData = args.buffData === undefined ? null : readDefinitionDirectory(args.buffData);
  const gameplayTagRegistry =
    args.gameplayTagCatalog === undefined
      ? undefined
      : new GameplayTagRegistry(readGameplayTagPaths(args.gameplayTagCatalog));
  const missingBuffIds =
    buffData === null ? [] : sortedReferencedBuffIds.filter(buffId => !(buffId in buffData));
  const buffFailures: WeaponAuditFailure[] = [];
  const omittedBuffIds: string[] = [];
  let buffClosureCount = 0;
  let compiledBuffCount = 0;
  if (buffData !== null && missingBuffIds.length === 0) {
    const closure = collectBuffRuntimeClosure(sortedReferencedBuffIds, buffData);
    buffClosureCount = closure.size;
    const visualOnlyIds = new Set(
      [...closure.entries()]
        .filter(([, source]) => isPresentationOnlyBuffStackEffect(source))
        .map(([id]) => id),
    );
    for (const [buffId, source] of closure) {
      if (visualOnlyIds.has(buffId) || isAfterEnemyDefeatedOnlyBuffRuntime(source)) {
        omittedBuffIds.push(buffId);
        continue;
      }
      try {
        const omittedAbilityEvents = new Set<string | number>();
        const omittedReasons: string[] = [];
        for (const event of source.graph.abilityEvents) {
          const reason = standardStumpBuffAbilityEventOmissionReason(event.event);
          if (reason === null) continue;
          omittedAbilityEvents.add(event.event);
          omittedReasons.push(`scenario-omitted: BuffData.${buffId}.abilityEventAction: ${reason}`);
        }
        if (omittedReasons.length > 0) {
          scenarioOmissions.push({ weaponId: `BuffData.${buffId}`, reasons: omittedReasons });
        }
        compileBuffRuntimeDefinitionSource(
          source,
          visualOnlyIds,
          omittedAbilityEvents,
          undefined,
          undefined,
          { gameplayTagRegistry },
        );
        compiledBuffCount += 1;
      } catch (error) {
        buffFailures.push({ weaponId: buffId, reasons: [formatError(error)] });
      }
    }
  }
  return {
    total: weaponIds.length,
    complete,
    runtimeDependencyCount,
    referencedBuffIds: sortedReferencedBuffIds,
    missingBuffIds,
    buffClosureCount,
    compiledBuffCount,
    omittedBuffIds: omittedBuffIds.sort((left, right) => left.localeCompare(right)),
    buffFailures,
    scenarioOmissions,
    failures,
  };
}

export function parseArguments(values: readonly string[]): Arguments {
  const result = new Map<string, string>();
  for (let index = 0; index < values.length; index += 2) {
    const name = values[index];
    const value = values[index + 1];
    if (!name?.startsWith('--') || value === undefined) {
      throw new Error('expected paired --name <path> arguments');
    }
    result.set(name, value);
  }
  return {
    tables: requiredPath(result, '--tables'),
    skillData: requiredPath(result, '--skill-data'),
    ...(result.has('--buff-data') ? { buffData: requiredPath(result, '--buff-data') } : {}),
    ...(result.has('--gameplay-tag-catalog')
      ? { gameplayTagCatalog: requiredPath(result, '--gameplay-tag-catalog') }
      : {}),
  };
}

function readDefinitionDirectory(directory: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const name of fs
    .readdirSync(directory)
    .filter(name => name.endsWith('.json'))
    .sort()) {
    if (!/^[A-Za-z0-9._-]+\.json$/.test(name)) {
      throw new Error(`${directory}: unsafe BuffData filename ${JSON.stringify(name)}`);
    }
    const value = readJson(path.join(directory, name));
    const row = requireRecord(value, name);
    if (typeof row.id !== 'string' || row.id.length === 0) {
      throw new Error(`${name}.id: expected non-empty string`);
    }
    if (row.id in result) {
      throw new Error(`${name}.id: duplicate BuffData identity ${JSON.stringify(row.id)}`);
    }
    result[row.id] = value;
  }
  return result;
}

function readSkillDataDirectory(directory: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const name of fs
    .readdirSync(directory)
    .filter(name => name.endsWith('.json'))
    .sort()) {
    if (!/^[A-Za-z0-9._-]+\.json$/.test(name)) {
      throw new Error(`${directory}: unsafe SkillData filename ${JSON.stringify(name)}`);
    }
    const value = readJson(path.join(directory, name));
    const row = requireRecord(value, name);
    if (typeof row.skillId !== 'string' || row.skillId.length === 0) {
      throw new Error(`${name}.skillId: expected non-empty string`);
    }
    if (row.skillId in result) {
      throw new Error(
        `${name}.skillId: duplicate SkillData identity ${JSON.stringify(row.skillId)}`,
      );
    }
    result[row.skillId] = value;
  }
  return result;
}

function requiredPath(values: ReadonlyMap<string, string>, name: string): string {
  const value = values.get(name);
  if (!value) throw new Error(`missing ${name}`);
  return path.resolve(value);
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function requireRecord(value: unknown, sourcePath: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${sourcePath}: expected object`);
  }
  return value as Record<string, unknown>;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function run(): void {
  const report = auditWeaponStaticDefinitions(parseArguments(process.argv.slice(2)));
  process.stdout.write(
    `weapon static definitions: ${report.complete}/${report.total}; runtime dependencies: ${report.runtimeDependencyCount}; referenced BuffData: ${report.referencedBuffIds.length}; scenario omissions: ${report.scenarioOmissions.length}\n`,
  );
  if (report.missingBuffIds.length > 0) {
    process.stdout.write(`missing BuffData: ${report.missingBuffIds.join(', ')}\n`);
  }
  if (report.buffClosureCount > 0) {
    process.stdout.write(
      `Buff runtime closure: ${report.compiledBuffCount}/${report.buffClosureCount}; stump omissions: ${report.omittedBuffIds.length}\n`,
    );
  }
  for (const omission of report.scenarioOmissions) {
    process.stdout.write(`~ ${omission.weaponId}\n`);
    for (const reason of omission.reasons) process.stdout.write(`  - ${reason}\n`);
  }
  for (const failure of report.failures) {
    process.stdout.write(`- ${failure.weaponId}\n`);
    for (const reason of failure.reasons) process.stdout.write(`  - ${reason}\n`);
  }
  for (const failure of report.buffFailures) {
    process.stdout.write(`- BuffData.${failure.weaponId}\n`);
    for (const reason of failure.reasons) process.stdout.write(`  - ${reason}\n`);
  }
  if (
    report.failures.length > 0 ||
    report.missingBuffIds.length > 0 ||
    report.buffFailures.length > 0
  ) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run();
}
