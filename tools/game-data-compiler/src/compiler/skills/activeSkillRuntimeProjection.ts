import type { ScheduledSequenceDefinition } from '../../../../../packages/game-data-contract/src/actions.ts';
import type { SkillDefinition } from '../../../../../packages/game-data-contract/src/skills.ts';
import { NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY } from '../../../../../packages/game-data-contract/src/conditions.ts';
import { numericDeclaredBlackboard } from '../../source/blackboard.ts';
import type { SkillPatchSource } from '../../source/skillPatch.ts';
import { parseKnownSkillActionGraphSource } from '../../source/skillActionGraph.ts';
import { collectNativeActionNodes, type NativeSequenceSource } from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { TargetGroupActionSource } from '../../source/targetGroup.ts';
import type { TargetReferenceSource } from '../../source/target.ts';
import {
  compileCombatActionSequenceSource,
  collectCombatInvisiblePresentationAssignmentKeys,
} from '../buffs/buffRuntimeProjection.ts';
import type {
  CombatActionProjectionContextSource,
  CombatActionProjectionExtensionsSource,
} from '../combatProjectionCommon.ts';
import {
  isDynamicSingleEnemySmartTargetGroup,
  isDynamicSingleEnemyTagTargetGroup,
  isStaticSingleEnemyTargetGroup,
  isCurrentTargetRestrictedSingleEnemyTargetGroup,
} from '../combatProjectionCommon.ts';
import type { CompiledBuffSequenceSource } from '../actions/combatActionProjectionTypes.ts';
import {
  prepareSkillDefinitionInputSource,
  assertNoUnprojectedSkillRootEffects,
  compileStrictSwitchToBuffCastSource,
} from './skillDefinitionInput.ts';
import {
  collectPresentationOnlyBlackboardKeys,
  collectPresentationOnlyTargetGroups,
  collectUnconsumedTargetGroups,
  collectCombatInvisibleRandomBlackboardKeys,
  collectCombatInvisiblePhysicsCastPaths,
  collectPresentationSelectionTimelineIndexes,
  isPresentationOnlyActionSequence,
} from './skillPresentationTargets.ts';
import { parseSkillTargetSelectionHeaderSource } from '../../source/skillTargetSelection.ts';
import { compileSkillSmartTargetSource } from '../conditions/comboSmartTarget.ts';
import { assertPresentationCalculationIsolation } from '../scenario/presentationCalculationIsolation.ts';
import {
  compareKnownNumbers,
  isStaticControlledOperatorWrite,
  isStaticZeroSpacePointWrite,
  propagateGuaranteedSingletonZeroSpaceFacts,
} from '../optimization/targetGroupCardinalityAnalysis.ts';

/** 正式调度输出子集；原生时间轴结束帧必填，动作仍限于已支持的公共投影。 */
export type CompiledActiveSkillTimelineSequenceSource = Readonly<
  Required<Pick<ScheduledSequenceDefinition, 'startFrame' | 'endFrame'>>
> & {
  readonly sequence: CompiledBuffSequenceSource;
};

/**
 * 主动技能与实体子技能共用的装配结果：黑板是实例初值，不再充当静态求值环境。
 * 原生时长与技能块宽度仍分别保留；技能等级的具体取值由最终消费者选择。
 */
export interface CompiledActiveSkillRuntimeProjectionSource {
  readonly skillId: string;
  readonly durationFrame: number;
  readonly timelineBlockFrames: number;
  readonly exclusiveFrame: number;
  readonly offsetRecordFrame: number;
  /**
   * 原生输入窗口的编译期证据。它只供最终技能组装配选择“下一段”窗口，
   * 不属于 Endaxis 运行时技能契约，也不能直接按最早帧压成技能块宽度。
   */
  readonly allowNextSkillTransitions: readonly {
    readonly startFrame: number;
    readonly endFrame: number;
    readonly skillIds: readonly string[];
    readonly direct: boolean;
  }[];
  readonly inputWindows?: SkillDefinition['inputWindows'];
  readonly blackboard: NonNullable<SkillDefinition['blackboard']>;
  readonly scheduledSequences: readonly CompiledActiveSkillTimelineSequenceSource[];
  readonly smartTarget?: 'enemy' | 'input' | 'trigger';
  readonly switchToBuffCast?: {
    readonly currentSkillTypes?: readonly import('../../../../../packages/game-data-contract/src/primitives.ts').SkillType[];
    readonly requiresCurrentSkillNotInterruptible?: boolean;
    readonly condition?: import('../actions/combatActionProjectionTypes.ts').CompiledBuffConditionSource;
    readonly asSkillCast: boolean;
    readonly sequence: CompiledBuffSequenceSource;
  };
}

function directBooleanBlackboardAssignments(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
): ReadonlyMap<string, 0 | 1> {
  const result = new Map<string, 0 | 1>();
  for (const node of sequence.actions.filter(node => node.metadata.enabled)) {
    if (
      node.body.kind !== 'leaf' ||
      node.body.value.family !== 'blackboardMutation' ||
      node.body.value.action.operation !== 'Assign' ||
      !node.body.value.action.directValue ||
      node.body.value.action.value.blackboardKey !== null ||
      (node.body.value.action.value.value !== 0 && node.body.value.action.value.value !== 1)
    ) {
      continue;
    }
    result.set(node.body.value.action.key, node.body.value.action.value.value as 0 | 1);
  }
  return result;
}

/**
 * 原生技能常用 CheckEntityNum 在同一 IfElse 中把“是否有实体目标”缓存成 0/1，
 * 后续每箭用该值选择 OnlyHit 或自由命中。这里从结构建立 BB→Context 关系；同名 BB
 * 只要出现不属于 0/1 镜像的写入就不参与证明。
 */
function collectEnemyPresenceBlackboardKeys(
  graph: ReturnType<typeof parseKnownSkillActionGraphSource>,
  atMostOneZeroSpaceKeys: ReadonlySet<string>,
): ReadonlyMap<string, string> {
  const candidates = new Map<string, string>();
  const conflicts = new Set<string>();
  const allNodes = graph.actionGroup.timelineActions.flatMap(timeline =>
    collectNativeActionNodes(timeline.sequence),
  );
  for (const node of allNodes) {
    if (node.body.kind !== 'ifElse') continue;
    const conditions = node.body.condition.actions.filter(child => child.metadata.enabled);
    const condition = conditions[0];
    if (
      conditions.length !== 1 ||
      condition?.body.kind !== 'leaf' ||
      condition.body.value.family !== 'condition' ||
      condition.body.value.action.kind !== 'entityCount' ||
      condition.body.value.action.targetSource !== 'Context' ||
      !atMostOneZeroSpaceKeys.has(condition.body.value.action.targetGroupKey) ||
      condition.body.value.action.containsHittableTarget ||
      condition.body.value.action.excludeDeadEntity ||
      condition.body.value.action.storeKey !== '' ||
      compareKnownNumbers(
        1,
        condition.body.value.action.comparison,
        condition.body.value.action.minimumCount,
      ) !== true ||
      compareKnownNumbers(
        0,
        condition.body.value.action.comparison,
        condition.body.value.action.minimumCount,
      ) !== false
    ) {
      continue;
    }
    const whenTrue = directBooleanBlackboardAssignments(node.body.whenTrue);
    const whenFalse = directBooleanBlackboardAssignments(node.body.whenFalse);
    for (const [key, value] of whenTrue) {
      if (value !== 1 || whenFalse.get(key) !== 0) continue;
      const targetGroupKey = condition.body.value.action.targetGroupKey;
      const previous = candidates.get(key);
      if (previous !== undefined && previous !== targetGroupKey) conflicts.add(key);
      else candidates.set(key, targetGroupKey);
    }
  }
  for (const node of allNodes) {
    if (
      node.body.kind !== 'leaf' ||
      node.body.value.family !== 'blackboardMutation' ||
      !candidates.has(node.body.value.action.key)
    ) {
      continue;
    }
    const action = node.body.value.action;
    if (
      action.operation !== 'Assign' ||
      !action.directValue ||
      action.value.blackboardKey !== null ||
      (action.value.value !== 0 && action.value.value !== 1)
    ) {
      conflicts.add(action.key);
    }
  }
  for (const key of conflicts) candidates.delete(key);
  return candidates;
}

function conditionGuaranteedEnemyContextKey(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
  enemyPresenceBlackboardKeys: ReadonlyMap<string, string>,
  atMostOneZeroSpaceKeys: ReadonlySet<string>,
): string | null {
  const nodes = sequence.actions.filter(node => node.metadata.enabled);
  const node = nodes[0];
  if (nodes.length !== 1 || node?.body.kind !== 'leaf' || node.body.value.family !== 'condition') {
    return null;
  }
  const condition = node.body.value.action;
  if (
    condition.kind === 'entityCount' &&
    condition.targetSource === 'Context' &&
    atMostOneZeroSpaceKeys.has(condition.targetGroupKey) &&
    !condition.containsHittableTarget &&
    !condition.excludeDeadEntity &&
    condition.storeKey === '' &&
    compareKnownNumbers(1, condition.comparison, condition.minimumCount) === true &&
    compareKnownNumbers(0, condition.comparison, condition.minimumCount) === false
  ) {
    return condition.targetGroupKey;
  }
  if (condition.kind !== 'floatCompare') return null;
  const leftKey = condition.left.blackboardKey;
  const rightKey = condition.right.blackboardKey;
  if (
    leftKey !== null &&
    rightKey === null &&
    condition.right.value === 1 &&
    compareKnownNumbers(1, condition.comparison, 1) === true &&
    compareKnownNumbers(0, condition.comparison, 1) === false
  ) {
    return enemyPresenceBlackboardKeys.get(leftKey) ?? null;
  }
  if (
    rightKey !== null &&
    leftKey === null &&
    condition.left.value === 1 &&
    compareKnownNumbers(1, condition.comparison, 1) === true &&
    compareKnownNumbers(1, condition.comparison, 0) === false
  ) {
    return enemyPresenceBlackboardKeys.get(rightKey) ?? null;
  }
  return null;
}

function collectGuardedProjectilePaths(
  graph: ReturnType<typeof parseKnownSkillActionGraphSource>,
  atMostOneZeroSpaceKeys: ReadonlySet<string>,
): {
  readonly onlyHit: ReadonlySet<string>;
  readonly zeroSpace: ReadonlySet<string>;
} {
  const presenceKeys = collectEnemyPresenceBlackboardKeys(graph, atMostOneZeroSpaceKeys);
  const onlyHit = new Set<string>();
  const zeroSpace = new Set<string>();
  const visitSequence = (
    sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
    guaranteedEnemyKeys: ReadonlySet<string>,
  ): void => {
    for (const node of sequence.actions.filter(node => node.metadata.enabled)) {
      if (node.body.kind === 'leaf') {
        if (node.body.value.family === 'projectile') {
          const launch = node.body.value.action;
          if (
            launch.target.targetSource === 'Context' &&
            guaranteedEnemyKeys.has(launch.target.targetGroupKey)
          ) {
            zeroSpace.add(node.sourcePath);
          }
          if (
            launch.targetFilterMode === 'OnlyHit' &&
            launch.targetFilterSettings?.targetSource === 'Context' &&
            guaranteedEnemyKeys.has(launch.targetFilterSettings.targetGroupKey)
          ) {
            onlyHit.add(node.sourcePath);
          }
        }
        continue;
      }
      if (node.body.kind === 'ifElse') {
        const guaranteedKey = conditionGuaranteedEnemyContextKey(
          node.body.condition,
          presenceKeys,
          atMostOneZeroSpaceKeys,
        );
        visitSequence(
          node.body.whenTrue,
          guaranteedKey === null
            ? guaranteedEnemyKeys
            : new Set([...guaranteedEnemyKeys, guaranteedKey]),
        );
        visitSequence(node.body.whenFalse, guaranteedEnemyKeys);
        continue;
      }
      const nested: NativeSequenceSource<KnownNativeActionLeafSource>[] = [];
      if (node.body.kind === 'actionWithCallback') nested.push(node.body.callback);
      else if (node.body.kind === 'once' || node.body.kind === 'forEach')
        nested.push(node.body.action);
      else if (node.body.kind === 'physicsCast') nested.push(node.body.whenHit, node.body.whenMiss);
      else if (node.body.kind === 'channeling') nested.push(node.body.actionOnTick);
      else if (node.body.kind === 'timelineJump') nested.push(node.body.condition);
      else if (node.body.kind === 'tickInterval' || node.body.kind === 'tickIntervalV2')
        nested.push(node.body.actionOnTick);
      else if (node.body.kind === 'togglable') nested.push(node.body.condition, node.body.action);
      else if (node.body.kind === 'switch')
        nested.push(...node.body.options.map(option => option.action));
      nested.forEach(child => visitSequence(child, guaranteedEnemyKeys));
    }
  };
  graph.actionGroup.timelineActions.forEach(timeline =>
    visitSequence(timeline.sequence, new Set()),
  );
  return { onlyHit, zeroSpace };
}

/**
 * 只折叠标准木桩模型中可由来源事实直接证明的纯条件序列。未知条件保持 unknown，
 * 让调用方同时遍历两个分支；这里不参与正式运行时条件编译，也不读取技能名或 Context 键名。
 */
function evaluateStaticStumpConditionSequence(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
  staticEnemyTargetGroupKeys: ReadonlySet<string>,
): boolean | undefined {
  if (sequence.onlyExecuteWhenSourceIsMainCharacter || sequence.onlyExecuteWhenSourceIsGuard)
    return undefined;
  const enabled = sequence.actions.filter(node => node.metadata.enabled);
  if (enabled.length === 0) return undefined;
  for (const node of enabled) {
    if (node.body.kind !== 'leaf' || node.body.value.family !== 'condition') return undefined;
    const condition = node.body.value.action;
    if (condition.kind === 'entityCount') {
      if (
        condition.targetSource !== 'Context' ||
        !staticEnemyTargetGroupKeys.has(condition.targetGroupKey) ||
        condition.containsHittableTarget ||
        condition.excludeDeadEntity ||
        condition.storeKey !== ''
      )
        return undefined;
      const result = compareKnownNumbers(1, condition.comparison, condition.minimumCount);
      if (result === undefined) return undefined;
      if (!result) return false;
      continue;
    }
    if (condition.kind === 'distance') {
      const sourceIsMainCharacter = condition.source.targetSource === 'MainCharacter';
      const targetIsMainCharacter = condition.target.targetSource === 'MainCharacter';
      const sourceIsStaticEnemy =
        condition.source.targetSource === 'Context' &&
        staticEnemyTargetGroupKeys.has(condition.source.targetGroupKey);
      const targetIsStaticEnemy =
        condition.target.targetSource === 'Context' &&
        staticEnemyTargetGroupKeys.has(condition.target.targetGroupKey);
      if (
        condition.containsHittableObject ||
        !(
          (sourceIsMainCharacter && targetIsStaticEnemy) ||
          (targetIsMainCharacter && sourceIsStaticEnemy)
        )
      )
        return undefined;
      // lessThan=true 的原生语义是 <=。纳入非负目标半径只会让
      // MainCharacter 到唯一木桩的有效距离更小；因此这里只证明 <= 非负阈值的真值。
      if (!condition.lessThan || condition.distance < 0) return undefined;
      continue;
    }
    return undefined;
  }
  return true;
}

function collectReachableTargetGroupActions(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
  staticEnemyTargetGroupKeys: ReadonlySet<string>,
): TargetGroupActionSource[] {
  const result: TargetGroupActionSource[] = [];
  const visit = (current: NativeSequenceSource<KnownNativeActionLeafSource>): void => {
    for (const node of current.actions) {
      if (!node.metadata.enabled) continue;
      const body = node.body;
      if (body.kind === 'leaf') {
        if (body.value.family === 'targetGroup') result.push(body.value.action);
        continue;
      }
      switch (body.kind) {
        case 'ifElse': {
          const value = evaluateStaticStumpConditionSequence(
            body.condition,
            staticEnemyTargetGroupKeys,
          );
          visit(body.condition);
          if (value === true) visit(body.whenTrue);
          else if (value === false) visit(body.whenFalse);
          else {
            visit(body.whenTrue);
            visit(body.whenFalse);
          }
          break;
        }
        case 'switch':
          body.options.forEach(option => visit(option.action));
          break;
        case 'once':
        case 'forEach':
          visit(body.action);
          break;
        case 'channeling':
        case 'tickInterval':
        case 'tickIntervalV2':
          visit(body.actionOnTick);
          break;
        case 'timelineJump':
          visit(body.condition);
          break;
        case 'togglable':
          visit(body.condition);
          visit(body.action);
          break;
        case 'negateNextResult':
          break;
      }
    }
  };
  visit(sequence);
  return result;
}

function isPlainStaticEnemyMerge(
  write: TargetGroupActionSource,
  staticEnemyTargetGroupKeys: ReadonlySet<string>,
): boolean {
  if (write.producerType !== 'MergeTargetAction' || write.inputTargets.length === 0) return false;
  let hasProvenEnemyInput = false;
  const preservesEnemyIdentity = write.inputTargets.every(input => {
    const noFilters =
      input.validatorTypes.length === 0 &&
      input.postProcessorTypes.length === 0 &&
      input.priorityFilters.length === 0 &&
      input.shuffleTargets.length === 0 &&
      input.distanceValidators.length === 0 &&
      input.finderSpawnedObjectType === null &&
      input.validatorTagQueries.length === 0;
    if (!noFilters) return false;
    const plainInput = input.finderType === null;
    if (input.targetSource === 'Target' || input.targetSource === 'MainTarget') {
      hasProvenEnemyInput = true;
      return true;
    }
    const instantEnemy =
      input.targetSource === 'InstantSearch' &&
      (input.finderType === 'MainTargetFinder' ||
        (input.finderType === 'HitBoxFinder' &&
          input.finderFactionTarget === 'Anti' &&
          (input.finderTargetObjectType === 'Normal' ||
            input.finderTargetObjectType === 'NoInteractive') &&
          input.finderCheckAlive !== null));
    if (instantEnemy) {
      hasProvenEnemyInput = true;
      return true;
    }
    if (!plainInput) return false;
    if (input.targetSource !== 'Context') return false;
    if (staticEnemyTargetGroupKeys.has(input.targetGroupKey)) {
      hasProvenEnemyInput = true;
      return true;
    }
    // MergeTargetAction 是目标集合并集。把结果组本身重新并入只会保留先前成员；
    // 但仍要求同一写入至少含一个独立证明的敌人输入，不能用纯自引用凭空建立身份。
    return input.targetGroupKey === write.targetGroupKey;
  });
  return preservesEnemyIdentity && hasProvenEnemyInput;
}

function isAtMostSingleEnemyMerge(
  write: TargetGroupActionSource,
  singleEnemyTargetGroupKeys: ReadonlySet<string>,
): boolean {
  if (write.producerType !== 'MergeTargetAction' || write.inputTargets.length === 0) return false;
  return write.inputTargets.every(input => {
    const noFilters =
      input.validatorTypes.length === 0 &&
      input.postProcessorTypes.length === 0 &&
      input.priorityFilters.length === 0 &&
      input.shuffleTargets.length === 0 &&
      input.distanceValidators.length === 0 &&
      input.finderSpawnedObjectType === null &&
      input.validatorTagQueries.length === 0;
    const plainInput = noFilters && input.finderType === null;
    const instantMainTarget =
      noFilters &&
      input.targetSource === 'InstantSearch' &&
      (input.finderType === 'MainTargetFinder' ||
        (input.finderType === 'HitBoxFinder' &&
          input.finderFactionTarget === 'Anti' &&
          (input.finderTargetObjectType === 'Normal' ||
            input.finderTargetObjectType === 'NoInteractive') &&
          input.finderCheckAlive !== null));
    return (
      instantMainTarget ||
      (plainInput &&
        (input.targetSource === 'Target' ||
          input.targetSource === 'MainTarget' ||
          (input.targetSource === 'Context' &&
            (input.targetGroupKey === write.targetGroupKey ||
              singleEnemyTargetGroupKeys.has(input.targetGroupKey)))))
    );
  });
}

function isAtMostSingleEnemyConversion(
  write: TargetGroupActionSource,
  singleEnemyTargetGroupKeys: ReadonlySet<string>,
): boolean {
  const input = write.inputTargets[0];
  return (
    write.producerType === 'ConvertToTargetContext' &&
    write.conversionOperation === 'ExcludeTarget' &&
    write.inputTargets.length === 1 &&
    input?.targetSource === 'Context' &&
    (input.targetGroupKey === write.targetGroupKey ||
      singleEnemyTargetGroupKeys.has(input.targetGroupKey)) &&
    input.finderType === null &&
    input.validatorTypes.length === 0 &&
    input.postProcessorTypes.length === 0 &&
    input.priorityFilters.length === 0 &&
    input.shuffleTargets.length === 0 &&
    input.distanceValidators.length === 0 &&
    input.finderSpawnedObjectType === null &&
    input.validatorTagQueries.length === 0
  );
}

function isAtMostSingleEnemyFilteredFind(write: TargetGroupActionSource): boolean {
  return (
    write.producerType === 'FindTargetAction' &&
    write.finderType === 'HitBoxFinder' &&
    write.finderFactionTarget === 'Anti' &&
    (write.finderTargetObjectType === 'Normal' ||
      write.finderTargetObjectType === 'NoInteractive') &&
    write.finderCheckAlive !== null &&
    write.validatorTypes.length === 0 &&
    write.postProcessorTypes.length === 1 &&
    write.postProcessorTypes[0] === 'ExcludeTarget' &&
    write.priorityFilters.length === 0 &&
    write.shuffleTargets.length === 0 &&
    write.distanceValidators.length === 0
  );
}

function isPlainTargetReference(
  target: TargetReferenceSource | null,
  targetSource: string,
  targetGroupKey: string,
): boolean {
  return (
    target !== null &&
    target.targetSource === targetSource &&
    target.targetGroupKey === targetGroupKey &&
    target.selectorOwner === 'ActionOwner' &&
    target.ownerContextKey === '' &&
    target.centerType === 'ActionSource' &&
    target.centerContextKey === '' &&
    !target.centerToGround &&
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    !target.enableAdvancedDirection &&
    target.selectorDirection === 'SourceForward' &&
    target.finderType === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

function enabledActions<T>(sequence: NativeSequenceSource<T>) {
  return sequence.actions.filter(action => action.metadata.enabled);
}

function floatCompareBlackboardAgainstOne(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
): string | undefined {
  const actions = enabledActions(sequence);
  if (
    actions.length !== 1 ||
    actions[0]!.body.kind !== 'leaf' ||
    actions[0]!.body.value.family !== 'condition' ||
    actions[0]!.body.value.action.kind !== 'floatCompare'
  )
    return undefined;
  const condition = actions[0]!.body.value.action;
  if (condition.comparison !== 'EQ' && condition.comparison !== 'Equals') return undefined;
  if (
    condition.left.blackboardKey !== null &&
    condition.right.blackboardKey === null &&
    condition.right.value === 1
  )
    return condition.left.blackboardKey;
  if (
    condition.right.blackboardKey !== null &&
    condition.left.blackboardKey === null &&
    condition.left.value === 1
  )
    return condition.right.blackboardKey;
  return undefined;
}

function sequenceReadsFloatBlackboard(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
  keys: ReadonlySet<string>,
): boolean {
  return collectNativeActionNodes(sequence).some(node => {
    if (
      !node.metadata.enabled ||
      node.body.kind !== 'leaf' ||
      node.body.value.family !== 'condition' ||
      node.body.value.action.kind !== 'floatCompare'
    )
      return false;
    const { left, right } = node.body.value.action;
    return (
      (left.blackboardKey !== null && keys.has(left.blackboardKey)) ||
      (right.blackboardKey !== null && keys.has(right.blackboardKey))
    );
  });
}

/**
 * ShowComboRingQte.triggeredAction 是已执行的成功入口；AbilityEntity 分支只选择另一套表现。
 * 成功逻辑应读取原生触发键，不再受表现原型开关限制。这里只解包“单一 EQ 1 守卫、
 * 空 false 分支、true 分支读取已证明 QTE 触发键”的完整形状；其他黑板条件原样保留。
 */
function unwrapComboQtePrototypeGuard(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
  triggerKeys: ReadonlySet<string> | undefined,
): NativeSequenceSource<KnownNativeActionLeafSource> {
  if (triggerKeys === undefined || triggerKeys.size === 0) return sequence;
  const actions = enabledActions(sequence);
  if (actions.length >= 2) {
    const firstOnly = { ...sequence, actions: [actions[0]!] };
    const selectorKey = floatCompareBlackboardAgainstOne(firstOnly);
    const remainder = {
      ...sequence,
      actions: sequence.actions.filter(action => action !== actions[0]),
    };
    if (
      selectorKey !== undefined &&
      !triggerKeys.has(selectorKey) &&
      sequenceReadsFloatBlackboard(remainder, triggerKeys)
    )
      return remainder;
  }
  if (actions.length !== 1 || actions[0]!.body.kind !== 'ifElse') return sequence;
  const guard = actions[0]!.body;
  const selectorKey = floatCompareBlackboardAgainstOne(guard.condition);
  if (
    selectorKey === undefined ||
    triggerKeys.has(selectorKey) ||
    enabledActions(guard.whenFalse).length !== 0 ||
    !sequenceReadsFloatBlackboard(guard.whenTrue, triggerKeys)
  )
    return sequence;
  return guard.whenTrue;
}

/**
 * TargetPostProcessorAction 先复制输入候选，再执行筛选。此处只接纳汤汤实证的距离升序取 1：
 * 唯一木桩输入经空 validator、空 Buff 过滤和最多保留一个后，成员身份及非空性均不变。
 */
function isStaticSingleEnemyTargetPostProcessor(
  write: TargetGroupActionSource,
  staticEnemyTargetGroupKeys: ReadonlySet<string>,
): boolean {
  if (write.producerType !== 'TargetPostProcessorAction') return false;
  const detail = write.targetPostProcessor;
  const filter = write.priorityFilters[0];
  if (detail === undefined || filter === undefined) return false;
  return (
    write.inputTargets.length === 1 &&
    isPlainTargetReference(detail.target, 'Context', detail.target.targetGroupKey) &&
    detail.target.targetGroupKey.length > 0 &&
    staticEnemyTargetGroupKeys.has(detail.target.targetGroupKey) &&
    isPlainTargetReference(detail.center, 'Context', detail.target.targetGroupKey) &&
    isPlainTargetReference(detail.source, 'Source', '') &&
    detail.direction.directionType === 'SourceForward' &&
    isPlainTargetReference(detail.direction.source, 'Target', '') &&
    isPlainTargetReference(detail.direction.target, 'Target', '') &&
    detail.direction.sourceMountPoint === 'None' &&
    detail.direction.targetMountPoint === 'None' &&
    !detail.direction.customSourceAndTarget &&
    detail.direction.clampToXZ &&
    !detail.direction.invertDirection &&
    write.validatorTypes.length === 0 &&
    write.postProcessorTypes.length === 1 &&
    write.postProcessorTypes[0] === 'PriorityFilter' &&
    write.priorityFilters.length === 1 &&
    write.shuffleTargets.length === 0 &&
    write.distanceValidators.length === 0 &&
    filter.filterType === 'DistanceFromMainCharAsc' &&
    !filter.onlyReserveMaxPriorityTargets &&
    filter.limitMaxNum &&
    filter.maxNum === 1 &&
    filter.buffFilter.checkType === 'Id' &&
    filter.buffFilter.buffIds.length === 0 &&
    filter.buffFilter.tagQuery.tagIds.length === 0 &&
    filter.buffFilter.stackCountType === 'BuffCount'
  );
}

/**
 * 主动 SkillData 的严格执行阶段。引用闭包阶段允许保留未跟踪动作；进入正式时间轴时必须让
 * 每个叶子通过公共 parser/projection，且不得把被动事件静默混入施法时间轴。
 */
export function compileActiveSkillRuntimeProjectionSource(input: {
  readonly value: unknown;
  readonly sourcePath: string;
  readonly patch: SkillPatchSource | null;
  readonly context: CombatActionProjectionContextSource;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly extensions?: CombatActionProjectionExtensionsSource;
}): CompiledActiveSkillRuntimeProjectionSource {
  const prepared = prepareSkillDefinitionInputSource(input.value, input.sourcePath, input.patch);
  const targeting = compileSkillSmartTargetSource(
    parseSkillTargetSelectionHeaderSource(input.value, input.sourcePath),
  );
  const switchToBuffCast = compileStrictSwitchToBuffCastSource(
    input.value,
    input.sourcePath,
    input.context,
  );
  assertNoUnprojectedSkillRootEffects(input.value, input.sourcePath);
  const graph = parseKnownSkillActionGraphSource(
    input.value,
    input.sourcePath,
    prepared.blackboard.values,
  );
  if (graph.actionGroup.passiveEvents.length > 0)
    throw new Error(
      `${input.sourcePath}.actionGroupData.passiveEventActions: active skill passive events are unsupported`,
    );
  const visualOnlyIds = input.visualOnlyIds ?? new Set<string>();
  const extensions = input.extensions ?? {};
  const presentationOnlyBlackboardKeys = collectPresentationOnlyBlackboardKeys(graph);
  const presentationSelectionTimelineIndexes = collectPresentationSelectionTimelineIndexes(graph);
  const combatInvisiblePresentationBlackboardKeys =
    collectCombatInvisiblePresentationAssignmentKeys(
      graph.actionGroup.timelineActions.map(timeline => timeline.sequence),
    );
  const combatInvisibleRandomBlackboardKeys = collectCombatInvisibleRandomBlackboardKeys(graph);
  const combatInvisiblePhysicsCastPaths = collectCombatInvisiblePhysicsCastPaths(graph);
  const timelineTargetGroupWrites = graph.actionGroup.timelineActions.map(timeline =>
    collectNativeActionNodes(timeline.sequence).flatMap(node =>
      node.body.kind === 'leaf' && node.body.value.family === 'targetGroup'
        ? [node.body.value.action]
        : [],
    ),
  );
  const targetGroupWrites = timelineTargetGroupWrites.flat();
  const writesByKey = Map.groupBy(targetGroupWrites, write => write.targetGroupKey);
  const dynamicSpatialPointCounts = new Map<
    string,
    | { readonly kind: 'constant'; readonly value: number }
    | { readonly kind: 'blackboard'; readonly key: string }
  >();
  for (const [key, writes] of writesByKey) {
    const randomPointWrites = writes.filter(write => write.finderType === 'RandomPointFinder');
    if (randomPointWrites.length === 0) continue;
    if (
      randomPointWrites.length !== writes.length ||
      randomPointWrites.some(write => write.finderRandomPointCount === undefined)
    ) {
      throw new Error(`Context ${JSON.stringify(key)} mixes RandomPoint and incompatible writes`);
    }
    const operands = randomPointWrites.map(write => {
      const count = write.finderRandomPointCount!;
      return count.blackboardKey === null
        ? { kind: 'constant' as const, value: count.value }
        : { kind: 'blackboard' as const, key: count.blackboardKey };
    });
    if (operands.some(operand => JSON.stringify(operand) !== JSON.stringify(operands[0]))) {
      const runtimeCountKey = `__endaxis_target_group_count:${key}`;
      if (Object.hasOwn(prepared.blackboard.values, runtimeCountKey)) {
        throw new Error(`Context ${JSON.stringify(key)} count key collides with Skill blackboard`);
      }
      dynamicSpatialPointCounts.set(key, { kind: 'blackboard', key: runtimeCountKey });
    } else {
      dynamicSpatialPointCounts.set(key, operands[0]!);
    }
  }
  const allActionNodes = graph.actionGroup.timelineActions.flatMap(timeline =>
    collectNativeActionNodes(timeline.sequence),
  );
  const rayCastTargetGroupWrites = allActionNodes.flatMap(node =>
    node.metadata.enabled &&
    node.body.kind === 'leaf' &&
    node.body.value.family === 'rayCastTargetGroup'
      ? [node.body.value.action]
      : [],
  );
  const usesNativeSkillHasHit = allActionNodes.some(
    node =>
      node.metadata.enabled &&
      node.body.kind === 'leaf' &&
      node.body.value.family === 'condition' &&
      node.body.value.action.kind === 'skillHasHit',
  );
  const enabledAnimationEventListenerPresent = allActionNodes.some(
    node =>
      node.metadata.enabled &&
      node.body.kind === 'leaf' &&
      node.body.value.family === 'animationEventListener' &&
      !isPresentationOnlyActionSequence(
        node.body.value.action.actionOnEvent,
        presentationOnlyBlackboardKeys,
      ),
  );
  if (
    usesNativeSkillHasHit &&
    (Object.hasOwn(prepared.blackboard.values, NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY) ||
      Object.hasOwn(
        numericDeclaredBlackboard(graph.declaredBlackboard, true),
        NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY,
      ))
  ) {
    throw new Error(
      `${input.sourcePath}: internal CheckSkillHasHit key collides with the Skill blackboard`,
    );
  }
  const abilityEntityContextKeys = new Set(
    allActionNodes.flatMap(node =>
      node.metadata.enabled &&
      node.body.kind === 'leaf' &&
      node.body.value.family === 'abilityEntity' &&
      node.body.value.action.saveToContext
        ? [node.body.value.action.contextKey]
        : [],
    ),
  );
  const ownerSpawnedAbilityEntityContextKeys = new Set(
    [...writesByKey]
      .filter(
        ([, writes]) =>
          writes.length > 0 &&
          writes.every(
            write =>
              write.producerType === 'FindTargetAction' &&
              write.finderType === 'OwnerSpawnedEntityFinder' &&
              write.finderSpawnedObjectType === 'AbilityEntity',
          ),
      )
      .map(([key]) => key),
  );
  // Context 在技能的所有调度段之间共享。只把“至少由一次能力实体生成写入，且没有任何
  // 目标组/空间动作写入同名键”的集合标成能力实体；OwnerSpawnedEntityFinder
  // 写入也保留同一成员类型。条件生成/查询可以令集合为空，但不会改变成员类型。
  const conflictingContextKeys = new Set([
    ...targetGroupWrites
      .filter(write => !ownerSpawnedAbilityEntityContextKeys.has(write.targetGroupKey))
      .map(write => write.targetGroupKey),
    ...allActionNodes.flatMap(node =>
      node.metadata.enabled &&
      node.body.kind === 'leaf' &&
      node.body.value.family === 'spatial' &&
      node.body.value.action.kind === 'teleportPositionSelection'
        ? [node.body.value.action.outputContextKey]
        : [],
    ),
    ...rayCastTargetGroupWrites.flatMap(write => [write.targetGroupKey, write.hitPosGroupKey]),
  ]);
  const staticAbilityEntityTargetGroupKeys = new Set(
    [...abilityEntityContextKeys, ...ownerSpawnedAbilityEntityContextKeys].filter(
      key => !conflictingContextKeys.has(key),
    ),
  );
  // 保留已支持的直接搜索证明；传播阶段只负责增加跨 Context 的合并不变量。
  const isStaticActiveSkillEnemyTargetGroup = (write: (typeof targetGroupWrites)[number]) =>
    isStaticSingleEnemyTargetGroup(write) || isCurrentTargetRestrictedSingleEnemyTargetGroup(write);
  const rayCastEnemyWritesByKey = Map.groupBy(
    rayCastTargetGroupWrites,
    write => write.targetGroupKey,
  );
  const staticEnemyTargetGroupKeys = new Set(
    [...new Set([...writesByKey.keys(), ...rayCastEnemyWritesByKey.keys()])].filter(key => {
      const ordinaryWrites = writesByKey.get(key) ?? [];
      const rayWrites = rayCastEnemyWritesByKey.get(key) ?? [];
      return (
        ordinaryWrites.length + rayWrites.length > 0 &&
        ordinaryWrites.every(isStaticActiveSkillEnemyTargetGroup)
      );
    }),
  );
  // StoreSmartTarget writes the selected candidate to this implicit native context group. 对 input/trigger
  // 路径，prepareComboCast 会在施法前严格拒绝非敌方候选；无候选手工排轴则回退唯一木桩。
  // 因而所有已支持的 smartTarget 模式在技能运行入口之后都具有同一 enemy 不变量。
  if (targeting.definition.smartTarget !== undefined)
    staticEnemyTargetGroupKeys.add('smart_target');
  // 控制流中的不可达写入不能破坏 Context 身份证明。以已知入口目标组为种子反复归约：
  // 只有所有“在当前证据下可达”的写入都保持唯一敌人时才新增键；未知分支仍全部计入。
  let enemyClosureChanged = true;
  while (enemyClosureChanged) {
    enemyClosureChanged = false;
    const reachableWrites = graph.actionGroup.timelineActions.flatMap(timeline =>
      collectReachableTargetGroupActions(timeline.sequence, staticEnemyTargetGroupKeys),
    );
    const reachableWritesByKey = Map.groupBy(reachableWrites, write => write.targetGroupKey);
    for (const [key, writes] of reachableWritesByKey) {
      if (
        !staticEnemyTargetGroupKeys.has(key) &&
        writes.length > 0 &&
        writes.every(
          write =>
            isStaticActiveSkillEnemyTargetGroup(write) ||
            isPlainStaticEnemyMerge(write, staticEnemyTargetGroupKeys) ||
            isStaticSingleEnemyTargetPostProcessor(write, staticEnemyTargetGroupKeys),
        )
      ) {
        staticEnemyTargetGroupKeys.add(key);
        enemyClosureChanged = true;
      }
    }
  }
  // 与“恒为敌人”分开记录至多一个敌人的集合。TagValidator 会让集合动态为空，
  // 但不会改变成员身份；这足以保留 ForEach 的零次/一次语义，不能用于折叠数量条件。
  const singleEnemyTargetGroupKeys = new Set(staticEnemyTargetGroupKeys);
  let singleEnemyClosureChanged = true;
  while (singleEnemyClosureChanged) {
    singleEnemyClosureChanged = false;
    for (const [key, writes] of writesByKey) {
      if (singleEnemyTargetGroupKeys.has(key)) continue;
      if (
        writes.length > 0 &&
        writes.every(
          write =>
            isStaticActiveSkillEnemyTargetGroup(write) ||
            isDynamicSingleEnemyTagTargetGroup(write) ||
            isDynamicSingleEnemySmartTargetGroup(write) ||
            isAtMostSingleEnemyMerge(write, singleEnemyTargetGroupKeys) ||
            isAtMostSingleEnemyConversion(write, singleEnemyTargetGroupKeys) ||
            isAtMostSingleEnemyFilteredFind(write),
        )
      ) {
        singleEnemyTargetGroupKeys.add(key);
        singleEnemyClosureChanged = true;
      }
    }
  }
  // Context 目标组跨时间段保留。固定敌人和 FixedPoint 在 Endaxis 中都位于零空间，
  // 但这个集合只证明“可作零空间锚点”，不能反过来冒充敌人实体。
  const rayCastHitPositionWritesByKey = Map.groupBy(
    rayCastTargetGroupWrites,
    write => write.hitPosGroupKey,
  );
  const staticZeroSpaceTargetGroupKeys = new Set(staticEnemyTargetGroupKeys);
  const atMostOneZeroSpaceTargetGroupKeys = new Set([
    ...singleEnemyTargetGroupKeys,
    ...[...writesByKey]
      .filter(
        ([, writes]) =>
          writes.length > 0 &&
          writes.every(
            write =>
              isStaticActiveSkillEnemyTargetGroup(write) ||
              isStaticZeroSpacePointWrite(write) ||
              isStaticControlledOperatorWrite(write) ||
              (write.producerType === 'PickTargetAction' &&
                write.inputTargets.length === 1 &&
                write.inputTargets[0]!.targetSource === 'Context' &&
                singleEnemyTargetGroupKeys.has(write.inputTargets[0]!.targetGroupKey) &&
                write.pickIndexBlackboardKey === null &&
                write.pickIndexValue !== null &&
                Number.isInteger(write.pickIndexValue) &&
                write.pickIndexValue >= 0),
          ),
      )
      .map(([key]) => key),
  ]);
  const guardedProjectilePaths = collectGuardedProjectilePaths(
    graph,
    atMostOneZeroSpaceTargetGroupKeys,
  );
  for (const key of new Set([...writesByKey.keys(), ...rayCastHitPositionWritesByKey.keys()])) {
    const ordinaryWrites = writesByKey.get(key) ?? [];
    const rayHitWrites = rayCastHitPositionWritesByKey.get(key) ?? [];
    if (
      ordinaryWrites.length + rayHitWrites.length > 0 &&
      ordinaryWrites.every(
        write =>
          isStaticActiveSkillEnemyTargetGroup(write) ||
          isStaticZeroSpacePointWrite(write) ||
          isStaticControlledOperatorWrite(write),
      )
    ) {
      staticZeroSpaceTargetGroupKeys.add(key);
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [key, writes] of writesByKey) {
      if (staticZeroSpaceTargetGroupKeys.has(key)) continue;
      if (
        writes.length > 0 &&
        writes.every(
          write =>
            isStaticActiveSkillEnemyTargetGroup(write) ||
            isStaticZeroSpacePointWrite(write) ||
            isStaticControlledOperatorWrite(write) ||
            (write.producerType === 'PickTargetAction' &&
              write.inputTargets.length === 1 &&
              write.inputTargets[0]!.targetSource === 'Context' &&
              staticZeroSpaceTargetGroupKeys.has(write.inputTargets[0]!.targetGroupKey) &&
              write.pickIndexBlackboardKey === null &&
              write.pickIndexValue !== null &&
              Number.isInteger(write.pickIndexValue) &&
              write.pickIndexValue >= 0) ||
            (write.producerType === 'MergeTargetAction' &&
              write.inputTargets.length > 0 &&
              write.inputTargets.every(input => {
                const plainInput =
                  input.finderType === null &&
                  input.validatorTypes.length === 0 &&
                  input.postProcessorTypes.length === 0 &&
                  input.priorityFilters.length === 0 &&
                  input.shuffleTargets.length === 0 &&
                  input.distanceValidators.length === 0 &&
                  input.finderSpawnedObjectType === null &&
                  input.validatorTagQueries.length === 0;
                return (
                  plainInput &&
                  ((input.targetSource === 'Context' &&
                    staticZeroSpaceTargetGroupKeys.has(input.targetGroupKey)) ||
                    input.targetSource === 'Target' ||
                    input.targetSource === 'MainTarget')
                );
              })),
        )
      ) {
        staticZeroSpaceTargetGroupKeys.add(key);
        changed = true;
      }
    }
  }
  const guaranteedSingletonZeroSpaceTargetGroupKeysByTimeline =
    graph.actionGroup.timelineActions.map(() => new Set<string>());
  let guaranteedSingletonZeroSpaceTargetGroupKeys = new Set<string>();
  if (targeting.definition.smartTarget !== undefined) {
    guaranteedSingletonZeroSpaceTargetGroupKeys.add('smart_target');
  }
  const orderedTimelineIndexes = graph.actionGroup.timelineActions
    .map((timeline, timelineIndex) => ({ timeline, timelineIndex }))
    .sort(
      (left, right) =>
        left.timeline.startFrame - right.timeline.startFrame ||
        left.timelineIndex - right.timelineIndex,
    );
  for (const { timeline, timelineIndex } of orderedTimelineIndexes) {
    guaranteedSingletonZeroSpaceTargetGroupKeysByTimeline[timelineIndex] = new Set(
      guaranteedSingletonZeroSpaceTargetGroupKeys,
    );
    if (timeline.sequence.onlyExecuteWhenSourceIsGuard) continue;
    const sequence = timeline.sequence.onlyExecuteWhenSourceIsMainCharacter
      ? { ...timeline.sequence, onlyExecuteWhenSourceIsMainCharacter: false }
      : timeline.sequence;
    guaranteedSingletonZeroSpaceTargetGroupKeys = propagateGuaranteedSingletonZeroSpaceFacts(
      sequence,
      guaranteedSingletonZeroSpaceTargetGroupKeys,
      {
        atMostOneZeroSpaceKeys: atMostOneZeroSpaceTargetGroupKeys,
        compareKnownNumbers,
        writeProducesSingleton: (write, state) => {
          if (
            isStaticActiveSkillEnemyTargetGroup(write) ||
            isStaticZeroSpacePointWrite(write) ||
            isStaticControlledOperatorWrite(write)
          ) {
            return true;
          }
          const input = write.inputTargets[0];
          return (
            write.producerType === 'PickTargetAction' &&
            write.inputTargets.length === 1 &&
            input?.targetSource === 'Context' &&
            state.has(input.targetGroupKey) &&
            input.finderType === null &&
            input.validatorTypes.length === 0 &&
            input.postProcessorTypes.length === 0 &&
            input.priorityFilters.length === 0 &&
            input.shuffleTargets.length === 0 &&
            input.distanceValidators.length === 0 &&
            input.finderSpawnedObjectType === null &&
            input.validatorTagQueries.length === 0 &&
            write.pickIndexBlackboardKey === null &&
            write.pickIndexValue === 0
          );
        },
      },
    );
  }
  const exclusiveFrame = Number(prepared.root.exclusiveFrame);
  if (!Number.isInteger(exclusiveFrame) || exclusiveFrame < 0)
    throw new Error(`${input.sourcePath}.exclusiveFrame: expected non-negative integer`);
  const offsetRecordFrame = Number(prepared.root.offsetRecordFrame);
  if (!Number.isInteger(offsetRecordFrame) || offsetRecordFrame < 0)
    throw new Error(`${input.sourcePath}.offsetRecordFrame: expected non-negative integer`);
  const allowNextSkillTransitions = graph.actionGroup.timelineActions.flatMap(timeline => {
    const directNodes = new Set(timeline.sequence.actions);
    return collectNativeActionNodes(timeline.sequence).flatMap(node => {
      if (
        !node.metadata.enabled ||
        node.body.kind !== 'leaf' ||
        node.body.value.family !== 'inputControl' ||
        node.body.value.action.kind !== 'allowNextSkill'
      )
        return [];
      return [
        {
          startFrame: timeline.startFrame,
          endFrame: timeline.endFrame,
          skillIds: node.body.value.action.skillIds,
          direct: directNodes.has(node),
        },
      ];
    });
  });
  const commandMappings: Array<
    NonNullable<NonNullable<SkillDefinition['inputWindows']>['commandMappings']>[number]
  > = [];
  const allowedNextSkills: Array<
    NonNullable<NonNullable<SkillDefinition['inputWindows']>['allowedNextSkills']>[number]
  > = [];
  let hasConditionalInputActions = false;
  for (const timeline of graph.actionGroup.timelineActions) {
    const directNodes = new Set(timeline.sequence.actions);
    for (const node of collectNativeActionNodes(timeline.sequence)) {
      if (
        !node.metadata.enabled ||
        node.body.kind !== 'leaf' ||
        node.body.value.family !== 'inputControl'
      ) {
        continue;
      }
      const action = node.body.value.action;
      if (action.kind !== 'comboCache' && action.kind !== 'allowNextSkill') continue;
      if (!directNodes.has(node)) {
        hasConditionalInputActions = true;
        continue;
      }
      if (action.kind === 'allowNextSkill') {
        allowedNextSkills.push({
          startFrame: timeline.startFrame,
          endFrame: timeline.endFrame,
          skillIds: action.skillIds,
        });
        continue;
      }
      for (const mapping of action.mappings) {
        // RefreshNextSkillRequest 只让 Attack 映射的 skillId 决定实际技能。
        // NormalSkill/ComboSkill 映射仅供缓存配置，随后会被当前槽位 ID 覆盖；
        // UltimateSkill 则直接以当前终结技构造请求。
        if (mapping.commandType !== 'Attack') continue;
        commandMappings.push({
          startFrame: timeline.startFrame,
          endFrame: timeline.endFrame,
          input: 'basicAttack',
          targetSkillId: mapping.skillId.length === 0 ? null : mapping.skillId,
        });
      }
    }
  }
  const inputWindows: SkillDefinition['inputWindows'] | undefined =
    commandMappings.length === 0 && allowedNextSkills.length === 0 && !hasConditionalInputActions
      ? undefined
      : {
          ...(commandMappings.length === 0 ? {} : { commandMappings }),
          ...(allowedNextSkills.length === 0 ? {} : { allowedNextSkills }),
          ...(hasConditionalInputActions ? { hasConditionalActions: true } : {}),
        };
  // 静态查询可证明单次写入的结果，却不一定支配另一时间段的读取（例如只在非主控分支写入）。
  // 数量条件仍需在运行时读取的组必须保留写入，不能留下一个从未创建的 Context 名称。
  const materializedTargetGroupKeys = new Set(
    graph.actionGroup.timelineActions.flatMap((timeline, timelineIndex) =>
      collectNativeActionNodes(timeline.sequence).flatMap(node => {
        if (
          !node.metadata.enabled ||
          node.body.kind !== 'leaf' ||
          node.body.value.family !== 'condition'
        )
          return [];
        const condition = node.body.value.action;
        return condition.kind === 'entityCount' &&
          condition.targetSource === 'Context' &&
          !condition.containsHittableTarget &&
          !condition.excludeDeadEntity &&
          !staticEnemyTargetGroupKeys.has(condition.targetGroupKey) &&
          !guaranteedSingletonZeroSpaceTargetGroupKeysByTimeline[timelineIndex]!.has(
            condition.targetGroupKey,
          )
          ? [condition.targetGroupKey]
          : [];
      }),
    ),
  );
  const context = {
    ...input.context,
    staticEnemyTargetGroupKeys,
    singleEnemyTargetGroupKeys,
    staticZeroSpaceTargetGroupKeys,
    atMostOneZeroSpaceTargetGroupKeys,
    provenOnlyHitProjectilePaths: guardedProjectilePaths.onlyHit,
    provenZeroSpaceProjectilePaths: guardedProjectilePaths.zeroSpace,
    dynamicSpatialPointCounts,
    materializedTargetGroupKeys,
    staticAbilityEntityTargetGroupKeys,
    presentationOnlyTargetGroupKeys: collectPresentationOnlyTargetGroups(graph),
    unconsumedTargetGroupKeys: collectUnconsumedTargetGroups(graph),
    combatInvisibleRandomBlackboardKeys,
    combatInvisiblePresentationBlackboardKeys,
    combatInvisiblePhysicsCastPaths,
    enabledAnimationEventListenerPresent,
  };
  const scheduledSequences: CompiledActiveSkillTimelineSequenceSource[] = [];
  for (const [timelineIndex, timeline] of graph.actionGroup.timelineActions.entries()) {
    // SequenceAction.checkCharacter proves these flags are complementary tests
    // of the source character's current main/guard state. A user-placed active
    // skill is cast by the selected main character in the Endaxis scenario.
    if (timeline.sequence.onlyExecuteWhenSourceIsGuard) continue;
    if (presentationSelectionTimelineIndexes.has(timelineIndex)) continue;
    const activeMainCharacterSequence = timeline.sequence.onlyExecuteWhenSourceIsMainCharacter
      ? { ...timeline.sequence, onlyExecuteWhenSourceIsMainCharacter: false }
      : timeline.sequence;
    const executableSequence = unwrapComboQtePrototypeGuard(
      activeMainCharacterSequence,
      input.context.comboQteTriggerBlackboardKeys,
    );
    if (isPresentationOnlyActionSequence(executableSequence, presentationOnlyBlackboardKeys))
      continue;
    const enabledTopLevel = executableSequence.actions.filter(action => action.metadata.enabled);
    const rootProjectilesCanScheduleCallbacks =
      enabledTopLevel.some(
        action => action.body.kind === 'leaf' && action.body.value.family === 'projectile',
      ) &&
      enabledTopLevel.every(
        action =>
          action.body.kind === 'leaf' &&
          action.body.value.family !== 'condition' &&
          action.body.value.family !== 'eventListener' &&
          action.body.value.family !== 'animationEventListener',
      );
    const relativeProjectileCallbacks: CompiledActiveSkillTimelineSequenceSource[] = [];
    // Context 跨 SkillActionGroup 的时间线共享。同名键允许在后续帧改写成另一种实体，
    // 因此不能提升为技能级静态类型；但当前时间线仍可继承按 (startFrame, source order)
    // 严格发生在它之前的最后一批写入。相同调度点的条件分支只有所有写入类型一致时
    // 才建立临时事实，避免把某一分支猜成必然执行。
    const priorWrites = graph.actionGroup.timelineActions.flatMap((candidate, candidateIndex) =>
      candidate.startFrame < timeline.startFrame ||
      (candidate.startFrame === timeline.startFrame && candidateIndex < timelineIndex)
        ? timelineTargetGroupWrites[candidateIndex]!.map(write => ({
            write,
            startFrame: candidate.startFrame,
            timelineIndex: candidateIndex,
          }))
        : [],
    );
    const latestOrderByKey = new Map<
      string,
      { readonly startFrame: number; readonly timelineIndex: number }
    >();
    for (const item of priorWrites) {
      const previous = latestOrderByKey.get(item.write.targetGroupKey);
      if (
        previous === undefined ||
        item.startFrame > previous.startFrame ||
        (item.startFrame === previous.startFrame && item.timelineIndex > previous.timelineIndex)
      ) {
        latestOrderByKey.set(item.write.targetGroupKey, {
          startFrame: item.startFrame,
          timelineIndex: item.timelineIndex,
        });
      }
    }
    const latestWritesByKey = Map.groupBy(
      priorWrites.filter(item => {
        const latest = latestOrderByKey.get(item.write.targetGroupKey);
        return (
          latest?.startFrame === item.startFrame && latest.timelineIndex === item.timelineIndex
        );
      }),
      item => item.write.targetGroupKey,
    );
    const timelineEnemyKeys = new Set(staticEnemyTargetGroupKeys);
    const timelineAbilityEntityKeys = new Set(staticAbilityEntityTargetGroupKeys);
    const timelineZeroSpaceKeys = new Set(staticZeroSpaceTargetGroupKeys);
    const timelineSingletonZeroSpaceKeys = new Set(
      guaranteedSingletonZeroSpaceTargetGroupKeysByTimeline[timelineIndex],
    );
    for (const [key, items] of latestWritesByKey) {
      const writes = items.map(item => item.write);
      if (writes.length > 0 && writes.every(isStaticActiveSkillEnemyTargetGroup)) {
        timelineEnemyKeys.add(key);
        timelineZeroSpaceKeys.add(key);
        timelineSingletonZeroSpaceKeys.add(key);
        continue;
      }
      if (
        writes.length > 0 &&
        writes.every(
          write =>
            write.producerType === 'FindTargetAction' &&
            write.finderType === 'OwnerSpawnedEntityFinder' &&
            write.finderSpawnedObjectType === 'AbilityEntity',
        )
      ) {
        timelineAbilityEntityKeys.add(key);
        continue;
      }
      if (
        writes.length > 0 &&
        writes.every(
          write => isStaticZeroSpacePointWrite(write) || isStaticControlledOperatorWrite(write),
        )
      ) {
        timelineZeroSpaceKeys.add(key);
        timelineSingletonZeroSpaceKeys.add(key);
      }
    }
    const timelineContext = {
      ...context,
      staticEnemyTargetGroupKeys: timelineEnemyKeys,
      singleEnemyTargetGroupKeys: new Set([...singleEnemyTargetGroupKeys, ...timelineEnemyKeys]),
      staticZeroSpaceTargetGroupKeys: timelineZeroSpaceKeys,
      guaranteedSingletonZeroSpaceTargetGroupKeys: timelineSingletonZeroSpaceKeys,
      staticAbilityEntityTargetGroupKeys: timelineAbilityEntityKeys,
    };
    const sequence = compileCombatActionSequenceSource(
      executableSequence,
      {
        ...timelineContext,
        timelineRange: { startFrame: timeline.startFrame, endFrame: timeline.endFrame },
        ...(rootProjectilesCanScheduleCallbacks
          ? {
              scheduleRelativeProjectileCallback: scheduled => {
                relativeProjectileCallbacks.push({
                  startFrame: timeline.startFrame + scheduled.startFrame,
                  endFrame: timeline.startFrame + scheduled.endFrame,
                  sequence: scheduled.sequence,
                });
              },
            }
          : {}),
      },
      visualOnlyIds,
      { ...extensions, allowRootTimelineFinish: true },
    );
    if (sequence.steps.length > 0) {
      scheduledSequences.push({
        startFrame: timeline.startFrame,
        endFrame: timeline.endFrame,
        sequence,
      });
    }
    scheduledSequences.push(...relativeProjectileCallbacks);
  }
  assertPresentationCalculationIsolation(
    graph.actionGroup.timelineActions.map(item => item.sequence),
    scheduledSequences.map(item => item.sequence),
  );
  return {
    skillId: graph.skillId,
    durationFrame: graph.durationFrame,
    // 未模拟时只用当前技能自身的普通可中断边界作为保守预览。AllowNextSkillAction
    // 允许的是特定后继，不能在尚无未来输入时把任意一个窗口当成通用块宽。
    // 多段基础攻击仍可在整名装配时用明确的有序下一段生成更紧凑的技能库预览。
    timelineBlockFrames: exclusiveFrame + 1,
    exclusiveFrame,
    offsetRecordFrame,
    allowNextSkillTransitions,
    ...(inputWindows === undefined ? {} : { inputWindows }),
    // 动态声明也进入技能实例初值；补丁同名键后覆盖。
    // 此处位于动作投影输出边界，不能回灌到上面的静态解析环境消除动态引用。
    blackboard: {
      ...numericDeclaredBlackboard(graph.declaredBlackboard, true),
      ...prepared.blackboard.values,
      ...(usesNativeSkillHasHit ? { [NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY]: 0 } : {}),
    },
    ...targeting.definition,
    ...(switchToBuffCast === undefined ? {} : { switchToBuffCast }),
    scheduledSequences,
  };
}
