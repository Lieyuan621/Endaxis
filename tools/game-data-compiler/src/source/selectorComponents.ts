import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  parseBuffFindSettingsSource,
  readBuffStackNumType,
  type BuffFindSettingsSource,
} from './buffFindSettings.ts';
import {
  parseIntegerScalarSource,
  parseScalarSource,
  type IntegerScalarSource,
  type ScalarSource,
  type BlackboardLevelValues,
} from './scalar.ts';

export interface PriorityBuffFilterSource extends BuffFindSettingsSource {
  readonly stackCountType: string;
}

/** 普通 Targets 的 PriorityFilter 载荷；不代表 HittableTargets 或每种排序已能执行。 */
export interface PriorityFilterSource {
  readonly filterType: string;
  readonly onlyReserveMaxPriorityTargets: boolean;
  readonly limitMaxNum: boolean;
  readonly maxNum: number;
  readonly buffFilter: PriorityBuffFilterSource;
}

export interface ShuffleTargetSource {
  readonly targetNumLimit: IntegerScalarSource;
}

export interface DistanceValidatorSource {
  readonly threshold: ScalarSource;
  readonly compareType: string;
  readonly clampToXZ: boolean;
}

/** 读取 Selector 嵌套类型名，例如 `...Selector+HitBoxFinder+Data`。 */
export function selectorComponentName(value: unknown, path: string): string {
  const item = requireRecord(value, path);
  const typeName = requireString(item.$type, `${path}.$type`);
  // Unity RID 使用 Selector+Finder+Data，VFS MemoryPack 使用 Selector.Finder.Data。
  const parts = (typeName.split(',', 1)[0] ?? '').split(/[.+]/);
  const componentName = parts.at(-2) ?? '';
  const dataTypeName = parts.at(-1) ?? '';
  if (
    parts.length < 3 ||
    parts.at(-3) !== 'Selector' ||
    !componentName ||
    (dataTypeName !== 'Data' && dataTypeName !== `${componentName}Data`)
  ) {
    throw new Error(`${path}.$type: unsupported selector type ${JSON.stringify(typeName)}`);
  }
  return componentName;
}

/**
 * 严格读取所有 PriorityFilter。排序枚举、数量限制和 Buff 筛选必须一起保存；
 * 只读取 maxNum 会让不同原生过滤器在公共 IR 中错误地“看起来一样”。
 */
export function parsePriorityFilterSources(value: unknown, path: string): PriorityFilterSource[] {
  return matchingComponents(value, path, 'PriorityFilter').map(({ component, path: filterPath }) =>
    parsePriorityFilterSource(component, filterPath),
  );
}

/** 所有识别入口共用此解析；旧版隐式 Targets 与新版显式 Targets 使用同一来源结构。 */
export function parsePriorityFilterSource(
  value: unknown,
  filterPath: string,
): PriorityFilterSource {
  const processor = requireOrdinaryTargetProcessor(value, filterPath, 'PriorityFilter', [
    'filterType',
    'onlyReserveMaxPriorityTargets',
    'limitMaxNum',
    'maxNum',
    'buffFilterSettings',
  ]);
  const rawBuffFilter = requireRecord(
    processor.buffFilterSettings,
    `${filterPath}.buffFilterSettings`,
  );
  requireExactFields(
    rawBuffFilter,
    new Set(['buffSettings', 'buffStackNumType']),
    `${filterPath}.buffFilterSettings`,
  );
  const buffSettings = parseBuffFindSettingsSource(
    rawBuffFilter.buffSettings,
    `${filterPath}.buffFilterSettings.buffSettings`,
  );
  // 保留 PriorityFilter 原有的非空 ID 支持边界；公共来源解析不统一删除空占位。
  buffSettings.buffIds.forEach((id, index) =>
    requireNonEmptyString(id, `${filterPath}.buffFilterSettings.buffSettings.buffIdList[${index}]`),
  );
  return {
    filterType: requireNonEmptyString(processor.filterType, `${filterPath}.filterType`),
    onlyReserveMaxPriorityTargets: requireBoolean(
      processor.onlyReserveMaxPriorityTargets,
      `${filterPath}.onlyReserveMaxPriorityTargets`,
    ),
    limitMaxNum: requireBoolean(processor.limitMaxNum, `${filterPath}.limitMaxNum`),
    maxNum: requireInteger(processor.maxNum, `${filterPath}.maxNum`),
    buffFilter: {
      ...buffSettings,
      stackCountType: readBuffStackNumType(
        rawBuffFilter.buffStackNumType,
        `${filterPath}.buffFilterSettings.buffStackNumType`,
      ),
    },
  };
}

/** 严格读取 ShuffleTarget；随机算法属于执行层，这里只保存原生 BlackboardInt 限量值。 */
export function parseShuffleTargetSources(value: unknown, path: string): ShuffleTargetSource[] {
  return matchingComponents(value, path, 'ShuffleTarget').map(
    ({ component: processor, path: shufflePath }) => {
      requireOrdinaryTargetProcessor(processor, shufflePath, 'ShuffleTarget', ['targetNumLimit']);
      return {
        targetNumLimit: parseIntegerScalarSource(
          processor.targetNumLimit,
          `${shufflePath}.targetNumLimit`,
        ),
      };
    },
  );
}

/** 完整保存 DistanceValidator，零距离投影只能在 compiler 层依据比较式决定。 */
export function parseDistanceValidatorSources(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues = {},
): DistanceValidatorSource[] {
  const selector = requireRecord(value, path);
  return requireArray(selector.validatorData, `${path}.validatorData`).flatMap(
    (rawValidator, index) => {
      const validatorPath = `${path}.validatorData[${index}]`;
      const validator = requireRecord(rawValidator, validatorPath);
      if (selectorComponentName(validator, validatorPath) !== 'DistanceValidator') return [];
      requireExactFields(
        validator,
        new Set(['$type', 'value', 'compareType', 'clampToXZ']),
        validatorPath,
      );
      return [
        {
          threshold: parseScalarSource(
            validator.value,
            `${validatorPath}.value`,
            inheritedBlackboard,
          ),
          compareType: requireNonEmptyString(validator.compareType, `${validatorPath}.compareType`),
          clampToXZ: requireBoolean(validator.clampToXZ, `${validatorPath}.clampToXZ`),
        },
      ];
    },
  );
}

/**
 * 仅供已分别取证的三个后处理器共用普通目标通道校验，不推广到其他同名字段。
 * 旧结构缺失等价于 Targets；受击列表独立存在，不能以单敌人模型抹掉差异。
 */
export function requireOrdinaryTargetProcessor(
  value: unknown,
  path: string,
  component: 'PriorityFilter' | 'ExcludeTarget' | 'ShuffleTarget',
  fields: readonly string[],
): Record<string, unknown> {
  const processor = requireRecord(value, path);
  if (selectorComponentName(processor, path) !== component) {
    throw new Error(`${path}: expected ${component}`);
  }
  requireExactFields(
    processor,
    new Set([
      '$type',
      ...fields,
      ...('processTargetType' in processor ? ['processTargetType'] : []),
    ]),
    path,
  );
  if ('processTargetType' in processor && processor.processTargetType !== 'Targets') {
    throw new Error(`${path}.processTargetType: only named Targets is supported`);
  }
  return processor;
}

function matchingComponents(
  value: unknown,
  path: string,
  componentName: string,
): Array<{ readonly component: Record<string, unknown>; readonly path: string }> {
  const selector = requireRecord(value, path);
  return requireArray(selector.postProcessorData, `${path}.postProcessorData`).flatMap(
    (rawComponent, index) => {
      const componentPath = `${path}.postProcessorData[${index}]`;
      const component = requireRecord(rawComponent, componentPath);
      return selectorComponentName(component, componentPath) === componentName
        ? [{ component, path: componentPath }]
        : [];
    },
  );
}
