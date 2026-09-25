import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  NATIVE_GAMEPLAY_TAG_QUERY_NAMES,
  parseTagQuerySource,
  type TagQuerySource,
} from './tagQuery.ts';
import type { BlackboardLevelValues } from './scalar.ts';
import {
  parsePriorityFilterSources,
  parseDistanceValidatorSources,
  parseShuffleTargetSources,
  requireOrdinaryTargetProcessor,
  selectorComponentName,
  type PriorityFilterSource,
  type DistanceValidatorSource,
  type ShuffleTargetSource,
} from './selectorComponents.ts';

export { selectorComponentName } from './selectorComponents.ts';

/** 排除后处理器统一入口；完整目标设置沿用公共解析，不能只验证或复制 key。 */
export function parseExcludeTargetSource(value: unknown, path: string): TargetReferenceSource {
  const processor = requireOrdinaryTargetProcessor(value, path, 'ExcludeTarget', [
    'excludedTargetSettings',
  ]);
  return parseTargetReferenceSource(
    processor.excludedTargetSettings,
    `${path}.excludedTargetSettings`,
  );
}
import {
  readActionTarget,
  readDirectionType,
  readTargetSource,
  readFactionTarget,
  readHitBoxObjectType,
} from './targetEnums.ts';

export interface TargetReferenceSource {
  readonly targetSource: string;
  readonly targetGroupKey: string;
  readonly selectorOwner: string;
  readonly ownerContextKey: string;
  readonly centerType: string;
  readonly centerContextKey: string;
  readonly centerToGround: boolean;
  readonly target: string;
  readonly targetContextKey: string;
  readonly enableAdvancedDirection: boolean;
  readonly selectorDirection: string;
  readonly finderType: string | null;
  /** HitBoxFinder 阵营/对象/存活过滤；目标引用也必须保留，供固定模型严格归约。 */
  readonly finderFactionTarget?: string | null;
  readonly finderTargetObjectType?: string | null;
  readonly finderCheckAlive?: boolean | null;
  readonly finderAutoSetTargetFaction?: boolean | null;
  readonly finderTargetFactionType?: string | number | null;
  readonly finderShape: ShapeFinderSource | null;
  readonly finderProjectileShape?: ColliderShapeSource;
  /** OwnerPartsFinder 对 owner 的部件 Tag 做查询；来源层不解释部件选择结果。 */
  readonly finderOwnerPartsQuery: TagQuerySource | null;
  /** PointFinder 中实际启用的坐标/旋转黑板输入；只保存空间数据流，不解释坐标。 */
  readonly finderPointBlackboardKeys?: readonly string[];
  /** FixedPointFinder 的固定偏移证据；零空间投影可归约坐标，但不能在来源层丢掉。 */
  readonly finderFixedPoint?: FixedPointFinderSource;
  readonly validatorTypes: readonly string[];
  readonly postProcessorTypes: readonly string[];
  readonly priorityFilters: readonly PriorityFilterSource[];
  readonly shuffleTargets: readonly ShuffleTargetSource[];
  readonly distanceValidators: readonly DistanceValidatorSource[];
  readonly finderSpawnedObjectType: string | null;
  readonly validatorTagQueries: ReadonlyArray<readonly [string, readonly number[]]>;
}

export interface SelectorSummarySource {
  readonly finderType: string | null;
  readonly finderFactionTarget: string | null;
  readonly finderTargetObjectType: string | null;
  readonly finderCheckAlive: boolean | null;
  readonly finderAutoSetTargetFaction: boolean | null;
  readonly finderTargetFactionType: string | number | null;
  readonly finderShape: ShapeFinderSource | null;
  readonly finderProjectileShape?: ColliderShapeSource;
  readonly finderOwnerPartsQuery: TagQuerySource | null;
  readonly finderPointBlackboardKeys: readonly string[];
  /** RandomPointFinder 生成的目标点数量；几何在来源层验证，数量留给零空间投影。 */
  readonly finderRandomPointCount: {
    readonly value: number;
    readonly blackboardKey: string | null;
  } | null;
  readonly finderFixedPoint: FixedPointFinderSource | null;
  readonly validatorTypes: readonly string[];
  readonly postProcessorTypes: readonly string[];
  readonly priorityFilters: readonly PriorityFilterSource[];
  readonly shuffleTargets: readonly ShuffleTargetSource[];
  readonly distanceValidators: readonly DistanceValidatorSource[];
  /** TargetContainsValidator 解析的父集合来源；顺序与 validatorData 一致。 */
  readonly targetContainsParents: readonly {
    readonly targetSource: string;
    readonly targetGroupKey: string;
  }[];
  /** ExcludeTarget 后处理器引用的排除集合；顺序与 postProcessorData 一致。 */
  readonly excludeTargets: readonly {
    readonly targetSource: string;
    readonly targetGroupKey: string;
  }[];
}

export interface FixedPointFinderSource {
  readonly positionOffset: readonly [number, number, number];
  readonly rotationOffset: readonly [number, number, number, number];
  readonly snapToNavmesh: boolean;
  readonly sampleRadius: {
    readonly value: number;
    readonly blackboardKey: string | null;
  };
}

export interface SpawnedEntitySelectorIdentitySource {
  readonly spawnedObjectType: string | null;
  readonly tagQueries: Array<readonly [string, readonly number[]]>;
}

export interface ShapeFinderSource extends ColliderShapeSource {
  readonly checkAlive: boolean;
  readonly autoSetTargetFaction: boolean;
  readonly containsUnmarkable: boolean;
  readonly factionTarget: string;
  readonly targetFactionType: string | number;
  readonly limitHeight: boolean;
  readonly maxHeight: number;
  readonly limitAngle: boolean;
  readonly angleKey: string;
  readonly angle: number;
}

/** 原生 ColliderShapeData 的几何参数；不包含候选对象的阵营或类型。 */
export interface ColliderShapeSource {
  readonly shape: string;
  readonly rotationOffset: readonly [number, number, number];
  readonly useExtentKey: boolean;
  readonly extent: readonly [number, number, number];
  readonly extentKeys: readonly [string, string, string];
  readonly useCenterKey: boolean;
  readonly center: readonly [number, number, number];
  readonly centerKeys: readonly [string, string, string];
  readonly height: number;
  readonly heightKey: string;
  readonly radius: number;
  readonly radiusKey: string;
}

const TARGET_FIELDS = new Set([
  'advancedDirection',
  'centerContextKey',
  'centerToGround',
  'centerType',
  'enableAdvancedDirection',
  'ownerContextKey',
  'selectorData',
  'selectorDirection',
  'selectorOwner',
  'target',
  'targetContextKey',
  'targetGroupKey',
  'targetSource',
]);

const KNOWN_FINDERS = new Set([
  'AbilityEntityTargetFinder',
  'AllEnemyFinder',
  'CharacterTeamFinder',
  'FixedPointFinder',
  'GodEntityFinder',
  'HitBoxFinder',
  'InteractiveShapeFinder',
  'InFightEnemyFinder',
  'MainTargetFinder',
  'OwnerSpawnedEntityFinder',
  'OwnerPartsFinder',
  'PointFinder',
  'ProjectileFinder',
  'RandomPointFinder',
  'ShapeFinder',
  'SmartTargetFinder',
  'SnapPointFinder',
  'SourceFinder',
  'TyphoeaArcherySelectedFinder',
]);
const KNOWN_VALIDATORS = new Set([
  'DistanceValidator',
  'ExcludeOwnerValidator',
  'HittableObjectValidator',
  'InScreenValidator',
  'MainCharacterValidator',
  'SkillCastIdValidator',
  'TagValidator',
  'TargetContainsValidator',
]);
const KNOWN_POST_PROCESSORS = new Set([
  'CircularOrderSort',
  'ConvertToPosition',
  'ConvertToSlot',
  'ExcludeTarget',
  'PriorityFilter',
  'ShuffleTarget',
]);

/** 解析完整目标引用，但不在此阶段把它归约为 Endaxis 的 caster、enemy 或 party。 */
export function parseTargetReferenceSource(value: unknown, path: string): TargetReferenceSource {
  const target = requireRecord(value, path);
  requireExactFields(target, TARGET_FIELDS, path);

  const targetSource = readTargetSource(target.targetSource, `${path}.targetSource`);
  const selectorData = target.selectorData;
  const selectorPath = `${path}.selectorData`;
  const summary = parseSelectorSummarySource(
    selectorData,
    selectorPath,
    targetSource === 'InstantSearch',
  );
  const spawnedIdentity = parseSpawnedEntitySelectorIdentitySource(selectorData, selectorPath);

  return {
    targetSource,
    targetGroupKey: requireString(target.targetGroupKey, `${path}.targetGroupKey`),
    selectorOwner: readActionTarget(target.selectorOwner, `${path}.selectorOwner`),
    ownerContextKey: requireString(target.ownerContextKey, `${path}.ownerContextKey`),
    centerType: readActionTarget(target.centerType, `${path}.centerType`),
    centerContextKey: requireString(target.centerContextKey, `${path}.centerContextKey`),
    centerToGround: requireBoolean(target.centerToGround, `${path}.centerToGround`),
    target: readActionTarget(target.target, `${path}.target`),
    targetContextKey: requireString(target.targetContextKey, `${path}.targetContextKey`),
    enableAdvancedDirection: requireBoolean(
      target.enableAdvancedDirection,
      `${path}.enableAdvancedDirection`,
    ),
    selectorDirection: readDirectionType(target.selectorDirection, `${path}.selectorDirection`),
    finderType: summary.finderType,
    ...(summary.finderFactionTarget === null
      ? {}
      : { finderFactionTarget: summary.finderFactionTarget }),
    ...(summary.finderTargetObjectType === null
      ? {}
      : { finderTargetObjectType: summary.finderTargetObjectType }),
    ...(summary.finderCheckAlive === null ? {} : { finderCheckAlive: summary.finderCheckAlive }),
    ...(summary.finderAutoSetTargetFaction === null
      ? {}
      : { finderAutoSetTargetFaction: summary.finderAutoSetTargetFaction }),
    ...(summary.finderTargetFactionType === null
      ? {}
      : { finderTargetFactionType: summary.finderTargetFactionType }),
    finderShape: summary.finderShape,
    ...(summary.finderProjectileShape
      ? { finderProjectileShape: summary.finderProjectileShape }
      : {}),
    finderOwnerPartsQuery: summary.finderOwnerPartsQuery,
    ...(summary.finderPointBlackboardKeys.length === 0
      ? {}
      : { finderPointBlackboardKeys: summary.finderPointBlackboardKeys }),
    ...(summary.finderFixedPoint === null ? {} : { finderFixedPoint: summary.finderFixedPoint }),
    validatorTypes: summary.validatorTypes,
    postProcessorTypes: summary.postProcessorTypes,
    priorityFilters: summary.priorityFilters,
    shuffleTargets: summary.shuffleTargets,
    distanceValidators: summary.distanceValidators,
    finderSpawnedObjectType: spawnedIdentity.spawnedObjectType,
    validatorTagQueries: spawnedIdentity.tagQueries,
  };
}

export function parseSelectorSummarySource(
  value: unknown,
  path: string,
  finderRequired: boolean,
  inheritedBlackboard: BlackboardLevelValues = {},
): SelectorSummarySource {
  const selector = requireRecord(value, path);
  const expectedFields = new Set(['validatorData', 'postProcessorData']);
  if (finderRequired || 'finderData' in selector) expectedFields.add('finderData');
  requireExactFields(selector, expectedFields, path);

  let finderType: string | null = null;
  let finderFactionTarget: string | null = null;
  let finderTargetObjectType: string | null = null;
  let finderCheckAlive: boolean | null = null;
  let finderAutoSetTargetFaction: boolean | null = null;
  let finderTargetFactionType: string | number | null = null;
  let finderShape: ShapeFinderSource | null = null;
  let finderProjectileShape: ColliderShapeSource | undefined;
  let finderOwnerPartsQuery: TagQuerySource | null = null;
  let finderPointBlackboardKeys: string[] = [];
  let finderRandomPointCount: SelectorSummarySource['finderRandomPointCount'] = null;
  let finderFixedPoint: FixedPointFinderSource | null = null;
  // 非搜索来源不会执行 finder，VFS 的显式 null 与旧导出省略字段都表示没有配置。
  // finderRequired 为 true 时仍进入下方拒绝路径，不把空 finder 解释成零个目标。
  if ('finderData' in selector && selector.finderData !== null) {
    const finder = requireRecord(selector.finderData, `${path}.finderData`);
    finderType = selectorComponentName(finder, `${path}.finderData`);
    if (!KNOWN_FINDERS.has(finderType)) {
      throw new Error(`${path}.finderData: unsupported finder ${JSON.stringify(finderType)}`);
    }
    if (
      finderType === 'AllEnemyFinder' ||
      finderType === 'GodEntityFinder' ||
      finderType === 'AbilityEntityTargetFinder' ||
      finderType === 'TyphoeaArcherySelectedFinder'
    ) {
      // 三类 Data 都没有配置字段：前两者分别读取全局 GodEntity 和
      // AbilityEntity 控制器目标；Typhoea 分支复制 BattleManager 的屏幕选中目标集。
      requireExactFields(finder, new Set(['$type']), `${path}.finderData`);
    } else if (finderType === 'FixedPointFinder') {
      finderFixedPoint = parseFixedPointFinderSource(finder, `${path}.finderData`);
    } else if (finderType === 'HitBoxFinder') {
      finderFactionTarget = readFactionTarget(
        finder.factionTarget,
        `${path}.finderData.factionTarget`,
      );
      finderTargetObjectType = readHitBoxObjectType(
        finder.targetObjectType,
        `${path}.finderData.targetObjectType`,
      );
      finderCheckAlive = requireBoolean(finder.checkAlive, `${path}.finderData.checkAlive`);
      finderAutoSetTargetFaction = requireBoolean(
        finder.autoSetTargetFaction,
        `${path}.finderData.autoSetTargetFaction`,
      );
      if (
        typeof finder.targetFactionType !== 'string' &&
        typeof finder.targetFactionType !== 'number'
      ) {
        throw new Error(`${path}.finderData.targetFactionType: expected enum name or number`);
      }
      finderTargetFactionType = finder.targetFactionType;
    } else if (finderType === 'ShapeFinder' || finderType === 'InteractiveShapeFinder') {
      finderShape = parseShapeFinderSource(finder, `${path}.finderData`);
    } else if (finderType === 'ProjectileFinder') {
      requireExactFields(finder, new Set(['$type', 'shapeData']), `${path}.finderData`);
      finderProjectileShape = parseColliderShapeSource(
        finder.shapeData,
        `${path}.finderData.shapeData`,
      );
    } else if (finderType === 'OwnerPartsFinder') {
      requireExactFields(finder, new Set(['$type', 'partQuery']), `${path}.finderData`);
      finderOwnerPartsQuery = parseTagQuerySource(finder.partQuery, `${path}.finderData.partQuery`);
    } else if (finderType === 'PointFinder') {
      requireExactFields(
        finder,
        new Set(['$type', 'positionOffset', 'rotationOffset']),
        `${path}.finderData`,
      );
      finderPointBlackboardKeys = [
        ...parsePointFinderVector(finder.positionOffset, `${path}.finderData.positionOffset`),
        ...parsePointFinderVector(finder.rotationOffset, `${path}.finderData.rotationOffset`),
      ];
    } else if (finderType === 'RandomPointFinder') {
      requireExactFields(
        finder,
        new Set([
          '$type',
          'pointNum',
          'shape',
          'localPlaneRotationEulers',
          'radius',
          'minRadius',
          'angle',
          'useExtraJitter',
          'snapToNavMesh',
          ...('extent2D' in finder ? ['extent2D'] : []),
        ]),
        `${path}.finderData`,
      );
      const parseNumber = (raw: unknown, valuePath: string) => {
        const number = requireRecord(raw, valuePath);
        requireExactFields(
          number,
          new Set(['useBlackboardKey', 'value', 'blackboardKey']),
          valuePath,
        );
        const useBlackboardKey = requireBoolean(
          number.useBlackboardKey,
          `${valuePath}.useBlackboardKey`,
        );
        const blackboardKey = requireString(number.blackboardKey, `${valuePath}.blackboardKey`);
        if (useBlackboardKey && blackboardKey.length === 0)
          throw new Error(`${valuePath}.blackboardKey: expected non-empty selected key`);
        return {
          value: requireNumber(number.value, `${valuePath}.value`),
          blackboardKey: useBlackboardKey ? blackboardKey : null,
        };
      };
      finderRandomPointCount = parseNumber(finder.pointNum, `${path}.finderData.pointNum`);
      if ('extent2D' in finder) {
        // 二维尺寸由另一形状分支消费；本轮仅接入现有 Circle/Sector 的零默认载荷。
        // 点数与已有几何黑板依赖保持原样，不能把生成点数量一起当成空间效果消除。
        if (finder.shape !== 'Circle' && finder.shape !== 'Sector')
          throw new Error(`${path}.finderData.shape: extent2D shape is not projected`);
        const extentPath = `${path}.finderData.extent2D`;
        const extent = requireRecord(finder.extent2D, extentPath);
        requireExactFields(extent, new Set(['x', 'y']), extentPath);
        for (const axis of ['x', 'y'] as const) {
          const component = parseNumber(extent[axis], `${extentPath}.${axis}`);
          if (component.blackboardKey !== null || component.value !== 0)
            throw new Error(`${extentPath}.${axis}: expected inactive zero extent`);
        }
      }
      const eulers = requireRecord(
        finder.localPlaneRotationEulers,
        `${path}.finderData.localPlaneRotationEulers`,
      );
      requireExactFields(
        eulers,
        new Set(['x', 'y', 'z']),
        `${path}.finderData.localPlaneRotationEulers`,
      );
      const geometryNumbers = [
        parseNumber(eulers.x, `${path}.finderData.localPlaneRotationEulers.x`),
        parseNumber(eulers.y, `${path}.finderData.localPlaneRotationEulers.y`),
        parseNumber(eulers.z, `${path}.finderData.localPlaneRotationEulers.z`),
        parseNumber(finder.radius, `${path}.finderData.radius`),
        parseNumber(finder.minRadius, `${path}.finderData.minRadius`),
        parseNumber(finder.angle, `${path}.finderData.angle`),
      ];
      finderPointBlackboardKeys = [finderRandomPointCount, ...geometryNumbers].flatMap(number =>
        number.blackboardKey === null ? [] : [number.blackboardKey],
      );
      requireNonEmptyString(finder.shape, `${path}.finderData.shape`);
      requireBoolean(finder.useExtraJitter, `${path}.finderData.useExtraJitter`);
      requireBoolean(finder.snapToNavMesh, `${path}.finderData.snapToNavMesh`);
    }
  } else if (finderRequired) {
    throw new Error(`${path}.finderData: expected object`);
  }

  const validatorTypes = parseKnownComponents(
    selector.validatorData,
    `${path}.validatorData`,
    KNOWN_VALIDATORS,
    'validators',
  );
  const postProcessorTypes = parseKnownComponents(
    selector.postProcessorData,
    `${path}.postProcessorData`,
    KNOWN_POST_PROCESSORS,
    'processors',
  );
  const priorityFilters = parsePriorityFilterSources(selector, path);
  const shuffleTargets = parseShuffleTargetSources(selector, path);
  const distanceValidators = parseDistanceValidatorSources(selector, path, inheritedBlackboard);
  const targetContainsParents = requireArray(
    selector.validatorData,
    `${path}.validatorData`,
  ).flatMap((rawValidator, index) => {
    const validatorPath = `${path}.validatorData[${index}]`;
    const validator = requireRecord(rawValidator, validatorPath);
    if (selectorComponentName(validator, validatorPath) !== 'TargetContainsValidator') return [];
    requireExactFields(validator, new Set(['$type', 'parentTargetSettings']), validatorPath);
    const parent = parseTargetReferenceSource(
      validator.parentTargetSettings,
      `${validatorPath}.parentTargetSettings`,
    );
    return [{ targetSource: parent.targetSource, targetGroupKey: parent.targetGroupKey }];
  });
  const excludeTargets = requireArray(
    selector.postProcessorData,
    `${path}.postProcessorData`,
  ).flatMap((rawProcessor, index) => {
    const processorPath = `${path}.postProcessorData[${index}]`;
    const processor = requireRecord(rawProcessor, processorPath);
    if (selectorComponentName(processor, processorPath) !== 'ExcludeTarget') return [];
    const excluded = parseExcludeTargetSource(processor, processorPath);
    return [{ targetSource: excluded.targetSource, targetGroupKey: excluded.targetGroupKey }];
  });
  return {
    finderType,
    finderFactionTarget,
    finderTargetObjectType,
    finderCheckAlive,
    finderAutoSetTargetFaction,
    finderTargetFactionType,
    finderShape,
    ...(finderProjectileShape ? { finderProjectileShape } : {}),
    finderOwnerPartsQuery,
    finderPointBlackboardKeys,
    finderRandomPointCount,
    finderFixedPoint,
    validatorTypes,
    postProcessorTypes,
    priorityFilters,
    shuffleTargets,
    distanceValidators,
    targetContainsParents,
    excludeTargets,
  };
}

function parseFixedPointFinderSource(
  finder: Record<string, unknown>,
  path: string,
): FixedPointFinderSource {
  requireExactFields(
    finder,
    new Set(['$type', 'positionOffset', 'rotationOffset', 'snapToNavmesh', 'sampleRadius']),
    path,
  );
  const position = requireRecord(finder.positionOffset, `${path}.positionOffset`);
  requireExactFields(position, new Set(['x', 'y', 'z']), `${path}.positionOffset`);
  const rotation = requireRecord(finder.rotationOffset, `${path}.rotationOffset`);
  requireExactFields(rotation, new Set(['x', 'y', 'z', 'w']), `${path}.rotationOffset`);
  const radius = requireRecord(finder.sampleRadius, `${path}.sampleRadius`);
  requireExactFields(
    radius,
    new Set(['useBlackboardKey', 'value', 'blackboardKey']),
    `${path}.sampleRadius`,
  );
  const useRadiusBlackboard = requireBoolean(
    radius.useBlackboardKey,
    `${path}.sampleRadius.useBlackboardKey`,
  );
  const radiusKey = requireString(radius.blackboardKey, `${path}.sampleRadius.blackboardKey`);
  if (useRadiusBlackboard && radiusKey.length === 0) {
    throw new Error(`${path}.sampleRadius.blackboardKey: expected non-empty string`);
  }
  return {
    positionOffset: [
      requireNumber(position.x, `${path}.positionOffset.x`),
      requireNumber(position.y, `${path}.positionOffset.y`),
      requireNumber(position.z, `${path}.positionOffset.z`),
    ],
    rotationOffset: [
      requireNumber(rotation.x, `${path}.rotationOffset.x`),
      requireNumber(rotation.y, `${path}.rotationOffset.y`),
      requireNumber(rotation.z, `${path}.rotationOffset.z`),
      requireNumber(rotation.w, `${path}.rotationOffset.w`),
    ],
    snapToNavmesh: requireBoolean(finder.snapToNavmesh, `${path}.snapToNavmesh`),
    sampleRadius: {
      value: requireNumber(radius.value, `${path}.sampleRadius.value`),
      blackboardKey: useRadiusBlackboard ? radiusKey : null,
    },
  };
}

function parsePointFinderVector(value: unknown, path: string): string[] {
  const vector = requireRecord(value, path);
  requireExactFields(vector, new Set(['x', 'y', 'z']), path);
  const blackboardKeys: string[] = [];
  for (const axis of ['x', 'y', 'z'] as const) {
    const componentPath = `${path}.${axis}`;
    const component = requireRecord(vector[axis], componentPath);
    requireExactFields(
      component,
      new Set(['useBlackboardKey', 'value', 'blackboardKey']),
      componentPath,
    );
    const useBlackboardKey = requireBoolean(
      component.useBlackboardKey,
      `${componentPath}.useBlackboardKey`,
    );
    requireNumber(component.value, `${componentPath}.value`);
    const blackboardKey = requireString(component.blackboardKey, `${componentPath}.blackboardKey`);
    if (useBlackboardKey && blackboardKey.length === 0)
      throw new Error(`${componentPath}.blackboardKey: expected non-empty string`);
    if (useBlackboardKey) blackboardKeys.push(blackboardKey);
  }
  return blackboardKeys;
}

function parseShapeFinderSource(finder: Record<string, unknown>, path: string): ShapeFinderSource {
  const interactive = selectorComponentName(finder, path) === 'InteractiveShapeFinder';
  requireExactFields(
    finder,
    new Set([
      '$type',
      'checkAlive',
      'autoSetTargetFaction',
      'containsUnMarkable',
      'factionTarget',
      'targetFactionType',
      'shapeData',
      'limitHeight',
      'maxHeight',
      'limitAngle',
      'angleKey',
      'angle',
      ...(interactive ? ['checkIntUnSelectableTag'] : []),
    ]),
    path,
  );
  const targetFactionType = finder.targetFactionType;
  if (interactive)
    requireBoolean(finder.checkIntUnSelectableTag, `${path}.checkIntUnSelectableTag`);
  if (typeof targetFactionType !== 'string' && typeof targetFactionType !== 'number') {
    throw new Error(`${path}.targetFactionType: expected enum name or number`);
  }
  return {
    checkAlive: requireBoolean(finder.checkAlive, `${path}.checkAlive`),
    autoSetTargetFaction: requireBoolean(
      finder.autoSetTargetFaction,
      `${path}.autoSetTargetFaction`,
    ),
    containsUnmarkable: requireBoolean(finder.containsUnMarkable, `${path}.containsUnMarkable`),
    factionTarget: readFactionTarget(finder.factionTarget, `${path}.factionTarget`),
    targetFactionType,
    ...parseColliderShapeSource(finder.shapeData, `${path}.shapeData`),
    limitHeight: requireBoolean(finder.limitHeight, `${path}.limitHeight`),
    maxHeight: requireNumber(finder.maxHeight, `${path}.maxHeight`),
    limitAngle: requireBoolean(finder.limitAngle, `${path}.limitAngle`),
    angleKey: requireString(finder.angleKey, `${path}.angleKey`),
    angle: requireNumber(finder.angle, `${path}.angle`),
  };
}

function parseColliderShapeSource(value: unknown, shapePath: string): ColliderShapeSource {
  const shape = requireRecord(value, shapePath);
  requireExactFields(
    shape,
    new Set([
      '_shape',
      '_rotationOffset',
      '_useExtentKey',
      '_extent',
      '_extentXKey',
      '_extentYKey',
      '_extentZKey',
      '_useCenterKey',
      '_center',
      '_centerXKey',
      '_centerYKey',
      '_centerZKey',
      '_heightKey',
      '_height',
      '_radiusKey',
      '_radius',
    ]),
    shapePath,
  );
  return {
    shape: requireNonEmptyString(shape._shape, `${shapePath}._shape`),
    rotationOffset: parseVector3(shape._rotationOffset, `${shapePath}._rotationOffset`),
    useExtentKey: requireBoolean(shape._useExtentKey, `${shapePath}._useExtentKey`),
    extent: parseVector3(shape._extent, `${shapePath}._extent`),
    extentKeys: [
      requireString(shape._extentXKey, `${shapePath}._extentXKey`),
      requireString(shape._extentYKey, `${shapePath}._extentYKey`),
      requireString(shape._extentZKey, `${shapePath}._extentZKey`),
    ],
    useCenterKey: requireBoolean(shape._useCenterKey, `${shapePath}._useCenterKey`),
    center: parseVector3(shape._center, `${shapePath}._center`),
    centerKeys: [
      requireString(shape._centerXKey, `${shapePath}._centerXKey`),
      requireString(shape._centerYKey, `${shapePath}._centerYKey`),
      requireString(shape._centerZKey, `${shapePath}._centerZKey`),
    ],
    height: requireNumber(shape._height, `${shapePath}._height`),
    heightKey: requireString(shape._heightKey, `${shapePath}._heightKey`),
    radius: requireNumber(shape._radius, `${shapePath}._radius`),
    radiusKey: requireString(shape._radiusKey, `${shapePath}._radiusKey`),
  };
}

function parseVector3(value: unknown, path: string): readonly [number, number, number] {
  const vector = requireRecord(value, path);
  requireExactFields(vector, new Set(['x', 'y', 'z']), path);
  return [
    requireNumber(vector.x, `${path}.x`),
    requireNumber(vector.y, `${path}.y`),
    requireNumber(vector.z, `${path}.z`),
  ];
}

function parseKnownComponents(
  value: unknown,
  path: string,
  knownTypes: ReadonlySet<string>,
  label: 'validators' | 'processors',
): string[] {
  const types = requireArray(value, path).map((item, index) =>
    selectorComponentName(item, `${path}[${index}]`),
  );
  const unknown = [...new Set(types.filter(type => !knownTypes.has(type)))].sort();
  if (unknown.length > 0) {
    throw new Error(`${path}: unsupported ${label} ${JSON.stringify(unknown)}`);
  }
  return types;
}

export function parseSpawnedEntitySelectorIdentitySource(
  value: unknown,
  path: string,
): SpawnedEntitySelectorIdentitySource {
  const selector = requireRecord(value, path);
  let spawnedObjectType: string | null = null;
  if ('finderData' in selector && selector.finderData !== null) {
    const finder = requireRecord(selector.finderData, `${path}.finderData`);
    if (selectorComponentName(finder, `${path}.finderData`) === 'OwnerSpawnedEntityFinder') {
      requireExactFields(finder, new Set(['$type', 'spawnedObjectType']), `${path}.finderData`);
      const rawObjectType = finder.spawnedObjectType;
      if (rawObjectType === 0) {
        // ObjectType 没有命名零成员；反编译证据表明零掩码不会命中子实体。
        spawnedObjectType = '0';
      } else if (rawObjectType === 512) {
        spawnedObjectType = 'AbilityEntity';
      } else if (rawObjectType === -1) {
        spawnedObjectType = 'All';
      } else if (typeof rawObjectType === 'string' && rawObjectType.length > 0) {
        spawnedObjectType = rawObjectType;
      } else {
        throw new Error(
          `${path}.finderData.spawnedObjectType: expected proven ObjectType name or native value`,
        );
      }
    }
  }

  const tagQueries: Array<readonly [string, readonly number[]]> = [];
  requireArray(selector.validatorData, `${path}.validatorData`).forEach((rawValidator, index) => {
    const validatorPath = `${path}.validatorData[${index}]`;
    const validator = requireRecord(rawValidator, validatorPath);
    if (selectorComponentName(validator, validatorPath) !== 'TagValidator') return;
    if (Object.keys(validator).length === 1 && '$type' in validator) return;
    requireExactFields(validator, new Set(['$type', 'query']), validatorPath);
    const queryPath = `${validatorPath}.query`;
    const query = requireRecord(validator.query, queryPath);
    requireExactFields(query, new Set(['queryType', 'tags']), queryPath);
    const rawQueryType = query.queryType;
    let queryType: string;
    if (typeof rawQueryType === 'number' && Number.isInteger(rawQueryType)) {
      const nativeQueryType = NATIVE_GAMEPLAY_TAG_QUERY_NAMES[rawQueryType];
      if (!nativeQueryType)
        throw new Error(
          `${queryPath}.queryType: unsupported native value ${JSON.stringify(rawQueryType)}`,
        );
      queryType = nativeQueryType;
    } else queryType = requireString(rawQueryType, `${queryPath}.queryType`);
    if (!(NATIVE_GAMEPLAY_TAG_QUERY_NAMES as readonly string[]).includes(queryType)) {
      throw new Error(`${queryPath}.queryType: unsupported value ${JSON.stringify(queryType)}`);
    }
    const tags = requireArray(query.tags, `${queryPath}.tags`).map((rawTag, tagIndex) => {
      const tagPath = `${queryPath}.tags[${tagIndex}]`;
      const tag = requireRecord(rawTag, tagPath);
      requireExactFields(tag, new Set(['tagId']), tagPath);
      return requireInteger(tag.tagId, `${tagPath}.tagId`);
    });
    tagQueries.push([queryType, tags]);
  });
  return { spawnedObjectType, tagQueries };
}
