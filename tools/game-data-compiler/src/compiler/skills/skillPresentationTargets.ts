import { collectEnabledNativeActionNodes } from '../../source/actionLeaf.ts';
import {
  collectCombatInvisibleRandomKeys,
  isCombatInvisiblePresentationLeaf,
} from '../optimization/nativePresentationUsage.ts';
import { summarizeNativeBlackboardUsage } from '../optimization/nativeBlackboardUsage.ts';
import {
  canOmitUnusedNativeCondition,
  isReadOnlyNativeTarget,
} from '../optimization/nativeConditionUsage.ts';
import {
  collectMaterializedSequenceTargetGroups,
  summarizeNativeTargetUsage,
} from '../optimization/nativeTargetUsage.ts';
import {
  type NativeActionNodeSource,
  type NativeSequenceSource,
} from '../../source/controlFlow.ts';
import type { SkillActionGraphSource } from '../../source/skillActionGraph.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { TargetGroupActionSource } from '../../source/targetGroup.ts';

/** 时间线和被动事件共享技能状态，数组位置不能证明运行时先后关系。 */
function skillSequences(graph: SkillActionGraphSource<KnownNativeActionLeafSource>) {
  return [
    ...graph.actionGroup.timelineActions.map(timeline => timeline.sequence),
    ...graph.actionGroup.passiveEvents.flatMap(event => event.actions),
  ];
}

function blackboardKeys(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const node of collectEnabledNativeActionNodes(sequence)) {
    const usage = summarizeNativeBlackboardUsage(node);
    for (const key of [...usage.reads, ...usage.writes]) keys.add(key);
  }
  return keys;
}

/** 接收资源尚未装配时，整板继承意味着局部扫描无法证明其中的值无用。 */
function inheritsSkillBlackboard(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
): boolean {
  return skillSequences(graph)
    .flatMap(collectEnabledNativeActionNodes)
    .some(
      node =>
        node.metadata.enabled &&
        node.body.kind === 'leaf' &&
        (node.body.value.family === 'abilityEntity' || node.body.value.family === 'projectile') &&
        node.body.value.action.assignBlackboard,
    );
}

function isPresentationQuery(action: TargetGroupActionSource): boolean {
  return (
    action.producerType === 'FindTargetAction' &&
    (action.finderType === 'SourceFinder' || action.finderType === 'FixedPointFinder') &&
    action.validatorTypes.length === 0 &&
    action.postProcessorTypes.length === 0
  );
}

function isPresentationConditionNode(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): boolean {
  if (!node.metadata.enabled) return true;
  if (node.body.kind !== 'leaf') return false;
  const leaf = node.body.value;
  return (
    leaf.family === 'presentationCalculation' ||
    (leaf.family === 'condition' && canOmitUnusedNativeCondition(node))
  );
}

function isPresentationActionNode(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  presentationOnlyBlackboardKeys: ReadonlySet<string>,
  allowBlackboardMutation: boolean,
): boolean {
  if (!node.metadata.enabled) return true;
  const body = node.body;
  if (body.kind === 'leaf') {
    if (
      (body.value.family === 'blackboardMutation' ||
        body.value.family === 'blackboardCalculation') &&
      allowBlackboardMutation &&
      presentationOnlyBlackboardKeys.has(body.value.action.key)
    )
      return true;
    if (body.value.family === 'animationEventListener') {
      return body.value.action.actionOnEvent.actions.every(child =>
        isPresentationActionNode(child, presentationOnlyBlackboardKeys, true),
      );
    }
    return (
      isCombatInvisiblePresentationLeaf(node) ||
      body.value.family === 'presentationCalculation' ||
      body.value.family === 'spatial'
    );
  }
  if (body.kind !== 'ifElse') return false;
  return (
    body.condition.actions.every(isPresentationConditionNode) &&
    body.whenTrue.actions.every(child =>
      isPresentationActionNode(child, presentationOnlyBlackboardKeys, true),
    ) &&
    body.whenFalse.actions.every(child =>
      isPresentationActionNode(child, presentationOnlyBlackboardKeys, true),
    )
  );
}

/**
 * 只识别“条件和中间黑板值最终仅选择表现动作”的窄控制树。当前白名单故意只覆盖实际镜头样本的
 * mainOperator/floatCompare/distance/objectTypeMatch/superArmor；它们在此只选择纯表现子树，
 * 不会被求值或写入模拟状态。带写回副作用的战斗条件、循环和时间动作一律不能省略。
 */
export function isPresentationOnlyActionSequence(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
  presentationOnlyBlackboardKeys: ReadonlySet<string> = new Set(),
): boolean {
  return sequence.actions.every(node =>
    isPresentationActionNode(node, presentationOnlyBlackboardKeys, false),
  );
}

function isPresentationSelectionNode(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): boolean {
  if (!node.metadata.enabled) return true;
  const body = node.body;
  if (body.kind === 'leaf') {
    if (body.value.family === 'condition') {
      const action = body.value.action;
      // 计数写回也参与下方输出闭包；只有组外没有消费者时才能随整条时间线省略。
      return action.kind === 'entityCount'
        ? isReadOnlyNativeTarget(action.target)
        : canOmitUnusedNativeCondition(node);
    }
    if (body.value.family === 'directionAngle') {
      const action = body.value.action;
      return [
        action.direction1Source,
        action.direction1Target,
        action.direction2Source,
        action.direction2Target,
      ].every(isReadOnlyNativeTarget);
    }
    if (body.value.family === 'spatial') {
      return ['selfRotate', 'teleport', 'teleportPositionSelection'].includes(
        body.value.action.kind,
      );
    }
    if (body.value.family === 'targetGroup') {
      const query = body.value.action;
      return (
        query.shuffleTargets.length === 0 &&
        query.circularOrderIndexKey === null &&
        query.finderType !== 'RandomPointFinder'
      );
    }
    if (body.value.family === 'presentation') return isCombatInvisiblePresentationLeaf(node);
    return [
      'presentationCalculation',
      'spatialMeasurement',
      'blackboardMutation',
      'blackboardCalculation',
    ].includes(body.value.family);
  }
  if (body.kind === 'actionWithCallback') {
    return (
      isPresentationSelectionNode({ ...node, body: { kind: 'leaf', value: body.value } }) &&
      body.callback.actions.every(isPresentationSelectionNode)
    );
  }
  if (body.kind === 'ifElse') {
    return [body.condition, body.whenTrue, body.whenFalse].every(sequence =>
      sequence.actions.every(isPresentationSelectionNode),
    );
  }
  if (body.kind === 'forEach' || body.kind === 'once') {
    return body.action.actions.every(isPresentationSelectionNode);
  }
  return false;
}

function presentationSelectionOutputKeys(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
): { readonly values: ReadonlySet<string>; readonly targets: ReadonlySet<string> } {
  const outputs = new Set<string>();
  const targets = new Set<string>();
  for (const node of collectEnabledNativeActionNodes(sequence)) {
    for (const key of summarizeNativeTargetUsage(node).writes) targets.add(key);
    for (const key of summarizeNativeBlackboardUsage(node).writes) outputs.add(key);
  }
  return { values: outputs, targets };
}

/**
 * 收集仅含表现动作或无消费者查询链的完整调度时间线。
 *
 * 镜头选敌并不总是简单的 CameraAction：原生会先查目标、ForEach 计算左右侧，再跨多个
 * 时间线复用 Context 与黑板值。这里先按动作族找出不含任何战斗副作用的候选子图，再反复
 * 验证候选产生的每个 Context/黑板输出都没有流向候选集外。任一伤害、Buff、资源或未知
 * 控制动作读取这些输出，整条生产链都会退出候选，不能借“最终有相机动作”裁掉战斗逻辑。
 */
export function collectPresentationSelectionTimelineIndexes(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
  isUnusedByExternalResources?: (key: string) => boolean,
): ReadonlySet<number> {
  const timelines = graph.actionGroup.timelineActions;
  if (
    skillSequences(graph).some(sequence =>
      collectEnabledNativeActionNodes(sequence).some(
        node => summarizeNativeTargetUsage(node).passesAllTargets,
      ),
    )
  )
    return new Set();
  const candidates = new Set(
    timelines.flatMap((timeline, index) => {
      const nodes = collectEnabledNativeActionNodes(timeline.sequence).filter(
        node => node.metadata.enabled,
      );
      const containsPresentationOrQuery = nodes.some(
        node =>
          (node.body.kind === 'leaf' || node.body.kind === 'actionWithCallback') &&
          (isCombatInvisiblePresentationLeaf(node) ||
            node.body.value.family === 'presentationCalculation' ||
            node.body.value.family === 'directionAngle' ||
            node.body.value.family === 'spatial' ||
            (node.body.value.family === 'targetGroup' &&
              isPresentationQuery(node.body.value.action))),
      );
      return containsPresentationOrQuery &&
        timeline.sequence.actions.every(isPresentationSelectionNode)
        ? [index]
        : [];
    }),
  );
  const outputsByTimeline = timelines.map(timeline =>
    presentationSelectionOutputKeys(timeline.sequence),
  );
  if (inheritsSkillBlackboard(graph)) {
    for (const index of candidates) {
      if (
        [...outputsByTimeline[index]!.values].some(
          key => isUnusedByExternalResources?.(key) !== true,
        )
      )
        candidates.delete(index);
    }
  }
  // 不用调度数组顺序推断末次写入：时间线可重叠，事件可重入。
  // 候选写入是否保留，只由下方跨入口消费者与上方继承检查决定。
  let changed: boolean;
  const valueKeysByTimeline = timelines.map(timeline => blackboardKeys(timeline.sequence));
  const passiveValueKeys = new Set(
    graph.actionGroup.passiveEvents.flatMap(event =>
      event.actions.flatMap(sequence => [...blackboardKeys(sequence)]),
    ),
  );
  const targetReadsByTimeline = timelines.map(
    timeline =>
      new Set(
        collectEnabledNativeActionNodes(timeline.sequence).flatMap(node => [
          ...summarizeNativeTargetUsage(node).reads,
        ]),
      ),
  );
  const passiveTargetReads = new Set(
    graph.actionGroup.passiveEvents.flatMap(event =>
      event.actions.flatMap(sequence =>
        collectEnabledNativeActionNodes(sequence).flatMap(node => [
          ...summarizeNativeTargetUsage(node).reads,
        ]),
      ),
    ),
  );
  do {
    changed = false;
    for (const index of [...candidates]) {
      const outputs = outputsByTimeline[index]!;
      const outputEscapes =
        [...outputs.targets].some(
          key =>
            passiveTargetReads.has(key) ||
            targetReadsByTimeline.some(
              (reads, consumerIndex) => !candidates.has(consumerIndex) && reads.has(key),
            ),
        ) ||
        [...outputs.values].some(
          key =>
            timelines.some(
              (_, consumerIndex) =>
                !candidates.has(consumerIndex) && valueKeysByTimeline[consumerIndex]!.has(key),
            ) || passiveValueKeys.has(key),
        );
      if (outputEscapes) {
        candidates.delete(index);
        changed = true;
      }
    }
  } while (changed);
  return candidates;
}

/**
 * PhysicsCast 需要真实物理世界才能决定分支。这里只接受已取证的最窄不可见形状：
 * 不写距离、不 Tick；两个分支仅从命中点/动作实体派生固定位置组，且这些组与命中点在动作之后
 * 都没有消费者。时间线可跳转，事件也可延迟触发；这里不按数组位置排除消费者。
 */
export function collectCombatInvisiblePhysicsCastPaths(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
  omittedTimelineIndexes: ReadonlySet<number> = new Set(),
): ReadonlySet<string> {
  const nodes = [
    ...graph.actionGroup.timelineActions.flatMap((timeline, index) =>
      omittedTimelineIndexes.has(index) ? [] : [timeline.sequence],
    ),
    ...graph.actionGroup.passiveEvents.flatMap(event => event.actions),
  ].flatMap(collectEnabledNativeActionNodes);
  const result = new Set<string>();
  for (const node of nodes) {
    if (!node.metadata.enabled || node.body.kind !== 'physicsCast') continue;
    const action = node.body.value;
    if (action.hitDistanceBlackboardKey !== '' || action.needTick) continue;
    const branchNodes = [node.body.whenHit, node.body.whenMiss].flatMap(
      collectEnabledNativeActionNodes,
    );
    const enabledBranchNodes = branchNodes.filter(child => child.metadata.enabled);
    if (
      enabledBranchNodes.length === 0 ||
      !enabledBranchNodes.every(child => {
        if (child.body.kind !== 'leaf' || child.body.value.family !== 'targetGroup') return false;
        const write = child.body.value.action;
        return (
          write.producerType === 'FindTargetAction' &&
          write.finderType === 'FixedPointFinder' &&
          write.validatorTypes.length === 0 &&
          write.postProcessorTypes.length === 0 &&
          (write.center === 'ActionOwner' ||
            (write.center === 'ContextTarget' &&
              write.centerContextKey === action.hitPositionTargetGroupKey))
        );
      })
    ) {
      continue;
    }
    const outputKeys = new Set([
      action.hitPositionTargetGroupKey,
      ...enabledBranchNodes.flatMap(child =>
        child.body.kind === 'leaf' && child.body.value.family === 'targetGroup'
          ? [child.body.value.action.targetGroupKey]
          : [],
      ),
    ]);
    const descendants = new Set(branchNodes);
    const otherNodes = nodes.filter(candidate => candidate !== node && !descendants.has(candidate));
    if (
      [...outputKeys].some(key =>
        otherNodes.some(candidate => {
          const usage = summarizeNativeTargetUsage(candidate);
          return usage.passesAllTargets || usage.reads.has(key);
        }),
      )
    ) {
      continue;
    }
    result.add(node.sourcePath);
  }
  return result;
}

/**
 * 只把“写入和所有跨时间线消费者均属于纯表现控制树”的动作黑板键判为可删除。
 * 从全部写入键开始反复收缩；一个候选依赖后来被判为战斗键时，依赖它的整棵树也会在下一轮退出。
 */
export function collectPresentationOnlyBlackboardKeys(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
  isUnusedByExternalResources?: (key: string) => boolean,
): ReadonlySet<string> {
  const timelines = skillSequences(graph);
  const inherited = inheritsSkillBlackboard(graph);
  const candidates = new Set(
    timelines.flatMap(sequence =>
      collectEnabledNativeActionNodes(sequence).flatMap(node =>
        node.body.kind === 'leaf' &&
        (node.body.value.family === 'blackboardMutation' ||
          node.body.value.family === 'blackboardCalculation')
          ? [node.body.value.action.key]
          : [],
      ),
    ),
  );
  if (inherited) {
    for (const key of candidates) {
      if (isUnusedByExternalResources?.(key) !== true) candidates.delete(key);
    }
  }
  const usages = timelines.map(blackboardKeys);
  let changed: boolean;
  do {
    changed = false;
    for (const key of candidates) {
      const consumers = timelines.filter((_, index) => usages[index]!.has(key));
      if (
        consumers.length === 0 ||
        consumers.some(
          sequence =>
            !sequence.actions.every(node => isPresentationActionNode(node, candidates, true)),
        )
      ) {
        candidates.delete(key);
        changed = true;
      }
    }
  } while (changed);
  return candidates;
}

/**
 * 来源阶段只裁剪已确认局部使用的表现随机值。整板继承或显式外部赋值都必须保留，
 * 等接收资源装配后再分析消费者；不能以当前技能里没有键名引用证明值不会传出。
 * 表现随机数不推进模拟的战斗概率流，这不适用于进入有效战斗分支的随机值。
 */
export function collectCombatInvisibleRandomBlackboardKeys(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
  isUnusedByExternalResources?: (key: string) => boolean,
): ReadonlySet<string> {
  const inherited = inheritsSkillBlackboard(graph);
  return collectCombatInvisibleRandomKeys(
    skillSequences(graph),
    key => !inherited || isUnusedByExternalResources?.(key) === true,
    collectPresentationOnlyBlackboardKeys(graph, isUnusedByExternalResources),
    collectPresentationOnlyTargetGroups(graph),
  );
}

function countExactString(value: unknown, expected: string): number {
  if (value === expected) return 1;
  if (Array.isArray(value))
    return value.reduce((count, child) => count + countExactString(child, expected), 0);
  if (value === null || typeof value !== 'object') return 0;
  return Object.values(value).reduce(
    (count, child) => count + countExactString(child, expected),
    0,
  );
}

/**
 * 只删除没有读取、也不会随整块黑板传出的技能局部常量赋值。
 * Buff 黑板可被外部查询，不能使用这项证明；EntityBB_ 也不属于技能局部数据。
 * 采用已核对的动作集合：实体/投射物生成及新动作默认阻止裁剪，不能猜测其传值方式。
 */
export function collectUnconsumedSkillLocalKeys(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
  skillRoot: Readonly<Record<string, unknown>>,
): ReadonlySet<string> {
  const nodes = skillSequences(graph).flatMap(collectEnabledNativeActionNodes);
  const closedFamilies = new Set<KnownNativeActionLeafSource['family']>([
    'presentation',
    'spatial',
    'inputControl',
    'timelineControl',
    'targetGroup',
    'condition',
    'blackboardMutation',
    'eventListener',
    'resource',
    'finisherSpGain',
    // Buff 只接收 assignItems；CastSkill 只传施法身份，不复制调用方动作黑板。
    'buffApplication',
    'buffFinish',
    'skillCast',
    // 这些动作的数值读取都显式携带键名，不把技能局部黑板整体传出。
    'damage',
    'timeDilation',
    'interrupt',
    'stumpControl',
    // 只转交 Buff 的清理归属，不传递技能局部黑板。
    'buffInheritance',
  ]);
  if (nodes.some(node => node.body.kind === 'leaf' && !closedFamilies.has(node.body.value.family)))
    return new Set();
  const localKeys = new Set(
    graph.declaredBlackboard
      .filter(entry => entry.isDynamic && !entry.key.startsWith('EntityBB_'))
      .map(entry => entry.key),
  );
  const writes = new Map<string, number>();
  for (const node of nodes) {
    if (node.body.kind !== 'leaf' || node.body.value.family !== 'blackboardMutation') continue;
    const action = node.body.value.action;
    if (
      localKeys.has(action.key) &&
      action.directValue &&
      action.operation === 'Assign' &&
      action.value.blackboardKey === null
    ) {
      writes.set(action.key, (writes.get(action.key) ?? 0) + 1);
    }
  }
  // 图切片不含施法条件/根 Buff 等数据，因此这些根字段也必须排除读取。
  const { actionGroupData, blackboard: _declarations, ...otherFields } = skillRoot;
  return new Set(
    [...writes]
      .filter(
        ([key, count]) =>
          countExactString(graph.actionGroup, key) === count &&
          countExactString(actionGroupData, key) === count &&
          countExactString(otherFields, key) === 0,
      )
      .map(([key]) => key),
  );
}

/** 保留技能各入口仍需读取的目标组，主动技能和投射物回调使用相同规则。 */
export function collectMaterializedTargetGroups(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
  presentationOnlyGroups = collectPresentationOnlyTargetGroups(graph),
): ReadonlySet<string> {
  return collectMaterializedSequenceTargetGroups(skillSequences(graph), presentationOnlyGroups);
}

/** 在完整 SkillData 范围证明纯表现目标链；战斗消费者阻止裁剪。 */
export function collectPresentationOnlyTargetGroups(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
): ReadonlySet<string> {
  const nodes = skillSequences(graph).flatMap(collectEnabledNativeActionNodes);
  const usages = new Map(nodes.map(node => [node, summarizeNativeTargetUsage(node)]));
  if ([...usages.values()].some(usage => usage.passesAllTargets)) return new Set();
  const references = (node: NativeActionNodeSource<KnownNativeActionLeafSource>, key: string) => {
    const usage = usages.get(node)!;
    return usage.reads.has(key) || usage.writes.has(key);
  };
  const candidates = new Set(
    nodes.flatMap(node => {
      if (node.body.kind !== 'leaf' || node.body.value.family !== 'targetGroup') return [];
      const action = node.body.value.action;
      return isPresentationQuery(action) ? [action.targetGroupKey] : [];
    }),
  );
  // 被拒绝查询本身也会成为其上游的消费者，因此反复收缩到稳定集合。
  let changed: boolean;
  do {
    changed = false;
    for (const key of candidates) {
      const mixedSequence = skillSequences(graph).some(sequence => {
        const actions = collectEnabledNativeActionNodes(sequence);
        return (
          actions.some(
            node =>
              node.body.kind === 'leaf' &&
              node.body.value.family === 'targetGroup' &&
              node.body.value.action.targetGroupKey === key,
          ) &&
          actions.some(
            node =>
              node.body.kind !== 'leaf' ||
              (node.body.value.family !== 'presentation' &&
                !(
                  node.body.value.family === 'targetGroup' &&
                  candidates.has(node.body.value.action.targetGroupKey)
                )),
          )
        );
      });
      const unsafe =
        mixedSequence ||
        nodes.some(node => {
          // 控制流自身也可能读目标（例如 ForEach.target），不能只扫描叶子。
          if (node.body.kind !== 'leaf') return references(node, key);
          const leaf = node.body.value;
          if (!references(node, key)) return false;
          return (
            leaf.family !== 'presentation' &&
            !(
              leaf.family === 'targetGroup' &&
              isPresentationQuery(leaf.action) &&
              candidates.has(leaf.action.targetGroupKey)
            )
          );
        });
      if (unsafe) {
        candidates.delete(key);
        changed = true;
      }
    }
  } while (changed);

  // 逐个检查位置组的生产者和消费者；同一时间线上的无关伤害不妨碍删除纯位置数据。
  // 有效回调、循环和非空间读取仍阻止删除。
  const leafNodesForSpatialPoints = nodes.filter(node => node.body.kind === 'leaf');
  const forEachTargetReads = new Set(
    nodes.flatMap(node =>
      node.body.kind === 'forEach' && node.body.target.targetSource === 'Context'
        ? [node.body.target.targetGroupKey]
        : [],
    ),
  );
  const isSpatialPointQuery = (action: TargetGroupActionSource) =>
    action.producerType === 'FindTargetAction' &&
    (action.finderType === 'SnapPointFinder' || action.finderType === 'PointFinder') &&
    action.validatorTypes.length === 0 &&
    action.postProcessorTypes.length === 0 &&
    action.priorityFilters.length === 0 &&
    action.shuffleTargets.length === 0 &&
    action.distanceValidators.length === 0;
  const spatialPointCandidates = new Set(
    leafNodesForSpatialPoints.flatMap(node => {
      if (node.body.kind !== 'leaf' || node.body.value.family !== 'targetGroup') return [];
      const action = node.body.value.action;
      return isSpatialPointQuery(action) ? [action.targetGroupKey] : [];
    }),
  );
  for (const key of spatialPointCandidates) {
    if (forEachTargetReads.has(key)) continue;
    const safe = nodes.every(node => {
      if (!references(node, key)) return true;
      if (node.body.kind === 'actionWithCallback')
        return node.body.value.family === 'spatial' && node.body.callback.actions.length === 0;
      if (node.body.kind !== 'leaf') return false;
      const usage = usages.get(node)!;
      if (
        node.body.value.family === 'targetGroup' &&
        node.body.value.action.targetGroupKey === key
      ) {
        const action = node.body.value.action;
        // 实体转位置只保存坐标；直接宿主引用不执行额外查询。
        const directPosition =
          action.producerType === 'ConvertToTargetContext' &&
          action.conversionOperation === 'ConvertEntityToPosition' &&
          action.conversionSource?.targetSource === 'Owner';
        return (isSpatialPointQuery(action) || directPosition) && !usage.reads.has(key);
      }
      return node.body.value.family === 'spatial' || node.body.value.family === 'stumpControl';
    });
    if (safe) candidates.add(key);
  }

  // PickTarget 有时只为随后 EffectAction 选择一个挂点实体。先证明输出组的所有叶消费者均为表现，
  // 再反向证明输入组只被这些 PickTarget 消费；这样可整条裁掉带 Shuffle/距离筛选的表现身份链，
  // 而不会把随机顺序冒充成稳定的战斗顺序。
  // EventListener 叶的 action 内嵌响应树；响应节点已经在上方递归展开，容器本身不能再作为
  // 对其中 Context 键的一次独立消费者，否则所有事件内数据流都会被重复判为未知读取。
  const leafNodes = nodes.filter(
    node => node.body.kind === 'leaf' && node.body.value.family !== 'eventListener',
  );
  const controlTargetReads = new Set(
    nodes.flatMap(node =>
      node.body.kind === 'forEach' && node.body.target.targetSource === 'Context'
        ? [node.body.target.targetGroupKey]
        : [],
    ),
  );
  const presentationPickOutputs = new Set<string>();
  for (const node of leafNodes) {
    if (
      node.body.kind !== 'leaf' ||
      node.body.value.family !== 'targetGroup' ||
      node.body.value.action.producerType !== 'PickTargetAction'
    )
      continue;
    const outputKey = node.body.value.action.targetGroupKey;
    if (controlTargetReads.has(outputKey)) continue;
    const consumersArePresentation = leafNodes.every(candidate => {
      if (candidate === node || candidate.body.kind !== 'leaf') return true;
      if (!references(candidate, outputKey)) return true;
      return (
        isCombatInvisiblePresentationLeaf(candidate) ||
        (candidate.body.value.family === 'targetGroup' &&
          candidate.body.value.action.producerType === 'PickTargetAction' &&
          candidate.body.value.action.targetGroupKey === outputKey)
      );
    });
    if (consumersArePresentation) presentationPickOutputs.add(outputKey);
  }
  const presentationPickInputs = new Set<string>();
  for (const node of leafNodes) {
    if (
      node.body.kind !== 'leaf' ||
      node.body.value.family !== 'targetGroup' ||
      node.body.value.action.producerType !== 'PickTargetAction' ||
      !presentationPickOutputs.has(node.body.value.action.targetGroupKey)
    )
      continue;
    for (const input of node.body.value.action.inputTargets) {
      if (input.targetSource === 'Context' && input.targetGroupKey !== '') {
        presentationPickInputs.add(input.targetGroupKey);
      }
    }
  }
  for (const inputKey of [...presentationPickInputs]) {
    if (controlTargetReads.has(inputKey)) {
      presentationPickInputs.delete(inputKey);
      continue;
    }
    const consumersStayInPresentationChain = leafNodes.every(node => {
      if (node.body.kind !== 'leaf') return true;
      if (!references(node, inputKey)) return true;
      if (
        node.body.value.family === 'targetGroup' &&
        node.body.value.action.targetGroupKey === inputKey
      )
        return true;
      return (
        node.body.value.family === 'targetGroup' &&
        node.body.value.action.producerType === 'PickTargetAction' &&
        presentationPickOutputs.has(node.body.value.action.targetGroupKey)
      );
    });
    if (!consumersStayInPresentationChain) presentationPickInputs.delete(inputKey);
  }

  // ConvertToTargetContext(None) 也常只把受击来源转存给转向、移动和相机。它与查找器不同，
  // 不能按来源类型猜实体；从全部候选开始反复剔除任何进入战斗叶或控制迭代的键，只保留完整的
  // 纯表现 Context 链。这样外部受击仍能触发后续 jumpTimeline，而无需伪造攻击者空间。
  const presentationConvertedContexts = new Set(
    leafNodes.flatMap(node =>
      node.body.kind === 'leaf' &&
      node.body.value.family === 'targetGroup' &&
      node.body.value.action.producerType === 'ConvertToTargetContext' &&
      node.body.value.action.conversionOperation === 'None'
        ? [node.body.value.action.targetGroupKey]
        : [],
    ),
  );
  let convertedContextsChanged: boolean;
  do {
    convertedContextsChanged = false;
    for (const key of presentationConvertedContexts) {
      if (controlTargetReads.has(key)) {
        presentationConvertedContexts.delete(key);
        convertedContextsChanged = true;
        continue;
      }
      const safe = leafNodes.every(node => {
        if (node.body.kind !== 'leaf') return true;
        const leaf = node.body.value;
        const usage = usages.get(node)!;
        if (!references(node, key)) return true;
        if (leaf.family === 'targetGroup') {
          if (leaf.action.targetGroupKey === key && !usage.reads.has(key)) return true;
          return presentationConvertedContexts.has(leaf.action.targetGroupKey);
        }
        if (['presentation', 'spatial', 'stumpControl'].includes(leaf.family)) return true;
        return (
          leaf.family === 'condition' &&
          leaf.action.kind === 'distance' &&
          !leaf.action.lessThan &&
          leaf.action.distance >= 0 &&
          !leaf.action.includeTargetRadius &&
          !leaf.action.containsHittableObject
        );
      });
      if (!safe) {
        presentationConvertedContexts.delete(key);
        convertedContextsChanged = true;
      }
    }
  } while (convertedContextsChanged);

  return new Set([
    ...candidates,
    ...presentationPickOutputs,
    ...presentationPickInputs,
    ...presentationConvertedContexts,
  ]);
}

/**
 * 收集只被写入、从未被任何后续动作或控制流读取的 Context 组。
 * 这项事实本身不允许省略查询；调用方还必须证明 FindTargetAction 的 owner/center 可解析，
 * 且查询没有随机取样、写入等副作用，保留“空结果也返回 true”的短路语义。
 */
export function collectUnconsumedTargetGroups(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
): ReadonlySet<string> {
  const nodes = skillSequences(graph).flatMap(collectEnabledNativeActionNodes);
  const usages = nodes.map(summarizeNativeTargetUsage);
  if (usages.some(usage => usage.passesAllTargets)) return new Set();
  const reads = new Set(usages.flatMap(usage => [...usage.reads]));
  const keys = new Set(
    nodes.flatMap(node =>
      node.body.kind === 'leaf' && node.body.value.family === 'targetGroup'
        ? [node.body.value.action.targetGroupKey]
        : [],
    ),
  );
  return new Set([...keys].filter(key => !reads.has(key)));
}
