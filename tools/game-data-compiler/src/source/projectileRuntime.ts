import {
  requireArray,
  requireBoolean,
  requireInteger,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  NATIVE_GAMEPLAY_TAG_QUERY_NAMES,
  projectNativeTagQueryType,
  type TagQuerySource,
} from './tagQuery.ts';
import { parseBlackboardDataPairs, type DeclaredBlackboardValueSource } from './blackboard.ts';
import { parseActiveSkillTypesSource } from './activeSkillTypes.ts';
import { parseAbilitySystemReferences } from './abilitySystemReferences.ts';
/**
 * 完整 AbilitySystem 的黑板接收者。ProjectileComponent 尚未解码的末段只有特效/声音配置，
 * 不提供技能或 Buff 入口；它的战斗数值字段仍由原始 value 参与键读取检查。
 * 非空模式和 RID 条件尚未在这里追踪，不能宣称该资源的引用已经闭合。
 */
export function parseProjectileBlackboardReceiverSource(value: unknown, path: string) {
  const root = requireRecord(value, path);
  const boundary = root.abilitySystemBoundary;
  if (
    boundary === undefined ||
    requireRecord(boundary, path + '.abilitySystemBoundary').decodeStatus !== 'complete' ||
    requireRecord(boundary, path + '.abilitySystemBoundary').remainingLength !== 0
  )
    return undefined;
  const result = parseAbilitySystemReferences(root.abilitySystem, path + '.abilitySystem');
  return result.complete ? { value, references: result.references } : undefined;
}
export interface ProjectileRuntimeSource {
  /** Missing means the source exporter did not preserve the owning AbilitySystem bundle. */
  readonly activeSkills?: ReturnType<typeof parseActiveSkillTypesSource>;
  readonly projectileId: string;
  readonly decodeStatus: 'partial' | 'complete';
  /** 新版 VFS 严格解码直接恢复的 Projectile AbilitySystem 实体黑板；缺少表示尚未解出。 */
  readonly entityBlackboard?: readonly DeclaredBlackboardValueSource[];
  readonly hitOnReach: boolean;
  readonly hasCollisionShape: boolean;
  readonly targetFilter: {
    readonly checkAlive: boolean;
    readonly autoSetTargetFaction: boolean;
    readonly factionTarget: number;
    readonly targetFactionType: number;
    readonly filterObjectType: boolean;
    readonly objectType: number;
    readonly filterSlot: boolean;
    readonly filterGameplayTag: boolean;
    readonly gameplayTagQuery: TagQuerySource | null;
  };
}
/** 读取 ProjectileComponentData partial 解码中已经命名、且用于回调身份与命中目标筛选的字段。 */
export function parseProjectileRuntimeSource(
  value: unknown,
  path: string,
): ProjectileRuntimeSource {
  const root = requireRecord(value, path);
  if (root.$decoded !== true || root.layout !== 'Beyond.Gameplay.Core.ProjectileComponentData')
    throw new Error(`${path}: expected decoded ProjectileComponentData`);
  if (root.decodeStatus !== 'partial' && root.decodeStatus !== 'complete')
    throw new Error(`${path}.decodeStatus: expected decoded component`);
  const targetFilter = requireRecord(root.targetFilter, `${path}.targetFilter`);
  const factionTarget = requireRecord(
    targetFilter.factionTarget,
    `${path}.targetFilter.factionTarget`,
  );
  const targetFactionType = requireRecord(
    targetFilter.targetFactionType,
    `${path}.targetFilter.targetFactionType`,
  );
  const objectType = requireRecord(targetFilter.objectType, `${path}.targetFilter.objectType`);
  const filterGameplayTag = requireBoolean(
    targetFilter.filterGameplayTag,
    `${path}.targetFilter.filterGameplayTag`,
  );
  return {
    projectileId: requireNonEmptyString(root.id, `${path}.id`),
    ...(root.abilitySystem === undefined
      ? {}
      : {
          activeSkills: parseActiveSkillTypesSource(
            requireRecord(root.abilitySystem, `${path}.abilitySystem`).skillDataBundle,
            `${path}.abilitySystem.skillDataBundle`,
          ),
        }),
    decodeStatus: root.decodeStatus,
    ...(root.entityBlackboard === undefined
      ? {}
      : {
          entityBlackboard: parseBlackboardDataPairs(
            requireArray(root.entityBlackboard, `${path}.entityBlackboard`),
            `${path}.entityBlackboard`,
          ),
        }),

    hitOnReach: requireBoolean(root.hitOnReach, `${path}.hitOnReach`),
    hasCollisionShape:
      requireInteger(
        requireRecord(
          requireRecord(root.colliderShapeData, `${path}.colliderShapeData`).shapeType,
          `${path}.colliderShapeData.shapeType`,
        ).value,
        `${path}.colliderShapeData.shapeType.value`,
      ) !== 0,

    targetFilter: {
      checkAlive: requireBoolean(targetFilter.checkAlive, `${path}.targetFilter.checkAlive`),
      autoSetTargetFaction: requireBoolean(
        targetFilter.autoSetTargetFaction,
        `${path}.targetFilter.autoSetTargetFaction`,
      ),
      factionTarget: requireInteger(
        factionTarget.value,
        `${path}.targetFilter.factionTarget.value`,
      ),
      targetFactionType: requireInteger(
        targetFactionType.value,
        `${path}.targetFilter.targetFactionType.value`,
      ),
      filterObjectType: requireBoolean(
        targetFilter.filterObjectType,
        `${path}.targetFilter.filterObjectType`,
      ),
      objectType: requireInteger(objectType.value, `${path}.targetFilter.objectType.value`),
      filterSlot: requireBoolean(targetFilter.filterSlot, `${path}.targetFilter.filterSlot`),
      filterGameplayTag,
      gameplayTagQuery: filterGameplayTag
        ? parseDecodedProjectileTagQuery(targetFilter.tagQuery, `${path}.targetFilter.tagQuery`)
        : null,
    },
  };
}
/** ProjectileData 的二进制解码器保留枚举数值和标签哈希包装，形状不同于动作 JSON。 */
function parseDecodedProjectileTagQuery(value: unknown, path: string): TagQuerySource {
  const query = requireRecord(value, path);
  const rawType = requireRecord(query.queryType, `${path}.queryType`);
  const numeric = requireInteger(rawType.value, `${path}.queryType.value`);
  const expectedName = NATIVE_GAMEPLAY_TAG_QUERY_NAMES[numeric];
  if (expectedName === undefined)
    throw new Error(`${path}.queryType.value: unsupported value ${numeric}`);
  const queryType = projectNativeTagQueryType(numeric, `${path}.queryType.value`);
  if (requireString(rawType.name, `${path}.queryType.name`) !== expectedName)
    throw new Error(`${path}.queryType: value/name mismatch`);
  const tagIds = requireArray(query.tags, `${path}.tags`).map((entry, index) => {
    const tag = requireRecord(entry, `${path}.tags[${index}]`);
    const wrappedId = requireRecord(tag.tagId, `${path}.tags[${index}].tagId`);
    const id = requireInteger(wrappedId.value, `${path}.tags[${index}].tagId.value`);
    if (id < -0x80000000 || id > 0x7fffffff)
      throw new Error(`${path}.tags[${index}].tagId.value: expected signed 32-bit integer`);
    return id;
  });
  return { queryType, tagIds };
}
