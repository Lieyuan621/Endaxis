import { projectGameplayTags } from '../combatProjectionCommon.ts';
import { mergeIndependentActionSequencesSource } from '../actions/independentActionSequences.ts';
import { buffHasNoAffixIdentityWriter } from './buffCastIdentityProof.ts';
import { projectPureDamageModifierCondition } from '../conditions/damageModifierConditionProjection.ts';
import {
  compileResolvedAttributeModifierSource,
  isCombatRuntimeAttributeRelevant,
  projectCombatRuntimeAttributeKey,
} from '../build/attributeModifier.ts';
import {
  collectNativeActionNodes,
  type NativeActionBodySourceMap,
  type NativeActionNodeSource,
  type NativeSequenceSource,
} from '../../source/controlFlow.ts';
import {
  buffShowsTimelineActions,
  type BuffPresentationSource,
  type BuffRuntimeSource,
  type BuffStackingTypeSource,
} from '../../source/buffRuntime.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { BuffStackingType } from '../../../../../packages/game-data-contract/src/buffs.ts';
import type { DamageModifierSide } from '../../../../../packages/game-data-contract/src/modifiers.ts';
import type {
  CompiledBuffPresentationSource,
  CompiledBuffDamageModifierSource,
  CompiledBuffHealModifierSource,
  CompiledBuffPoiseModifierSource,
  CompiledBuffDefinitionSource,
} from './buffProjectionTypes.ts';
import type {
  CompiledBuffConditionSource,
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from '../actions/combatActionProjectionTypes.ts';
import { projectTimelineJump } from '../actions/timelineControlProjection.ts';
import { compileAbilityEventPrograms } from '../abilities/abilityEventProgram.ts';
import { projectAbilityEvent } from '../abilities/abilityEventProjection.ts';
import {
  compileActionSequenceProgram,
  type CompileActionSequenceProgramOptions,
} from '../actions/actionSequenceProgram.ts';
import {
  type ProjectedTargetGroup,
  type CombatActionProjectionContextSource,
  type CombatActionProjectionExtensionsSource,
  BUFF_ACTION_CONTEXT,
  isDynamicSingleEnemySmartTargetGroup,
  isDynamicSingleEnemyTagTargetGroup,
  isStaticExplicitBadFactionEnemyTargetGroup,
  isStaticSingleEnemyOwnerAllyTargetGroup,
  isStaticSingleEnemyTargetGroup,
  isZeroSpaceSingleEnemySmartTargetGroup,
  isPartyExceptOwnerInstantSearch,
  scalarOperand,
  actionValueOperand,
  DAMAGE_TYPES,
  COMPARISON_OPERATORS,
  isPlainOwnerTarget,
} from '../combatProjectionCommon.ts';
import { compileBuffLeafNode } from '../actions/combatEntityAndTimeProjection.ts';
import {
  compileEventCondition,
  conditionWritesBlackboard,
  canOmitUnusedNativeCondition,
  canOmitUnusedCompiledCondition,
} from '../conditions/combatConditionProjection.ts';
import { assertPresentationCalculationIsolation } from '../scenario/presentationCalculationIsolation.ts';
import {
  compareKnownNumbers,
  isStaticControlledOperatorWrite,
  isStaticZeroSpacePointWrite,
  propagateGuaranteedSingletonZeroSpaceFacts,
} from '../optimization/targetGroupCardinalityAnalysis.ts';

export { collectBuffRuntimeClosure } from './buffReferenceClosure.ts';
// 兼容已有公共入口；类型的唯一声明不再夹在投影实现中。
export type {
  CompiledBuffNumberSource,
  CompiledBuffPresentationSource,
  CompiledBuffAttributeModifierSource,
  CompiledBuffDamageModifierSource,
  CompiledBuffHealModifierSource,
  CompiledBuffPoiseModifierSource,
  CompiledBuffDefinitionSource,
} from './buffProjectionTypes.ts';
export type {
  CompiledBuffConditionSource,
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from '../actions/combatActionProjectionTypes.ts';
export type {
  CombatActionProjectionContextSource,
  CombatActionProjectionExtensionsSource,
} from '../combatProjectionCommon.ts';
// Start/Enable 没有外部能力事件，Source 是创建者，Target/InputTarget 是持有者。
// 生命周期执行器以 Buff 来源绑定 caster；不能从不存在的 event 中读取来源或目标。
const BUFF_LIFECYCLE_CONTEXT: CombatActionProjectionContextSource = {
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'buffOwner',
};

// Buff.BindAbilityEventEnvironment：205 的输入是新 Buff 施加者，
// 但监听 Buff 的 ActionSource 始终是该监听器的创建者，不能用物理事件 sourceId 替代。
const BUFF_BEFORE_ADDED_CONTEXT: CombatActionProjectionContextSource = {
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'buffSource',
  actionTargetTarget: 'eventSource',
  restrictEventSourceTargetProjection: true,
};

// 伤害与物理异常的受击侧事件都把本次来源作为动作 InputTarget；监听 Buff 自身的
// ActionSource 仍是创建者。波格兰尼奇据此把终结技附加增益施加给异常来源，并在
// 连携伤害分支用 SourceFinder(ActionSource) 与 Target 比较来源链。
const BUFF_BEFORE_TAKE_CONTEXT: CombatActionProjectionContextSource = {
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'buffSource',
  actionTargetTarget: 'eventSource',
  restrictEventSourceTargetProjection: true,
};

// OnIgnite 保留 Buff 的 Owner/Source；点燃者只作为输入 Target，施法信息临时取点燃动作环境。
const BUFF_IGNITE_CONTEXT: CombatActionProjectionContextSource = {
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'actionInputTarget',
};

type BuffProjectionTargetGroup = ProjectedTargetGroup | 'guaranteedSingletonZeroSpace';

type CompiledBuffAbilityEvent = NonNullable<
  CompiledBuffDefinitionSource['abilityEventResponses']
>[number]['event'];

function projectBuffAbilityEvent(
  event: string | number,
  sourcePath: string,
  fixedBuffOwnerTarget?: 'caster' | 'enemy' | 'currentAbilityEntity',
): CompiledBuffAbilityEvent {
  if (event === 'OnEnemyBeforeTakeSpellInfliction') {
    if (fixedBuffOwnerTarget !== 'enemy')
      throw new Error(
        `${sourcePath}: OnEnemyBeforeTakeSpellInfliction requires a proven enemy Buff owner`,
      );
    // 该原生事件监听目标方附着入口；角色侧 OnCharBeforeTakeSpellInfliction 是另一事件。
    return 'beforeTakeInfliction';
  }
  return projectAbilityEvent(event, sourcePath) as CompiledBuffAbilityEvent;
}

export function buffRuntimeReadsBlackboardKey(source: BuffRuntimeSource, key: string): boolean {
  const readFieldNames = new Set(['blackboardKey', 'inputValueKey', 'buffIdKey']);
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (value === null || typeof value !== 'object') return false;
    for (const [field, child] of Object.entries(value)) {
      if (readFieldNames.has(field) && child === key) return true;
      if (visit(child)) return true;
    }
    return false;
  };
  return visit(source);
}

export function compileBuffRuntimeDefinitionSource(
  source: BuffRuntimeSource,
  visualOnlyIds: ReadonlySet<string> = new Set(),
  omittedAbilityEvents: ReadonlySet<string | number> = new Set(),
  extensions: CombatActionProjectionExtensionsSource = {},
  abilityEntityQueries?: CombatActionProjectionContextSource['abilityEntityQueries'],
  contextOverrides: Pick<
    CombatActionProjectionContextSource,
    | 'fixedBuffOwnerTarget'
    | 'fixedBuffSourceTarget'
    | 'gameplayTagRegistry'
    | 'staticEnemyTargetGroupKeys'
    | 'staticEmptyTargetGroupKeys'
    | 'staticZeroSpaceTargetGroupKeys'
    | 'atMostOneZeroSpaceTargetGroupKeys'
    | 'guaranteedSingletonZeroSpaceTargetGroupKeys'
    | 'provenOnlyHitProjectilePaths'
    | 'provenZeroSpaceProjectilePaths'
    | 'staticAbilityEntityTargetGroupKeys'
  > = {},
): CompiledBuffDefinitionSource {
  if (source.unsupportedPayloads.length > 0) {
    throw new Error(
      `unsupported Buff payloads: ${source.unsupportedPayloads.map(item => item.field).join(', ')}`,
    );
  }
  const startSequences: CompiledBuffSequenceSource[] = [];
  const enableSequences: CompiledBuffSequenceSource[] = [];
  const triggerSequences: CompiledBuffSequenceSource[] = [];
  const enhanceChangedSequences: CompiledBuffSequenceSource[] = [];
  const afterEnhanceSequences: CompiledBuffSequenceSource[] = [];
  const finishSequences: CompiledBuffSequenceSource[] = [];
  const timelineActions = buffShowsTimelineActions(source) ? source.graph.timelineActions : [];
  const allSequences = [
    ...timelineActions.map(item => item.sequence),
    ...source.graph.buffEvents.flatMap(item => item.actions),
    ...source.graph.abilityEvents.flatMap(item => item.actions),
    ...source.graph.igniteEvents.flatMap(item => item.actions),
  ];
  const comboQteSources = allSequences
    .flatMap(sequence => collectNativeActionNodes(sequence))
    .flatMap(node =>
      node.metadata.enabled && node.body.kind === 'leaf' && node.body.value.family === 'comboQte'
        ? [node.body.value.action]
        : [],
    );
  const staticEnemyTargetGroupKeys = new Set([
    ...(contextOverrides.staticEnemyTargetGroupKeys ?? []),
    ...allSequences
      .flatMap(sequence => collectNativeActionNodes(sequence))
      .flatMap(node =>
        node.metadata.enabled &&
        node.body.kind === 'leaf' &&
        node.body.value.family === 'targetGroup' &&
        (isStaticSingleEnemyTargetGroup(node.body.value.action) ||
          isStaticExplicitBadFactionEnemyTargetGroup(node.body.value.action) ||
          (contextOverrides.fixedBuffOwnerTarget === 'enemy' &&
            isStaticSingleEnemyOwnerAllyTargetGroup(node.body.value.action)) ||
          (contextOverrides.fixedBuffOwnerTarget === 'currentAbilityEntity' &&
            node.body.value.action.producerType === 'FindTargetAction' &&
            node.body.value.action.finderType === 'AbilityEntityTargetFinder' &&
            node.body.value.action.validatorTypes.length === 0 &&
            node.body.value.action.postProcessorTypes.length === 0) ||
          isZeroSpaceSingleEnemySmartTargetGroup(node.body.value.action)) &&
        (contextOverrides.fixedBuffOwnerTarget === 'caster' ||
          contextOverrides.fixedBuffOwnerTarget === 'enemy' ||
          contextOverrides.fixedBuffOwnerTarget === 'currentAbilityEntity')
          ? [node.body.value.action.targetGroupKey]
          : [],
      ),
  ]);
  const targetGroupNodes = allSequences.flatMap(sequence => collectNativeActionNodes(sequence));
  const targetGroupWrites = targetGroupNodes.flatMap(node =>
    node.metadata.enabled && node.body.kind === 'leaf' && node.body.value.family === 'targetGroup'
      ? [node.body.value.action]
      : [],
  );
  const targetGroupWritesByKey = Map.groupBy(targetGroupWrites, write => write.targetGroupKey);
  const staticEmptyTargetGroupKeys = new Set(contextOverrides.staticEmptyTargetGroupKeys ?? []);
  for (const write of targetGroupWrites) {
    if (
      contextOverrides.fixedBuffOwnerTarget === 'currentAbilityEntity' &&
      write.producerType === 'FindTargetAction' &&
      write.finderType === 'InFightEnemyFinder' &&
      write.validatorTypes.length === 0 &&
      write.postProcessorTypes.length === 2 &&
      write.postProcessorTypes[0] === 'ExcludeTarget' &&
      write.postProcessorTypes[1] === 'PriorityFilter' &&
      write.excludeTargets?.length === 1 &&
      write.excludeTargets[0]!.targetSource === 'Context' &&
      staticEnemyTargetGroupKeys.has(write.excludeTargets[0]!.targetGroupKey) &&
      write.priorityFilters.length === 1 &&
      write.priorityFilters[0]!.filterType === 'DistanceFromOwnerAsc'
    ) {
      // 唯一敌人列表排除已证明的同一敌人后恒为空；PriorityFilter 不会再产生候选。
      staticEmptyTargetGroupKeys.add(write.targetGroupKey);
    }
  }
  // 标签/智能目标筛选会令集合动态为空，但在固定木桩模型中不可能产生第二个敌人。
  // 这项证明只供 ForEach 保留“零次或一次”的运行时语义，不能升级成静态必有敌人。
  const singleEnemyTargetGroupKeys = new Set(staticEnemyTargetGroupKeys);
  for (const [key, writes] of targetGroupWritesByKey) {
    if (
      writes.length > 0 &&
      writes.every(
        write =>
          isStaticSingleEnemyTargetGroup(write) ||
          isDynamicSingleEnemyTagTargetGroup(write) ||
          isDynamicSingleEnemySmartTargetGroup(write),
      )
    ) {
      singleEnemyTargetGroupKeys.add(key);
    }
  }
  // “恒为敌人”与“恒为一个零空间目标”是两项不同事实。技能型 Buff 的目标组可能
  // 在主控/非主控分支分别写入唯一敌人和 FixedPoint；它不能冒充敌人身份，但两条
  // 路径都严格产生一个目标，后续数量守卫和 ForEach 仍应保持原生的零次/一次语义。
  const atMostOneZeroSpaceTargetGroupKeys = new Set([
    ...(contextOverrides.atMostOneZeroSpaceTargetGroupKeys ?? []),
    ...singleEnemyTargetGroupKeys,
    ...[...targetGroupWritesByKey]
      .filter(
        ([, writes]) =>
          writes.length > 0 &&
          writes.every(
            write =>
              isStaticSingleEnemyTargetGroup(write) ||
              isStaticZeroSpacePointWrite(write) ||
              isStaticControlledOperatorWrite(write),
          ),
      )
      .map(([key]) => key),
  ]);
  const guaranteedSingletonZeroSpaceTargetGroupKeysByTimeline = timelineActions.map(
    () => new Set<string>(),
  );
  let guaranteedSingletonZeroSpaceTargetGroupKeys = new Set(
    contextOverrides.guaranteedSingletonZeroSpaceTargetGroupKeys ?? [],
  );
  const orderedTimelineIndexes = timelineActions
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
            isStaticSingleEnemyTargetGroup(write) ||
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
  const combatInvisibleRandomBlackboardKeys = collectBuffPresentationRandomKeys(allSequences);
  const combatInvisiblePresentationBlackboardKeys =
    collectCombatInvisiblePresentationAssignmentKeys(allSequences);
  const staticAbilityEntityTargetGroupKeys = new Set([
    ...(contextOverrides.staticAbilityEntityTargetGroupKeys ?? []),
    ...targetGroupNodes.flatMap(node =>
      node.metadata.enabled &&
      node.body.kind === 'leaf' &&
      node.body.value.family === 'targetGroup' &&
      node.body.value.action.producerType === 'FindTargetAction' &&
      node.body.value.action.finderType === 'OwnerSpawnedEntityFinder' &&
      node.body.value.action.finderSpawnedObjectType === 'AbilityEntity'
        ? [node.body.value.action.targetGroupKey]
        : [],
    ),
    ...targetGroupNodes.flatMap(node =>
      node.metadata.enabled &&
      node.body.kind === 'leaf' &&
      node.body.value.family === 'abilityEntity' &&
      node.body.value.action.kind === 'abilityEntitySpawn' &&
      node.body.value.action.saveToContext &&
      node.body.value.action.contextKey.length > 0
        ? [node.body.value.action.contextKey]
        : [],
    ),
  ]);
  let abilityEntityGroupChanged = true;
  while (abilityEntityGroupChanged) {
    abilityEntityGroupChanged = false;
    for (const node of targetGroupNodes) {
      if (
        !node.metadata.enabled ||
        node.body.kind !== 'leaf' ||
        node.body.value.family !== 'targetGroup' ||
        node.body.value.action.producerType !== 'PickTargetAction' ||
        !node.body.value.action.inputTargets.some(
          target =>
            target.targetSource === 'Context' &&
            staticAbilityEntityTargetGroupKeys.has(target.targetGroupKey),
        ) ||
        staticAbilityEntityTargetGroupKeys.has(node.body.value.action.targetGroupKey)
      ) {
        continue;
      }
      staticAbilityEntityTargetGroupKeys.add(node.body.value.action.targetGroupKey);
      abilityEntityGroupChanged = true;
    }
  }
  const projectionContextOverrides = {
    gameplayTagRegistry: abilityEntityQueries?.gameplayTagRegistry,
    ...contextOverrides,
    ...(staticEnemyTargetGroupKeys.size === 0 ? {} : { staticEnemyTargetGroupKeys }),
    ...(staticEmptyTargetGroupKeys.size === 0 ? {} : { staticEmptyTargetGroupKeys }),
    ...(singleEnemyTargetGroupKeys.size === 0 ? {} : { singleEnemyTargetGroupKeys }),
    ...(atMostOneZeroSpaceTargetGroupKeys.size === 0 ? {} : { atMostOneZeroSpaceTargetGroupKeys }),
    ...(staticAbilityEntityTargetGroupKeys.size === 0
      ? {}
      : { staticAbilityEntityTargetGroupKeys }),
    ...(combatInvisibleRandomBlackboardKeys.size === 0
      ? {}
      : { combatInvisibleRandomBlackboardKeys }),
    ...(combatInvisiblePresentationBlackboardKeys.size === 0
      ? {}
      : { combatInvisiblePresentationBlackboardKeys }),
  };
  const scheduledSequences = timelineActions.flatMap((timeline, timelineIndex) => {
    const animationEndNodes: NativeActionNodeSource<KnownNativeActionLeafSource>[] = [];
    let animationEndFrame: number | null = null;
    const timelineActions = timeline.sequence.actions.map(node => {
      if (
        node.body.kind !== 'leaf' ||
        node.body.value.family !== 'presentation' ||
        node.body.value.action.kind !== 'playAnimation'
      )
        return node;
      const animation = node.body.value.action;
      const onEnd = animation.onEnd;
      if (onEnd === undefined) return node;
      const naturalEndFrame =
        timeline.startFrame +
        Math.max(0, Math.ceil((animation.durationSeconds - animation.blendOutSeconds) * 30));
      const callbackFrame = Math.min(naturalEndFrame, timeline.endFrame);
      if (callbackFrame < naturalEndFrame && animation.executeOnNormalEndOnly)
        throw new Error(`${node.sourcePath}.onEndAction: interrupted normal-only callback`);
      if (animationEndFrame !== null && animationEndFrame !== callbackFrame)
        throw new Error(`${node.sourcePath}.onEndAction: conflicting callback frames`);
      animationEndFrame = callbackFrame;
      onEnd.conditions.forEach((condition, index) => {
        animationEndNodes.push({
          metadata: node.metadata,
          sourcePath: `${node.sourcePath}.onEndAction.condition[${index}]`,
          body: { kind: 'leaf', value: { family: 'condition', action: condition } },
        });
      });
      onEnd.buffApplications.forEach((action, index) => {
        animationEndNodes.push({
          metadata: node.metadata,
          sourcePath: `${node.sourcePath}.onEndAction.buffApplication[${index}]`,
          body: { kind: 'leaf', value: { family: 'buffApplication', action } },
        });
      });
      return {
        ...node,
        body: {
          ...node.body,
          value: {
            ...node.body.value,
            action: { ...animation, onEnd: undefined },
          },
        },
      } as NativeActionNodeSource<KnownNativeActionLeafSource>;
    });
    const timelineContext = {
      ...BUFF_LIFECYCLE_CONTEXT,
      abilityEntityQueries,
      ...projectionContextOverrides,
      guaranteedSingletonZeroSpaceTargetGroupKeys:
        guaranteedSingletonZeroSpaceTargetGroupKeysByTimeline[timelineIndex],
      timelineRange: { startFrame: timeline.startFrame, endFrame: timeline.endFrame },
    };
    const sequence = compileLinearSequence(
      { ...timeline.sequence, actions: timelineActions },
      visualOnlyIds,
      timelineContext,
      extensions,
    );
    const main =
      sequence.steps.length === 0
        ? []
        : [{ startFrame: timeline.startFrame, endFrame: timeline.endFrame, sequence }];
    if (animationEndNodes.length === 0) return main;
    if (animationEndFrame === null) throw new Error('animation end actions have no callback frame');
    const onEnd = compileLinearSequence(
      {
        onlyExecuteWhenSourceIsMainCharacter: false,
        onlyExecuteWhenSourceIsGuard: false,
        actions: animationEndNodes,
      },
      visualOnlyIds,
      {
        ...timelineContext,
        timelineRange: { startFrame: animationEndFrame, endFrame: animationEndFrame },
      },
      extensions,
    );
    return onEnd.steps.length === 0
      ? main
      : [...main, { startFrame: animationEndFrame, endFrame: animationEndFrame, sequence: onEnd }];
  });
  for (const event of source.graph.buffEvents) {
    const target =
      event.event === 'OnBuffStart'
        ? startSequences
        : event.event === 'OnBuffEnable'
          ? enableSequences
          : event.event === 'DuringBuffEnable'
            ? enableSequences
            : event.event === 'OnBuffTrigger'
              ? triggerSequences
              : event.event === 'OnBuffEnhanceChanged'
                ? enhanceChangedSequences
                : event.event === 'OnBuffAfterTryEnhanced'
                  ? afterEnhanceSequences
                  : event.event === 'OnBuffFinish'
                    ? finishSequences
                    : null;
    if (target === null) {
      const isTrainingOnlyInterruptedEvent =
        event.event === 'OnBuffFinishedEarlyInterrupted' &&
        event.actions
          .flatMap(sequence => collectNativeActionNodes(sequence))
          .filter(node => node.metadata.enabled)
          .every(
            node =>
              node.body.kind === 'leaf' &&
              node.body.value.family === 'levelEvent' &&
              node.body.value.action.kind === 'trainingLevelEvent',
          );
      if (isTrainingOnlyInterruptedEvent) continue;
      throw new Error(`unsupported Buff event ${JSON.stringify(event.event)}`);
    }
    for (const sequence of event.actions) {
      const skillAffixBody =
        event.event === 'DuringBuffEnable' ? splitDirectSkillAffixSequence(sequence) : null;
      // AfterTryEnhanced 的默认 Target 仍是持有者，Source 由运行时绑定本次叠层者。
      // Finish/EnhanceChanged 保留现有事件投影，不能据此一并放宽未核实的来源映射。
      const compiled = compileLinearSequence(
        skillAffixBody ?? sequence,
        visualOnlyIds,
        event.event === 'OnBuffStart' ||
          event.event === 'OnBuffEnable' ||
          event.event === 'DuringBuffEnable' ||
          event.event === 'OnBuffFinish' ||
          event.event === 'OnBuffAfterTryEnhanced'
          ? { ...BUFF_LIFECYCLE_CONTEXT, abilityEntityQueries, ...projectionContextOverrides }
          : { ...BUFF_ACTION_CONTEXT, abilityEntityQueries, ...projectionContextOverrides },
        extensions,
      );
      if (skillAffixBody !== null) {
        // 原生动作在序列末尾执行；前序失败时不得提前记录身份或建立监听。
        target.push({
          ...compiled,
          steps: [...compiled.steps, { kind: 'skillAffix', parameters: {} }],
        });
      } else if (compiled.steps.length > 0) target.push(compiled);
    }
  }
  const effectiveOmittedAbilityEvents = new Set(omittedAbilityEvents);
  // 固定场景不会遣返队伍；唯一敌人也没有部件模型或部件禁用入口。两者只执行关联实体
  // 清理/收尾技能，不能伪造成普通 Buff 结束事件。
  effectiveOmittedAbilityEvents.add('OnSquadRepatriate');
  effectiveOmittedAbilityEvents.add('OnRemoveAllPendingComboSkill');
  if (contextOverrides.fixedBuffOwnerTarget === 'enemy') {
    effectiveOmittedAbilityEvents.add('OnBeforePartDisable');
  }
  for (const event of source.graph.abilityEvents) {
    if (event.event !== 'OnAbilityEntitySpawned' && event.event !== 'OnAbilityEntityFinished')
      continue;
    try {
      const sequences = event.actions.map(sequence =>
        compileLinearSequence(
          sequence,
          visualOnlyIds,
          { ...BUFF_ACTION_CONTEXT, abilityEntityQueries, ...projectionContextOverrides },
          extensions,
        ),
      );
      // 只省略经正常投影已证明没有任何战斗步骤的实体出生监听；未知动作仍由正式路径报错。
      if (sequences.every(sequence => sequence.steps.length === 0)) {
        effectiveOmittedAbilityEvents.add(event.event);
      }
    } catch {
      // 保持严格失败；这里仅是纯表现事件的前置证明，不吞正式编译错误。
    }
  }
  for (const event of source.graph.abilityEvents) {
    if (event.event !== 'OnSkillInterrupted') continue;
    try {
      const sequences = event.actions.map(sequence =>
        compileLinearSequence(
          sequence,
          visualOnlyIds,
          {
            ...BUFF_ACTION_CONTEXT,
            abilityEntityQueries,
            ...projectionContextOverrides,
            nativeAbilityEvent: event.event,
          },
          extensions,
        ),
      );
      // Next 只产生 CastNextSkill 中断；严格编译并证明该事件的所有分支在此模型下为空后，
      // 才省略尚未公开的 OnSkillInterrupted 事件，不吞未知条件或动作。
      if (sequences.every(sequence => sequence.steps.length === 0)) {
        effectiveOmittedAbilityEvents.add(event.event);
      }
    } catch {
      // 正式编译继续报告原始错误。
    }
  }
  // Ability-event callbacks retain the Buff's ordinary cast info; event cast
  // info is a separate value. Do not extend this proof to ignite callbacks,
  // whose execution context can replace ordinary cast provenance.
  const abilityEventProjectionContext = {
    ...projectionContextOverrides,
    actionEnvironmentSkillCastInfoIsSourceCast: buffHasNoAffixIdentityWriter(source),
  };
  const abilityEventResponses = compileAbilityEventPrograms(
    source.graph.abilityEvents
      .filter(event =>
        event.actions.some(sequence => sequence.actions.some(node => node.metadata.enabled)),
      )
      .map(event => ({
        abilityEvent: event.event,
        actions: event.actions,
      })),
    {
      sourcePath: `BuffData.${source.graph.buffId}.abilityEventAction`,
      omitEvent: event => effectiveOmittedAbilityEvents.has(event),
      mapEvent: (event, sourcePath) =>
        projectBuffAbilityEvent(event, sourcePath, contextOverrides.fixedBuffOwnerTarget),
      compileSequence: (sequence, _sequencePath, abilityEvent) =>
        compileLinearSequence(
          omitFixedExternalOperatorHitEnemyGuard(
            sequence,
            abilityEvent,
            contextOverrides.fixedBuffOwnerTarget,
          ),
          visualOnlyIds,
          abilityEvent === 'OnBeforeAddedBuff'
            ? {
                ...BUFF_BEFORE_ADDED_CONTEXT,
                abilityEntityQueries,
                ...abilityEventProjectionContext,
              }
            : abilityEvent === 'OnBeforeTakeDamage' ||
                abilityEvent === 'OnBeforeTakePhysicalInfliction'
              ? {
                  ...BUFF_BEFORE_TAKE_CONTEXT,
                  abilityEntityQueries,
                  ...abilityEventProjectionContext,
                }
              : (abilityEvent === 'OnOutputDamage' ||
                    abilityEvent === 'OnBeforeOutputDamage' ||
                    abilityEvent === 'OnBeforeDamageAction') &&
                  contextOverrides.fixedBuffOwnerTarget === 'caster'
                ? {
                    ...BUFF_ACTION_CONTEXT,
                    // 固定木桩场景中干员输出伤害的受击目标只能是唯一敌人。保留事件
                    // 条件与动态标签筛选，但无需把已知身份降级成不可投影的 eventTarget。
                    actionTargetTarget: 'enemy' as const,
                    abilityEntityQueries,
                    ...abilityEventProjectionContext,
                  }
                : {
                    ...BUFF_ACTION_CONTEXT,
                    abilityEntityQueries,
                    ...abilityEventProjectionContext,
                    nativeAbilityEvent: abilityEvent,
                  },
          extensions,
        ),
      isEmptySequence: sequence => sequence.steps.length === 0,
    },
  ).map(({ event, priority, sequence }) => ({ event, priority, sequence }));
  for (const qte of comboQteSources) {
    const triggeredAction = compileLinearSequence(
      qte.triggeredAction,
      visualOnlyIds,
      { ...BUFF_ACTION_CONTEXT, abilityEntityQueries, ...projectionContextOverrides },
      extensions,
    );
    abilityEventResponses.push({
      event: 'beforeCastSkill',
      priority: 0,
      sequence: {
        steps: [
          {
            kind: 'conditional',
            parameters: {
              condition: {
                kind: 'all',
                conditions: [
                  { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
                  { kind: 'eventComboRingQteSucceeded' },
                ],
              },
            },
            whenTrue: triggeredAction,
          },
        ],
      },
    });
  }
  const igniteEventResponses = source.graph.igniteEvents.map(event => ({
    igniteType: event.igniteType,
    finishAfterIgnited: event.finishAfterIgnited,
    sequence: mergeSequences(
      event.actions.map(sequence =>
        compileLinearSequence(
          sequence,
          visualOnlyIds,
          {
            ...BUFF_IGNITE_CONTEXT,
            abilityEntityQueries,
            ...projectionContextOverrides,
          },
          extensions,
        ),
      ),
    ),
  }));
  const blackboard = Object.fromEntries(
    source.graph.declaredBlackboard.map(item => [item.key, item.value]),
  );
  return {
    stackingType: STACKING_TYPES[source.lifecycle.stackingType],
    ...(source.lifecycle.stackingIdentifierType === 'StackingKey'
      ? { stackingKey: source.lifecycle.stackingKey }
      : {}),
    priority:
      source.lifecycle.priority.blackboardKey === null
        ? signed(source.lifecycle.priority.value, source.lifecycle.negatePriority)
        : {
            blackboardKey: source.lifecycle.priority.blackboardKey,
            ...(source.lifecycle.negatePriority ? { negate: true as const } : {}),
          },
    maxStackCount: scalarOperand(source.lifecycle.maxStackCount),
    ...(source.lifecycle.addingCooldown === null
      ? {}
      : { addingCooldownSeconds: scalarOperand(source.lifecycle.addingCooldown) }),
    ...(source.lifecycle.ignoreAddingCooldown ? { ignoreAddingCooldown: true } : {}),
    ...(source.lifecycle.lifeType === 'Limited' ||
    source.lifecycle.stackingType === 'TimedGrowingEnhance'
      ? { durationSeconds: scalarOperand(source.lifecycle.duration) }
      : {}),
    ...(source.lifecycle.triggerInterval.value < 0 &&
    source.lifecycle.triggerInterval.blackboardKey === null
      ? {}
      : {
          triggerIntervalSeconds: scalarOperand(source.lifecycle.triggerInterval),
          waitFirstTriggerInterval: source.lifecycle.waitFirstTriggerInterval,
          maxTriggerCount: scalarOperand(source.lifecycle.maxTriggerCount),
        }),
    ...(source.graph.useTimeDilationDeltaTime
      ? {
          timeClock: source.graph.onlyUseSelfTimeDilation ? ('self' as const) : ('global' as const),
        }
      : {}),
    ...(source.presentation.hasIcon || source.presentation.spritePath !== ''
      ? { presentation: compilePresentation(source.presentation) }
      : {}),
    applyTags: projectGameplayTags(
      source.applyTagIds,
      projectionContextOverrides,
      `BuffData.${source.graph.buffId}.applyTags`,
    ),
    extendTags: projectGameplayTags(
      source.extendTagIds,
      projectionContextOverrides,
      `BuffData.${source.graph.buffId}.extendTags`,
    ),
    blackboard,
    attributeModifiers: source.attributeModifiers.modifiers.flatMap((modifier, index) => {
      const compiled = compileResolvedAttributeModifierSource({
        sourcePath: `BuffData.${source.graph.buffId}.attributeModifier.attributeModifiers[${index}]`,
        modifyAttributeType: modifier.modifyAttributeType,
        attributeType: modifier.attributeType,
        formulaItem: modifier.formulaItem,
        value: 0,
      });
      if (
        modifier.modifyAttributeType === 'Specific' &&
        !isCombatRuntimeAttributeRelevant(modifier.attributeType)
      )
        return [];
      const attribute =
        modifier.modifyAttributeType === 'Specific'
          ? projectCombatRuntimeAttributeKey(modifier.attributeType)
          : modifier.modifyAttributeType === 'Main'
            ? ({ kind: 'main' } as const)
            : modifier.modifyAttributeType === 'Sub'
              ? ({ kind: 'secondary' } as const)
              : ({ kind: 'all' } as const);
      return [
        {
          attribute,
          slot: compiled.slot,
          value: scalarOperand(modifier.parameter),
        },
      ];
    }),
    ...compileBuffDamageModifiers(source, projectionContextOverrides),
    ...compileBuffHealModifiers(source, projectionContextOverrides),
    ...compileBuffPoiseModifiers(source),
    ...compileBuffShields(source),
    ...(scheduledSequences.length === 0 ? {} : { scheduledSequences }),
    ...(startSequences.length === 0 &&
    enableSequences.length === 0 &&
    triggerSequences.length === 0 &&
    enhanceChangedSequences.length === 0 &&
    afterEnhanceSequences.length === 0 &&
    finishSequences.length === 0
      ? {}
      : {
          lifecycleSequences: {
            ...(startSequences.length === 0 ? {} : { start: mergeSequences(startSequences) }),
            ...(enableSequences.length === 0 ? {} : { enable: mergeSequences(enableSequences) }),
            ...(triggerSequences.length === 0 ? {} : { trigger: mergeSequences(triggerSequences) }),
            ...(enhanceChangedSequences.length === 0
              ? {}
              : { enhanceChanged: mergeSequences(enhanceChangedSequences) }),
            ...(finishSequences.length === 0 ? {} : { finish: mergeSequences(finishSequences) }),
            ...(afterEnhanceSequences.length === 0
              ? {}
              : { afterEnhance: mergeSequences(afterEnhanceSequences) }),
          },
        }),
    ...(abilityEventResponses.length === 0 ? {} : { abilityEventResponses }),
    ...(igniteEventResponses.length === 0 ? {} : { igniteEventResponses }),
  };
}

/**
 * 当前 operatorHit 外部事实固定由唯一敌人发出，且输入协议不表示 Dot / RemainArea。
 * 角色受击监听开头的对应类型与 ExceptAny 守卫因此恒真；只删除这些无黑板副作用的精确前缀，
 * 不推广到敌方 Buff、其他事件或其他掩码。
 */
function omitFixedExternalOperatorHitEnemyGuard(
  sequence: NativeSequenceSource<KnownNativeActionLeafSource>,
  abilityEvent: string | number,
  fixedBuffOwnerTarget?: 'caster' | 'enemy' | 'currentAbilityEntity',
): NativeSequenceSource<KnownNativeActionLeafSource> {
  if (
    fixedBuffOwnerTarget !== 'caster' ||
    (abilityEvent !== 'OnBeforeTakeDamage' && abilityEvent !== 'OnTakeDamage')
  ) {
    return sequence;
  }
  let omitted = 0;
  for (const node of sequence.actions) {
    if (node.body.kind !== 'leaf' || node.body.value.family !== 'condition') break;
    const condition = node.body.value.action;
    const isEnemySourceGuard =
      condition.kind === 'objectTypeMatch' &&
      condition.target.targetSource === 'Target' &&
      condition.target.targetGroupKey === '' &&
      condition.objectTypeMask === 'Enemy';
    const isDirectDamageGuard =
      condition.kind === 'damageDecorateMask' &&
      condition.checkType === 'ExceptAny' &&
      condition.mask === 268435456 + 536870912;
    if (!isEnemySourceGuard && !isDirectDamageGuard) break;
    omitted += 1;
  }
  return omitted === 0 ? sequence : { ...sequence, actions: sequence.actions.slice(omitted) };
}

function splitDirectSkillAffixSequence(
  source: NativeSequenceSource<KnownNativeActionLeafSource>,
): NativeSequenceSource<KnownNativeActionLeafSource> | null {
  if (source.onlyExecuteWhenSourceIsMainCharacter || source.onlyExecuteWhenSourceIsGuard) {
    return null;
  }
  const nodes = source.actions.filter(node => node.metadata.enabled);
  const affixes = nodes.filter(
    node => node.body.kind === 'leaf' && node.body.value.family === 'skillAffix',
  );
  if (affixes.length !== 1 || affixes[0] !== nodes.at(-1)) return null;
  return { ...source, actions: source.actions.filter(node => node !== affixes[0]) };
}

function compileBuffDamageModifiers(
  source: BuffRuntimeSource,
  context: Pick<CombatActionProjectionContextSource, 'gameplayTagRegistry'>,
): {
  readonly damageModifiers?: readonly CompiledBuffDamageModifierSource[];
} {
  const modifiers = source.damageModifiers.flatMap((modifier, index) => {
    const enabledSide = DAMAGE_MODIFIER_SIDES[modifier.enabledSide];
    if (enabledSide === undefined) {
      throw new Error(
        `damageModifier[${index}]: unsupported enabled side ${JSON.stringify(modifier.enabledSide)}`,
      );
    }
    const conditionSource = compileDamageModifierCondition(
      modifier.condition,
      index,
      context,
      enabledSide,
    );
    // 原生先执行条件再遍历处理器。只有公共序列已证明无副作用，空列表才可省略。
    if (modifier.processors.length === 0 && conditionSource.conditionProgram === undefined)
      return [];
    const processors = modifier.processors.flatMap<
      CompiledBuffDamageModifierSource['processors'][number]
    >((processor, processorIndex) => {
      const processorPath = `damageModifier[${index}].damageProcessors[${processorIndex}]`;
      if (processor.kind === 'damageTextPresentation') return [];
      if (processor.kind === 'damageScale') {
        const side = DAMAGE_MODIFIER_SIDES[processor.side];
        const zone = DAMAGE_SCALE_ZONES[processor.zoneName];
        if (side === undefined || zone === undefined) {
          throw new Error(`${processorPath}: unsupported side/zone`);
        }
        return [
          {
            kind: 'damageScale' as const,
            side,
            zone,
            addition: scalarOperand(processor.addition),
          },
        ];
      }
      const targetSide = DAMAGE_MODIFIER_SIDES[processor.targetSide];
      if (targetSide === undefined || processor.modifyAttributeType !== 'Specific') {
        throw new Error(`${processorPath}: unsupported instant attribute target`);
      }
      const compiled = compileResolvedAttributeModifierSource({
        sourcePath: processorPath,
        modifyAttributeType: processor.modifyAttributeType,
        attributeType: processor.attributeType,
        formulaItem: processor.formulaItem,
        value: 0,
      });
      return [
        {
          kind: 'instantAttribute' as const,
          targetSide,
          attribute: projectCombatRuntimeAttributeKey(processor.attributeType),
          values: { slot: compiled.slot, value: scalarOperand(processor.parameter) },
          attributeTiming: 'runtime' as const,
        },
      ];
    });
    if (processors.length === 0 && conditionSource.conditionProgram === undefined) return [];
    return [{ enabledSide, ...conditionSource, processors }];
  });
  return modifiers.length === 0 ? {} : { damageModifiers: modifiers };
}

function compileBuffHealModifiers(
  source: BuffRuntimeSource,
  context: Pick<CombatActionProjectionContextSource, 'gameplayTagRegistry'>,
): {
  readonly healModifiers?: readonly CompiledBuffHealModifierSource[];
} {
  const modifiers = source.healModifiers.map((modifier, modifierIndex) => {
    const enabledSide =
      modifier.enabledSide === 'Healer'
        ? ('healer' as const)
        : modifier.enabledSide === 'HealReceiver'
          ? ('receiver' as const)
          : null;
    if (enabledSide === null) {
      throw new Error(
        `healModifier[${modifierIndex}]: unsupported enabled side ${JSON.stringify(modifier.enabledSide)}`,
      );
    }
    const nodes = modifier.condition.actions.filter(node => node.metadata.enabled);
    if (
      modifier.condition.onlyExecuteWhenSourceIsMainCharacter ||
      modifier.condition.onlyExecuteWhenSourceIsGuard ||
      nodes.length > 1
    ) {
      throw new Error(`healModifier[${modifierIndex}]: unsupported condition sequence`);
    }
    const condition =
      nodes.length === 0 ? undefined : compileHealModifierCondition(nodes[0]!, context);
    const processors = modifier.processors.map((processor, processorIndex) => {
      if (processor.kind === 'modifyCalculationResult') {
        return {
          kind: 'modifyCalculationResult' as const,
          timing: 'afterCalculation' as const,
          baseMultiplier: scalarOperand(processor.baseMultiplier),
          multiplierCount: scalarOperand(processor.multiplierCount),
        };
      }
      const targetSide =
        processor.modifyTargetSide === 'Attacker'
          ? ('healer' as const)
          : processor.modifyTargetSide === 'Defender'
            ? ('receiver' as const)
            : null;
      const expectedAttribute =
        targetSide === 'healer' ? 'HealOutputIncrease' : 'HealTakenIncrease';
      if (
        targetSide === null ||
        processor.modifier.modifyAttributeType !== 'Specific' ||
        processor.modifier.attributeType !== expectedAttribute ||
        processor.modifier.formulaItem !== 'BaseAddition'
      ) {
        throw new Error(
          `healModifier[${modifierIndex}].healProcessors[${processorIndex}]: unsupported instant healing attribute modifier`,
        );
      }
      return {
        kind: 'modifyHealingIncrease' as const,
        timing: 'beforeCalculation' as const,
        side: targetSide,
        addition: scalarOperand(processor.modifier.parameter),
      };
    });
    if (processors.length === 0) {
      throw new Error(`healModifier[${modifierIndex}]: expected at least one processor`);
    }
    return { enabledSide, ...(condition === undefined ? {} : { condition }), processors };
  });
  return modifiers.length === 0 ? {} : { healModifiers: modifiers };
}

function compileHealModifierCondition(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  context: Pick<CombatActionProjectionContextSource, 'gameplayTagRegistry'>,
): NonNullable<CompiledBuffHealModifierSource['condition']> {
  if (node.body.kind !== 'leaf' || node.body.value.family !== 'condition') {
    throw new Error(`${node.sourcePath}: expected a heal modifier condition`);
  }
  const condition = node.body.value.action;
  if (condition.kind === 'health') {
    if (
      condition.targetSource !== 'Target' ||
      condition.targetGroupKey !== '' ||
      condition.characterTeamSelection !== null
    ) {
      throw new Error(`${node.sourcePath}: unsupported heal target health condition`);
    }
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined)
      throw new Error(`${node.sourcePath}: unsupported health comparison`);
    return {
      kind: 'targetHealthCompare',
      valueType: condition.isRatio ? 'ratio' : 'current',
      operator,
      value: scalarOperand(condition.value),
    };
  }
  if (condition.kind !== 'healTag')
    throw new Error(`${node.sourcePath}: unsupported heal modifier condition ${condition.kind}`);
  const match =
    condition.queryType === 'hasAny'
      ? 'hasAny'
      : condition.queryType === 'hasAll'
        ? 'hasAll'
        : null;
  if (match === null) {
    throw new Error(`${node.sourcePath}: unsupported heal tag query ${condition.queryType}`);
  }
  return {
    kind: 'healTagsMatch',
    match,
    tags: projectGameplayTags(condition.tagIds, context, node.sourcePath),
  };
}

function compileBuffPoiseModifiers(source: BuffRuntimeSource): {
  readonly poiseModifiers?: readonly CompiledBuffPoiseModifierSource[];
} {
  const modifiers = source.poiseModifiers.map((modifier, modifierIndex) => {
    const enabledSide =
      modifier.enabledSide === 'Attacker'
        ? ('attacker' as const)
        : modifier.enabledSide === 'Defender'
          ? ('defender' as const)
          : null;
    if (enabledSide === null) {
      throw new Error(
        `poiseModifier[${modifierIndex}]: unsupported enabled side ${JSON.stringify(modifier.enabledSide)}`,
      );
    }
    const condition = compilePoiseModifierCondition(modifier.condition, modifierIndex);
    const processors = modifier.processors.map((processor, processorIndex) => {
      const side =
        processor.modifyTargetSide === 'Attacker'
          ? ('attacker' as const)
          : processor.modifyTargetSide === 'Defender'
            ? ('defender' as const)
            : null;
      const expectedAttribute =
        side === 'attacker' ? 'PoiseDamageOutputScalar' : 'PoiseDamageTakenScalar';
      if (
        side === null ||
        processor.modifier.modifyAttributeType !== 'Specific' ||
        processor.modifier.attributeType !== expectedAttribute ||
        processor.modifier.formulaItem !== 'BaseAddition'
      ) {
        throw new Error(
          `poiseModifier[${modifierIndex}].poiseProcessors[${processorIndex}]: unsupported instant poise attribute modifier`,
        );
      }
      return {
        kind: 'modifyPoiseScalar' as const,
        timing: 'beforeCalculation' as const,
        side,
        addition: scalarOperand(processor.modifier.parameter),
      };
    });
    if (processors.length === 0) {
      throw new Error(`poiseModifier[${modifierIndex}]: expected at least one processor`);
    }
    return { enabledSide, ...(condition === undefined ? {} : { condition }), processors };
  });
  return modifiers.length === 0 ? {} : { poiseModifiers: modifiers };
}

function compilePoiseModifierCondition(
  source: NativeSequenceSource<KnownNativeActionLeafSource>,
  modifierIndex: number,
): CompiledBuffPoiseModifierSource['condition'] | undefined {
  if (source.onlyExecuteWhenSourceIsMainCharacter || source.onlyExecuteWhenSourceIsGuard) {
    throw new Error(`poiseModifier[${modifierIndex}]: root condition filters are unsupported`);
  }
  const conditions = source.actions
    .filter(node => node.metadata.enabled)
    .map(node => {
      if (node.body.kind !== 'leaf' || node.body.value.family !== 'condition') {
        throw new Error(`${node.sourcePath}: expected a poise modifier condition`);
      }
      const condition = node.body.value.action;
      if (condition.kind === 'mainOperator') {
        if (condition.targetSource !== 'Source' || condition.targetGroupKey !== '') {
          throw new Error(`${node.sourcePath}: unsupported poise main-character target`);
        }
        return { kind: 'casterControlled' as const };
      }
      if (condition.kind === 'damageDecorateMask') {
        if (
          (condition.checkType !== 'HasAny' && condition.checkType !== 'HasAll') ||
          condition.mask !== 2097152
        ) {
          throw new Error(`${node.sourcePath}: unsupported poise decorate mask ${condition.mask}`);
        }
        return {
          kind: 'eventDamageTagsMatch' as const,
          match: condition.checkType === 'HasAny' ? ('hasAny' as const) : ('hasAll' as const),
          tags: ['normalAttackLastCombo'] as const,
        };
      }
      throw new Error(`${node.sourcePath}: unsupported poise modifier condition ${condition.kind}`);
    });
  if (conditions.length === 0) return undefined;
  return conditions.length === 1 ? conditions[0] : { kind: 'all', conditions };
}

function compileBuffShields(source: BuffRuntimeSource): {
  readonly shields?: NonNullable<CompiledBuffDefinitionSource['shields']>;
} {
  const shields = source.shields.map((shield, shieldIndex) => {
    if (shield.value.kind === 'definite' && shield.value.applyScale) {
      throw new Error(
        `shieldConfigs[${shieldIndex}]: scaled DefiniteValueCalculation is unsupported`,
      );
    }
    const priority =
      shield.priority === 'Normal'
        ? ('normal' as const)
        : shield.priority === 'PrioritizeConsume'
          ? ('prioritizeConsume' as const)
          : null;
    if (priority === null) {
      throw new Error(
        `shieldConfigs[${shieldIndex}]: unsupported priority ${JSON.stringify(shield.priority)}`,
      );
    }
    return {
      infinityValue: shield.infinityValue,
      value:
        shield.value.kind === 'definite'
          ? scalarOperand(shield.value.value)
          : {
              attributeSource:
                shield.value.valueSource === 'AttackerOrHealer'
                  ? ('buffSource' as const)
                  : shield.value.valueSource === 'Target'
                    ? ('buffOwner' as const)
                    : (() => {
                        throw new Error(
                          `shieldConfigs[${shieldIndex}]: unsupported value source ${JSON.stringify(shield.value.valueSource)}`,
                        );
                      })(),
              attribute: projectCombatRuntimeAttributeKey(shield.value.attributeType),
              multiplier: scalarOperand(shield.value.multiplier),
              addition: scalarOperand(shield.value.addition),
            },
      damageAbsorptions: shield.damageAbsorptions.map((absorption, absorptionIndex) => {
        const damageType = DAMAGE_TYPES[absorption.damageType];
        if (damageType === undefined) {
          throw new Error(
            `shieldConfigs[${shieldIndex}].damageAbsorptions[${absorptionIndex}]: unsupported damage type ${JSON.stringify(absorption.damageType)}`,
          );
        }
        return {
          damageType,
          ratio: scalarOperand(absorption.ratio),
          scale: scalarOperand(absorption.scale),
        };
      }),
      absorbCount:
        shield.absorbCount.blackboardKey === null
          ? shield.absorbCount.value
          : { blackboardKey: shield.absorbCount.blackboardKey },
      absorbAllDamageWhenConsumed: shield.absorbAllDamageWhenConsumed,
      removeBuffWhenConsumed: shield.removeBuffWhenConsumed,
      priority,
      replaceHitEffect: shield.replaceHitEffect,
    };
  });
  return shields.length === 0 ? {} : { shields };
}

function compileDamageModifierCondition(
  source: NativeSequenceSource<KnownNativeActionLeafSource>,
  modifierIndex: number,
  context: Pick<
    CombatActionProjectionContextSource,
    'gameplayTagRegistry' | 'fixedBuffOwnerTarget' | 'fixedBuffSourceTarget'
  >,
  side: DamageModifierSide,
): Pick<CompiledBuffDamageModifierSource, 'condition' | 'conditionProgram'> {
  const program = compileCombatConditionSequenceSource(source, {
    ...context,
    actionOwnerTarget: 'buffOwner',
    actionSourceTarget: 'caster',
    // 原生 Target 是处理侧的对侧，不得把防御方修正的 Target 也当作敌人。
    actionTargetTarget: side === 'attacker' ? 'enemy' : 'caster',
    damageModifierContext: true,
  });
  const path = `damageModifier[${modifierIndex}].condition`;
  try {
    const condition = projectPureDamageModifierCondition(program, path);
    return condition === undefined ? {} : { condition };
  } catch (error) {
    assertSynchronousDamageModifierConditionProgram(program, path, error);
    return { conditionProgram: program };
  }
}

function assertSynchronousDamageModifierConditionProgram(
  sequence: CompiledBuffSequenceSource,
  path: string,
  originalError: unknown,
): void {
  for (const [index, step] of sequence.steps.entries()) {
    const stepPath = `${path}.steps[${index}]`;
    if (step.kind === 'conditional') {
      assertSynchronousDamageModifierConditionProgram(
        step.whenTrue,
        `${stepPath}.whenTrue`,
        originalError,
      );
      if (step.whenFalse !== undefined)
        assertSynchronousDamageModifierConditionProgram(
          step.whenFalse,
          `${stepPath}.whenFalse`,
          originalError,
        );
      continue;
    }
    if (
      step.kind !== 'modifyActionValue' &&
      step.kind !== 'calculateActionValue' &&
      step.kind !== 'readBuffStackCount'
    )
      throw originalError;
  }
}

/** 主动命中切片、被动技能、Buff、武器与装备共享的 Action/Condition 序列投影入口。 */
export function compileCombatActionSequenceSource(
  source: NativeSequenceSource<KnownNativeActionLeafSource>,
  context: CombatActionProjectionContextSource,
  visualOnlyIds: ReadonlySet<string> = new Set(),
  extensions: CombatActionProjectionExtensionsSource = {},
): CompiledBuffSequenceSource {
  return compileLinearSequence(source, visualOnlyIds, context, extensions);
}

/** 连携等调用方消费整个序列的布尔结果；即使尾条件不写黑板，也不能删除。 */
export function compileCombatConditionSequenceSource(
  source: NativeSequenceSource<KnownNativeActionLeafSource>,
  context: CombatActionProjectionContextSource,
  visualOnlyIds: ReadonlySet<string> = new Set(),
): CompiledBuffSequenceSource {
  return compileActionSequenceProgram(source, {
    ...createBuffSequenceProjection(visualOnlyIds, context),
    resultIsConsumed: true,
  });
}

function compileLinearSequence(
  source: NativeSequenceSource<KnownNativeActionLeafSource>,
  visualOnlyIds: ReadonlySet<string>,
  context: CombatActionProjectionContextSource = BUFF_ACTION_CONTEXT,
  extensions: CombatActionProjectionExtensionsSource = {},
): CompiledBuffSequenceSource {
  assertSpatialContextWriteIsolation(source);
  if (
    (source.onlyExecuteWhenSourceIsMainCharacter || source.onlyExecuteWhenSourceIsGuard) &&
    collectNativeActionNodes(source)
      .filter(node => node.metadata.enabled)
      .every(
        node =>
          node.body.kind !== 'leaf' ||
          ['presentation', 'presentationCalculation', 'spatial', 'selfDefense'].includes(
            node.body.value.family,
          ),
      )
  ) {
    return { steps: [] };
  }
  const result = compileActionSequenceProgram(
    source,
    createBuffSequenceProjection(
      visualOnlyIds,
      context,
      extensions,
      extensions.allowRootTimelineFinish === true,
    ),
  );
  // 先按既有固定命中/零空间边界投影，再检查仍被消费的值。
  // 角度可改变原生范围，但被整体省略的选点分支不再是 Next 数值消费者。
  assertPresentationCalculationIsolation([source], [result]);
  return result;
}

/** 选点动作写出的 Context 只能进入空间动作；一旦被战斗动作读取就必须恢复真实几何。 */
function assertSpatialContextWriteIsolation(
  source: NativeSequenceSource<KnownNativeActionLeafSource>,
): void {
  const leaves = collectNativeActionNodes(source).filter(
    node => node.body.kind === 'leaf',
  ) as NativeActionNodeSource<KnownNativeActionLeafSource>[];
  for (const node of leaves) {
    if (
      node.body.kind !== 'leaf' ||
      node.body.value.family !== 'spatial' ||
      node.body.value.action.kind !== 'teleportPositionSelection'
    )
      continue;
    const key = node.body.value.action.outputContextKey;
    for (const consumer of leaves) {
      if (consumer === node || consumer.body.kind !== 'leaf') continue;
      if (!leafActionReadsContextKey(consumer.body.value, key)) continue;
      // DebugPrint 的原生发行版实现直接返回 true，不读取序列化的目标设置。
      if (
        consumer.body.value.family === 'presentation' &&
        consumer.body.value.action.kind === 'debugPrint'
      )
        continue;
      if (
        consumer.body.value.family !== 'spatial' &&
        !(
          consumer.body.value.family === 'condition' &&
          consumer.body.value.action.kind === 'distance'
        )
      ) {
        throw new Error(
          `${node.sourcePath}: spatial output ${key} reaches combat action ${consumer.sourcePath}`,
        );
      }
    }
  }
}

function leafActionReadsContextKey(leaf: KnownNativeActionLeafSource, key: string): boolean {
  if (leaf.family === 'targetGroup' && leaf.action.targetGroupKey === key) {
    return JSON.stringify({ ...leaf.action, targetGroupKey: '' }).includes(JSON.stringify(key));
  }
  if (leaf.family === 'spatial' && leaf.action.kind === 'teleportPositionSelection') {
    return JSON.stringify({ ...leaf.action, outputContextKey: '' }).includes(JSON.stringify(key));
  }
  return JSON.stringify(leaf.action).includes(JSON.stringify(key));
}

function createBuffSequenceProjection(
  visualOnlyIds: ReadonlySet<string>,
  context: CombatActionProjectionContextSource,
  extensions: CombatActionProjectionExtensionsSource = {},
  allowRootTimelineFinish = false,
): CompileActionSequenceProgramOptions<
  KnownNativeActionLeafSource,
  CompiledBuffConditionSource,
  CompiledBuffStepSource,
  ReadonlyMap<string, BuffProjectionTargetGroup>
> {
  const runtimeTargetGroups = (
    targetGroups: ReadonlyMap<string, BuffProjectionTargetGroup>,
  ): ReadonlyMap<string, ProjectedTargetGroup> => {
    const result = new Map<string, ProjectedTargetGroup>();
    for (const [key, value] of targetGroups) {
      if (value !== 'guaranteedSingletonZeroSpace') result.set(key, value);
    }
    return result;
  };
  const compileLeaf = (
    node: NativeActionNodeSource<KnownNativeActionLeafSource>,
    partyTargetGroups: ReadonlyMap<string, BuffProjectionTargetGroup>,
  ) => {
    const visibleTargetGroups = runtimeTargetGroups(partyTargetGroups);
    const compiled =
      node.body.kind === 'leaf' &&
      node.body.value.family === 'eventListener' &&
      node.body.value.action.events.some(
        event =>
          event.abilityEvent === 'OnAddedBuff' ||
          event.abilityEvent === 'OnBeforeAddedBuff' ||
          event.abilityEvent === 'OnOutputBuff' ||
          event.abilityEvent === 'OnBeforeTakeDamage' ||
          event.abilityEvent === 'OnSkillEnd',
      )
        ? compileEventListenerNode(node, visualOnlyIds, visibleTargetGroups, context, extensions)
        : compileBuffLeafNode(node, visualOnlyIds, visibleTargetGroups, context, extensions);
    const refinedEntries = [...partyTargetGroups].filter(
      ([, value]) => value === 'guaranteedSingletonZeroSpace',
    );
    if (refinedEntries.length === 0) return compiled;
    const overwrittenKey =
      node.body.kind === 'leaf' && node.body.value.family === 'targetGroup'
        ? node.body.value.action.targetGroupKey
        : null;
    const nextState = new Map<string, BuffProjectionTargetGroup>(compiled.state);
    for (const [key, value] of refinedEntries) {
      if (key !== overwrittenKey && !nextState.has(key)) nextState.set(key, value);
    }
    return { ...compiled, state: nextState };
  };
  return {
    initialState: () =>
      new Map<string, BuffProjectionTargetGroup>([
        ...[...(context.operatorTargetGroupKeys ?? [])].map(
          key => [key, 'contextOperator'] as const,
        ),
        ...[...(context.staticAbilityEntityTargetGroupKeys ?? [])].map(
          key => [key, 'abilityEntity'] as const,
        ),
        ...[...(context.dynamicSpatialPointCounts?.keys() ?? [])].map(
          key => [key, 'spatialPoint'] as const,
        ),
      ]),
    compileCondition: (node, targetGroups) =>
      compileEventCondition(node, context, runtimeTargetGroups(targetGroups)),
    compileConditionSequence: (sequence, targetGroups) => {
      const nodes = sequence.actions.filter(node => node.metadata.enabled);
      if (nodes.length !== 2) return null;
      const [readNode, compareNode] = nodes;
      if (readNode?.body.kind !== 'leaf' || readNode.body.value.family !== 'buffBlackboardRead') {
        return null;
      }
      const read = compileLeaf(readNode, targetGroups);
      if (read.steps.length !== 1 || read.steps[0]?.kind !== 'readBuffBlackboard') return null;
      const compare = compileEventCondition(
        compareNode!,
        context,
        runtimeTargetGroups(targetGroups),
      );
      if (
        compare?.kind !== 'actionValueCompare' ||
        compare.left.kind !== 'blackboard' ||
        compare.left.key !== readNode.body.value.action.outputKey
      ) {
        return null;
      }
      return {
        kind: 'buffBlackboardValueCompare',
        target: read.steps[0].parameters.target,
        query: read.steps[0].parameters.query,
        desiredKey: read.steps[0].parameters.desiredKey,
        outputKey: read.steps[0].parameters.outputKey,
        operator: compare.operator,
        value: compare.right,
      };
    },
    canOmitTerminalCondition: canOmitUnusedCompiledCondition,
    canOmitUnusedCondition: canOmitUnusedNativeCondition,
    evaluateCondition: condition => {
      if (condition.kind === 'constant') return condition.value;
      if (condition.kind === 'all' && condition.conditions.length === 0) return true;
      if (condition.kind === 'any' && condition.conditions.length === 0) return false;
      return undefined;
    },
    combineConditions: conditions =>
      conditions.length === 1 ? conditions[0]! : { kind: 'all', conditions },
    negateCondition: condition => ({ kind: 'not', condition }),
    compileLeaf,
    compileActionWithCallback: (node, state) => {
      const callback = compileActionSequenceProgram(node.body.callback, {
        ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
        initialState: () => state,
      });
      if (callback.steps.length > 0) {
        throw new Error(
          `${node.sourcePath}: combat-visible targetPointInvalid callback requires native trigger projection`,
        );
      }
      // 子树已消去后才检查持有动作；不能因原始回调非空就拒绝或让其无条件执行。
      return compileLeaf({ ...node, body: { kind: 'leaf', value: node.body.value } }, state);
    },
    refineIfElseBranchState: (node, state, branch) => {
      if (branch !== 'whenTrue') return state;
      const conditions = node.body.condition.actions.filter(child => child.metadata.enabled);
      const condition = conditions[0];
      if (
        conditions.length !== 1 ||
        condition?.body.kind !== 'leaf' ||
        condition.body.value.family !== 'condition' ||
        condition.body.value.action.kind !== 'entityCount'
      ) {
        return state;
      }
      const count = condition.body.value.action;
      if (
        count.targetSource !== 'Context' ||
        context.atMostOneZeroSpaceTargetGroupKeys?.has(count.targetGroupKey) !== true ||
        count.containsHittableTarget ||
        count.excludeDeadEntity ||
        count.storeKey !== '' ||
        compareKnownNumbers(1, count.comparison, count.minimumCount) !== true ||
        compareKnownNumbers(0, count.comparison, count.minimumCount) !== false
      ) {
        return state;
      }
      const refined = new Map(state);
      refined.set(count.targetGroupKey, 'guaranteedSingletonZeroSpace');
      return refined;
    },
    compilePhysicsCast: (node, state) =>
      context.combatInvisiblePhysicsCastPaths?.has(node.sourcePath) === true
        ? { steps: [], state }
        : null,
    compileNodePrefix: (nodes, partyTargetGroups) => {
      const first = nodes[0]!;
      if (
        first.body.kind === 'leaf' &&
        first.body.value.family === 'projectile' &&
        nodes.every(
          node =>
            node.body.kind === 'leaf' &&
            // 条件叶控制其后的动作，不能作为“同步普通叶”越过公共短路编排。
            // 含条件的序列回到标准程序；即使这使回调先于纯表现尾部，也不能改变战斗语义。
            node.body.value.family !== 'condition',
        )
      ) {
        // Launch 当下建立投射物，但零距离命中回调仍在首个移动 Tick。
        // 线性 Sequence 中所有后续同步叶子必须先执行，多个投射物回调则保持
        // 发射顺序；非线性控制流继续由上层严格拒绝，不在这里猜测调度。
        let state = partyTargetGroups;
        const synchronousSteps: CompiledBuffStepSource[] = [];
        const projectileNodes: NativeActionNodeSource<KnownNativeActionLeafSource>[] = [];
        for (const node of nodes) {
          if (node.body.kind !== 'leaf') throw new Error('linear projectile sequence invariant');
          if (node.body.value.family === 'projectile') {
            projectileNodes.push(node);
            continue;
          }
          const compiled = compileLeaf(node, state);
          synchronousSteps.push(...compiled.steps);
          state = compiled.state;
        }
        const callbackSteps = projectileNodes.flatMap(node => compileLeaf(node, state).steps);
        return {
          steps: [...synchronousSteps, ...callbackSteps],
          state,
          consumedNodeCount: nodes.length,
        };
      }
      if (first.body.kind === 'leaf' && first.body.value.family === 'randomBlackboard') {
        const key = first.body.value.action.targetKey;
        const keyEscaped = JSON.stringify(key);
        const consumerIndex = nodes
          .slice(1)
          .findIndex(node => JSON.stringify(node).includes(keyEscaped));
        const branchIndex = consumerIndex < 0 ? -1 : consumerIndex + 1;
        const branch = branchIndex < 0 ? undefined : nodes[branchIndex];
        const conditions =
          branch?.body.kind === 'ifElse'
            ? branch.body.condition.actions.filter(node => node.metadata.enabled)
            : [];
        const condition = conditions[0];
        const isDirectRandomComparison =
          branch?.body.kind === 'ifElse' &&
          branch.body.alwaysNext &&
          conditions.length === 1 &&
          condition?.body.kind === 'leaf' &&
          condition.body.value.family === 'condition' &&
          condition.body.value.action.kind === 'floatCompare' &&
          ((condition.body.value.action.left.blackboardKey === key &&
            condition.body.value.action.right.blackboardKey !== key) ||
            (condition.body.value.action.right.blackboardKey === key &&
              condition.body.value.action.left.blackboardKey !== key));
        const prefixNodes = branchIndex < 0 ? [] : nodes.slice(1, branchIndex);
        const prefixKeepsCompileState = prefixNodes.every(
          node => node.body.kind !== 'leaf' || node.body.value.family !== 'targetGroup',
        );
        const readAfterBranch =
          branchIndex < 0 || JSON.stringify(nodes.slice(branchIndex + 1)).includes(keyEscaped);
        if (
          isDirectRandomComparison &&
          branch?.body.kind === 'ifElse' &&
          !branch.body.whenTrue.onlyExecuteWhenSourceIsMainCharacter &&
          !branch.body.whenTrue.onlyExecuteWhenSourceIsGuard &&
          !branch.body.whenFalse.onlyExecuteWhenSourceIsMainCharacter &&
          !branch.body.whenFalse.onlyExecuteWhenSourceIsGuard &&
          prefixKeepsCompileState &&
          !readAfterBranch
        ) {
          const nestedOptions = {
            ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
            initialState: () => partyTargetGroups,
          };
          const whenTrue = compileActionSequenceProgram(
            {
              onlyExecuteWhenSourceIsMainCharacter: false,
              onlyExecuteWhenSourceIsGuard: false,
              actions: [...prefixNodes, ...branch.body.whenTrue.actions],
            },
            nestedOptions,
          );
          const whenFalse = compileActionSequenceProgram(
            {
              onlyExecuteWhenSourceIsMainCharacter: false,
              onlyExecuteWhenSourceIsGuard: false,
              actions: [...prefixNodes, ...branch.body.whenFalse.actions],
            },
            nestedOptions,
          );
          if (JSON.stringify(whenTrue.steps) === JSON.stringify(whenFalse.steps)) {
            // 随机值只选择投影后完全相同的战斗分支；保留任一分支即可，不能为表现差异
            // 引入一套虚假的战斗随机数语义。分支内部的随机对会递归应用同一证明。
            return {
              steps: [...whenTrue.steps],
              state: partyTargetGroups,
              consumedNodeCount: branchIndex + 1,
            };
          }
        }
      }
      if (
        first.body.kind === 'leaf' &&
        first.body.value.family === 'timelineControl' &&
        first.body.value.action.kind === 'interruptCurrentSkill'
      ) {
        if (!allowRootTimelineFinish) {
          throw new Error(
            `${first.sourcePath}: InterruptCurSkillAction requires a root skill timeline`,
          );
        }
        if (nodes.length !== 1) {
          throw new Error(
            `${first.sourcePath}: InterruptCurSkillAction must be the only enabled root action`,
          );
        }
        const owner = first.body.value.action.owner;
        const plainOwnerReference =
          owner.targetGroupKey !== '' ||
          owner.selectorOwner !== 'ActionOwner' ||
          owner.ownerContextKey !== '' ||
          owner.centerType !== 'ActionSource' ||
          owner.centerContextKey !== '' ||
          owner.centerToGround ||
          owner.target !== 'ActionSource' ||
          owner.targetContextKey !== '' ||
          owner.enableAdvancedDirection ||
          owner.selectorDirection !== 'SourceForward' ||
          owner.finderType !== null ||
          owner.validatorTypes.length !== 0 ||
          owner.postProcessorTypes.length !== 0 ||
          owner.priorityFilters.length !== 0 ||
          owner.shuffleTargets.length !== 0 ||
          owner.distanceValidators.length !== 0 ||
          owner.finderSpawnedObjectType !== null ||
          owner.validatorTagQueries.length !== 0;
        if (context.timelineRange === undefined || plainOwnerReference) {
          throw new Error(`${first.sourcePath}.skillOwner: expected plain caster Owner`);
        }
        if (owner.targetSource === 'Target' && context.actionTargetTarget === 'enemy') {
          // 原生动作只打断目标 AbilitySystem 的当前技能。固定木桩不执行敌方主动技能，
          // 因而该动作没有可观察结果；不能误投影成结束能力实体自己的子时间轴。
          return { steps: [], state: partyTargetGroups, consumedNodeCount: 1 };
        }
        if (
          (context.actionOwnerTarget !== 'caster' &&
            context.actionOwnerTarget !== 'currentAbilityEntity') ||
          owner.targetSource !== 'Owner'
        ) {
          throw new Error(`${first.sourcePath}.skillOwner: expected plain caster Owner`);
        }
        return {
          steps: [{ kind: 'finishTimeline', parameters: {} }],
          state: partyTargetGroups,
          consumedNodeCount: 1,
        };
      }
      if (
        first.body.kind === 'leaf' &&
        first.body.value.family === 'aura' &&
        first.body.value.action.kind === 'directRangedAura' &&
        first.body.value.action.target === 'party'
      ) {
        const aura = first.body.value.action;
        const enabledEnterActions = aura.actionOnEnter.actions.filter(
          node => node.metadata.enabled,
        );
        const mainCharacterGuard = enabledEnterActions[0];
        if (
          mainCharacterGuard?.body.kind !== 'leaf' ||
          mainCharacterGuard.body.value.family !== 'condition' ||
          mainCharacterGuard.body.value.action.kind !== 'mainOperator' ||
          mainCharacterGuard.body.value.action.targetSource !== 'Target' ||
          mainCharacterGuard.body.value.action.targetGroupKey !== ''
        ) {
          throw new Error(
            `${first.sourcePath}: party Aura requires a leading Target main-character guard`,
          );
        }
        // Aura 候选为全队，但原生进入序列的第一个条件只让主控干员
        // 继续。直接查询当时主控的稳定身份与逐人执行后被该守卫截断等价，
        // 同时使后续 ExcludeTarget 能明确排除这一当前迭代目标。
        const auraContextKey = `__auraParty:${first.sourcePath}`;
        const auraContext: CombatActionProjectionContextSource = {
          ...context,
          actionTargetTarget: 'currentOperator',
        };
        const body = compileActionSequenceProgram(
          { ...aura.actionOnEnter, actions: enabledEnterActions.slice(1) },
          {
            ...createBuffSequenceProjection(visualOnlyIds, auraContext, extensions),
            initialState: () => partyTargetGroups,
          },
        );
        return {
          steps: [
            {
              kind: 'findCharacterTeamTargets',
              parameters: {
                saveToContextKey: auraContextKey,
                selection: { kind: 'controlledOperator' },
              },
            },
            {
              kind: 'forEachContextTarget',
              parameters: { contextKey: auraContextKey },
              body,
            },
          ],
          state: partyTargetGroups,
          consumedNodeCount: 1,
        };
      }
      if (
        first.body.kind === 'leaf' &&
        first.body.value.family === 'aura' &&
        first.body.value.action.kind === 'directRangedAura' &&
        first.body.value.action.target === 'enemy'
      ) {
        const aura = first.body.value.action;
        const auraContext: CombatActionProjectionContextSource = {
          ...context,
          actionTargetTarget: 'enemy',
          staticEnemyTargetGroupKeys: new Set([
            ...(context.staticEnemyTargetGroupKeys ?? []),
            aura.targetGroupKey!,
          ]),
        };
        const body = compileActionSequenceProgram(aura.actionOnEnter, {
          ...createBuffSequenceProjection(visualOnlyIds, auraContext, extensions),
          initialState: () => partyTargetGroups,
        });
        return {
          steps: body.steps,
          state: partyTargetGroups,
          consumedNodeCount: 1,
        };
      }
      const jump = projectTimelineJump(nodes[0]!, context, node => {
        const condition = compileEventCondition(
          node,
          context,
          runtimeTargetGroups(partyTargetGroups),
        );
        return condition !== null && !conditionWritesBlackboard(condition) ? condition : null;
      });
      if (jump !== null) {
        return { steps: [jump], state: partyTargetGroups, consumedNodeCount: 1 };
      }
      return (
        compileBuffOwnerCharacterTypeGate(
          nodes,
          visualOnlyIds,
          runtimeTargetGroups(partyTargetGroups),
          context,
          extensions,
        ) ??
        compileDifferentCharacterTypePartyLoop(
          nodes,
          visualOnlyIds,
          runtimeTargetGroups(partyTargetGroups),
          context,
          extensions,
        )
      );
    },
    compileForEach: (node, partyTargetGroups) => {
      if (
        node.body.target.targetSource === 'Context' &&
        [
          'party',
          'partyExceptCaster',
          'controlledOperator',
          'contextOperator',
          'lowestHealthRatioOperatorExceptCaster',
          'casterAndControlledOperator',
          'casterAndLowestHealthRatioOperatorExceptCaster',
        ].includes(partyTargetGroups.get(node.body.target.targetGroupKey) ?? '') &&
        node.body.target.finderType === null &&
        node.body.target.validatorTypes.length === 0 &&
        node.body.target.postProcessorTypes.length === 0 &&
        !node.body.action.onlyExecuteWhenSourceIsMainCharacter &&
        !node.body.action.onlyExecuteWhenSourceIsGuard
      ) {
        const body = compileActionSequenceProgram(node.body.action, {
          ...createBuffSequenceProjection(
            visualOnlyIds,
            { ...context, actionTargetTarget: 'currentOperator' },
            extensions,
          ),
          initialState: () => partyTargetGroups,
        });
        return {
          steps: [
            {
              kind: 'forEachContextTarget',
              parameters: { contextKey: node.body.target.targetGroupKey },
              body,
            },
          ],
          state: partyTargetGroups,
        };
      }
      if (
        node.body.target.targetSource === 'InstantSearch' &&
        node.body.target.finderType === 'OwnerSpawnedEntityFinder' &&
        node.body.target.finderSpawnedObjectType === 'AbilityEntity' &&
        node.body.target.validatorTypes.length > 0 &&
        node.body.target.validatorTypes.every(
          type => type === 'TagValidator' || type === 'SkillCastIdValidator',
        ) &&
        node.body.target.validatorTagQueries.length > 0 &&
        node.body.target.postProcessorTypes.length === 0 &&
        !node.body.action.onlyExecuteWhenSourceIsMainCharacter &&
        !node.body.action.onlyExecuteWhenSourceIsGuard
      ) {
        const loopContext: CombatActionProjectionContextSource = {
          ...context,
          actionTargetTarget: 'currentAbilityEntity',
        };
        const body = compileActionSequenceProgram(node.body.action, {
          ...createBuffSequenceProjection(visualOnlyIds, loopContext, extensions),
          initialState: () => partyTargetGroups,
        });
        if (body.steps.length === 0) {
          // 该直接查询只给匹配的召唤实体挂无图标、无战斗状态的表现 Buff。先完整编译
          // 子树证明零输出，再省略迭代；一旦子 Buff 获得可见战斗语义，此处会继续严格失败。
          return { steps: [], state: partyTargetGroups };
        }
        return null;
      }
      if (
        context.actionTargetTarget === 'enemy' &&
        node.body.target.targetSource === 'Target' &&
        node.body.target.targetGroupKey === '' &&
        node.body.target.finderType === null &&
        node.body.target.validatorTypes.length === 0 &&
        node.body.target.postProcessorTypes.length === 0 &&
        !node.body.action.onlyExecuteWhenSourceIsMainCharacter &&
        !node.body.action.onlyExecuteWhenSourceIsGuard
      ) {
        // 投射物 hit 回调的直接 Target 已由回调入口绑定为唯一木桩；原生 ForEach
        // 对这个单体集合精确执行一次。仍须保留 ExecuteInstant 的结果隔离；内部
        // 条件失败只结束本次迭代，不能截断 ForEach 后面的兄弟动作。
        const body = compileActionSequenceProgram(node.body.action, {
          ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
          initialState: () => partyTargetGroups,
        });
        return {
          steps: [{ kind: 'forEachContextTarget', parameters: { target: 'enemy' }, body }],
          state: partyTargetGroups,
        };
      }
      if (
        node.body.target.targetSource === 'Context' &&
        partyTargetGroups.get(node.body.target.targetGroupKey) !== 'dynamicEnemy' &&
        (context.staticEnemyTargetGroupKeys?.has(node.body.target.targetGroupKey) === true ||
          partyTargetGroups.get(node.body.target.targetGroupKey) === 'enemy') &&
        node.body.target.finderType === null &&
        node.body.target.validatorTypes.length === 0 &&
        node.body.target.postProcessorTypes.length === 0 &&
        !node.body.action.onlyExecuteWhenSourceIsMainCharacter &&
        !node.body.action.onlyExecuteWhenSourceIsGuard
      ) {
        // 固定木桩模型中该静态集合恒为且仅为一个敌人，ForEach 因而精确执行一次；
        // 不能直接展开 body，否则会把原生忽略的子序列 false 泄漏给外层 Sequence。
        const loopContext: CombatActionProjectionContextSource = {
          ...context,
          actionTargetTarget: 'enemy',
        };
        const body = compileActionSequenceProgram(node.body.action, {
          ...createBuffSequenceProjection(visualOnlyIds, loopContext, extensions),
          initialState: () => partyTargetGroups,
        });
        return {
          steps: [{ kind: 'forEachContextTarget', parameters: { target: 'enemy' }, body }],
          state: partyTargetGroups,
        };
      }
      if (
        node.body.target.targetSource === 'Context' &&
        (context.singleEnemyTargetGroupKeys?.has(node.body.target.targetGroupKey) === true ||
          partyTargetGroups.get(node.body.target.targetGroupKey) === 'dynamicEnemy') &&
        node.body.target.finderType === null &&
        node.body.target.validatorTypes.length === 0 &&
        node.body.target.postProcessorTypes.length === 0 &&
        !node.body.action.onlyExecuteWhenSourceIsMainCharacter &&
        !node.body.action.onlyExecuteWhenSourceIsGuard
      ) {
        const loopContext: CombatActionProjectionContextSource = {
          ...context,
          actionTargetTarget: 'enemy',
        };
        const body = compileActionSequenceProgram(node.body.action, {
          ...createBuffSequenceProjection(visualOnlyIds, loopContext, extensions),
          initialState: () => partyTargetGroups,
        });
        return {
          steps: [
            {
              kind: 'forEachContextTarget',
              parameters: { contextKey: node.body.target.targetGroupKey },
              body,
            },
          ],
          state: partyTargetGroups,
        };
      }
      if (
        node.body.target.targetSource === 'Context' &&
        (context.guaranteedSingletonZeroSpaceTargetGroupKeys?.has(
          node.body.target.targetGroupKey,
        ) === true ||
          partyTargetGroups.get(node.body.target.targetGroupKey) ===
            'guaranteedSingletonZeroSpace') &&
        node.body.target.finderType === null &&
        node.body.target.validatorTypes.length === 0 &&
        node.body.target.postProcessorTypes.length === 0 &&
        !node.body.action.onlyExecuteWhenSourceIsMainCharacter &&
        !node.body.action.onlyExecuteWhenSourceIsGuard
      ) {
        // 该 Context 可在敌人和 FixedPoint 之间切换，但当前控制流已证明严格产生一个目标。
        // 固定模型把二者都置于唯一木桩的零空间位置，因此逐目标子序列精确执行一次；
        // 这里只消去循环几何，不把该 Context 提升为全局 enemy 身份。
        const loopContext: CombatActionProjectionContextSource = {
          ...context,
          actionTargetTarget: 'enemy',
        };
        const body = compileActionSequenceProgram(node.body.action, {
          ...createBuffSequenceProjection(visualOnlyIds, loopContext, extensions),
          initialState: () => partyTargetGroups,
        });
        return {
          steps: [{ kind: 'forEachContextTarget', parameters: { target: 'enemy' }, body }],
          state: partyTargetGroups,
        };
      }
      if (
        node.body.target.targetSource === 'Context' &&
        partyTargetGroups.get(node.body.target.targetGroupKey) === 'abilityEntity' &&
        node.body.target.finderType === null &&
        node.body.target.validatorTypes.length === 0 &&
        node.body.target.postProcessorTypes.length === 0 &&
        !node.body.action.onlyExecuteWhenSourceIsMainCharacter &&
        !node.body.action.onlyExecuteWhenSourceIsGuard
      ) {
        const loopContext: CombatActionProjectionContextSource = {
          ...context,
          actionTargetTarget: 'currentAbilityEntity',
        };
        const body = compileActionSequenceProgram(node.body.action, {
          ...createBuffSequenceProjection(visualOnlyIds, loopContext, extensions),
          initialState: () => partyTargetGroups,
        });
        return {
          steps: [
            {
              kind: 'forEachContextTarget',
              parameters: { contextKey: node.body.target.targetGroupKey },
              body,
            },
          ],
          state: partyTargetGroups,
        };
      }
      if (context.actionTargetTarget === 'currentAbilityEntity') return null;
      if (context.actionTargetTarget === 'eventSource' || context.actionTargetTarget === 'enemy')
        return null;
      if (!isPartyExceptOwnerInstantSearch(node.body.target)) return null;
      if (
        node.body.action.onlyExecuteWhenSourceIsMainCharacter ||
        node.body.action.onlyExecuteWhenSourceIsGuard
      ) {
        return null;
      }
      const bodyNodes = node.body.action.actions.filter(child => child.metadata.enabled);
      if (
        bodyNodes.length === 0 ||
        bodyNodes.some(
          child =>
            child.body.kind !== 'leaf' ||
            child.body.value.family !== 'buffApplication' ||
            child.body.value.action.target.targetSource !== 'Target' ||
            child.body.value.action.target.targetGroupKey !== '',
        )
      ) {
        return null;
      }
      const loopContext: CombatActionProjectionContextSource = {
        ...context,
        actionTargetTarget: 'partyExceptCaster',
      };
      return {
        steps: bodyNodes.flatMap(
          child =>
            compileBuffLeafNode(
              child,
              visualOnlyIds,
              runtimeTargetGroups(partyTargetGroups),
              loopContext,
              extensions,
            ).steps,
        ),
        state: partyTargetGroups,
      };
    },
    compileSwitch: (node, targetGroups) => {
      const options = node.body.options.map(option => ({
        value: actionValueOperand(option.value),
        sequence: compileActionSequenceProgram(option.action, {
          ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
          initialState: () => targetGroups,
          // Switch 消费分支返回值，尾条件即使没有副作用也不能删除。
          resultIsConsumed: true,
        }),
      }));
      if (options.every(option => option.sequence.steps.length === 0)) {
        return { steps: [], state: targetGroups };
      }
      return {
        steps: [
          {
            kind: 'switch',
            parameters: {
              choice: actionValueOperand(node.body.choice),
              alwaysNext: node.body.alwaysNext,
            },
            options,
          },
        ],
        // 任一分支建立的事实都不能泄露到其他分支或外层后继。
        state: targetGroups,
      };
    },
    compileOnce: (node, partyTargetGroups) => {
      const enabledChildren = collectNativeActionNodes(node.body.action).filter(
        child => child.metadata.enabled,
      );
      if (
        !enabledChildren.some(isBuffAttackMapping) &&
        enabledChildren.every(
          child =>
            child.body.kind === 'leaf' &&
            [
              'presentation',
              'presentationCalculation',
              'spatial',
              'selfDefense',
              'inputControl',
              'environment',
            ].includes(child.body.value.family),
        )
      ) {
        // DoOnce 的唯一持久状态是这个节点自身是否执行过；当直接子动作全都不进入
        // Endaxis 的战斗模型时，该状态没有任何外部消费者，可以连同表现子树省略。
        return { steps: [], state: partyTargetGroups };
      }
      const body = compileActionSequenceProgram(node.body.action, {
        ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
        initialState: () => partyTargetGroups,
      });
      if (body.steps.length === 0) {
        // 嵌套空分支、木桩受击表现等可能不能靠直接子节点 family 判断；先由同一公共
        // 投影递归验证整棵子树。若结果完全为空，DoOnce 的已执行状态也没有战斗消费者。
        return { steps: [], state: partyTargetGroups };
      }
      // DoOnceAction 的子序列即时执行，返回 false 也消耗此次机会。
      // 技能实例内允许同步资源回复、创建公共 GlobalBuff、Buff 和静态敌人控制；
      // Buff 自己仍进入独立生命周期，不能把其持续动作偷换成 DoOnce 子序列生命周期。
      // 命中停顿也是即时启动独立计时，不要求 DoOnce 持续更新；同序列的镜头表现可省略。
      // 条件和 Switch 只选择这些即时动作，须递归检查所有分支；不开放持续动作或回调。
      if (
        context.timelineRange === undefined ||
        enabledChildren.some(child =>
          child.body.kind !== 'leaf'
            ? !['ifElse', 'switch', 'negateNextResult'].includes(child.body.kind)
            : ![
                'condition',
                'resource',
                'buffApplication',
                'globalBuff',
                'interrupt',
                'presentation',
              ].includes(child.body.value.family) &&
              !(
                child.body.value.family === 'stumpControl' &&
                child.body.value.action.kind === 'targetHitStop'
              ),
        )
      )
        return null;
      return {
        steps: [{ kind: 'once', parameters: { scopeKey: node.sourcePath }, body }],
        state: partyTargetGroups,
      };
    },
    compileTickInterval: (node, partyTargetGroups) => {
      if (context.timelineRange === undefined || node.body.useIntervalBlackboardKey) return null;
      if (!(node.body.intervalSeconds >= 0) || !Number.isFinite(node.body.intervalSeconds))
        return null;
      const body = compileActionSequenceProgram(node.body.actionOnTick, {
        ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
        initialState: () => partyTargetGroups,
        // 原生 TickIntervalAction 忽略每次子 Sequence 的返回值；子序列自己的短路仍保留。
        resultIsConsumed: false,
      });
      return {
        steps: [
          {
            kind: 'repeatEachTick',
            parameters: {
              [node.body.bodyLifetime === 'untilNextExecution'
                ? 'nativeExecuteInterval'
                : 'nativeTickInterval']: {
                executeEachFrame: node.body.executeEachFrame,
                intervalSeconds: node.body.intervalSeconds,
              },
            },
            body,
          },
        ],
        state: partyTargetGroups,
      };
    },
    compileChanneling: (node, partyTargetGroups) => {
      const target = node.body.target;
      const directTarget =
        target.finderType === null &&
        target.validatorTypes.length === 0 &&
        target.postProcessorTypes.length === 0 &&
        target.targetGroupKey === ''
          ? target.targetSource === 'Target' && context.actionTargetTarget === 'enemy'
            ? ('enemy' as const)
            : target.targetSource === 'Owner' && context.actionOwnerTarget === 'caster'
              ? ('caster' as const)
              : target.targetSource === 'Source' && context.actionSourceTarget === 'caster'
                ? ('caster' as const)
                : null
          : null;
      const groupedEnemy =
        context.actionTargetTarget === 'enemy' &&
        (target.targetSource === 'Context' || target.targetSource === 'Target') &&
        target.targetGroupKey !== '' &&
        (context.staticEnemyTargetGroupKeys?.has(target.targetGroupKey) === true ||
          partyTargetGroups.get(target.targetGroupKey) === 'enemy') &&
        target.finderType === null &&
        target.validatorTypes.length === 0 &&
        target.postProcessorTypes.length === 0;
      const groupedParty =
        target.targetSource === 'Context' &&
        target.targetGroupKey !== '' &&
        ['party', 'contextOperator'].includes(partyTargetGroups.get(target.targetGroupKey) ?? '') &&
        target.finderType === null &&
        target.validatorTypes.length === 0 &&
        target.postProcessorTypes.length === 0;
      const channelTarget =
        directTarget ??
        (groupedEnemy ? ('enemy' as const) : groupedParty ? ('currentOperator' as const) : null);
      if (channelTarget === null) return null;
      if (!node.body.executeEachFrame && !(node.body.triggerIntervalSeconds > 0)) return null;
      const bodyContext: CombatActionProjectionContextSource = {
        ...context,
        actionTargetTarget: channelTarget,
      };
      const body = compileActionSequenceProgram(node.body.actionOnTick, {
        ...createBuffSequenceProjection(visualOnlyIds, bodyContext, extensions),
        initialState: () => partyTargetGroups,
      });
      const repeated = {
        kind: 'repeatEachTick' as const,
        parameters: {
          nativeChanneling: {
            executeEachFrame: node.body.executeEachFrame,
            triggerIntervalSeconds: node.body.triggerIntervalSeconds,
            maxCountPerTarget: node.body.maxCountPerTarget,
            targetTriggerIntervalSeconds: node.body.targetTriggerIntervalSeconds,
          },
        },
        body,
      };
      return {
        steps: groupedParty
          ? [
              {
                kind: 'forEachContextTarget',
                parameters: { contextKey: target.targetGroupKey },
                body: { steps: [repeated] },
              },
            ]
          : [repeated],
        state: partyTargetGroups,
      };
    },
    selectIfElseBranch: (node, state) => {
      if (isCombatInvisibleIfElse(node, context)) return true;
      if (isAlwaysAliveCasterSourceCheck(node, context)) return true;
      if (isAbsentInterruptHenshinExitSuppressionCheck(node, context)) return true;
      const conditions = node.body.condition.actions.filter(child => child.metadata.enabled);
      if (conditions.length !== 1) return undefined;
      const projected = compileEventCondition(conditions[0]!, context, runtimeTargetGroups(state));
      if (projected?.kind === 'constant') return projected.value;
      if (projected?.kind === 'all' && projected.conditions.length === 0) return true;
      if (projected?.kind === 'any' && projected.conditions.length === 0) return false;
      if (
        projected?.kind === 'actionValueCompare' &&
        projected.left.kind === 'constant' &&
        projected.right.kind === 'constant'
      ) {
        const left = projected.left.value;
        const right = projected.right.value;
        return {
          equal: left === right,
          notEqual: left !== right,
          greater: left > right,
          greaterOrEqual: left >= right,
          less: left < right,
          lessOrEqual: left <= right,
        }[projected.operator];
      }
      return undefined;
    },
    canOmitIfElse: node => isCombatInvisibleIfElse(node, context),
    areEquivalentIfElseBranches: (whenTrue, whenFalse) =>
      JSON.stringify(whenTrue.steps) === JSON.stringify(whenFalse.steps),
    canOmitTogglable: node => isCombatInvisibleTogglable(node),
    createConditionalStep: ({ condition, whenTrue, whenFalse, alwaysNext }) => ({
      kind: 'conditional',
      parameters: { condition, ...(alwaysNext ? { alwaysNext: true } : {}) },
      whenTrue: { steps: [...whenTrue.steps] },
      ...(whenFalse === undefined ? {} : { whenFalse: { steps: [...whenFalse.steps] } }),
    }),
    rootFilterError: 'sequence owner/guard root filters are not yet supported',
    unsupportedNodeError: node => `${node.sourcePath}: unsupported Buff runtime action`,
  };
}

/**
 * 该公共短 Buff 只由游戏的外部“打断变身且不播退场”路径注入；1.4.4 Skill/Buff 导出中没有
 * CreateBuff 生产者，Endaxis 木桩场景也没有外部形态打断。因此庄方宜正常结束时计数恒为 0。
 */
function isAbsentInterruptHenshinExitSuppressionCheck(
  node: NativeActionNodeSource<KnownNativeActionLeafSource> & {
    readonly body: NativeActionBodySourceMap<KnownNativeActionLeafSource>['ifElse'];
  },
  context: CombatActionProjectionContextSource,
): boolean {
  if (
    !node.body.alwaysNext ||
    context.fixedBuffOwnerTarget !== 'caster' ||
    node.body.condition.onlyExecuteWhenSourceIsMainCharacter ||
    node.body.condition.onlyExecuteWhenSourceIsGuard
  ) {
    return false;
  }
  const enabled = node.body.condition.actions.filter(child => child.metadata.enabled);
  if (enabled.length !== 1) return false;
  const conditionNode = enabled[0]!;
  if (
    conditionNode.body.kind !== 'leaf' ||
    conditionNode.body.value.family !== 'condition' ||
    conditionNode.body.value.action.kind !== 'buffStack'
  ) {
    return false;
  }
  const condition = conditionNode.body.value.action;
  return (
    condition.targetSource === 'Owner' &&
    condition.targetGroupKey === '' &&
    condition.buffCheckType === 'Id' &&
    condition.buffIds.length === 1 &&
    condition.buffIds[0] === 'buff_common_interrupt_henshin_no_exit_effect' &&
    condition.buffTagIds.length === 0 &&
    condition.countType === 'BuffCount' &&
    condition.comparison === 'LE' &&
    condition.value.blackboardKey === null &&
    condition.value.value === 0 &&
    !condition.limitSkillCastId
  );
}

/**
 * Buff 全生命周期内的 RandomAction 若只驱动全部分支均为空的表现 Switch，则随机值本身也不可见。
 * 这里跨 timeline/Buff event 收集，避免只看写入所在的局部序列而漏掉后续消费者。
 */
function collectBuffPresentationRandomKeys(
  sequences: readonly NativeSequenceSource<KnownNativeActionLeafSource>[],
): ReadonlySet<string> {
  const nodes = sequences.flatMap(sequence => collectNativeActionNodes(sequence));
  const leafNodes = nodes.filter(node => node.body.kind === 'leaf');
  const candidates = new Set(
    leafNodes.flatMap(node =>
      node.body.kind === 'leaf' && node.body.value.family === 'randomBlackboard'
        ? [node.body.value.action.targetKey]
        : [],
    ),
  );
  for (const key of candidates) {
    const encoded = JSON.stringify(key);
    const leafReadsAreSafe = leafNodes.every(node => {
      if (!JSON.stringify(node.body).includes(encoded)) return true;
      return (
        node.body.kind === 'leaf' &&
        node.body.value.family === 'randomBlackboard' &&
        node.body.value.action.targetKey === key
      );
    });
    const consumers = nodes.filter(
      node => node.body.kind === 'switch' && node.body.choice.blackboardKey === key,
    );
    const switchesArePresentationOnly =
      consumers.length > 0 &&
      consumers.every(node => {
        if (node.body.kind !== 'switch') return false;
        return node.body.options.every(option =>
          collectNativeActionNodes(option.action)
            .filter(child => child.metadata.enabled)
            .every(child => isCombatInvisiblePresentationLeaf(child)),
        );
      });
    if (!leafReadsAreSafe || !switchesArePresentationOnly) candidates.delete(key);
  }
  return candidates;
}

/**
 * 收集只进入表现消费者的黑板键。与相机角度本身无关：完整生命周期内所有写入必须是
 * 直接数值运算，且读取者只能是表现动作或只控制表现分支的条件。
 */
export function collectCombatInvisiblePresentationAssignmentKeys(
  sequences: readonly NativeSequenceSource<KnownNativeActionLeafSource>[],
  isUnusedByExternalResources?: (key: string) => boolean,
): ReadonlySet<string> {
  const nodes = sequences.flatMap(sequence => collectNativeActionNodes(sequence));
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
  let candidateSetChanged = true;
  while (candidateSetChanged) {
    candidateSetChanged = false;
    for (const key of [...candidates]) {
      const encoded = JSON.stringify(key);
      const presentationIfElseConsumers = nodes.filter(node => {
        if (node.body.kind !== 'ifElse' || !JSON.stringify(node.body.condition).includes(encoded))
          return false;
        const conditionNodes = collectNativeActionNodes(node.body.condition).filter(
          child => child.metadata.enabled,
        );
        const branchNodes = [node.body.whenTrue, node.body.whenFalse].flatMap(branch =>
          collectNativeActionNodes(branch).filter(child => child.metadata.enabled),
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
          node.body.kind === 'ifElse' ? collectNativeActionNodes(node.body.condition) : [],
        ),
      );
      const presentationLeafConsumers = leafNodes.filter(
        node =>
          JSON.stringify(node.body).includes(encoded) &&
          node.body.kind === 'leaf' &&
          (node.body.value.family === 'presentationCalculation' ||
            isCombatInvisiblePresentationLeaf(node)),
      );
      const leafReferencesAreCombatInvisible = leafNodes.every(node => {
        if (!JSON.stringify(node.body).includes(encoded)) return true;
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
        if (node.body.kind !== 'switch') return false;
        return node.body.options.every(option =>
          collectNativeActionNodes(option.action)
            .filter(child => child.metadata.enabled)
            .every(
              child => child.body.kind === 'leaf' && child.body.value.family === 'presentation',
            ),
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

function isCombatInvisiblePresentationLeaf(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): boolean {
  return (
    node.body.kind === 'leaf' &&
    node.body.value.family === 'presentation' &&
    node.body.value.action.kind !== 'passiveUiValue'
  );
}

/**
 * 固定木桩场景没有敌人主动行为，干员不会死亡。GlobalBuff 子 Buff 因而可以证明其
 * caster 来源仍是一个存活实体；只开放梨诺语料使用的无输出单条件形状。
 */
function isAlwaysAliveCasterSourceCheck(
  node: NativeActionNodeSource<KnownNativeActionLeafSource> & {
    readonly body: NativeActionBodySourceMap<KnownNativeActionLeafSource>['ifElse'];
  },
  context: CombatActionProjectionContextSource,
): boolean {
  if (!node.body.alwaysNext || context.actionSourceTarget !== 'caster') return false;
  const enabled = node.body.condition.actions.filter(child => child.metadata.enabled);
  if (enabled.length !== 1) return false;
  const conditionNode = enabled[0]!;
  if (
    conditionNode.body.kind !== 'leaf' ||
    conditionNode.body.value.family !== 'condition' ||
    conditionNode.body.value.action.kind !== 'entityCount'
  )
    return false;
  const condition = conditionNode.body.value.action;
  return (
    condition.targetSource === 'Source' &&
    condition.targetGroupKey === '' &&
    !condition.containsHittableTarget &&
    condition.excludeDeadEntity &&
    condition.storeKey === '' &&
    condition.comparison === 'GE' &&
    condition.minimumCount === 1
  );
}

function compileEventListenerNode(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  visualOnlyIds: ReadonlySet<string>,
  targetGroups: ReadonlyMap<string, ProjectedTargetGroup>,
  context: CombatActionProjectionContextSource,
  extensions: CombatActionProjectionExtensionsSource,
): {
  readonly steps: readonly CompiledBuffStepSource[];
  readonly state: ReadonlyMap<string, ProjectedTargetGroup>;
} {
  if (node.body.kind !== 'leaf' || node.body.value.family !== 'eventListener') {
    throw new Error(`${node.sourcePath}: expected EventListenerAction`);
  }
  if (
    context.actionOwnerTarget !== 'caster' &&
    context.actionOwnerTarget !== 'currentAbilityEntity'
  ) {
    // 目前只接主动技能或能力实体子技能时间轴上的临时监听器；Buff 宿主不能借用。
    throw new Error(`${node.sourcePath}: unsupported EventListenerAction owner`);
  }
  const programs = compileAbilityEventPrograms(node.body.value.action.events, {
    sourcePath: `${node.sourcePath}.abilityActionMap`,
    mapEvent: (nativeEvent, sourcePath) => {
      const event = projectAbilityEvent(nativeEvent, sourcePath);
      if (
        event === 'addedBuff' ||
        event === 'beforeAddedBuff' ||
        event === 'outputBuff' ||
        event === 'beforeTakeDamage'
      )
        return event;
      // 只允许编译后为空的结束回调省略，不能按事件名提前跳过动作检查。
      if (event === 'skillEnd') return event;
      throw new Error(`${sourcePath}: unsupported ability event ${JSON.stringify(nativeEvent)}`);
    },
    compileSequence: (source, sourcePath, _nativeEvent, event) => {
      const sequence = compileActionSequenceProgram(source, {
        ...createBuffSequenceProjection(
          visualOnlyIds,
          {
            ...context,
            // Added/BeforeTakeDamage 在接收者发布且 Target 是来源；Output 在来源发布且
            // Target 是接收者。外部 operatorHit 只陈述受击事实，不制造敌方伤害或扣血。
            actionTargetTarget:
              event === 'beforeTakeDamage'
                ? 'enemy'
                : event === 'outputBuff'
                  ? 'eventTarget'
                  : event === 'addedBuff' || event === 'beforeAddedBuff'
                    ? 'eventSource'
                    : context.actionTargetTarget,
          },
          extensions,
        ),
        initialState: () => targetGroups,
      });
      if (event === 'skillEnd' && sequence.steps.length !== 0) {
        throw new Error(`${sourcePath}: unsupported ability event "OnSkillEnd"`);
      }
      return { key: sourcePath, sequence, omit: event === 'skillEnd' };
    },
    // 已支持事件即使动作为空也保留注册；只省略上方验证过的结束回调。
    isEmptySequence: compiled => compiled.omit,
  });
  const responses = programs.flatMap(program =>
    program.event === 'skillEnd'
      ? []
      : [
          {
            key: program.sequence.key,
            // 原生事件直达公共订阅；受击事实仍是木桩模型的显式输入桥接。
            event:
              program.event === 'beforeTakeDamage'
                ? { kind: 'operatorHit' as const }
                : { kind: 'abilityEvent' as const, event: program.event },
            phase: 'dataAction' as const,
            priority: program.priority,
            sequence: program.sequence.sequence,
          },
        ],
  );
  return {
    steps:
      responses.length === 0 ? [] : [{ kind: 'listenForCombatEvents', parameters: { responses } }],
    state: targetGroups,
  };
}

function isCombatInvisibleTogglable(
  node: NativeActionNodeSource<KnownNativeActionLeafSource> & {
    readonly body: NativeActionBodySourceMap<KnownNativeActionLeafSource>['togglable'];
  },
): boolean {
  const conditionNodes = collectNativeActionNodes(node.body.condition).filter(
    child => child.metadata.enabled,
  );
  const actionNodes = collectNativeActionNodes(node.body.action).filter(
    child => child.metadata.enabled,
  );
  let conditionsArePureReads = conditionNodes.length > 0;
  let onlyReadsMoveInput = conditionNodes.length > 0;
  for (let index = 0; index < conditionNodes.length; index += 1) {
    const child = conditionNodes[index]!;
    if (child.body.kind === 'negateNextResult') {
      const next = conditionNodes[index + 1];
      if (
        next === undefined ||
        next.body.kind !== 'leaf' ||
        next.body.value.family !== 'condition'
      ) {
        conditionsArePureReads = false;
        onlyReadsMoveInput = false;
        break;
      }
      continue;
    }
    if (child.body.kind !== 'leaf' || child.body.value.family !== 'condition') {
      conditionsArePureReads = false;
      onlyReadsMoveInput = false;
      break;
    }
    if (child.body.value.action.kind !== 'moveInput') onlyReadsMoveInput = false;
  }
  return (
    conditionsArePureReads &&
    actionNodes.every(
      child =>
        child.body.kind === 'leaf' &&
        ((child.body.value.family === 'inputControl' && !isBuffAttackMapping(child)) ||
          child.body.value.family === 'presentation' ||
          (onlyReadsMoveInput &&
            ['spatial', 'presentationCalculation', 'selfDefense'].includes(
              child.body.value.family,
            ))),
    )
  );
}

function isBuffAttackMapping(node: NativeActionNodeSource<KnownNativeActionLeafSource>): boolean {
  return (
    node.metadata.enabled &&
    node.body.kind === 'leaf' &&
    node.body.value.family === 'inputControl' &&
    node.body.value.action.kind === 'comboCache' &&
    node.body.value.action.mappings.some(mapping => mapping.commandType === 'Attack')
  );
}

function isCombatInvisibleIfElse(
  node: NativeActionNodeSource<KnownNativeActionLeafSource> & {
    readonly body: NativeActionBodySourceMap<KnownNativeActionLeafSource>['ifElse'];
  },
  context: CombatActionProjectionContextSource,
): boolean {
  // 省略后必须仍继续兄弟动作；循环、跳转等控制节点不能只凭叶子无伤害而消失。
  if (!node.body.alwaysNext) return false;
  const nodes = [
    ...collectNativeActionNodes(node.body.condition),
    ...collectNativeActionNodes(node.body.whenTrue),
    ...collectNativeActionNodes(node.body.whenFalse),
  ].filter(child => child.metadata.enabled);
  const invisibleFamilies = new Set([
    'presentation',
    'presentationCalculation',
    'spatial',
    'selfDefense',
    'inputControl',
    'targetGroup',
  ]);
  if (nodes.some(isBuffAttackMapping)) return false;
  return nodes.every(child => {
    if (child.body.kind !== 'leaf') return child.body.kind === 'ifElse' && child.body.alwaysNext;
    const leaf = child.body.value;
    if (
      leaf.family === 'targetGroup' &&
      context.materializedTargetGroupKeys?.has(leaf.action.targetGroupKey)
    )
      return false;
    if (leaf.family === 'presentation') return isCombatInvisiblePresentationLeaf(child);
    if (invisibleFamilies.has(leaf.family)) return true;
    if (leaf.family === 'condition' && leaf.action.kind === 'targetAngle') return true;
    if (
      leaf.family === 'blackboardMutation' &&
      (context.combatInvisiblePresentationBlackboardKeys?.has(leaf.action.key) === true ||
        context.unconsumedSkillLocalKeys?.has(leaf.action.key) === true)
    )
      return true;
    if (leaf.family === 'spatialMeasurement') {
      const key = leaf.action.outputKey;
      return nodes.every(consumer => {
        if (consumer === child || consumer.body.kind !== 'leaf') return true;
        if (!JSON.stringify(consumer.body.value.action).includes(JSON.stringify(key))) return true;
        return (
          ['presentation', 'presentationCalculation'].includes(consumer.body.value.family) ||
          canOmitUnusedNativeCondition(consumer)
        );
      });
    }
    return canOmitUnusedNativeCondition(child);
  });
}

/**
 * SaveCharTypeId(Owner) 后以 Pulse/Natural 两个等价分支表达的资格门。来源字符串来自
 * CharacterTable.charTypeId；Next 的 electric/nature 是一一投影，因此直接保留身份条件，
 * 不把只服务于该门的临时字符串扩散成通用动作黑板能力。
 */
function compileBuffOwnerCharacterTypeGate(
  nodes: readonly NativeActionNodeSource<KnownNativeActionLeafSource>[],
  visualOnlyIds: ReadonlySet<string>,
  partyTargetGroups: ReadonlyMap<string, ProjectedTargetGroup>,
  context: CombatActionProjectionContextSource,
  extensions: CombatActionProjectionExtensionsSource,
): {
  readonly consumedNodeCount: number;
  readonly steps: readonly CompiledBuffStepSource[];
  readonly state: ReadonlyMap<string, ProjectedTargetGroup>;
} | null {
  const read = nodes[0];
  const branch = nodes[1];
  if (
    context.actionOwnerTarget !== 'buffOwner' ||
    read?.body.kind !== 'leaf' ||
    read.body.value.family !== 'characterIdentity' ||
    !isPlainOwnerTarget(read.body.value.action.target) ||
    branch?.body.kind !== 'ifElse' ||
    !branch.body.alwaysNext
  ) {
    return null;
  }

  const outputKey = read.body.value.action.outputKey;
  const pulseConditions = branch.body.condition.actions.filter(child => child.metadata.enabled);
  const pulseActions = branch.body.whenTrue.actions.filter(child => child.metadata.enabled);
  const naturalActions = branch.body.whenFalse.actions.filter(child => child.metadata.enabled);
  if (
    pulseConditions.length !== 1 ||
    !isCharacterTypeStringCompare(pulseConditions[0]!, outputKey, 'Pulse') ||
    pulseActions.length === 0 ||
    naturalActions.length < 2 ||
    !isCharacterTypeStringCompare(naturalActions[0]!, outputKey, 'Natural')
  ) {
    return null;
  }

  const projection = {
    ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
    initialState: () => partyTargetGroups,
  };
  const pulse = compileActionSequenceProgram(
    { ...branch.body.whenTrue, actions: pulseActions },
    projection,
  );
  const natural = compileActionSequenceProgram(
    { ...branch.body.whenFalse, actions: naturalActions.slice(1) },
    projection,
  );
  if (JSON.stringify(pulse.steps) !== JSON.stringify(natural.steps)) {
    throw new Error(`${branch.sourcePath}: Pulse and Natural character-type branches diverge`);
  }
  return {
    consumedNodeCount: 2,
    state: partyTargetGroups,
    steps: [
      {
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'characterTypeIn',
            target: 'buffOwner',
            characterTypes: ['electric', 'nature'],
          },
        },
        whenTrue: pulse,
      },
    ],
  };
}

function isCharacterTypeStringCompare(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  outputKey: string,
  expected: 'Pulse' | 'Natural',
): boolean {
  if (
    node.body.kind !== 'leaf' ||
    node.body.value.family !== 'condition' ||
    node.body.value.action.kind !== 'stringCompare'
  ) {
    return false;
  }
  const { left, right } = node.body.value.action;
  return (
    (left.blackboardKey === outputKey &&
      right.blackboardKey === null &&
      right.value === expected) ||
    (right.blackboardKey === outputKey && left.blackboardKey === null && left.value === expected)
  );
}

/**
 * SaveCharTypeId(owner) 后逐队员保存类型、取反 CompareString 的原生组合，等价于只选择不同
 * CharacterTable.charTypeId 的其他队员。Next 的 element 是该字段的一一投影，运行时仍以角色类型
 * 集合目标表达，不能把这条规则降成“任意其他队员”。
 */
function compileDifferentCharacterTypePartyLoop(
  nodes: readonly NativeActionNodeSource<KnownNativeActionLeafSource>[],
  visualOnlyIds: ReadonlySet<string>,
  partyTargetGroups: ReadonlyMap<string, ProjectedTargetGroup>,
  context: CombatActionProjectionContextSource,
  extensions: CombatActionProjectionExtensionsSource,
): {
  readonly consumedNodeCount: number;
  readonly steps: readonly CompiledBuffStepSource[];
  readonly state: ReadonlyMap<string, ProjectedTargetGroup>;
} | null {
  if (
    context.actionTargetTarget === 'enemy' ||
    context.actionTargetTarget === 'currentAbilityEntity'
  )
    return null;
  const ownerRead = nodes[0];
  const loop = nodes[1];
  if (
    context.actionOwnerTarget !== 'caster' ||
    ownerRead?.body.kind !== 'leaf' ||
    ownerRead.body.value.family !== 'characterIdentity' ||
    ownerRead.body.value.action.target.targetSource !== 'Owner' ||
    ownerRead.body.value.action.target.targetGroupKey !== '' ||
    loop?.body.kind !== 'forEach' ||
    !isPartyExceptOwnerInstantSearch(loop.body.target) ||
    loop.body.action.onlyExecuteWhenSourceIsMainCharacter ||
    loop.body.action.onlyExecuteWhenSourceIsGuard
  ) {
    return null;
  }

  const body = loop.body.action.actions.filter(child => child.metadata.enabled);
  const teamRead = body[0];
  const negate = body[1];
  const compare = body[2];
  const applications = body.slice(3);
  if (
    teamRead?.body.kind !== 'leaf' ||
    teamRead.body.value.family !== 'characterIdentity' ||
    teamRead.body.value.action.target.targetSource !== 'Target' ||
    teamRead.body.value.action.target.targetGroupKey !== '' ||
    negate?.body.kind !== 'negateNextResult' ||
    compare?.body.kind !== 'leaf' ||
    compare.body.value.family !== 'condition' ||
    compare.body.value.action.kind !== 'stringCompare' ||
    applications.length === 0 ||
    applications.some(
      child =>
        child.body.kind !== 'leaf' ||
        child.body.value.family !== 'buffApplication' ||
        child.body.value.action.target.targetSource !== 'Target' ||
        child.body.value.action.target.targetGroupKey !== '',
    )
  ) {
    return null;
  }

  const ownerKey = ownerRead.body.value.action.outputKey;
  const teamKey = teamRead.body.value.action.outputKey;
  const leftKey = compare.body.value.action.left.blackboardKey;
  const rightKey = compare.body.value.action.right.blackboardKey;
  if (!(
    (leftKey === ownerKey && rightKey === teamKey) ||
    (leftKey === teamKey && rightKey === ownerKey)
  )) {
    return null;
  }

  const loopContext: CombatActionProjectionContextSource = {
    ...context,
    actionTargetTarget: 'partyExceptCasterAndSameCharacterType',
  };
  return {
    consumedNodeCount: 2,
    steps: applications.flatMap(
      child =>
        compileBuffLeafNode(child, visualOnlyIds, partyTargetGroups, loopContext, extensions).steps,
    ),
    state: partyTargetGroups,
  };
}

/** 已严格解析、但在无渲染后端中不产生战斗状态的表现动作路径。 */
export function collectBuffRuntimePresentationActionPaths(
  source: BuffRuntimeSource,
): readonly string[] {
  const sequences = [
    ...(buffShowsTimelineActions(source)
      ? source.graph.timelineActions.map(item => item.sequence)
      : []),
    ...source.graph.buffEvents.flatMap(item => item.actions),
    ...source.graph.abilityEvents.flatMap(item => item.actions),
    ...source.graph.igniteEvents.flatMap(item => item.actions),
  ];
  return sequences
    .flatMap(sequence => collectNativeActionNodes(sequence))
    .filter(
      node =>
        node.metadata.enabled &&
        node.body.kind === 'leaf' &&
        isCombatInvisiblePresentationLeaf(node),
    )
    .map(node => node.sourcePath);
}

/** 严格解析但只发布关卡事件/战斗记录、当前木桩运行时无生产消费者的动作路径。 */
export function collectBuffRuntimeLevelEventActionPaths(
  source: BuffRuntimeSource,
): readonly string[] {
  const sequences = [
    ...(buffShowsTimelineActions(source)
      ? source.graph.timelineActions.map(item => item.sequence)
      : []),
    ...source.graph.buffEvents.flatMap(item => item.actions),
    ...source.graph.abilityEvents.flatMap(item => item.actions),
    ...source.graph.igniteEvents.flatMap(item => item.actions),
  ];
  return sequences
    .flatMap(sequence => collectNativeActionNodes(sequence))
    .filter(
      node =>
        node.metadata.enabled &&
        node.body.kind === 'leaf' &&
        node.body.value.family === 'levelEvent',
    )
    .map(node => node.sourcePath);
}

/** 严格解析后、仅在固定木桩强制排轴模型中省略的干员自施加异常路径。 */
export function collectBuffRuntimeCharacterStatusActionPaths(
  source: BuffRuntimeSource,
): readonly string[] {
  const sequences = [
    ...(buffShowsTimelineActions(source)
      ? source.graph.timelineActions.map(item => item.sequence)
      : []),
    ...source.graph.buffEvents.flatMap(item => item.actions),
    ...source.graph.abilityEvents.flatMap(item => item.actions),
    ...source.graph.igniteEvents.flatMap(item => item.actions),
  ];
  return sequences
    .flatMap(sequence => collectNativeActionNodes(sequence))
    .filter(
      node =>
        node.metadata.enabled &&
        node.body.kind === 'leaf' &&
        node.body.value.family === 'characterSpellInfliction',
    )
    .map(node => node.sourcePath);
}

export function isPresentationOnlyBuffStackEffect(source: BuffRuntimeSource): boolean {
  return (
    source.lifecycle.stackEffectCount > 0 &&
    source.lifecycle.stackEffectActionTypes.every(type => type === 'EffectAction') &&
    !source.presentation.hasIcon &&
    source.presentation.spritePath === '' &&
    source.attributeModifiers.modifiers.length === 0 &&
    source.damageModifiers.length === 0 &&
    source.healModifiers.length === 0 &&
    source.poiseModifiers.length === 0 &&
    source.shields.length === 0 &&
    source.applyTagIds.length === 0 &&
    source.extendTagIds.length === 0 &&
    source.unsupportedPayloads.length === 0 &&
    (!buffShowsTimelineActions(source) || source.graph.timelineActions.length === 0) &&
    source.graph.buffEvents.length === 0 &&
    source.graph.abilityEvents.length === 0 &&
    source.graph.igniteEvents.length === 0
  );
}

export function isAfterEnemyDefeatedOnlyBuffRuntime(source: BuffRuntimeSource): boolean {
  return (
    source.unsupportedPayloads.length === 0 &&
    source.attributeModifiers.modifiers.length === 0 &&
    source.damageModifiers.length === 0 &&
    source.healModifiers.length === 0 &&
    source.poiseModifiers.length === 0 &&
    source.shields.length === 0 &&
    source.applyTagIds.length === 0 &&
    source.extendTagIds.length === 0 &&
    (!buffShowsTimelineActions(source) || source.graph.timelineActions.length === 0) &&
    source.graph.buffEvents.length === 0 &&
    source.graph.igniteEvents.length === 0 &&
    source.graph.abilityEvents.length > 0 &&
    source.graph.abilityEvents.every(event => event.event === 'OnAfterKillEntity')
  );
}

function compilePresentation(source: BuffPresentationSource): CompiledBuffPresentationSource {
  return {
    visible: source.hasIcon,
    ...(source.spritePath === ''
      ? {}
      : { iconId: source.spritePath, iconPath: `/icons/${source.spritePath}.webp` }),
    showInHeadBarCommon: source.showInHeadBarCommon,
    showInHeadBarAttached: source.showInHeadBarAttached,
    showInSquadIcon: source.showInSquadIcon,
    onlyShowForMainCharacter: source.onlyShowForMainCharacter,
    blinkInMainCharHpBar: source.blinkInMainCharHpBar,
    showProgressInHpBar: source.showProgressInHpBar,
    showProgressInNormalSkillButton: source.showProgressInNormalSkillButton,
    useWeakProgressInNormalSkillButton: source.useWeakProgressInNormalSkillButton,
    showProgressInUltimateSkillButton: source.showProgressInUltimateSkillButton,
    forceRaiseIconEvent: source.forceRaiseIconEvent,
    showWarningBackground: source.showWarningBackground,
    playStrongInAnimation: source.playStrongInAnimation,
    hasCharHpBarVfxType: source.hasCharHpBarVfxType,
    charHpBarVfxType: source.charHpBarVfxType,
    iconStyleInSquad: source.iconStyleInSquad,
    abnormalColorType: source.abnormalColorType,
    orderPriority: {
      useDirectoryValue: source.orderUseDirectoryValue,
      value: source.orderPriorityValue,
      category: source.orderPriorityEnum,
    },
  };
}

function signed(value: number, negate: boolean): number {
  return negate ? -value : value;
}

function mergeSequences(
  sequences: readonly CompiledBuffSequenceSource[],
): CompiledBuffSequenceSource {
  // BuffEventAction / IgniteEventAction 的 actions 数组是彼此独立的回调序列：
  // 单个回调可以按原生返回值短路自身，但失败不能阻止后续回调执行。
  // 它们仍属于同一 Buff 实例，必须共享 Buff direct blackboard，不能把前一回调的写入丢掉。
  return mergeIndependentActionSequencesSource(sequences, 'native-buff-callback');
}

const STACKING_TYPES: Record<BuffStackingTypeSource, BuffStackingType> = {
  Unlimited: 'unlimited',
  HighPriority: 'highPriority',
  Stack: 'stack',
  Enhance: 'enhance',
  Refresh: 'refresh',
  Extend: 'extend',
  Modify: 'modify',
  Unique: 'unique',
  EnhanceAndRefresh: 'enhanceAndRefresh',
  OverwriteDuration: 'overwriteDuration',
  EnhanceAndOverwriteDuration: 'enhanceAndOverwriteDuration',
  HighPriorityWithMaxStack: 'highPriorityWithMaxStack',
  TimedGrowingEnhance: 'timedGrowingEnhance',
};

const DAMAGE_MODIFIER_SIDES: Readonly<Record<string, DamageModifierSide>> = {
  Attacker: 'attacker',
  Defender: 'defender',
};

const DAMAGE_SCALE_ZONES: Readonly<
  Record<
    string,
    'product' | 'normal' | 'abnormalAndBurst' | 'enhanced' | 'combo' | 'vulnerable' | 'race'
  >
> = {
  ProdCalcZone: 'product',
  NormalCalcZone: 'normal',
  AbnormalAndBurstCalcZone: 'abnormalAndBurst',
  EnhanceCalcZone: 'enhanced',
  ComboCalcZone: 'combo',
  VulnerableCalcZone: 'vulnerable',
  RaceCalcZone: 'race',
};
