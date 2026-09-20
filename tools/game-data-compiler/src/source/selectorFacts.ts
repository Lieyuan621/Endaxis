import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
} from './primitives.ts';
import {
  parsePriorityFilterSource,
  parsePriorityFilterSources,
  selectorComponentName,
} from './selectorComponents.ts';
import {
  parseExcludeTargetSource,
  parseTargetReferenceSource,
  type TargetReferenceSource,
} from './target.ts';

export interface CircularOrderSource {
  readonly indexKey: string;
  readonly desiredCount: number;
  readonly reverseFlag: number;
  readonly heightOffset: number;
  readonly rangeThreshold: number;
  readonly rangeCheckTarget: TargetReferenceSource;
}

export type CharacterTeamSelectionSource =
  | { readonly kind: 'controlledOperator' }
  | {
      readonly kind: 'lowestHealthRatioOperator';
      /** 原始排除引用；Context 名称不证明组内身份，Owner 也不在来源层等同 caster。 */
      readonly excludedTarget: TargetReferenceSource | null;
    };

/** 识别已取证的主控与最低生命比例队友选择器。 */
export function parseCharacterTeamSelection(
  value: unknown,
  path: string,
): CharacterTeamSelectionSource | null {
  const selector = requireRecord(value, path);
  if (!('finderData' in selector)) return null;
  const finder = requireRecord(selector.finderData, `${path}.finderData`);
  if (selectorComponentName(finder, `${path}.finderData`) !== 'CharacterTeamFinder') {
    return null;
  }
  requireExactFields(finder, new Set(['$type']), `${path}.finderData`);

  const validators = requireArray(selector.validatorData, `${path}.validatorData`);
  const processors = requireArray(selector.postProcessorData, `${path}.postProcessorData`);
  if (validators.length === 1 && processors.length === 0) {
    const validatorPath = `${path}.validatorData[0]`;
    const validator = requireRecord(validators[0], validatorPath);
    if (selectorComponentName(validator, validatorPath) !== 'MainCharacterValidator') return null;
    requireExactFields(validator, new Set(['$type']), validatorPath);
    return { kind: 'controlledOperator' };
  }
  if (validators.length > 0 || ![1, 2].includes(processors.length)) return null;

  let excludedTarget: TargetReferenceSource | null = null;
  const priorityIndex = processors.length === 2 ? 1 : 0;
  if (processors.length === 2) {
    const exclusionPath = `${path}.postProcessorData[0]`;
    const exclusion = requireRecord(processors[0], exclusionPath);
    if (selectorComponentName(exclusion, exclusionPath) !== 'ExcludeTarget') return null;
    excludedTarget = parseExcludeTargetSource(exclusion, exclusionPath);
  }

  const priorityPath = `${path}.postProcessorData[${priorityIndex}]`;
  if (selectorComponentName(processors[priorityIndex], priorityPath) !== 'PriorityFilter')
    return null;
  const priority = parsePriorityFilterSource(processors[priorityIndex], priorityPath);
  if (
    priority.filterType !== 'CurHpRatioAsc' ||
    priority.onlyReserveMaxPriorityTargets !== false ||
    priority.limitMaxNum !== true ||
    priority.maxNum !== 1
  ) {
    return null;
  }
  const filter = priority.buffFilter;
  if (
    filter.checkType !== 'Id' ||
    filter.buffIds.length !== 0 ||
    filter.tagQuery.queryType !== 'hasAny' ||
    filter.tagQuery.tagIds.length !== 0 ||
    filter.stackCountType !== 'BuffCount'
  ) {
    return null;
  }
  return { kind: 'lowestHealthRatioOperator', excludedTarget };
}

/** 选择器是否明确排除当前输入 Target。 */
export function selectorExcludesPlainCurrentTarget(value: unknown, path: string): boolean {
  return selectorExcludesPlainTarget(value, path, 'Target');
}

/** 选择器是否明确排除当前动作 Owner。 */
export function selectorExcludesPlainOwner(value: unknown, path: string): boolean {
  return selectorExcludesPlainTarget(value, path, 'Owner');
}

/** 保存 SmartTargetFinder 无距离限制回退主目标的原生配置事实。 */
export function smartTargetFallsBackToMainTarget(value: unknown, path: string): boolean {
  const selector = requireRecord(value, path);
  const finder = requireRecord(selector.finderData, `${path}.finderData`);
  if (selectorComponentName(finder, `${path}.finderData`) !== 'SmartTargetFinder') return false;
  const setting = requireRecord(finder.selectSetting, `${path}.finderData.selectSetting`);
  return setting.smartTargetSelectStrategy === 'SelectByTag' && finder.limitFallbackRange === false;
}

/** 所有验证器是否都已证明能在 Endaxis 零距离投影下通过。 */
export function distanceValidatorsPassAtZero(value: unknown, path: string): boolean {
  const selector = requireRecord(value, path);
  const validators = requireArray(selector.validatorData, `${path}.validatorData`);
  if (validators.length === 0) return false;
  for (let index = 0; index < validators.length; index += 1) {
    const validatorPath = `${path}.validatorData[${index}]`;
    const validator = requireRecord(validators[index], validatorPath);
    if (selectorComponentName(validator, validatorPath) !== 'DistanceValidator') return false;
    const scalar = requireRecord(validator.value, `${validatorPath}.value`);
    if (scalar.useBlackboardKey !== false || typeof scalar.value !== 'number') return false;
    const threshold = scalar.value;
    const comparison = validator.compareType;
    const allowed = threshold > 0 ? ['LT', 'LE'] : threshold === 0 ? ['LE'] : [];
    if (!allowed.includes(String(comparison))) return false;
  }
  return true;
}

/** 读取唯一 PriorityFilter 的显式最大保留数量。 */
export function priorityFilterMaxTargets(value: unknown, path: string): number | null {
  const filters = parsePriorityFilterSources(value, path);
  if (filters.length !== 1 || !filters[0]!.limitMaxNum) return null;
  return requireNonNegativeInteger(filters[0]!.maxNum, `${path}.postProcessorData.maxNum`);
}

/** 严格读取已由反编译证据闭环的 CircularOrderSort 载荷。 */
export function parseCircularOrderSource(value: unknown, path: string): CircularOrderSource | null {
  const matches = matchingProcessors(value, path, 'CircularOrderSort');
  if (matches.length === 0) return null;
  if (matches.length !== 1) {
    throw new Error(`${path}.postProcessorData: expected one CircularOrderSort`);
  }
  const { processor, path: processorPath } = matches[0]!;
  requireExactFields(
    processor,
    new Set([
      '$type',
      'indexKey',
      'heightOffset',
      'rangeCheckTarget',
      'rangeThreshold',
      'reverseFlag',
      'desireCount',
    ]),
    processorPath,
  );
  const desiredCount = constantScalar(processor.desireCount, `${processorPath}.desireCount`);
  if (!Number.isInteger(desiredCount) || desiredCount <= 0) {
    throw new Error(`${processorPath}.desireCount.value: expected positive integer`);
  }
  return {
    indexKey: requireNonEmptyString(processor.indexKey, `${processorPath}.indexKey`),
    desiredCount,
    reverseFlag: constantScalar(processor.reverseFlag, `${processorPath}.reverseFlag`),
    heightOffset: constantScalar(processor.heightOffset, `${processorPath}.heightOffset`),
    rangeThreshold: constantScalar(processor.rangeThreshold, `${processorPath}.rangeThreshold`),
    rangeCheckTarget: parseTargetReferenceSource(
      processor.rangeCheckTarget,
      `${processorPath}.rangeCheckTarget`,
    ),
  };
}

function selectorExcludesPlainTarget(
  value: unknown,
  path: string,
  targetSource: 'Target' | 'Owner',
): boolean {
  const selector = requireRecord(value, path);
  const processors = requireArray(selector.postProcessorData, `${path}.postProcessorData`);
  for (let index = 0; index < processors.length; index += 1) {
    const processorPath = `${path}.postProcessorData[${index}]`;
    const processor = requireRecord(processors[index], processorPath);
    if (selectorComponentName(processor, processorPath) !== 'ExcludeTarget') continue;
    const excluded = parseExcludeTargetSource(processor, processorPath);
    if (isPlainTarget(excluded, targetSource, '')) return true;
  }
  return false;
}

function isPlainTarget(
  target: TargetReferenceSource,
  targetSource: string,
  targetGroupKey: string,
): boolean {
  return (
    target.targetSource === targetSource &&
    target.targetGroupKey === targetGroupKey &&
    target.finderType === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0
  );
}

function matchingProcessors(
  value: unknown,
  path: string,
  componentName: string,
): Array<{ readonly processor: Record<string, unknown>; readonly path: string }> {
  const selector = requireRecord(value, path);
  return requireArray(selector.postProcessorData, `${path}.postProcessorData`).flatMap(
    (rawProcessor, index) => {
      const processorPath = `${path}.postProcessorData[${index}]`;
      const processor = requireRecord(rawProcessor, processorPath);
      return selectorComponentName(processor, processorPath) === componentName
        ? [{ processor, path: processorPath }]
        : [];
    },
  );
}

function constantScalar(value: unknown, path: string): number {
  const scalar = requireRecord(value, path);
  requireExactFields(scalar, new Set(['useBlackboardKey', 'value', 'blackboardKey']), path);
  if (scalar.useBlackboardKey !== false || scalar.blackboardKey !== '') {
    throw new Error(`${path}: blackboard scalar is not yet supported`);
  }
  return requireNumber(scalar.value, `${path}.value`);
}
