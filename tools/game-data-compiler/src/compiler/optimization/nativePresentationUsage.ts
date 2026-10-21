import { collectEnabledNativeActionNodes } from '../../source/actionLeaf.ts';
import {
  type NativeActionNodeSource,
  type NativeSequenceSource,
} from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import { canOmitUnusedNativeCondition } from './nativeConditionUsage.ts';
import { summarizeNativeBlackboardUsage } from './nativeBlackboardUsage.ts';

/**
 * 收集只进入表现消费者的黑板键。与相机角度本身无关：完整生命周期内所有写入必须是
 * 直接数值运算，且读取者只能是表现动作或只控制表现分支的条件。
 */
export function collectCombatInvisiblePresentationAssignmentKeys(
  sequences: readonly NativeSequenceSource<KnownNativeActionLeafSource>[],
  isUnusedByExternalResources?: (key: string) => boolean,
): ReadonlySet<string> {
  const nodes = sequences.flatMap(sequence => collectEnabledNativeActionNodes(sequence));
  const leafNodes = nodes.filter(node => node.body.kind === 'leaf');
  // 只对已核对读写方式的动作扩展条件程序分析。投射物、能力实体等可以传递
  // 整份黑板；其他未核对动作也不能凭“没有出现键名”就当作没有读取。
  const hasUninspectedBlackboardConsumer = leafNodes.some(
    node =>
      node.body.kind === 'leaf' &&
      ![
        'presentation',
        'presentationCalculation',
        'blackboardMutation',
        'blackboardCalculation',
        'condition',
        'spatial',
      ].includes(node.body.value.family),
  );
  const candidates = new Set(
    leafNodes.flatMap(node => {
      if (node.body.kind !== 'leaf') return [];
      if (node.body.value.family === 'blackboardMutation' && node.body.value.action.directValue) {
        return [node.body.value.action.key];
      }
      if (node.body.value.family === 'blackboardCalculation') {
        return [node.body.value.action.key];
      }
      if (node.body.value.family === 'presentationCalculation') {
        const action = node.body.value.action;
        return 'outputKeys' in action ? [...action.outputKeys] : [action.outputKey];
      }
      return [];
    }),
  );
  // 外部读取不取决于本资源是否创建接收者。先保护这些输出，再让固定点分析
  // 反向保留它们依赖的计算链，不能只在个别条件分支里检查外部用途。
  if (isUnusedByExternalResources) {
    for (const key of candidates) {
      if (!isUnusedByExternalResources(key)) candidates.delete(key);
    }
  }
  const usages = new Map(nodes.map(node => [node, summarizeNativeBlackboardUsage(node)]));
  const references = (node: NativeActionNodeSource<KnownNativeActionLeafSource>, key: string) => {
    const usage = usages.get(node)!;
    return usage.reads.has(key) || usage.writes.has(key);
  };
  let candidateSetChanged = true;
  while (candidateSetChanged) {
    candidateSetChanged = false;
    for (const key of [...candidates]) {
      const presentationIfElseConsumers = nodes.filter(node => {
        if (
          node.body.kind !== 'ifElse' ||
          !collectEnabledNativeActionNodes(node.body.condition).some(child =>
            references(child, key),
          )
        )
          return false;
        const conditionNodes = collectEnabledNativeActionNodes(node.body.condition).filter(
          child => child.metadata.enabled,
        );
        const branchNodes = [node.body.whenTrue, node.body.whenFalse].flatMap(branch =>
          collectEnabledNativeActionNodes(branch).filter(child => child.metadata.enabled),
        );
        const isPresentationProgramNode = (
          child: NativeActionNodeSource<KnownNativeActionLeafSource>,
        ): boolean => {
          if (child.body.kind !== 'leaf')
            return child.body.kind === 'ifElse' && child.body.alwaysNext;
          const leaf = child.body.value;
          if (leaf.family === 'condition') return canOmitUnusedNativeCondition(child);
          if (isCombatInvisiblePresentationLeaf(child)) return true;
          if (hasUninspectedBlackboardConsumer && !isUnusedByExternalResources?.(key)) return false;
          if (leaf.family === 'presentationCalculation') return true;
          if (leaf.family === 'spatial') return leaf.action.kind === 'selfRotate';
          return (
            leaf.family === 'blackboardMutation' &&
            leaf.action.directValue &&
            !leaf.action.key.startsWith('EntityBB_') &&
            candidates.has(leaf.action.key)
          );
        };
        return (
          node.body.alwaysNext &&
          conditionNodes.length > 0 &&
          conditionNodes.every(isPresentationProgramNode) &&
          branchNodes.length > 0 &&
          branchNodes.every(isPresentationProgramNode)
        );
      });
      const presentationConditionNodes = new Set(
        presentationIfElseConsumers.flatMap(node =>
          node.body.kind === 'ifElse' ? collectEnabledNativeActionNodes(node.body.condition) : [],
        ),
      );
      const presentationLeafConsumers = leafNodes.filter(
        node =>
          references(node, key) &&
          node.body.kind === 'leaf' &&
          (node.body.value.family === 'presentationCalculation' ||
            isCombatInvisiblePresentationLeaf(node)),
      );
      const leafReferencesAreCombatInvisible = leafNodes.every(node => {
        if (!references(node, key)) return true;
        return (
          node.body.kind === 'leaf' &&
          ((node.body.value.family === 'blackboardMutation' &&
            node.body.value.action.key === key &&
            node.body.value.action.directValue &&
            node.body.value.action.operation === 'Assign' &&
            node.body.value.action.value.blackboardKey !== key) ||
            (node.body.value.family === 'blackboardMutation' &&
              node.body.value.action.key === key &&
              node.body.value.action.directValue &&
              node.body.value.action.operation !== 'Assign' &&
              (node.body.value.action.value.blackboardKey === null ||
                candidates.has(node.body.value.action.value.blackboardKey))) ||
            (node.body.value.family === 'blackboardMutation' &&
              node.body.value.action.key !== key &&
              node.body.value.action.directValue &&
              node.body.value.action.value.blackboardKey === key &&
              candidates.has(node.body.value.action.key)) ||
            (node.body.value.family === 'blackboardCalculation' &&
              node.body.value.action.key === key &&
              [
                node.body.value.action.left.blackboardKey,
                node.body.value.action.right.blackboardKey,
                node.body.value.action.addend?.blackboardKey ?? null,
              ].every(inputKey => inputKey === null || candidates.has(inputKey))) ||
            (node.body.value.family === 'blackboardCalculation' &&
              node.body.value.action.key !== key &&
              [
                node.body.value.action.left.blackboardKey,
                node.body.value.action.right.blackboardKey,
                node.body.value.action.addend?.blackboardKey ?? null,
              ].includes(key) &&
              candidates.has(node.body.value.action.key)) ||
            (node.body.value.family === 'presentationCalculation' &&
              ('outputKeys' in node.body.value.action
                ? node.body.value.action.outputKeys.includes(key)
                : node.body.value.action.outputKey === key)) ||
            node.body.value.family === 'presentationCalculation' ||
            isCombatInvisiblePresentationLeaf(node) ||
            (node.body.value.family === 'condition' && presentationConditionNodes.has(node)))
        );
      });
      const consumers = nodes.filter(
        node => node.body.kind === 'switch' && node.body.choice.blackboardKey === key,
      );
      const switchesArePresentationOnly = consumers.every(node => {
        if (node.body.kind !== 'switch' || !node.body.alwaysNext) return false;
        return node.body.options.every(option =>
          collectEnabledNativeActionNodes(option.action)
            .filter(child => child.metadata.enabled)
            .every(child => isCombatInvisiblePresentationLeaf(child)),
        );
      });
      const forwardsIntoPresentationCandidate = leafNodes.some(
        node =>
          node.body.kind === 'leaf' &&
          ((node.body.value.family === 'blackboardMutation' &&
            node.body.value.action.key !== key &&
            node.body.value.action.directValue &&
            node.body.value.action.value.blackboardKey === key &&
            candidates.has(node.body.value.action.key)) ||
            (node.body.value.family === 'blackboardCalculation' &&
              node.body.value.action.key !== key &&
              [
                node.body.value.action.left.blackboardKey,
                node.body.value.action.right.blackboardKey,
                node.body.value.action.addend?.blackboardKey ?? null,
              ].includes(key) &&
              candidates.has(node.body.value.action.key))),
      );
      if (
        !leafReferencesAreCombatInvisible ||
        !switchesArePresentationOnly ||
        (consumers.length === 0 &&
          presentationLeafConsumers.length === 0 &&
          presentationIfElseConsumers.length === 0 &&
          !forwardsIntoPresentationCandidate)
      ) {
        candidates.delete(key);
        candidateSetChanged = true;
      }
    }
  }
  return candidates;
}

export function isCombatInvisiblePresentationLeaf(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): boolean {
  return (
    node.body.kind === 'leaf' &&
    node.body.value.family === 'presentation' &&
    node.body.value.action.kind !== 'passiveUiValue' &&
    // 需到目标身份投影后才能证明原生成功返回；不能提前删掉可能失败的查询。
    node.body.value.action.kind !== 'rewardComboState' &&
    (node.body.value.action.kind !== 'playAnimation' ||
      node.body.value.action.onEnd === undefined ||
      node.body.value.action.onEnd.actions.every(
        child => !child.metadata.enabled || isCombatInvisiblePresentationLeaf(child),
      ))
  );
}

/** 分析完整资源的随机值读取；调用方负责证明输出不会被外部资源读取。 */
export function collectCombatInvisibleRandomKeys(
  sequences: readonly NativeSequenceSource<KnownNativeActionLeafSource>[],
  canDiscardOutput: (key: string) => boolean,
  presentationOnlyCalculationKeys: ReadonlySet<string> = new Set(),
  presentationOnlyTargetGroups: ReadonlySet<string> = new Set(),
): ReadonlySet<string> {
  // 包含控制动作自身的数值输入（例如 TickInterval），子序列由公共遍历枚举。
  const nodes = sequences.flatMap(collectEnabledNativeActionNodes);
  const candidates = new Set(
    nodes.flatMap(node =>
      node.body.kind === 'leaf' && node.body.value.family === 'randomBlackboard'
        ? [node.body.value.action.targetKey]
        : [],
    ),
  );
  const usages = new Map(nodes.map(node => [node, summarizeNativeBlackboardUsage(node)]));
  for (const key of candidates) {
    if (!canDiscardOutput(key)) {
      candidates.delete(key);
      continue;
    }
    const safe = nodes.every(node => {
      const usage = usages.get(node)!;
      if (!usage.reads.has(key)) return true;
      // 位置偏移不改变点数；只有输出组已证明完全无战斗消费者时才丢弃随机输入。
      if (
        node.body.kind === 'leaf' &&
        node.body.value.family === 'targetGroup' &&
        node.body.value.action.finderType === 'PointFinder' &&
        presentationOnlyTargetGroups.has(node.body.value.action.targetGroupKey)
      )
        return true;
      if (node.body.kind === 'leaf' && node.body.value.family === 'blackboardCalculation') {
        const outputKey = node.body.value.action.key;
        if (!canDiscardOutput(outputKey)) return false;
        const outputHasNoOtherConsumer = nodes.every(
          candidate => candidate === node || !usages.get(candidate)!.reads.has(outputKey),
        );
        // 随机输入可以先参与一段只写入纯表现/无消费者槽位的计算；这不把输出槽位
        // 反向提升为战斗数据。输出若被伤害、条件或 Buff 消费，会从上面的闭包集合中退出。
        if (presentationOnlyCalculationKeys.has(outputKey) || outputHasNoOtherConsumer) return true;
      }
      return false;
    });
    if (!safe) candidates.delete(key);
  }
  return candidates;
}
