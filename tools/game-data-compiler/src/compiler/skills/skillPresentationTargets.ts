import {
  collectNativeActionNodes,
  type NativeActionNodeSource,
  type NativeSequenceSource,
} from '../../source/controlFlow.ts';
import type { SkillActionGraphSource } from '../../source/skillActionGraph.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { TargetGroupActionSource } from '../../source/targetGroup.ts';

function isPresentationQuery(action: TargetGroupActionSource): boolean {
  return (
    action.producerType === 'FindTargetAction' &&
    (action.finderType === 'SourceFinder' || action.finderType === 'FixedPointFinder') &&
    action.validatorTypes.length === 0 &&
    action.postProcessorTypes.length === 0
  );
}

const PRESENTATION_ONLY_CONDITION_KINDS = new Set([
  'mainOperator',
  'floatCompare',
  'distance',
  'objectTypeMatch',
  'superArmor',
  'skillCameraMotionFree',
  'targetInScreen',
]);

function isPresentationConditionNode(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): boolean {
  if (!node.metadata.enabled) return true;
  if (node.body.kind !== 'leaf') return false;
  const leaf = node.body.value;
  return (
    leaf.family === 'presentationCalculation' ||
    (leaf.family === 'condition' && PRESENTATION_ONLY_CONDITION_KINDS.has(leaf.action.kind))
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
      body.value.family === 'presentation' ||
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
    return [
      'presentation',
      'presentationCalculation',
      'spatialMeasurement',
      'targetGroup',
      'condition',
      'blackboardMutation',
      'blackboardCalculation',
    ].includes(body.value.family);
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
): ReadonlySet<string> {
  const outputs = new Set<string>();
  for (const node of collectNativeActionNodes(sequence)) {
    if (!node.metadata.enabled || node.body.kind !== 'leaf') continue;
    const leaf = node.body.value;
    if (leaf.family === 'targetGroup') outputs.add(leaf.action.targetGroupKey);
    if (leaf.family === 'blackboardMutation' || leaf.family === 'blackboardCalculation') {
      outputs.add(leaf.action.key);
    }
    if (leaf.family === 'presentationCalculation') {
      const action = leaf.action;
      for (const key of 'outputKeys' in action ? action.outputKeys : [action.outputKey]) {
        outputs.add(key);
      }
    }
    if (leaf.family === 'spatialMeasurement') outputs.add(leaf.action.outputKey);
  }
  return outputs;
}

function presentationSelectionBlackboardWriteKeys(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
): ReadonlySet<string> {
  return new Set(
    collectNativeActionNodes(sequence).flatMap(node =>
      node.metadata.enabled &&
      node.body.kind === 'leaf' &&
      (node.body.value.family === 'blackboardMutation' ||
        node.body.value.family === 'blackboardCalculation')
        ? [node.body.value.action.key]
        : [],
    ),
  );
}

/**
 * 收集“查询/条件/临时黑板只为最终表现动作服务”的完整调度时间线。
 *
 * 镜头选敌并不总是简单的 CameraAction：原生会先查目标、ForEach 计算左右侧，再跨多个
 * 时间线复用 Context 与黑板值。这里先按动作族找出不含任何战斗副作用的候选子图，再反复
 * 验证候选产生的每个 Context/黑板输出都没有流向候选集外。任一伤害、Buff、资源或未知
 * 控制动作读取这些输出，整条生产链都会退出候选，不能借“最终有相机动作”裁掉战斗逻辑。
 */
export function collectPresentationSelectionTimelineIndexes(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
): ReadonlySet<number> {
  const timelines = graph.actionGroup.timelineActions;
  const candidates = new Set(
    timelines.flatMap((timeline, index) => {
      const nodes = collectNativeActionNodes(timeline.sequence).filter(
        node => node.metadata.enabled,
      );
      const containsPresentation = nodes.some(
        node =>
          node.body.kind === 'leaf' &&
          (node.body.value.family === 'presentation' ||
            node.body.value.family === 'presentationCalculation'),
      );
      return containsPresentation && timeline.sequence.actions.every(isPresentationSelectionNode)
        ? [index]
        : [];
    }),
  );
  const outputsByTimeline = timelines.map(timeline =>
    presentationSelectionOutputKeys(timeline.sequence),
  );
  const blackboardWritesByTimeline = timelines.map(timeline =>
    presentationSelectionBlackboardWriteKeys(timeline.sequence),
  );
  const orderedLeafNodes = timelines.flatMap((timeline, timelineIndex) =>
    collectNativeActionNodes(timeline.sequence).flatMap((node, nodeIndex) =>
      node.metadata.enabled && node.body.kind === 'leaf'
        ? [{ timelineIndex, nodeIndex, node }]
        : [],
    ),
  );

  // 一个末端黑板写入即使当前 SkillData 内没人读取，仍是动作作用域的可观察状态，不能因为
  // 同一时间线里恰好还有镜头动作而删除。只有该值后来确实进入本候选表现子图，写入才属于
  // 可裁剪的中间量；这同时防止表现计算与同名正式动作槽位相互覆盖时被误判。
  for (const index of [...candidates]) {
    const hasTerminalBlackboardWrite = [...blackboardWritesByTimeline[index]!].some(key => {
      const references = orderedLeafNodes.filter(
        ({ node }) =>
          node.body.kind === 'leaf' &&
          JSON.stringify(node.body.value).includes(JSON.stringify(key)),
      );
      const last = references.at(-1)?.node;
      return (
        last?.body.kind === 'leaf' &&
        (last.body.value.family === 'blackboardMutation' ||
          last.body.value.family === 'blackboardCalculation') &&
        last.body.value.action.key === key
      );
    });
    if (hasTerminalBlackboardWrite) candidates.delete(index);
  }

  let changed: boolean;
  do {
    changed = false;
    for (const index of [...candidates]) {
      const outputs = outputsByTimeline[index]!;
      const outputEscapes = [...outputs].some(key =>
        timelines.some(
          (timeline, consumerIndex) =>
            consumerIndex >= index &&
            !candidates.has(consumerIndex) &&
            countExactString(timeline.sequence, key) > 0,
        ),
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
 * 都没有消费者。较早时间线中的同名临时组不会被倒推成该动作的输出消费者。
 */
export function collectCombatInvisiblePhysicsCastPaths(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
): ReadonlySet<string> {
  const nodes = graph.actionGroup.timelineActions.flatMap(timeline =>
    collectNativeActionNodes(timeline.sequence),
  );
  const result = new Set<string>();
  for (const [index, node] of nodes.entries()) {
    if (!node.metadata.enabled || node.body.kind !== 'physicsCast') continue;
    const action = node.body.value;
    if (action.hitDistanceBlackboardKey !== '' || action.needTick) continue;
    const branchNodes = [node.body.whenHit, node.body.whenMiss].flatMap(collectNativeActionNodes);
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
    const laterNodes = nodes.slice(index + 1).filter(candidate => !descendants.has(candidate));
    if (
      [...outputKeys].some(key =>
        laterNodes.some(candidate => JSON.stringify(candidate.body).includes(JSON.stringify(key))),
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
): ReadonlySet<string> {
  const timelines = graph.actionGroup.timelineActions.map(item => item.sequence);
  // SpawnAbilityEntity 会把当前动作黑板的完整 direct 快照交给实体子技能。这里尚未装配实体
  // 定义，无法证明哪些键会被子技能读取；因此只要存在实体生成，任一写入都可能跨作用域影响
  // 战斗。表现裁剪必须保守退出，后续整名干员优化器会在实体定义可见时再做精确活性分析。
  const actionBlackboardEscapes = timelines.some(sequence =>
    collectNativeActionNodes(sequence).some(
      node =>
        node.metadata.enabled &&
        node.body.kind === 'leaf' &&
        node.body.value.family === 'abilityEntity',
    ),
  );
  if (actionBlackboardEscapes) return new Set();
  const candidates = new Set(
    timelines.flatMap(sequence =>
      collectNativeActionNodes(sequence).flatMap(node =>
        node.body.kind === 'leaf' &&
        (node.body.value.family === 'blackboardMutation' ||
          node.body.value.family === 'blackboardCalculation')
          ? [node.body.value.action.key]
          : [],
      ),
    ),
  );
  let changed: boolean;
  do {
    changed = false;
    for (const key of candidates) {
      const encodedKey = JSON.stringify(key);
      const consumers = timelines.filter(sequence => JSON.stringify(sequence).includes(encodedKey));
      if (
        consumers.length === 0 ||
        consumers.some(sequence => !isPresentationOnlyActionSequence(sequence, candidates))
      ) {
        candidates.delete(key);
        changed = true;
      }
    }
  } while (changed);
  return candidates;
}

/**
 * 只接受 RandomAction 写入、且所有已投影读取都来自 PointFinder 坐标槽位的键。
 * 没有已投影读取的随机值同样不可影响战斗：严格来源 parser 已把所有数值/条件/Buff 输入保留，
 * 剩余引用只可能位于被明确裁掉的表现字段或本来就未使用。Next 的概率样本流只承载战斗概率条件，
 * 不复刻表现随机数对 Unity 随机流的推进。任一战斗或未知消费者都会使候选退出。
 */
export function collectCombatInvisibleRandomBlackboardKeys(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
): ReadonlySet<string> {
  const presentationOnlyCalculationKeys = collectPresentationOnlyBlackboardKeys(graph);
  // collectNativeActionNodes 同时返回控制流容器与其后代；容器的 body 会再次内嵌所有叶子。
  // 数据流消费者只存在于叶动作上，因此必须先去掉容器，避免同一黑板引用被重复计为未知读取。
  const nodes = graph.actionGroup.timelineActions
    .flatMap(timeline => collectNativeActionNodes(timeline.sequence))
    .filter(node => node.body.kind === 'leaf');
  const candidates = new Set(
    nodes.flatMap(node =>
      node.body.kind === 'leaf' && node.body.value.family === 'randomBlackboard'
        ? [node.body.value.action.targetKey]
        : [],
    ),
  );
  for (const key of candidates) {
    const safe = nodes.every(node => {
      const occurrences = countExactString(node.body, key);
      if (occurrences === 0) return true;
      if (
        node.body.kind === 'leaf' &&
        node.body.value.family === 'randomBlackboard' &&
        node.body.value.action.targetKey === key
      ) {
        return occurrences === 1;
      }
      if (node.body.kind === 'leaf' && node.body.value.family === 'targetGroup') {
        const action = node.body.value.action;
        const pointOccurrences =
          action.finderType === 'PointFinder'
            ? (action.finderPointBlackboardKeys ?? []).filter(value => value === key).length
            : 0;
        if (pointOccurrences > 0 && pointOccurrences === occurrences) {
          return true;
        }
      }
      if (node.body.kind === 'leaf' && node.body.value.family === 'projectile') {
        // 首帧零距离投影独立证明命中/阻挡/到达事件；未进入回调黑板的实体赋值只控制
        // 原生投射物移动。回调若声明对应 EntityBB，作用域编译会保留赋值并使缺失随机值报错。
        const assignmentOccurrences = node.body.value.action.assignments.filter(
          assignment => assignment.inputValueKey === key,
        ).length;
        if (assignmentOccurrences > 0 && assignmentOccurrences === occurrences) return true;
      }
      if (node.body.kind === 'leaf' && node.body.value.family === 'blackboardCalculation') {
        const outputKey = node.body.value.action.key;
        const outputWriterOccurrences = nodes.filter(
          candidate =>
            candidate.body.kind === 'leaf' &&
            (candidate.body.value.family === 'blackboardCalculation' ||
              candidate.body.value.family === 'blackboardMutation') &&
            candidate.body.value.action.key === outputKey,
        ).length;
        const outputHasNoOtherConsumer =
          nodes.reduce(
            (count, candidate) => count + countExactString(candidate.body, outputKey),
            0,
          ) === outputWriterOccurrences;
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

function collectNodesIncludingEventResponses(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
): readonly NativeActionNodeSource<KnownNativeActionLeafSource>[] {
  const nodes = collectNativeActionNodes(sequence);
  return [
    ...nodes,
    ...nodes.flatMap(node =>
      node.body.kind === 'leaf' && node.body.value.family === 'eventListener'
        ? node.body.value.action.events.flatMap(event =>
            event.actions.flatMap(collectNodesIncludingEventResponses),
          )
        : [],
    ),
  ];
}

/**
 * 在完整 SkillData 范围验证目标查询仅服务于表现，不局限于单个调度序列。
 * 只允许无过滤的来源/固定点查询；任一战斗消费者都会保留查询并交给严格投影报错。
 */
export function collectPresentationOnlyTargetGroups(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
): ReadonlySet<string> {
  const nodes = graph.actionGroup.timelineActions.flatMap(timeline =>
    collectNodesIncludingEventResponses(timeline.sequence),
  );
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
      const mixedSequence = graph.actionGroup.timelineActions.some(timeline => {
        const actions = collectNativeActionNodes(timeline.sequence);
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
          if (node.body.kind !== 'leaf')
            return JSON.stringify(node.body).includes(JSON.stringify(key));
          const leaf = node.body.value;
          if (!JSON.stringify(leaf).includes(JSON.stringify(key))) return false;
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

  // SnapPointFinder 可能只为 MoveTo 等空间表现生成位置。按叶级引用证明，避免同一时间线
  // 还包含伤害/资源动作时被粗粒度 mixedSequence 误伤；任何非空间叶或 ForEach 读取都会拒绝。
  const leafNodesForSpatialPoints = nodes.filter(node => node.body.kind === 'leaf');
  const forEachTargetReads = new Set(
    nodes.flatMap(node =>
      node.body.kind === 'forEach' && node.body.target.targetSource === 'Context'
        ? [node.body.target.targetGroupKey]
        : [],
    ),
  );
  const spatialPointCandidates = new Set(
    leafNodesForSpatialPoints.flatMap(node => {
      if (node.body.kind !== 'leaf' || node.body.value.family !== 'targetGroup') return [];
      const action = node.body.value.action;
      return action.producerType === 'FindTargetAction' &&
        action.finderType === 'SnapPointFinder' &&
        action.validatorTypes.length === 0 &&
        action.postProcessorTypes.length === 0
        ? [action.targetGroupKey]
        : [];
    }),
  );
  for (const key of spatialPointCandidates) {
    if (forEachTargetReads.has(key)) continue;
    const safe = leafNodesForSpatialPoints.every(node => {
      if (node.body.kind !== 'leaf') return true;
      const occurrences = countExactString(node.body.value, key);
      if (occurrences === 0) return true;
      if (node.body.value.family === 'targetGroup' && node.body.value.action.targetGroupKey === key)
        return occurrences === 1;
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
      if (!JSON.stringify(candidate.body.value).includes(JSON.stringify(outputKey))) return true;
      return (
        candidate.body.value.family === 'presentation' ||
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
      if (!JSON.stringify(node.body.value).includes(JSON.stringify(inputKey))) return true;
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
        const occurrences = countExactString(leaf, key);
        if (occurrences === 0) return true;
        if (leaf.family === 'targetGroup') {
          if (leaf.action.targetGroupKey === key && occurrences === 1) return true;
          return presentationConvertedContexts.has(leaf.action.targetGroupKey);
        }
        if (['presentation', 'spatial', 'stumpControl'].includes(leaf.family)) return true;
        return (
          leaf.family === 'condition' &&
          (leaf.action.kind === 'targetAngle' ||
            (leaf.action.kind === 'distance' &&
              !leaf.action.lessThan &&
              leaf.action.distance >= 0 &&
              !leaf.action.includeTargetRadius &&
              !leaf.action.containsHittableObject))
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
 * 从而保留原生“空结果也覆盖组并返回 true”的短路语义。
 */
export function collectUnconsumedTargetGroups(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
): ReadonlySet<string> {
  const nodes = graph.actionGroup.timelineActions.flatMap(timeline =>
    collectNativeActionNodes(timeline.sequence),
  );
  const keys = new Set(
    nodes.flatMap(node =>
      node.body.kind === 'leaf' && node.body.value.family === 'targetGroup'
        ? [node.body.value.action.targetGroupKey]
        : [],
    ),
  );
  for (const key of keys) {
    const onlyProducerWrites = nodes.every(node => {
      const occurrences = countExactString(node.body, key);
      if (occurrences === 0) return true;
      if (node.body.kind !== 'leaf') return false;
      return (
        node.body.value.family === 'targetGroup' &&
        node.body.value.action.targetGroupKey === key &&
        occurrences === 1
      );
    });
    if (!onlyProducerWrites) keys.delete(key);
  }
  return keys;
}
