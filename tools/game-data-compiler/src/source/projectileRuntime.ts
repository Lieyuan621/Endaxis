import {
  requireArray,
  requireBoolean,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  NATIVE_GAMEPLAY_TAG_QUERY_NAMES,
  projectNativeTagQueryType,
  type TagQuerySource,
} from './tagQuery.ts';
import { parseScalarSource, type ScalarSource } from './scalar.ts';
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
  readonly finishDuration: number;
  /** 保留 BlackboardDouble 身份；零空间投影可以忽略距离阈值，但审计不能丢掉来源键。 */
  readonly finishDistance: ScalarSource;
  readonly finishOnReach: boolean;
  readonly finishOnBlock?: boolean;
  /** 原生普通更新中，将 Reach 延后到碰撞之后；不能仅由“第几帧”推断顺序。 */
  readonly useHitBlockReachOrder: boolean;
  readonly hitOnReach: boolean;
  readonly allowHitSameTarget: boolean;
  readonly maxHitCount: number;
  readonly collisionDetectTiming: number;
  readonly hitAndBlockDetectDelayTime: number;
  readonly hitAndBlockDetectDelayDistance: number;
  readonly keepMoveOnReach: boolean;
  readonly canTraceTargetAfterReach: boolean;
  readonly colliderShape: {
    readonly shapeType: number;
    readonly radius: number;
    readonly extent: readonly [number, number, number];
    readonly ring?: {
      readonly initialOuterRadius: number;
      readonly initialInnerRadius: number;
      readonly outerRadiusIncreaseSpeed: number;
      readonly innerRadiusIncreaseSpeed: number;
      readonly height: number;
      readonly isSector: boolean;
      readonly sectorDirection: number;
      readonly sectorAngle: number;
    } | null;
  } | null;
  readonly blockLayerDef: {
    readonly value: -1 | 0 | 1;
    readonly name: 'Custom' | 'Nothing' | 'WallAndGround';
  } | null;
  /** 自定义阻挡层的原生 Unity 掩码，仅在 blockLayerDef=Custom 时使用。 */
  readonly blockLayerMask?: number;
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
  readonly presetPointKeys: readonly string[];
  readonly useSegmentMove: boolean;
  /** move mode id -> ProjectileMoveType numeric value; missing partial tail entries stay absent. */
  readonly moveModeTypes: ReadonlyMap<string, number>;
  readonly moveSegments: readonly {
    readonly startPointKey: string;
    readonly moveModeId: string;
    readonly endPointKey: string;
    readonly earlyNextByDuration: boolean;
    readonly segmentDuration: number;
    readonly skipHitAndBlockDetection: boolean;
  }[];
}

/** 读取 ProjectileComponentData partial 解码中已经命名、且足以审计首帧投影的字段。 */
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
  const colliderShape =
    root.colliderShapeData === undefined
      ? null
      : requireRecord(root.colliderShapeData, `${path}.colliderShapeData`);
  const shapeType =
    colliderShape === null
      ? null
      : requireRecord(colliderShape.shapeType, `${path}.colliderShapeData.shapeType`);
  const blockLayerDef =
    root.blockLayerDef === undefined
      ? null
      : requireRecord(root.blockLayerDef, `${path}.blockLayerDef`);
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
  const segments = requireArray(root.moveSegments, `${path}.moveSegments`).map((entry, index) => {
    const segmentPath = `${path}.moveSegments[${index}]`;
    const segment = requireRecord(entry, segmentPath);
    return {
      startPointKey: requireNonEmptyString(segment.startPointKey, `${segmentPath}.startPointKey`),
      moveModeId: requireNonEmptyString(segment.moveModeId, `${segmentPath}.moveModeId`),
      endPointKey: requireNonEmptyString(segment.endPointKey, `${segmentPath}.endPointKey`),
      earlyNextByDuration: requireBoolean(
        segment.earlyNextByDuration,
        `${segmentPath}.earlyNextByDuration`,
      ),
      segmentDuration: parseDirectBlackboardDouble(
        segment.segmentDuration,
        `${segmentPath}.segmentDuration`,
      ),
      skipHitAndBlockDetection: requireBoolean(
        segment.skipHitAndBlockDetection,
        `${segmentPath}.skipHitAndBlockDetection`,
      ),
    };
  });
  const moveModeTypes = parseProjectileMoveModeTypes(root.tail, `${path}.tail`);
  return {
    projectileId: requireNonEmptyString(root.id, `${path}.id`),
    useHitBlockReachOrder: requireBoolean(
      root.useHitBlockReachOrder,
      `${path}.useHitBlockReachOrder`,
    ),
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
    finishDuration: parseDirectBlackboardDouble(root.finishDuration, `${path}.finishDuration`),
    finishDistance: parseScalarSource(root.finishDistance, `${path}.finishDistance`, {}),
    finishOnReach: requireBoolean(root.finishOnReach, `${path}.finishOnReach`),
    ...(root.finishOnBlock === undefined
      ? {}
      : { finishOnBlock: requireBoolean(root.finishOnBlock, `${path}.finishOnBlock`) }),
    hitOnReach: requireBoolean(root.hitOnReach, `${path}.hitOnReach`),
    allowHitSameTarget: requireBoolean(root.allowHitSameTarget, `${path}.allowHitSameTarget`),
    maxHitCount: requireInteger(
      requireRecord(root.maxHitCount, `${path}.maxHitCount`).valueIntCandidate,
      `${path}.maxHitCount.valueIntCandidate`,
    ),
    collisionDetectTiming: requireInteger(
      requireRecord(root.collisionDetectTiming, `${path}.collisionDetectTiming`).value,
      `${path}.collisionDetectTiming.value`,
    ),
    hitAndBlockDetectDelayTime: parseDirectBlackboardDouble(
      root.hitAndBlockDetectDelayTime,
      `${path}.hitAndBlockDetectDelayTime`,
    ),
    hitAndBlockDetectDelayDistance: parseDirectBlackboardDouble(
      root.hitAndBlockDetectDelayDistance,
      `${path}.hitAndBlockDetectDelayDistance`,
    ),
    keepMoveOnReach: requireBoolean(root.keepMoveOnReach, `${path}.keepMoveOnReach`),
    canTraceTargetAfterReach: requireBoolean(
      root.canTraceTargetAfterReach,
      `${path}.canTraceTargetAfterReach`,
    ),
    colliderShape:
      colliderShape === null || shapeType === null
        ? null
        : {
            shapeType: requireInteger(shapeType.value, `${path}.colliderShapeData.shapeType.value`),
            radius: parseDirectBlackboardDouble(
              colliderShape.radius,
              `${path}.colliderShapeData.radius`,
            ),
            extent: parseDirectBlackboardVector3(
              colliderShape.extent,
              `${path}.colliderShapeData.extent`,
            ),
            ring:
              shapeType.value === 3
                ? {
                    initialOuterRadius: parseDirectBlackboardDouble(
                      colliderShape.initOuterRadius,
                      `${path}.colliderShapeData.initOuterRadius`,
                    ),
                    initialInnerRadius: parseDirectBlackboardDouble(
                      colliderShape.initInnerRadius,
                      `${path}.colliderShapeData.initInnerRadius`,
                    ),
                    outerRadiusIncreaseSpeed: parseDirectBlackboardDouble(
                      colliderShape.outerRadiusIncreaseSpeed,
                      `${path}.colliderShapeData.outerRadiusIncreaseSpeed`,
                    ),
                    innerRadiusIncreaseSpeed: parseDirectBlackboardDouble(
                      colliderShape.innerRadiusIncreaseSpeed,
                      `${path}.colliderShapeData.innerRadiusIncreaseSpeed`,
                    ),
                    height: parseDirectBlackboardDouble(
                      colliderShape.height,
                      `${path}.colliderShapeData.height`,
                    ),
                    isSector: requireBoolean(
                      colliderShape.isSector,
                      `${path}.colliderShapeData.isSector`,
                    ),
                    sectorDirection: requireInteger(
                      requireRecord(
                        colliderShape.sectorDirection,
                        `${path}.colliderShapeData.sectorDirection`,
                      ).value,
                      `${path}.colliderShapeData.sectorDirection.value`,
                    ),
                    sectorAngle: parseDirectBlackboardDouble(
                      colliderShape.sectorAngle,
                      `${path}.colliderShapeData.sectorAngle`,
                    ),
                  }
                : null,
          },
    blockLayerDef: parseProjectileBlockLayer(blockLayerDef, `${path}.blockLayerDef`),
    ...(root.blockLayer === undefined
      ? {}
      : {
          blockLayerMask: requireInteger(
            requireRecord(root.blockLayer, `${path}.blockLayer`).value,
            `${path}.blockLayer.value`,
          ),
        }),
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
    presetPointKeys: requireArray(root.presetPointKeys, `${path}.presetPointKeys`).map(
      (entry, index) => requireNonEmptyString(entry, `${path}.presetPointKeys[${index}]`),
    ),
    useSegmentMove: requireBoolean(root.useSegmentMove, `${path}.useSegmentMove`),
    moveModeTypes,
    moveSegments: segments,
  };
}

function parseProjectileMoveModeTypes(value: unknown, path: string): ReadonlyMap<string, number> {
  if (value === undefined) return new Map();
  const tail = requireRecord(value, path);
  if (tail.moveModeDict === undefined) return new Map();
  const dictionary = requireRecord(tail.moveModeDict, `${path}.moveModeDict`);
  const values = requireArray(dictionary.values, `${path}.moveModeDict.values`);
  const result = new Map<string, number>();
  values.forEach((entry, index) => {
    const entryPath = `${path}.moveModeDict.values[${index}]`;
    const mode = requireRecord(entry, entryPath);
    const id = requireNonEmptyString(mode.key, `${entryPath}.key`);
    const moveType = requireInteger(
      requireRecord(mode.moveType, `${entryPath}.moveType`).value,
      `${entryPath}.moveType.value`,
    );
    if (result.has(id))
      throw new Error(`${entryPath}.key: duplicate move mode ${JSON.stringify(id)}`);
    result.set(id, moveType);
  });
  return result;
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

function parseProjectileBlockLayer(
  value: Record<string, unknown> | null,
  path: string,
): ProjectileRuntimeSource['blockLayerDef'] {
  if (value === null) return null;
  const numeric = requireInteger(value.value, `${path}.value`);
  const names = {
    [-1]: 'Custom',
    0: 'Nothing',
    1: 'WallAndGround',
  } as const;
  const name = names[numeric as keyof typeof names];
  if (name === undefined) throw new Error(`${path}.value: unsupported value ${numeric}`);
  // 1.4.4 机器码按 value 分支；VFS 的 name 是非权威导出标签。当前全量样本中绝大多数
  // name 仍沿用旧的偏移枚举（例如 value=1/name=Nothing），因此只校验它是已知标签，
  // 正式 IR 始终写入由数值恢复的规范名称。
  if (value.name !== undefined) {
    const exportedName = requireString(value.name, `${path}.name`);
    if (!['', 'Custom', 'Nothing', 'WallAndGround'].includes(exportedName))
      throw new Error(`${path}.name: unsupported value ${JSON.stringify(exportedName)}`);
  }
  return { value: numeric as -1 | 0 | 1, name };
}

function parseDirectBlackboardDouble(value: unknown, path: string): number {
  const wrapper = requireRecord(value, path);
  if (wrapper.useBlackboardKey !== false)
    throw new Error(`${path}: blackboard-driven scalar is unsupported`);
  // BlackboardDouble 的开关为 false 时读取常量 value；导出数据仍可能保留一个不会被读取的
  // blackboardKey。不能仅凭这个残留字符串把常量误判成动态参数。
  requireString(wrapper.blackboardKey, `${path}.blackboardKey`);
  const result = requireNumber(wrapper.value, `${path}.value`);
  if (!Number.isFinite(result)) throw new Error(`${path}.value: expected finite number`);
  return result;
}

function parseDirectBlackboardVector3(
  value: unknown,
  path: string,
): readonly [number, number, number] {
  const vector = requireRecord(value, path);
  return [
    parseDirectBlackboardDouble(vector.x, `${path}.x`),
    parseDirectBlackboardDouble(vector.y, `${path}.y`),
    parseDirectBlackboardDouble(vector.z, `${path}.z`),
  ];
}
