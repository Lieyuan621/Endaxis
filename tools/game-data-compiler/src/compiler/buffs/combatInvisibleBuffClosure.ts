import { collectNativeActionNodes } from '../../source/controlFlow.ts';
import {
  collectBuffActionReferences,
  parseReferenceAwareBuffActionGraphSource,
} from '../../source/buffActionGraph.ts';
import { parseBuffRuntimeSource } from '../../source/buffRuntime.ts';
import { requireArray, requireRecord, requireString } from '../../source/primitives.ts';

const PRESENTATION_PLUMBING_ACTIONS = new Set([
  'FindTargetAction',
  'CheckMainCharacterCondition',
  'CheckEntityNum',
  'CheckTargetsEqual',
  'CheckTwoDirectionAngle',
  'ConvertToTargetContext',
  'LockCameraAimAction',
  'AddDynamicCcsAction',
  'OverrideCameraFollowAction',
  'VoiceTriggerAction',
  'VoiceInterruptAction',
]);

interface BuffPresentationClosureNode {
  readonly locallyInvisible: boolean;
  readonly references: readonly string[];
}

/**
 * 找出完整递归闭包都只服务于无渲染表现的 Buff。
 * 判定不依赖 ID：图标、战斗字段、动态引用、未知动作或非表现子 Buff 任一出现即失败关闭。
 */
export function collectCombatInvisibleBuffClosureIds(
  rootIds: readonly string[],
  loadBuff: (id: string) => unknown,
  observedBuffIds: ReadonlySet<string> = new Set(),
): ReadonlySet<string> {
  const nodes = new Map<string, BuffPresentationClosureNode>();
  const queue = [...new Set(rootIds)];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (nodes.has(id)) continue;
    const node = inspectBuff(id, loadBuff);
    nodes.set(id, node);
    for (const reference of node.references) if (!nodes.has(reference)) queue.push(reference);
  }

  // 身份被战斗条件读取的 Buff 从初始集合起就不是表现节点，可见性沿引用边向上传播；
  // 不能事后从结果里 filter，否则创建它的父 Buff 仍会被误判为纯表现而整条丢失。
  // 身份被战斗条件读取的 Buff 从初始集合起就不是表现节点，可见性沿引用边向上传播；
  // 不能事后从结果里 filter，否则创建它的父 Buff 仍会被误判为纯表现而整条丢失。
  const invisible = new Set(
    [...nodes]
      .filter(([id, node]) => node.locallyInvisible && !observedBuffIds.has(id))
      .map(([id]) => id),
  );
  let changed: boolean;
  do {
    changed = false;
    for (const id of [...invisible]) {
      const node = nodes.get(id)!;
      if (node.references.some(reference => !invisible.has(reference))) {
        invisible.delete(id);
        changed = true;
      }
    }
  } while (changed);
  return invisible;
}

function inspectBuff(id: string, loadBuff: (id: string) => unknown): BuffPresentationClosureNode {
  try {
    const value = loadBuff(id);
    const root = requireRecord(value, `BuffData.${id}`);
    // 表现闭包也必须走完整 Buff 两阶段黑板与动作解析；只追引用的宽松图会把已经支持的
    // Effect/ShowHide 等动作留成 untracked，既无法验证字段，也会错误阻塞纯表现闭包。
    // 只有严格解析尚未覆盖的表现管线动作才退回引用图；例如 ConvertEntityToSlot 的
    // 变换语义尚未恢复，但递归闭包可以证明其输出最终只供镜头动作消费。
    let strictlyParsed = true;
    let graph;
    try {
      graph = parseBuffRuntimeSource(value, `BuffData.${id}`).graph;
    } catch {
      strictlyParsed = false;
      graph = parseReferenceAwareBuffActionGraphSource(value, `BuffData.${id}`, {});
    }
    if (graph.buffId !== id) return { locallyInvisible: false, references: [] };
    const references = collectBuffActionReferences(graph).filter(
      reference => reference.kind === 'buff' && reference.state !== 'inactive',
    );
    const staticReferences = references.flatMap(reference =>
      reference.state === 'active' && reference.id !== null ? [reference.id] : [],
    );
    const sequences = [
      ...graph.timelineActions.map(timeline => timeline.sequence),
      ...graph.buffEvents.flatMap(event => event.actions),
      ...graph.abilityEvents.flatMap(event => event.actions),
      ...graph.igniteEvents.flatMap(event => event.actions),
    ];
    const enabledNodes = sequences
      .flatMap(sequence => collectNativeActionNodes(sequence))
      .filter(node => node.metadata.enabled);
    const hasOperatorUiSink = enabledNodes.some(
      node =>
        node.body.kind === 'leaf' &&
        node.body.value.family === 'presentation' &&
        node.body.value.action.kind === 'operatorUiEvent',
    );
    const actionsArePresentationOnly = enabledNodes.every(node => {
      if (node.body.kind !== 'leaf') return true;
      const leaf = node.body.value;
      if (leaf.family === 'buffApplication' || leaf.family === 'buffFinish') return true;
      if (leaf.family === 'presentation')
        return leaf.action.kind !== 'playAnimation' || leaf.action.onEnd === undefined;
      if (leaf.family === 'presentationCalculation') return true;
      // 私有 UI Buff 内的计数、随机数和分支只驱动已经严格解析的专属 UI 事件。
      // 引用的子 Buff 仍由闭包不动点逐个证明为纯表现；任一战斗子 Buff 会使父节点退出集合。
      if (
        hasOperatorUiSink &&
        (leaf.family === 'blackboardMutation' ||
          leaf.family === 'blackboardCalculation' ||
          leaf.family === 'randomBlackboard')
      )
        return true;
      // 严格解析后的目标组写入与条件本身没有战斗输出；在整个递归闭包的其余叶子都只会
      // 创建/结束纯表现 Buff 或驱动表现动作时，它们也只能充当表现数据流的中间节点。
      if (leaf.family === 'targetGroup' || leaf.family === 'condition') return true;
      return (
        !strictlyParsed &&
        leaf.family === 'untracked' &&
        PRESENTATION_PLUMBING_ACTIONS.has(leaf.nativeName)
      );
    });
    return {
      locallyInvisible:
        hasNoVisibleIcon(root, id) &&
        hasNoCombatPayload(root, id) &&
        references.every(reference => reference.state === 'active' && reference.id !== null) &&
        actionsArePresentationOnly,
      references: staticReferences,
    };
  } catch {
    return { locallyInvisible: false, references: [] };
  }
}

function hasNoVisibleIcon(root: Record<string, unknown>, id: string): boolean {
  const icon = requireRecord(root.iconConfig, `BuffData.${id}.iconConfig`);
  return (
    root.hasIcon === false &&
    requireString(icon._spritePath, `BuffData.${id}.iconConfig._spritePath`) === ''
  );
}

function hasNoCombatPayload(root: Record<string, unknown>, id: string): boolean {
  const empty = (field: string) =>
    requireArray(root[field], `BuffData.${id}.${field}`).length === 0;
  const attributes = requireRecord(root.attributeModifier, `BuffData.${id}.attributeModifier`);
  const stacking = requireRecord(root.stackingSettings, `BuffData.${id}.stackingSettings`);
  return (
    requireArray(
      attributes.attributeModifiers,
      `BuffData.${id}.attributeModifier.attributeModifiers`,
    ).length === 0 &&
    empty('damageModifier') &&
    empty('healModifier') &&
    empty('poiseModifier') &&
    empty('globalModifier') &&
    empty('shieldConfigs') &&
    empty('applyTags') &&
    empty('tagsAfterTriggerExtendBuffAction') &&
    // Blackboard 只有被战斗动作读取时才可见；actionsArePresentationOnly 已排除这种消费者。
    // stackEffects 只承载 EffectAction，来源图解析已严格验证其结构。
    Array.isArray(stacking.stackEffects)
  );
}
