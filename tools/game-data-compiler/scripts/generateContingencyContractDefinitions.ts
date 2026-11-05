import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { format, resolveConfig } from 'prettier';
import type * as Contract from '../../../packages/game-data-contract/src/index.ts';
import { validateActionGraphOwner } from '../../../src/core/action-graph/actionGraphValidation.ts';
import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffDefinitionSource } from '../src/compiler/buffs/buffProjectionTypes.ts';
import { compileGlobalBuffTemplate } from '../src/compiler/buffs/globalBuffProjection.ts';
import { compileStandardStumpBuffClosure } from '../src/compiler/buffs/standardStumpBuffClosure.ts';
import { readGeneratedTimeDilationPriorities } from '../src/compiler/catalogs/generatedTimeDilationCatalog.ts';
import { resolveContractBuffBindings } from '../src/domains/contingencyContract/contractBuffBindings.ts';
import { imageRefFromPath } from '../src/compiler/publication/imageResources.ts';
import { finalizeDefinitionResources } from '../src/compiler/finalizeDefinitions.ts';
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
  ActionGraphStep,
  OperatorBuffDefinitions,
} from '../src/compiler/intermediateDefinitions.ts';
import { renderGraphValue } from '../src/compiler/optimization/actionGraphSourceRenderer.ts';
import type { DefinitionOptimizationMode } from '../src/compiler/optimization/definitionOptimization.ts';
import type { GraphSharedEntityValueUsage } from '../src/compiler/optimization/graphValueOptimization.ts';
import { createGraphEntityUsageContext } from '../src/compiler/optimization/graphValueOptimization.ts';
import {
  writeGeneratedDefinitionFile,
  type RenderedDefinitionFileSource,
} from '../src/compiler/publication/writeGeneratedDefinitionFiles.ts';
import {
  compileContingencyContractTagDefinitions,
  parseContingencyContractCatalogSource,
  parseContingencyContractLayoutSource,
  type ContingencyContractCatalogSource,
} from '../src/domains/contingencyContract/contingencyContractSource.ts';
import { renderCommonBuffDefinitionsSource } from '../src/domains/operator/definitionSourceRenderer.ts';
import { parseGlobalBuffTemplateCatalogSource } from '../src/source/globalBuffTemplate.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import {
  createNativeJsonEncodingReader,
  type NativeJsonEncodingSchema,
} from '../src/source/nativeJsonEncoding.ts';
import {
  requireArray,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
} from '../src/source/primitives.ts';

interface ContingencyContractBuffSourceArguments {
  readonly tableRoot: string;
  readonly buffDataRoot: string;
  readonly globalBuffCatalog: string;
  readonly skillSettingCatalog: string;
  readonly gameplayTagPaths: readonly string[];
  readonly nativeJsonEncoding?: NativeJsonEncodingSchema;
}

export interface ContingencyContractDefinitionSourceArguments extends ContingencyContractBuffSourceArguments {
  readonly scope: string;
}

export interface BoundContingencyContractSourceArguments extends ContingencyContractBuffSourceArguments {
  readonly bindings: string;
  readonly supplement: string;
  readonly timeDilationCatalog: string;
}

interface Arguments extends ContingencyContractDefinitionSourceArguments {
  readonly output: string;
  readonly check: boolean;
}

export interface ContingencyContractSimulationScope {
  readonly previewBuffRoots?: ReadonlyMap<string, 'caster' | 'enemy'>;
  /** 仅裁剪合约初始化入口；不能据此删除其他动作调用的共享子定义。 */
  readonly omittedBuffRootReasons?: ReadonlyMap<string, string>;
  readonly supportedTagIds: ReadonlySet<number>;
  readonly blockedTagReasons: ReadonlyMap<number, string>;
  readonly omittedTagReasons: ReadonlyMap<number, string>;
}

export interface ContingencyContractInitializationPlan {
  readonly tagId: number;
  readonly sequence: ActionGraphReference;
  readonly actionGraph: ActionGraphResourceDefinition;
}

/** 来源校验和行为闭包完成后的结果；可先收集黑板用途，再直接渲染这一批内容。 */
export interface CompiledContingencyContractDefinitions {
  readonly tags: ReturnType<typeof compileContingencyContractTagDefinitions>;
  readonly buffDefinitions: OperatorBuffDefinitions;
  readonly initializationPlans: readonly ContingencyContractInitializationPlan[];
  readonly scope: ContingencyContractSimulationScope;
  readonly revision: string;
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** 服务器仅公布参数时，以显式人工绑定编译根 Buff，不伪造原生 GlobalBuff 模板。 */
export function compileBoundContingencyContractDefinitionsFromFiles(
  args: BoundContingencyContractSourceArguments,
) {
  const supplement = readJson(args.supplement);
  const bindings = resolveContractBuffBindings(readJson(args.bindings), supplement);
  const gameId = requireNonEmptyString(requireRecord(supplement, args.supplement).gameId, 'gameId');
  const layout = parseContingencyContractLayoutSource(
    readJson(path.join(args.tableRoot, 'CcTagTable.json')),
    readJson(path.join(args.tableRoot, 'ContingencyContractTable.json')),
  );
  const contract = layout.contracts.find(entry => entry.id === gameId);
  if (!contract) throw new Error(`unknown contract layout ${gameId}`);
  const tagIds = new Set(
    contract.columns.flatMap(column => column.entries.map(entry => entry.tagId)),
  );
  for (const binding of bindings)
    if (!tagIds.has(binding.tagId))
      throw new Error(`tag ${binding.tagId} does not belong to ${gameId}`);
  const globalBuffCatalog = readJson(args.globalBuffCatalog);
  const settings = readJson(args.skillSettingCatalog);
  const registry = new GameplayTagRegistry(args.gameplayTagPaths);
  const priorities = readGeneratedTimeDilationPriorities(args.timeDilationCatalog);
  const definitions: Record<string, CompiledBuffDefinitionSource> = {};
  const initializationPlans: ContingencyContractInitializationPlan[] = [];
  const pending = new Map<number, string>();
  const omitted = new Map<number, string>();
  const readNative = args.nativeJsonEncoding
    ? createNativeJsonEncodingReader(args.nativeJsonEncoding)
    : undefined;
  for (const binding of bindings) {
    if (binding.omitted) {
      if (binding.buffs.length || binding.pending)
        throw new Error(`tag ${binding.tagId}: omitted binding contains effects`);
      omitted.set(binding.tagId, binding.omitted);
      continue;
    }
    if (binding.pending) pending.set(binding.tagId, binding.pending);
    const graph = createActionGraphBuilder();
    const steps: ActionGraphStep[] = [];
    const sharedValues: Record<string, number> = {};
    if (binding.spRecoveryBonus !== undefined) {
      sharedValues.recover_ratio = binding.spRecoveryBonus;
      for (const buff of binding.buffs) {
        if (buff.owner !== 'caster') throw new Error('shared SP binding requires character buffs');
        for (const [key, value] of Object.entries(buff.blackboard)) {
          if (typeof value !== 'number')
            throw new Error(`shared SP parameter ${key} must be numeric`);
          sharedValues[key] = value;
        }
      }
      steps.push({
        kind: 'createGlobalBuff',
        parameters: {
          globalBuffId: `endaxis_contract_${binding.tagId}_sp_recovery`,
          source: 'battle',
          blackboardAssignments: Object.fromEntries(
            Object.entries(sharedValues).map(([key, value]) => [key, { kind: 'constant', value }]),
          ),
          definition: {
            stackingType: 'unlimited',
            blackboard: sharedValues,
            children: binding.buffs.map(buff => ({
              buffId: buff.buffId,
              blackboardAssignments: Object.fromEntries(
                Object.keys(buff.blackboard).map(key => [key, { kind: 'valueNode', nodeId: key }]),
              ),
            })),
            sharedSpModifiers: [
              {
                attribute: 'spRecovery',
                operation: 'multiplier',
                value: { kind: 'valueNode', nodeId: 'recover_ratio' },
                applyToReturnSpGain: true,
              },
            ],
          },
        },
      });
    }
    for (const buff of binding.buffs) {
      const closure = compileStandardStumpBuffClosure(
        [buff.buffId],
        (id: string) => {
          const file = path.join(args.buffDataRoot, `${id}.json`);
          const value = readJson(file);
          return readNative ? readNative(value, 'Beyond.Gameplay.Core.BuffData', file) : value;
        },
        globalBuffCatalog,
        settings,
        undefined,
        () => ({
          resolveTimeDilationPriority: (id, sourcePath) => {
            const priority = priorities.get(id);
            if (priority === undefined)
              throw new Error(`${sourcePath}: unknown time dilation priority ${id}`);
            return priority;
          },
        }),
        new Map([[buff.buffId, buff.owner]]),
        new Set([buff.buffId]),
        registry,
      );
      const blocked = closure.diagnostics.filter(item => item.status === 'blocked');
      if (blocked.length)
        throw new Error(`tag ${binding.tagId}: ${blocked.map(item => item.reason).join(' | ')}`);
      mergeDefinitions(definitions, closure.definitions, `tag ${binding.tagId}`);
      if (binding.spRecoveryBonus !== undefined) continue;
      steps.push({
        kind: 'applyBuff',
        parameters: {
          targets:
            buff.owner === 'caster'
              ? { kind: 'characterTeam', excludeOwner: false }
              : {
                  kind: 'enemyByTags',
                  scope: 'global',
                  reverse: true,
                  tagQueryType: 'hasAll',
                  tags: [],
                },
          buffs: [
            {
              buffId: buff.buffId,
              blackboardAssignments: Object.fromEntries(
                Object.entries(buff.blackboard)
                  .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
                  .map(([key, value]) => [key, { kind: 'constant', value }]),
              ),
              stringBlackboardAssignments: Object.fromEntries(
                Object.entries(buff.blackboard).filter(
                  (entry): entry is [string, string] => typeof entry[1] === 'string',
                ),
              ),
            },
          ],
        },
      });
    }
    initializationPlans.push({
      tagId: binding.tagId,
      sequence: graph.sequence(steps),
      actionGraph: {
        main: {
          ...graph.finish(),
          ...(binding.spRecoveryBonus === undefined
            ? {}
            : {
                dataNodes: Object.fromEntries(
                  Object.keys(sharedValues).map(key => [
                    key,
                    { type: 'number' as const, expression: { kind: 'blackboard' as const, key } },
                  ]),
                ),
              }),
        },
        macros: {},
      },
    });
  }
  return {
    contract,
    tags: layout.tags.filter(tag => tagIds.has(tag.tagId)),
    buffDefinitions: definitions,
    initializationPlans,
    pending,
    omitted,
  };
}

/** 人工绑定与原生词条沿用同一个图优化、校验和源码渲染流程。 */
export async function renderBoundContingencyContractDefinitionsFromFiles(
  args: BoundContingencyContractSourceArguments,
  iconDirectory: string,
) {
  const compiled = compileBoundContingencyContractDefinitionsFromFiles(args);
  const supplement = requireRecord(readJson(args.supplement), args.supplement);
  const published = requireRecord(supplement.tags, 'supplement.tags');
  const byId = new Map(compiled.tags.map(tag => [tag.tagId, tag]));
  const tags = compiled.contract.columns.flatMap(column =>
    column.entries.flatMap(entry => {
      if (!Object.hasOwn(published, String(entry.tagId))) return [];
      const tag = byId.get(entry.tagId)!;
      if (!/^[a-zA-Z0-9_-]+$/u.test(tag.icon)) throw new Error(`unsafe contract icon ${tag.icon}`);
      const data = requireRecord(published[String(entry.tagId)], `tag ${entry.tagId}`);
      const blackboard: Record<string, number> = {};
      for (const board of requireArray(data.serverBlackboards, 'serverBlackboards'))
        for (const [key, raw] of Object.entries(requireRecord(board, 'blackboard')))
          if (!Object.hasOwn(blackboard, key))
            blackboard[key] = requireNumber(requireRecord(raw, key).floatValue, key);
      return [
        {
          tagId: tag.tagId,
          columnId: column.id,
          conflictId: entry.conflictId,
          score: tag.score,
          keyId: entry.keyId,
          lockIds: entry.lockIds,
          romanNumSuffix: tag.romanNumSuffix,
          icon: imageRefFromPath(`/${iconDirectory}/${tag.icon}.webp`),
          blackboard,
        },
      ];
    }),
  );
  const plans = compiled.initializationPlans.filter(plan => !compiled.pending.has(plan.tagId));
  for (const tag of tags)
    if (
      !plans.some(plan => plan.tagId === tag.tagId) &&
      !compiled.pending.has(tag.tagId) &&
      !compiled.omitted.has(tag.tagId)
    )
      throw new Error(`published tag ${tag.tagId} has no binding or explicit scope decision`);
  const rendered = await renderContingencyContractDefinitionsFromCompiled({
    tags,
    buffDefinitions: compiled.buffDefinitions,
    initializationPlans: plans,
    revision: String(supplement.gameId),
    scope: {
      supportedTagIds: new Set(plans.map(plan => plan.tagId)),
      blockedTagReasons: compiled.pending,
      omittedTagReasons: compiled.omitted,
    },
  });
  if (!/^[a-zA-Z0-9_-]+$/.test(compiled.contract.id)) throw new Error('unsafe contract ID');
  return {
    ...rendered,
    files: rendered.files.map(file => ({
      ...file,
      relativePath: `contingencyContract.${compiled.contract.id}.generated.ts`,
    })),
  };
}

function readScope(file: string): ContingencyContractSimulationScope {
  const value = requireRecord(readJson(file), file);
  const supportedTagIds = new Set(
    requireArray(value.supportedTagIds, `${file}.supportedTagIds`).map((entry, index) =>
      requireInteger(entry, `${file}.supportedTagIds[${index}]`),
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
  const previewBuffRoots = new Map<string, 'caster' | 'enemy'>();
  for (const [id, owner] of Object.entries(
    requireRecord(value.previewBuffRoots ?? {}, `${file}.previewBuffRoots`),
  )) {
    if (owner !== 'caster' && owner !== 'enemy')
      throw new Error(`${file}: invalid owner for ${id}`);
    previewBuffRoots.set(id, owner);
  }
  const omittedBuffRootReasons = new Map(
    Object.entries(
      requireRecord(value.omittedBuffRootReasons ?? {}, `${file}.omittedBuffRootReasons`),
    ).map(
      ([id, reason]) =>
        [
          requireNonEmptyString(id, `${file}.omittedBuffRootReasons`),
          requireNonEmptyString(reason, `${file}.omittedBuffRootReasons.${id}`),
        ] as const,
    ),
  );
  for (const id of previewBuffRoots.keys()) {
    if (omittedBuffRootReasons.has(id))
      throw new Error(`${file}: Buff root ${id} is both preview and omitted`);
  }
  return {
    supportedTagIds,
    blockedTagReasons,
    omittedTagReasons,
    previewBuffRoots,
    omittedBuffRootReasons,
  };
}

function validateScope(
  catalog: ContingencyContractCatalogSource,
  scope: ContingencyContractSimulationScope,
): void {
  const catalogIds = new Set(catalog.tags.map(tag => tag.tagId));
  for (const id of [
    ...scope.supportedTagIds,
    ...scope.blockedTagReasons.keys(),
    ...scope.omittedTagReasons.keys(),
  ]) {
    if (!catalogIds.has(id)) throw new Error(`simulation scope references unknown tag ${id}`);
  }
  const unclassified = [...catalogIds].filter(
    id =>
      !scope.supportedTagIds.has(id) &&
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
  const readNative = args.nativeJsonEncoding
    ? createNativeJsonEncodingReader(args.nativeJsonEncoding)
    : undefined;
  const loadBuff = (id: string) => {
    const file = path.join(args.buffDataRoot, `${id}.json`);
    const value = readJson(file);
    return readNative ? readNative(value, 'Beyond.Gameplay.Core.BuffData', file) : value;
  };
  const definitions: Record<string, CompiledBuffDefinitionSource> = {};
  const plans: ContingencyContractInitializationPlan[] = [];

  for (const tag of catalog.tags.filter(tag => scope.supportedTagIds.has(tag.tagId))) {
    const graph = createActionGraphBuilder();
    const steps: ActionGraphStep[] = [];
    for (const [termIndex, term] of tag.terms.entries()) {
      if (term.kind === 'reduceChallengeTime') {
        throw new Error(`supported tag ${tag.tagId} contains a challenge-time-only term`);
      }
      // 范围省略只发生在明确的入口，公共解析器和递归动作闭包继续严格检查。
      if (term.kind === 'enemyBuff' && scope.omittedBuffRootReasons?.has(term.buffId)) continue;
      const nativeTemplate =
        term.kind === 'selfGlobalBuff' ? globalBuffCatalog.byId.get(term.buffId) : undefined;
      if (term.kind === 'selfGlobalBuff' && nativeTemplate === undefined) {
        throw new Error(`supported tag ${tag.tagId} is missing GlobalBuff '${term.buffId}'`);
      }
      const template =
        nativeTemplate === undefined
          ? undefined
          : {
              ...nativeTemplate,
              children: nativeTemplate.children.filter(
                child => !scope.omittedBuffRootReasons?.has(child.buffId),
              ),
            };
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
                buffs: [{ buffId: term.buffId, blackboardAssignments: assignments(term) }],
                targets: { kind: 'fixed', target: 'enemy' },
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
    const sequence = graph.sequence(steps);
    plans.push({
      tagId: tag.tagId,
      sequence,
      actionGraph: { main: graph.finish(), macros: {} },
    });
  }

  for (const [id, owner] of scope.previewBuffRoots ?? []) {
    const closure = compileStandardStumpBuffClosure(
      [id],
      loadBuff,
      globalBuffCatalogValue,
      skillSettingCatalog,
      undefined,
      undefined,
      new Map([[id, owner]]),
      new Set([id]),
      gameplayTagRegistry,
    );
    const blocked = closure.diagnostics.filter(item => item.status === 'blocked');
    if (blocked.length)
      throw new Error(
        `preview Buff '${id}' is blocked: ${blocked.map(item => item.reason).join(' | ')}`,
      );
    mergeDefinitions(definitions, closure.definitions, `preview Buff ${id}`);
  }

  return {
    buffDefinitions: definitions,
    tags: compileContingencyContractTagDefinitions(catalog),
    initializationPlans: plans,
    scope,
    revision,
  };
}

export async function generateContingencyContractDefinitions(args: Arguments) {
  const compiled = compileContingencyContractDefinitionsFromFiles(args);
  const rendered = await renderContingencyContractDefinitionsFromCompiled(compiled);
  await publishContractFiles(args.output, rendered.files, args.check);
  return rendered.summary;
}

/** 各期共用目录；独立生成一期时不删除其他期的产物。 */
async function publishContractFiles(
  output: string,
  files: readonly RenderedDefinitionFileSource[],
  check: boolean,
) {
  for (const file of files) {
    if (check) {
      const actual = fs.readFileSync(path.join(output, file.relativePath), 'utf8');
      if (actual.replaceAll('\r\n', '\n') !== file.content.replaceAll('\r\n', '\n'))
        throw new Error(`generated contract file is stale: ${file.relativePath}`);
    } else await writeGeneratedDefinitionFile(output, file);
  }
}

/** 保留已验证的范围和版本，只渲染文件内容，不重新读取或编译机制来源。 */
export async function renderContingencyContractDefinitionsFromCompiled(
  compiled: CompiledContingencyContractDefinitions,
  optimization: DefinitionOptimizationMode = 'apply',
  sharedUsage?: GraphSharedEntityValueUsage,
) {
  const { buffDefinitions, initializationPlans: plans, scope, revision } = compiled;
  const { value: finalized, report } = finalizeDefinitionResources<{
    readonly buffDefinitions: Contract.OperatorBuffDefinitions;
    readonly initializationPlans: readonly {
      readonly tagId: number;
      readonly sequence: Contract.ActionGraphReference;
      readonly actionGraph: Contract.ActionGraphResourceDefinition;
    }[];
  }>({ buffDefinitions, initializationPlans: plans }, optimization, undefined, {
    sharedUsage,
    usageContext: createGraphEntityUsageContext(undefined, sharedUsage),
  });
  const definitions = finalized.buffDefinitions;
  const prettierConfig = (await resolveConfig(path.resolve('.prettierrc.json'))) ?? {};
  const graphPlans = finalized.initializationPlans;
  for (const plan of graphPlans)
    validateActionGraphOwner(plan, `contingencyContract.${plan.tagId}`);
  const content = await format(
    `/** 由危机合约原生词条、GlobalBuff 与 BuffData 闭包生成；不要手工编辑。 */
import type { ContingencyContractTagDefinition } from '../../../../packages/game-data-contract/src/index.ts';
import type { ActionGraphReference } from '../../../../packages/game-data-contract/src/actionGraph';

${renderCommonBuffDefinitionsSource(definitions, 'contingencyContractBuffDefinitions')}
export const contingencyContractTagDefinitions = Object.freeze<readonly ContingencyContractTagDefinition[]>(${JSON.stringify(compiled.tags, null, 2)});
export const contingencyContractInitializationPlans = Object.freeze<readonly { readonly tagId: number; readonly sequence: ActionGraphReference; readonly actionGraph: ActionGraphResourceDefinition }[]>(${renderGraphValue(graphPlans)});
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
      supportedTagCount: plans.length,
      blockedTagCount: scope.blockedTagReasons.size,
      omittedTagCount: scope.omittedTagReasons.size,
      buffDefinitionCount: Object.keys(definitions).length,
      optimization: report,
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
  const source = {
    tableRoot: path.resolve(required('--table-root')),
    buffDataRoot: path.resolve(required('--buff-data-root')),
    globalBuffCatalog: path.resolve(required('--global-buff-catalog')),
    skillSettingCatalog: path.resolve(required('--skill-setting-catalog')),
    gameplayTagPaths: gameplayTagModule.GAMEPLAY_TAG_PATHS,
  };
  if (options.has('--bindings')) {
    const rendered = await renderBoundContingencyContractDefinitionsFromFiles(
      {
        ...source,
        bindings: path.resolve(required('--bindings')),
        supplement: path.resolve(required('--supplement')),
        timeDilationCatalog: path.resolve(required('--time-dilation-catalog')),
      },
      required('--icon-directory'),
    );
    const output = path.resolve(required('--output'));
    await publishContractFiles(output, rendered.files, check);
    const { optimization: _optimization, ...summary } = rendered.summary;
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    return;
  }
  const result = await generateContingencyContractDefinitions({
    ...source,
    scope: path.resolve(required('--scope')),
    output: path.resolve(required('--output')),
    check,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
