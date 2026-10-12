import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { NativeActionNodeSource } from '../../source/controlFlow.ts';

export interface NativeBlackboardUsage {
  readonly reads: ReadonlySet<string>;
  readonly writes: ReadonlySet<string>;
}

// 这些键属于目标上下文或资源目录，不属于动作变量。
const NON_VARIABLE_KEYS = new Set([
  'targetGroupKey',
  'ownerContextKey',
  'centerContextKey',
  'targetContextKey',
  'selectorOwnerContextKey',
  'directionContextKey',
  'sourceContextKey',
  'contextKey',
  'outputContextKey',
  'successTargetContextKey',
  'hitPositionTargetGroupKey',
  'hitPosGroupKey',
  'cameraAnimationKey',
  'animationKey',
  'curveKey',
  'directCurveKeys',
  'inlineCurveKeys',
  'dataKey',
  'visualCoalitionGroupKey',
]);
const OUTPUT_KEYS = new Set([
  'outputKey',
  'outputKeys',
  'storeKey',
  'savedKey',
  'buffIdOutputKey',
  'overHealKey',
  'finalHealKey',
  'realHealKey',
  'valueKey',
  'realDeltaKey',
  'eventParameterBlackboardKey',
  'savedParamKey',
  'hitDistanceBlackboardKey',
]);

/** 来源 IR 的变量访问摘要。尚未细分的键按读取保护，不从任意字符串推测变量。 */
export function summarizeNativeBlackboardUsage(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): NativeBlackboardUsage {
  const reads = new Set<string>();
  const writes = new Set<string>();
  const add = (target: Set<string>, value: unknown): void => {
    if (typeof value === 'string' && value !== '') target.add(value);
    else if (Array.isArray(value)) value.forEach(item => add(target, item));
  };
  const visit = (value: unknown): void => {
    if (value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = value as Record<string, unknown>;
    // 子序列由公共控制流遍历单独枚举，摘要只描述当前调用自身。
    if (Array.isArray(record.actions) && 'onlyExecuteWhenSourceIsMainCharacter' in record) return;
    for (const [field, child] of Object.entries(record)) {
      if (field === 'metadata' || field === 'sourcePath' || NON_VARIABLE_KEYS.has(field)) continue;
      // 关闭的实体赋值、直接赋值中残留的输入键都不会被原生动作读取。
      if (field === 'assignments' && record.assignEntityBlackboard === false) continue;
      if (field === 'inputValueKey' && record.useDirectValue === true) continue;
      if (OUTPUT_KEYS.has(field)) add(writes, child);
      else if (
        field === 'key' &&
        (record.kind === 'blackboardMutation' || record.kind === 'blackboardCalculation')
      ) {
        add(writes, child);
        // 动态写入可能比较旧值；不能将它当作必然覆盖。
        add(reads, child);
      } else if (field === 'targetKey') {
        add(writes, child);
      } else if (field === 'key' || /[Kk]eys?$/.test(field)) {
        add(reads, child);
        visit(child);
      } else visit(child);
    }
  };
  if (node.metadata.enabled) visit(node.body);
  return { reads, writes };
}
