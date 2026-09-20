import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import type { TargetGroupActionSource } from '../../source/targetGroup.ts';
import type { TargetReferenceSource } from '../../source/target.ts';
import { projectNativeTagQueryType, type TagQuerySource } from '../../source/tagQuery.ts';
import type {
  DistanceValidatorSource,
  PriorityFilterSource,
} from '../../source/selectorComponents.ts';
import type { IntegerScalarSource } from '../../source/scalar.ts';
import type { ShuffleTargetSource } from '../../source/selectorComponents.ts';
import {
  resolveAbilityEntityTemplateIdsByTagQuery,
  type CompiledAbilityEntityTemplateCatalogSource,
} from './abilityEntityCatalog.ts';

export type CompiledSelectorAnchorSource =
  | { readonly kind: 'actionOwner' }
  | { readonly kind: 'actionSource' }
  | { readonly kind: 'contextTarget'; readonly key: string };

export type CompiledAbilityEntityValidatorSource =
  | { readonly kind: 'tag'; readonly query: TagQuerySource }
  | { readonly kind: 'sameSkillCast' }
  | ({ readonly kind: 'distance' } & DistanceValidatorSource);

export interface CompiledAbilityEntityDistanceFromOwnerSource {
  readonly kind: 'distanceFromOwner';
  readonly order: 'ascending' | 'descending';
  /** 原生未显式限量时使用固定硬上限 128。 */
  readonly maxTargets: number;
}

export interface CompiledAbilityEntityDistanceFromMainCharacterSource {
  readonly kind: 'distanceFromMainCharacter';
  readonly order: 'ascending';
  /** 未显式限量的原生 PriorityFilter 使用固定硬上限 128。 */
  readonly maxTargets: 128;
}

export interface CompiledAbilityEntityShuffleSource {
  readonly kind: 'shuffle';
  /** 原生先全量洗牌，再仅在求值结果大于零时保留前 N 项。 */
  readonly targetNumLimit: IntegerScalarSource;
}

export interface CompiledAbilityEntityCircularOrderSource {
  readonly kind: 'circularOrder';
  readonly indexBlackboardKey: string;
  readonly desiredCount: number;
  readonly reverseFlag: number;
}

export type CompiledAbilityEntityPostProcessorSource =
  | CompiledAbilityEntityDistanceFromOwnerSource
  | CompiledAbilityEntityDistanceFromMainCharacterSource
  | CompiledAbilityEntityShuffleSource
  | CompiledAbilityEntityCircularOrderSource;

/**
 * OwnerSpawnedEntityFinder 的静态查询投影。
 * candidateTemplateIds 只是“目录中可能通过模板标签验证”的集合；真正的运行时结果仍必须先属于
 * selector owner 的 children，并保持原生子对象顺序。这里不会把目录候选伪装成已生成实例。
 */
export interface CompiledAbilityEntitySelectorQuerySource {
  /** ObjectType 零掩码由反编译证明恒为空；All 等其他掩码仍不属于此 AbilityEntity 投影。 */
  readonly objectFilter: 'abilityEntity' | 'none';
  readonly owner: CompiledSelectorAnchorSource;
  readonly center: CompiledSelectorAnchorSource;
  readonly validators: readonly CompiledAbilityEntityValidatorSource[];
  /** 按原生 postProcessorData 顺序执行；这里只保存运行时实体排序，不能静态重排模板目录。 */
  readonly postProcessors: readonly CompiledAbilityEntityPostProcessorSource[];
  readonly candidateTemplateIds: readonly string[];
}

interface AbilityEntitySelectorFactsSource {
  readonly finderType: string | null;
  readonly finderSpawnedObjectType: string | null;
  readonly validatorTypes: readonly string[];
  readonly validatorTagQueries: ReadonlyArray<readonly [string, readonly number[]]>;
  readonly postProcessorTypes: readonly string[];
  readonly priorityFilters: readonly PriorityFilterSource[];
  readonly shuffleTargets: readonly ShuffleTargetSource[];
  readonly distanceValidators: readonly DistanceValidatorSource[];
  readonly circularOrderIndexKey?: string | null;
  readonly circularOrderDesiredCount?: number | null;
  readonly circularOrderReverseFlag?: number | null;
  readonly circularOrderHeightOffset?: number | null;
  readonly circularOrderRangeThreshold?: number | null;
  readonly circularOrderRangeCheckTarget?: TargetReferenceSource | null;
  readonly selectorOwner: string | null;
  readonly selectorOwnerContextKey: string;
  readonly center: string | null;
  readonly centerContextKey: string;
}

/** 编译 FindTargetAction 已解析出的 owner-spawned AbilityEntity 查询。 */
export function compileTargetGroupAbilityEntityQuerySource(
  source: TargetGroupActionSource,
  catalog: CompiledAbilityEntityTemplateCatalogSource,
  registry: GameplayTagRegistry,
  sourcePath: string,
): CompiledAbilityEntitySelectorQuerySource {
  if (
    source.producerType !== 'FindTargetAction' &&
    source.producerType !== 'ContinuousFindTargetAction'
  ) {
    throw new Error(`${sourcePath}: expected a target-search producer`);
  }
  return compileAbilityEntitySelectorFacts(
    {
      ...source,
      selectorOwnerContextKey: source.selectorOwnerContextKey,
    },
    catalog,
    registry,
    sourcePath,
  );
}

/** 编译 TargetSettings 中真正启用 InstantSearch 的 owner-spawned AbilityEntity 查询。 */
export function compileTargetReferenceAbilityEntityQuerySource(
  source: TargetReferenceSource,
  catalog: CompiledAbilityEntityTemplateCatalogSource,
  registry: GameplayTagRegistry,
  sourcePath: string,
): CompiledAbilityEntitySelectorQuerySource {
  if (source.targetSource !== 'InstantSearch') {
    throw new Error(`${sourcePath}: expected InstantSearch target source`);
  }
  return compileAbilityEntitySelectorFacts(
    {
      ...source,
      selectorOwnerContextKey: source.ownerContextKey,
      center: source.centerType,
    },
    catalog,
    registry,
    sourcePath,
  );
}

function compileAbilityEntitySelectorFacts(
  source: AbilityEntitySelectorFactsSource,
  catalog: CompiledAbilityEntityTemplateCatalogSource,
  registry: GameplayTagRegistry,
  sourcePath: string,
): CompiledAbilityEntitySelectorQuerySource {
  if (source.finderType !== 'OwnerSpawnedEntityFinder') {
    throw new Error(`${sourcePath}: expected OwnerSpawnedEntityFinder`);
  }
  // ObjectType 是掩码；AbilityEntity 单一位进入模板目录，零掩码由原生位运算证明恒不命中。
  // All 或其他类型组合不能偷换成 AbilityEntity 查询。
  if (
    source.finderSpawnedObjectType !== 'AbilityEntity' &&
    source.finderSpawnedObjectType !== '0'
  ) {
    throw new Error(`${sourcePath}: expected AbilityEntity spawned object type`);
  }
  const objectFilter = source.finderSpawnedObjectType === '0' ? 'none' : 'abilityEntity';
  const postProcessors = compilePostProcessors(source, sourcePath);

  const owner = compileAnchor(
    source.selectorOwner,
    source.selectorOwnerContextKey,
    `${sourcePath}.selectorOwner`,
  );
  const center = compileAnchor(source.center, source.centerContextKey, `${sourcePath}.center`);
  const validators: CompiledAbilityEntityValidatorSource[] = [];
  let tagQueryIndex = 0;
  let skillCastValidatorCount = 0;
  let distanceValidatorIndex = 0;
  for (const [index, validatorType] of source.validatorTypes.entries()) {
    if (validatorType === 'TagValidator') {
      const rawQuery = source.validatorTagQueries[tagQueryIndex];
      if (!rawQuery) {
        throw new Error(`${sourcePath}.validatorTypes[${index}]: TagValidator has no query data`);
      }
      validators.push({
        kind: 'tag',
        query: compileTagQuery(rawQuery, `${sourcePath}.validatorTagQueries[${tagQueryIndex}]`),
      });
      tagQueryIndex += 1;
      continue;
    }
    if (validatorType === 'SkillCastIdValidator') {
      skillCastValidatorCount += 1;
      if (skillCastValidatorCount > 1) {
        throw new Error(`${sourcePath}: duplicate SkillCastIdValidator is unsupported`);
      }
      validators.push({ kind: 'sameSkillCast' });
      continue;
    }
    if (validatorType === 'DistanceValidator') {
      const distance = source.distanceValidators[distanceValidatorIndex];
      if (!distance) {
        throw new Error(`${sourcePath}.validatorTypes[${index}]: DistanceValidator has no data`);
      }
      distanceValidatorIndex += 1;
      validators.push({ kind: 'distance', ...distance });
      continue;
    }
    throw new Error(
      `${sourcePath}.validatorTypes[${index}]: unsupported validator ${JSON.stringify(validatorType)}`,
    );
  }
  if (tagQueryIndex !== source.validatorTagQueries.length) {
    throw new Error(`${sourcePath}: unpaired TagValidator query data`);
  }
  if (distanceValidatorIndex !== source.distanceValidators.length) {
    throw new Error(`${sourcePath}: unpaired DistanceValidator data`);
  }

  let candidateTemplateIds =
    objectFilter === 'none' ? [] : catalog.templates.map(template => template.gameId);
  for (const validator of validators) {
    if (validator.kind !== 'tag') continue;
    const matching = new Set(
      resolveAbilityEntityTemplateIdsByTagQuery(catalog, validator.query, registry),
    );
    candidateTemplateIds = candidateTemplateIds.filter(id => matching.has(id));
  }
  return { objectFilter, owner, center, validators, postProcessors, candidateTemplateIds };
}

function compilePostProcessors(
  source: AbilityEntitySelectorFactsSource,
  sourcePath: string,
): CompiledAbilityEntityPostProcessorSource[] {
  const priorityCount = source.postProcessorTypes.filter(type => type === 'PriorityFilter').length;
  if (priorityCount !== source.priorityFilters.length) {
    throw new Error(`${sourcePath}: incomplete PriorityFilter source facts`);
  }
  const shuffleCount = source.postProcessorTypes.filter(type => type === 'ShuffleTarget').length;
  if (shuffleCount !== source.shuffleTargets.length) {
    throw new Error(`${sourcePath}: incomplete ShuffleTarget source facts`);
  }

  let priorityIndex = 0;
  let shuffleIndex = 0;
  return source.postProcessorTypes.map((type, index) => {
    if (type === 'CircularOrderSort') {
      const rangeTarget = source.circularOrderRangeCheckTarget;
      const circularShapeComplete =
        source.circularOrderIndexKey !== null &&
        source.circularOrderIndexKey !== undefined &&
        source.circularOrderDesiredCount !== null &&
        source.circularOrderDesiredCount !== undefined &&
        source.circularOrderReverseFlag !== null &&
        source.circularOrderReverseFlag !== undefined &&
        source.circularOrderHeightOffset !== null &&
        source.circularOrderHeightOffset !== undefined &&
        source.circularOrderRangeThreshold !== null &&
        source.circularOrderRangeThreshold !== undefined &&
        rangeTarget !== null &&
        rangeTarget !== undefined;
      if (!circularShapeComplete) {
        throw new Error(`${sourcePath}: incomplete CircularOrderSort source facts`);
      }
      if (
        source.circularOrderDesiredCount! <= 0 ||
        source.circularOrderRangeThreshold! < 0 ||
        !Number.isFinite(source.circularOrderHeightOffset!) ||
        rangeTarget!.targetSource !== 'InstantSearch' ||
        rangeTarget!.finderType !== 'OwnerSpawnedEntityFinder' ||
        rangeTarget!.finderSpawnedObjectType !== 'AbilityEntity' ||
        rangeTarget!.selectorOwner !== 'ActionSource' ||
        rangeTarget!.validatorTypes.length !== 1 ||
        rangeTarget!.validatorTypes[0] !== 'TagValidator' ||
        rangeTarget!.validatorTagQueries.length !== 1 ||
        rangeTarget!.postProcessorTypes.length !== 0
      ) {
        throw new Error(`${sourcePath}: unsupported CircularOrderSort range anchor`);
      }
      // Endaxis 的所有实体共点，range anchor 只决定原生起始槽位；共点时稳定回退为 0。
      // 实体槽位及方向仍进入运行时排序，不能把 CircularOrderSort 当成无序查询。
      return {
        kind: 'circularOrder',
        indexBlackboardKey: source.circularOrderIndexKey!,
        desiredCount: source.circularOrderDesiredCount!,
        reverseFlag: source.circularOrderReverseFlag!,
      };
    }
    if (type === 'ShuffleTarget') {
      const shuffle = source.shuffleTargets[shuffleIndex];
      shuffleIndex += 1;
      if (!shuffle) throw new Error(`${sourcePath}: incomplete ShuffleTarget source facts`);
      return { kind: 'shuffle', targetNumLimit: shuffle.targetNumLimit };
    }
    if (type !== 'PriorityFilter') {
      throw new Error(
        `${sourcePath}.postProcessorTypes[${index}]: unsupported owner-spawned post-processor ${JSON.stringify(type)}`,
      );
    }
    const priority = source.priorityFilters[priorityIndex];
    priorityIndex += 1;
    if (!priority) {
      throw new Error(`${sourcePath}: incomplete PriorityFilter source facts`);
    }
    return compileOwnerDistancePriorityFilter(
      priority,
      `${sourcePath}.priorityFilters[${priorityIndex - 1}]`,
    );
  });
}

function compileOwnerDistancePriorityFilter(
  source: PriorityFilterSource,
  sourcePath: string,
):
  | CompiledAbilityEntityDistanceFromOwnerSource
  | CompiledAbilityEntityDistanceFromMainCharacterSource {
  const commonFilterIsEmpty =
    !source.onlyReserveMaxPriorityTargets &&
    source.buffFilter.checkType === 'Id' &&
    source.buffFilter.buffIds.length === 0 &&
    source.buffFilter.tagQuery.queryType === 'hasAny' &&
    source.buffFilter.tagQuery.tagIds.length === 0 &&
    source.buffFilter.stackCountType === 'BuffCount';
  if (
    source.filterType === 'DistanceFromMainCharAsc' &&
    !source.limitMaxNum &&
    commonFilterIsEmpty
  ) {
    return { kind: 'distanceFromMainCharacter', order: 'ascending', maxTargets: 128 };
  }
  const order =
    source.filterType === 'DistanceFromOwnerAsc'
      ? 'ascending'
      : source.filterType === 'DistanceFromOwnerDes'
        ? 'descending'
        : null;
  if (!order) {
    throw new Error(
      `${sourcePath}: unsupported PriorityFilter ${JSON.stringify(source.filterType)}`,
    );
  }
  if (source.onlyReserveMaxPriorityTargets) {
    throw new Error(`${sourcePath}: onlyReserveMaxPriorityTargets is unsupported`);
  }
  if (!commonFilterIsEmpty) {
    throw new Error(`${sourcePath}: non-empty PriorityFilter buff filtering is unsupported`);
  }
  if (source.limitMaxNum && source.maxNum < 0) {
    throw new Error(`${sourcePath}.maxNum: expected a non-negative limit`);
  }
  return {
    kind: 'distanceFromOwner',
    order,
    maxTargets: source.limitMaxNum ? source.maxNum : 128,
  };
}

function compileAnchor(
  rawType: string | null,
  contextKey: string,
  sourcePath: string,
): CompiledSelectorAnchorSource {
  if (rawType === 'ActionOwner' || rawType === 'ActionSource') {
    // 同版本证据表明这两个枚举不读取 context key；投影有意丢弃该残留序列化字段。
    return { kind: rawType === 'ActionOwner' ? 'actionOwner' : 'actionSource' };
  }
  if (rawType === 'ContextTarget' && contextKey !== '') {
    return { kind: 'contextTarget', key: contextKey };
  }
  throw new Error(`${sourcePath}: unsupported selector anchor ${JSON.stringify(rawType)}`);
}

function compileTagQuery(
  source: readonly [string, readonly number[]],
  sourcePath: string,
): TagQuerySource {
  const queryType = projectNativeTagQueryType(source[0], sourcePath);
  return { queryType, tagIds: source[1] };
}
