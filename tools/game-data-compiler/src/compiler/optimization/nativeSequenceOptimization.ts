import { isCombatInvisiblePresentationLeaf } from './nativePresentationUsage.ts';
import { isDeepStrictEqual } from 'node:util';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { NativeActionNodeSource, NativeSequenceSource } from '../../source/controlFlow.ts';
import { canOmitUnusedNativeCondition, isReadOnlyNativeTarget } from './nativeConditionUsage.ts';
import { summarizeNativeBlackboardUsage } from './nativeBlackboardUsage.ts';

type Sequence = NativeSequenceSource<KnownNativeActionLeafSource>;

/** 仅在同一动作环境内裁剪已证明的分支；循环、回调等边界须由各自宿主重新提供事实。 */
export function pruneKnownNativeBranches<TLeaf>(
  source: NativeSequenceSource<TLeaf>,
  evaluate: (condition: NativeSequenceSource<TLeaf>) => boolean | undefined,
): NativeSequenceSource<TLeaf> {
  const actions = source.actions.map(node => {
    if (!node.metadata.enabled || node.body.kind !== 'ifElse') return node;
    const body = node.body;
    const result = evaluate(body.condition);
    const empty: NativeSequenceSource<TLeaf> = {
      actions: [],
      onlyExecuteWhenSourceIsMainCharacter: false,
      onlyExecuteWhenSourceIsGuard: false,
    };
    return {
      ...node,
      body: {
        ...body,
        // 保留原生调用边界及 alwaysNext，不能把分支直接展开到父序列。
        condition: result === undefined ? body.condition : empty,
        whenTrue: pruneKnownNativeBranches(
          result === false ? body.whenFalse : body.whenTrue,
          evaluate,
        ),
        whenFalse:
          result === undefined ? pruneKnownNativeBranches(body.whenFalse, evaluate) : empty,
      },
    };
  });
  // NotNext 会反转下一次返回值；未在此解释它时，不推断同层的短路位置。
  const inverted = actions.some(
    node => node.metadata.enabled && node.body.kind === 'negateNextResult',
  );
  const stop = inverted
    ? -1
    : actions.findIndex(
        node =>
          node.metadata.enabled &&
          node.body.kind === 'leaf' &&
          evaluate({ ...source, actions: [node] }) === false,
      );
  return { ...source, actions: stop < 0 ? actions : actions.slice(0, stop + 1) };
}

function isSequence(value: Record<string, unknown>): value is Record<string, unknown> & Sequence {
  return (
    Array.isArray(value.actions) &&
    typeof value.onlyExecuteWhenSourceIsMainCharacter === 'boolean' &&
    typeof value.onlyExecuteWhenSourceIsGuard === 'boolean'
  );
}

/** 来源路径和原生动作编号标识调用位置，不改变同一子序列的行为。其余元数据参与比较。 */
function comparable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(comparable);
  if (value === null || typeof value !== 'object') return value;
  const object = value as Record<string, unknown>;
  if ('body' in object && 'metadata' in object && 'sourcePath' in object) {
    const node = value as NativeActionNodeSource<KnownNativeActionLeafSource>;
    const { serverActionIndex: _index, ...metadata } = node.metadata;
    return { metadata, body: comparable(node.body) };
  }
  return Object.fromEntries(Object.entries(object).map(([key, child]) => [key, comparable(child)]));
}

/**
 * 在用途分析前裁剪无人消费的实体赋值和等价分支的纯条件。外部读取必须由完整闭包证明。
 * 保留 IfElse 调用及 alwaysNext，
 * 不能把多动作分支展开到父序列，否则 NotNext 和返回 false 的边界会改变。
 * 来源 IR 是纯数据；递归覆盖控制子序列及叶动作持有的事件、回调。
 * resource 仅供包含全部生命周期、调度及修正条件的完整来源使用，允许清理无读取的
 * 距离写入；sequence 无法排除其他入口的读取，只简化控制流与已有外部赋值证明。
 */
export function simplifyNativeSequences<T>(
  source: T,
  isEntityBlackboardKeyUnused?: (key: string) => boolean,
  scope: 'sequence' | 'resource' = 'sequence',
): T {
  let previousReads: ReadonlySet<string> | undefined;
  let reads = new Set<string>();
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (value === null || typeof value !== 'object') return value;
    const object = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, visit(child)]),
    );
    if ('body' in object && 'metadata' in object && 'sourcePath' in object) {
      const usage = summarizeNativeBlackboardUsage(
        object as unknown as NativeActionNodeSource<KnownNativeActionLeafSource>,
      );
      for (const key of usage.reads) reads.add(key);
    }
    if (object.family === 'projectile' || object.family === 'abilityEntity') {
      const leaf = object as unknown as Extract<
        KnownNativeActionLeafSource,
        { family: 'projectile' | 'abilityEntity' }
      >;
      if (leaf.action.assignEntityBlackboard && isEntityBlackboardKeyUnused) {
        return {
          ...leaf,
          action: {
            ...leaf.action,
            assignments: leaf.action.assignments.filter(
              assignment => !isEntityBlackboardKeyUnused(assignment.targetKey),
            ),
          },
        };
      }
    }
    if (!isSequence(object)) return object;
    // NotNext 绑定下一次动作调用的返回值；删除调用会使反转落到别的动作上。
    const hasResultInversion = object.actions.some(
      node => node.metadata.enabled && node.body.kind === 'negateNextResult',
    );
    return {
      ...object,
      actions: object.actions
        .filter(node => {
          if (hasResultInversion) return true;
          const body = node.body;
          // 先消除纯表现消费者，再用上一轮的保守读取集合清理距离写入。
          // 外部证明必须涵盖其他入口和资源；缺少证明时不能把局部无读取当作无用途。
          if (body.kind === 'leaf' && body.value.family === 'spatialMeasurement') {
            const action = body.value.action;
            if (
              scope === 'resource' &&
              previousReads &&
              !previousReads.has(action.outputKey) &&
              isEntityBlackboardKeyUnused?.(action.outputKey) &&
              isReadOnlyNativeTarget(action.source) &&
              isReadOnlyNativeTarget(action.target)
            )
              return false;
          }
          if (
            body.kind === 'ifElse' &&
            body.alwaysNext &&
            body.condition.actions.every(
              child => !child.metadata.enabled || canOmitUnusedNativeCondition(child),
            ) &&
            [body.whenTrue, body.whenFalse].every(branch =>
              branch.actions.every(
                child => !child.metadata.enabled || isCombatInvisiblePresentationLeaf(child),
              ),
            )
          )
            return false;
          // alwaysNext 使无匹配和任意分支都继续；纯表现分支没有战斗副作用。
          return !(
            body.kind === 'switch' &&
            body.alwaysNext &&
            body.options.every(option =>
              option.action.actions.every(
                child => !child.metadata.enabled || isCombatInvisiblePresentationLeaf(child),
              ),
            )
          );
        })
        .map(node => {
          const body = node.body;
          if (
            body.kind !== 'ifElse' ||
            !body.condition.actions.every(
              child => !child.metadata.enabled || canOmitUnusedNativeCondition(child),
            ) ||
            !isDeepStrictEqual(comparable(body.whenTrue), comparable(body.whenFalse))
          )
            return node;
          return {
            ...node,
            body: {
              ...body,
              condition: {
                actions: [],
                onlyExecuteWhenSourceIsMainCharacter: false,
                onlyExecuteWhenSourceIsGuard: false,
              },
            },
          };
        }),
    };
  };
  let current: unknown = source;
  for (;;) {
    reads = new Set();
    const next = visit(current);
    if (
      previousReads &&
      isDeepStrictEqual(previousReads, reads) &&
      isDeepStrictEqual(current, next)
    )
      return next as T;
    previousReads = reads;
    current = next;
  }
}
