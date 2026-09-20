import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { format, resolveConfig } from 'prettier';
import type { ActionSequenceDefinition } from '../../../packages/game-data-contract/src/actions.ts';
import type { CompiledBuffDefinitionSource } from '../src/compiler/buffs/buffProjectionTypes.ts';
import { compileGlobalBuffTemplate } from '../src/compiler/buffs/globalBuffProjection.ts';
import { compileStandardStumpBuffClosure } from '../src/compiler/buffs/standardStumpBuffClosure.ts';
import { parseGlobalBuffTemplateCatalogSource } from '../src/source/globalBuffTemplate.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import {
  requireArray,
  requireInteger,
  requireNonEmptyString,
  requireRecord,
} from '../src/source/primitives.ts';
import {
  parseContingencyContractCatalogSource,
  compileContingencyContractTagDefinitions,
  type ContingencyContractCatalogSource,
} from '../src/domains/mechanics/contingencyContractSource.ts';
import {
  writeGeneratedDefinitionFiles,
  checkGeneratedDefinitionFiles,
} from '../src/compiler/publication/writeGeneratedDefinitionFiles.ts';

export interface ContingencyContractDefinitionSourceArguments {
  readonly tableRoot: string;
  readonly buffDataRoot: string;
  readonly globalBuffCatalog: string;
  readonly skillSettingCatalog: string;
  readonly gameplayTagPaths: readonly string[];
  readonly scope: string;
}

interface Arguments extends ContingencyContractDefinitionSourceArguments {
  readonly output: string;
  readonly check: boolean;
}

export interface ContingencyContractSimulationScope {
  readonly supportedTagIds: ReadonlySet<number>;
  readonly enemyMaxHealthTagIds: ReadonlySet<number>;
  readonly blockedTagReasons: ReadonlyMap<number, string>;
  readonly omittedTagReasons: ReadonlyMap<number, string>;
}

export interface ContingencyContractInitializationPlan {
  readonly tagId: number;
  readonly sequence: ActionSequenceDefinition;
}

export interface ContingencyContractEnemyMaxHealthPlan {
  readonly tagId: number;
  readonly multiplier: number;
}

/** 来源校验和行为闭包完成后的结果；可先收集黑板用途，再直接渲染这一批内容。 */
export interface CompiledContingencyContractDefinitions {
  readonly tags: ReturnType<typeof compileContingencyContractTagDefinitions>;
  readonly buffDefinitions: Readonly<Record<string, CompiledBuffDefinitionSource>>;
  readonly initializationPlans: readonly ContingencyContractInitializationPlan[];
  readonly enemyMaxHealthPlans: readonly ContingencyContractEnemyMaxHealthPlan[];
  readonly scope: ContingencyContractSimulationScope;
  readonly revision: string;
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readScope(file: string): ContingencyContractSimulationScope {
  const value = requireRecord(readJson(file), file);
  const supportedTagIds = new Set(
    requireArray(value.supportedTagIds, `${file}.supportedTagIds`).map((entry, index) =>
      requireInteger(entry, `${file}.supportedTagIds[${index}]`),
    ),
  );
  const enemyMaxHealthTagIds = new Set(
    requireArray(value.enemyMaxHealthTagIds, `${file}.enemyMaxHealthTagIds`).map((entry, index) =>
      requireInteger(entry, `${file}.enemyMaxHealthTagIds[${index}]`),
    ),
  );
  const readReasons = (field: 'blockedTagReasons' | 'omittedTagReasons') => {
    const record = requireRecord(value[field], `${file}.${field}`);
    const result = new Map<number, string>();
    for (const [key, reason] of Object.entries(record)) {
      if (!/^\d+$/.test(key)) throw new Error(`${file}.${field}: invalid tag ID ${key}`);
      result.set(Number(key), requireNonEmptyString(reason, `${file}.${field}.${key}`));
    }
    return result;
  };
  const blockedTagReasons = readReasons('blockedTagReasons');
  const omittedTagReasons = readReasons('omittedTagReasons');
  const classified = new Map<number, string>();
  for (const id of supportedTagIds) classified.set(id, 'supported');
  for (const id of enemyMaxHealthTagIds) {
    const previous = classified.get(id);
    if (previous !== undefined)
      throw new Error(`${file}: tag ${id} is both ${previous} and enemyMaxHealth`);
    classified.set(id, 'enemyMaxHealth');
  }
  for (const [id] of blockedTagReasons) {
    const previous = classified.get(id);
    if (previous !== undefined)
      throw new Error(`${file}: tag ${id} is both ${previous} and blocked`);
    classified.set(id, 'blocked');
  }
  for (const [id] of omittedTagReasons) {
    const previous = classified.get(id);
    if (previous !== undefined)
      throw new Error(`${file}: tag ${id} is both ${previous} and omitted`);
    classified.set(id, 'omitted');
  }
  return { supportedTagIds, enemyMaxHealthTagIds, blockedTagReasons, omittedTagReasons };
}

function validateScope(
  catalog: ContingencyContractCatalogSource,
  scope: ContingencyContractSimulationScope,
): void {
  const catalogIds = new Set(catalog.tags.map(tag => tag.tagId));
  for (const id of [
    ...scope.supportedTagIds,
    ...scope.enemyMaxHealthTagIds,
    ...scope.blockedTagReasons.keys(),
    ...scope.omittedTagReasons.keys(),
  ]) {
    if (!catalogIds.has(id)) throw new Error(`simulation scope references unknown tag ${id}`);
  }
  const unclassified = [...catalogIds].filter(
    id =>
      !scope.supportedTagIds.has(id) &&
      !scope.enemyMaxHealthTagIds.has(id) &&
      !scope.blockedTagReasons.has(id) &&
      !scope.omittedTagReasons.has(id),
  );
  if (unclassified.length > 0)
    throw new Error(`simulation scope does not classify tags: ${unclassified.join(', ')}`);
}

function mergeDefinitions(
  target: Record<string, CompiledBuffDefinitionSource>,
  definitions: Readonly<Record<string, CompiledBuffDefinitionSource>>,
  owner: string,
): void {
  for (const [id, definition] of Object.entries(definitions)) {
    const previous = target[id];
    if (previous !== undefined && !isDeepStrictEqual(previous, definition)) {
      throw new Error(`Contingency Contract Buff '${id}' differs while compiling ${owner}`);
    }
    target[id] = definition;
  }
}

function assignments(term: {
  readonly blackboard: readonly { readonly key: string; readonly value: number }[];
}) {
  return Object.fromEntries(
    term.blackboard.map(item => [item.key, { kind: 'constant' as const, value: item.value }]),
  );
}

/** 同批来源编译入口；保留范围校验和闭包阻断，不渲染、写盘或读取现存生成定义。 */
export function compileContingencyContractDefinitionsFromFiles(
  args: ContingencyContractDefinitionSourceArguments,
): CompiledContingencyContractDefinitions {
  const catalog = parseContingencyContractCatalogSource(
    readJson(path.join(args.tableRoot, 'CcTagTable.json')),
    readJson(path.join(args.tableRoot, 'ContingencyContractTable.json')),
  );
  const globalBuffCatalogValue = readJson(args.globalBuffCatalog);
  const globalBuffCatalogRecord = requireRecord(globalBuffCatalogValue, args.globalBuffCatalog);
  const revision = requireNonEmptyString(
    globalBuffCatalogRecord.version,
    `${args.globalBuffCatalog}.version`,
  );
  const scope = readScope(args.scope);
  validateScope(catalog, scope);
  const globalBuffCatalog = parseGlobalBuffTemplateCatalogSource(globalBuffCatalogValue);
  const skillSettingCatalog = readJson(args.skillSettingCatalog);
  const gameplayTagRegistry = new GameplayTagRegistry(args.gameplayTagPaths);
  const loadBuff = (id: string) => readJson(path.join(args.buffDataRoot, `${id}.json`));
  const definitions: Record<string, CompiledBuffDefinitionSource> = {};
  const plans: ContingencyContractInitializationPlan[] = [];
  const enemyMaxHealthPlans: ContingencyContractEnemyMaxHealthPlan[] = [];

  for (const tag of catalog.tags.filter(tag => scope.enemyMaxHealthTagIds.has(tag.tagId))) {
    if (tag.terms.length !== 1) {
      throw new Error(`enemy max-health tag ${tag.tagId} must contain exactly one term`);
    }
    const term = tag.terms[0]!;
    if (term.kind !== 'enemyBuff' || term.buffId !== 'buff_cc_enemy_common_hp_up') {
      throw new Error(`enemy max-health tag ${tag.tagId} has an unexpected native Buff source`);
    }
    if (term.blackboard.length !== 1 || term.blackboard[0]?.key !== 'hp_up') {
      throw new Error(`enemy max-health tag ${tag.tagId} must define only the hp_up blackboard`);
    }
    const multiplier = term.blackboard[0].value;
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      throw new Error(`enemy max-health tag ${tag.tagId} has invalid hp_up ${multiplier}`);
    }
    enemyMaxHealthPlans.push({ tagId: tag.tagId, multiplier });
  }

  for (const tag of catalog.tags.filter(tag => scope.supportedTagIds.has(tag.tagId))) {
    const steps: ActionSequenceDefinition['steps'][number][] = [];
    for (const [termIndex, term] of tag.terms.entries()) {
      if (term.kind === 'reduceChallengeTime') {
        throw new Error(`supported tag ${tag.tagId} contains a challenge-time-only term`);
      }
      const template =
        term.kind === 'selfGlobalBuff' ? globalBuffCatalog.byId.get(term.buffId) : undefined;
      if (term.kind === 'selfGlobalBuff' && template === undefined) {
        throw new Error(`supported tag ${tag.tagId} is missing GlobalBuff '${term.buffId}'`);
      }
      const rootBuffIds =
        term.kind === 'enemyBuff' ? [term.buffId] : template!.children.map(child => child.buffId);
      const owner = term.kind === 'enemyBuff' ? ('enemy' as const) : ('caster' as const);
      const closure = compileStandardStumpBuffClosure(
        rootBuffIds,
        loadBuff,
        globalBuffCatalogValue,
        skillSettingCatalog,
        undefined,
        undefined,
        new Map(rootBuffIds.map(id => [id, owner])),
        new Set(rootBuffIds),
        gameplayTagRegistry,
      );
      const blocked = closure.diagnostics.filter(item => item.status === 'blocked');
      if (blocked.length > 0) {
        throw new Error(
          `supported tag ${tag.tagId} term ${termIndex} is blocked: ${blocked.map(item => item.reason).join(' | ')}`,
        );
      }
      mergeDefinitions(definitions, closure.definitions, `tag ${tag.tagId}`);
      steps.push(
        term.kind === 'enemyBuff'
          ? {
              kind: 'applyBuff',
              parameters: {
                buffId: term.buffId,
                target: 'enemy',
                blackboardAssignments: assignments(term),
              },
            }
          : {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: term.buffId,
                definition: compileGlobalBuffTemplate(
                  template!,
                  `CcTagTable.${tag.tagId}.tagTerms[${termIndex}]`,
                ),
                source: 'battle',
                blackboardAssignments: assignments(term),
              },
            },
      );
    }
    plans.push({ tagId: tag.tagId, sequence: { steps } });
  }

  return {
    buffDefinitions: definitions,
    tags: compileContingencyContractTagDefinitions(catalog),
    initializationPlans: plans,
    enemyMaxHealthPlans,
    scope,
    revision,
  };
}

export async function generateContingencyContractDefinitions(args: Arguments) {
  const compiled = compileContingencyContractDefinitionsFromFiles(args);
  const rendered = await renderContingencyContractDefinitionsFromCompiled(compiled);
  if (args.check) checkGeneratedDefinitionFiles(args.output, rendered.files);
  else await writeGeneratedDefinitionFiles(args.output, rendered.files);
  return rendered.summary;
}

/** 保留已验证的范围和版本，只渲染文件内容，不重新读取或编译机制来源。 */
export async function renderContingencyContractDefinitionsFromCompiled(
  compiled: CompiledContingencyContractDefinitions,
) {
  const {
    buffDefinitions: definitions,
    initializationPlans: plans,
    enemyMaxHealthPlans,
    scope,
    revision,
  } = compiled;
  const prettierConfig = (await resolveConfig(path.resolve('.prettierrc.json'))) ?? {};
  const content = await format(
    `/** 由危机合约原生词条、GlobalBuff 与 BuffData 闭包生成；不要手工编辑。 */
import type { ActionSequenceDefinition, OperatorBuffDefinitions, ContingencyContractTagDefinition } from '../../../../packages/game-data-contract/src/index.ts';

export const contingencyContractBuffDefinitions = Object.freeze(${JSON.stringify(definitions, null, 2)}) as OperatorBuffDefinitions;
export const contingencyContractTagDefinitions = Object.freeze<readonly ContingencyContractTagDefinition[]>(${JSON.stringify(compiled.tags, null, 2)});
export const contingencyContractInitializationPlans = Object.freeze(${JSON.stringify(plans, null, 2)}) as readonly { readonly tagId: number; readonly sequence: ActionSequenceDefinition }[];
export const contingencyContractEnemyMaxHealthPlans = Object.freeze(${JSON.stringify(enemyMaxHealthPlans, null, 2)}) as readonly { readonly tagId: number; readonly multiplier: number }[];
export const contingencyContractBlockedTagReasons = Object.freeze(${JSON.stringify(Object.fromEntries(scope.blockedTagReasons), null, 2)}) as Readonly<Record<number, string>>;
export const contingencyContractOmittedTagReasons = Object.freeze(${JSON.stringify(Object.fromEntries(scope.omittedTagReasons), null, 2)}) as Readonly<Record<number, string>>;
export const contingencyContractDefinitionRevision = ${JSON.stringify(revision)};
`,
    { ...prettierConfig, parser: 'typescript' },
  );
  const files = [{ relativePath: 'contingencyContractDefinitions.generated.ts', content }];
  return {
    files,
    summary: {
      supportedTagCount: plans.length + enemyMaxHealthPlans.length,
      blockedTagCount: scope.blockedTagReasons.size,
      omittedTagCount: scope.omittedTagReasons.size,
      buffDefinitionCount: Object.keys(definitions).length,
    },
  };
}

async function main(values: readonly string[]): Promise<void> {
  const options = new Map<string, string>();
  let check = false;
  for (let index = 0; index < values.length; index += 1) {
    const flag = values[index]!;
    if (flag === '--check') {
      check = true;
      continue;
    }
    const value = values[++index];
    if (!flag.startsWith('--') || value === undefined) throw new Error(`invalid argument ${flag}`);
    options.set(flag, value);
  }
  const required = (flag: string) => {
    const value = options.get(flag);
    if (value === undefined) throw new Error(`missing ${flag}`);
    return value;
  };
  const gameplayTagModule = await import(
    pathToFileURL(path.resolve(required('--gameplay-tag-catalog'))).href
  );
  const result = await generateContingencyContractDefinitions({
    tableRoot: path.resolve(required('--table-root')),
    buffDataRoot: path.resolve(required('--buff-data-root')),
    globalBuffCatalog: path.resolve(required('--global-buff-catalog')),
    skillSettingCatalog: path.resolve(required('--skill-setting-catalog')),
    gameplayTagPaths: gameplayTagModule.GAMEPLAY_TAG_PATHS,
    scope: path.resolve(required('--scope')),
    output: path.resolve(required('--output')),
    check,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
