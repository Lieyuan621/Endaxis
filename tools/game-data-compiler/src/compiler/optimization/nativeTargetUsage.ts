import { collectEnabledNativeActionNodes } from '../../source/actionLeaf.ts';
import type { NativeSequenceSource } from '../../source/controlFlow.ts';
import { isCombatInvisiblePresentationLeaf } from './nativePresentationUsage.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { NativeActionNodeSource } from '../../source/controlFlow.ts';

export interface NativeTargetUsage {
  readonly reads: ReadonlySet<string>;
  readonly writes: ReadonlySet<string>;
  readonly passesAllTargets: boolean;
}

// 来源 IR 的目标引用字段；技能名、变量名和调试文本不构成目标组读取。
const TARGET_INPUT_FIELDS = new Set([
  'targetGroupKey',
  'ownerContextKey',
  'centerContextKey',
  'targetContextKey',
  'selectorOwnerContextKey',
  'directionContextKey',
  'sourceContextKey',
  'bornRotationContextTarget',
  'contextKey',
]);

/** 同一资源的生命周期和回调共享目标组，读取须在所有入口上汇总。 */
export function collectMaterializedSequenceTargetGroups(
  sequences: readonly NativeSequenceSource<KnownNativeActionLeafSource>[],
  presentationOnlyGroups: ReadonlySet<string> = new Set(),
): ReadonlySet<string> {
  const usages = sequences.flatMap(sequence =>
    collectEnabledNativeActionNodes(sequence).map(summarizeNativeTargetUsage),
  );
  const passesAllTargets = usages.some(usage => usage.passesAllTargets);
  return new Set(
    usages.flatMap(usage =>
      [...usage.reads, ...(passesAllTargets ? usage.writes : [])].filter(
        key => !presentationOnlyGroups.has(key),
      ),
    ),
  );
}

/** 分析来源目标组依赖；不判断查询的随机、副作用或控制返回能否删除。 */
export function summarizeNativeTargetUsage(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): NativeTargetUsage {
  const reads = new Set<string>();
  const writes = new Set<string>();
  let passesAllTargets = false;
  const visit = (value: unknown): void => {
    if (value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = value as Record<string, unknown>;
    // 事件响应和控制子序列由公共遍历枚举，不能重复归算为容器自身的读取。
    if (Array.isArray(record.actions) && 'onlyExecuteWhenSourceIsMainCharacter' in record) return;
    // 原生 Buff 创建可复制整个目标上下文；接收资源未分析前，不能只按局部读判断。
    if (record.passTargetGroupsToBuff === true) passesAllTargets = true;
    for (const [field, child] of Object.entries(record)) {
      const isOutput =
        field === 'outputContextKey' ||
        field === 'hitPositionTargetGroupKey' ||
        field === 'successTargetContextKey' ||
        (field === 'targetGroupKey' && typeof record.producerType === 'string') ||
        (field === 'contextKey' &&
          record.kind === 'abilityEntitySpawn' &&
          record.saveToContext === true);
      if (isOutput && typeof child === 'string') {
        if (child !== '') writes.add(child);
      } else if (TARGET_INPUT_FIELDS.has(field) && typeof child === 'string') {
        // Target/Owner/Source 上会残留旧组名，只有 Context 查询实际读取它。
        if (
          field === 'targetGroupKey' &&
          typeof record.targetSource === 'string' &&
          record.targetSource !== 'Context'
        )
          continue;
        if (
          record.producerType === 'FindTargetAction' &&
          ((field === 'centerContextKey' && record.center !== 'ContextTarget') ||
            (field === 'selectorOwnerContextKey' && record.selectorOwner !== 'ContextTarget'))
        )
          continue;
        if (child !== '') reads.add(child);
      } else {
        visit(child);
      }
    }
  };
  if (node.metadata.enabled) visit(node.body);
  return { reads, writes, passesAllTargets };
}

/** 只证明查询输出无战斗读取；能否删除调用还取决于返回值及后继。 */
export function collectUnobservedTargetQueryOutputs(
  sequences: readonly NativeSequenceSource<KnownNativeActionLeafSource>[],
): ReadonlySet<string> {
  const nodes = sequences.flatMap(collectEnabledNativeActionNodes);
  const usages = new Map(nodes.map(node => [node, summarizeNativeTargetUsage(node)]));
  if ([...usages.values()].some(usage => usage.passesAllTargets)) return new Set();
  const outputs = new Set(
    nodes.flatMap(node =>
      node.body.kind === 'leaf' &&
      node.body.value.family === 'targetGroup' &&
      node.body.value.action.producerType === 'FindTargetAction'
        ? [node.body.value.action.targetGroupKey]
        : [],
    ),
  );
  let changed: boolean;
  do {
    changed = false;
    for (const key of outputs) {
      if (
        nodes.some(node => {
          if (!usages.get(node)!.reads.has(key) || isCombatInvisiblePresentationLeaf(node))
            return false;
          return !(
            node.body.kind === 'leaf' &&
            node.body.value.family === 'targetGroup' &&
            node.body.value.action.producerType === 'FindTargetAction' &&
            outputs.has(node.body.value.action.targetGroupKey)
          );
        })
      ) {
        outputs.delete(key);
        changed = true;
      }
    }
  } while (changed);
  return outputs;
}
