import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
import { projectConditionInput } from '../actions/conditionInputProjection.ts';
import {
  collectMaterializedSequenceTargetGroups,
  collectUnobservedTargetQueryOutputs,
} from '../optimization/nativeTargetUsage.ts';
import { collectKnownNativeActionNodes } from '../../source/actionLeaf.ts';
import {
  collectCombatInvisiblePresentationAssignmentKeys,
  collectCombatInvisibleRandomKeys,
  isCombatInvisiblePresentationLeaf,
} from '../optimization/nativePresentationUsage.ts';
import { projectAuraParameters } from '../actions/combatActionLeafProjection.ts';
import { imageRefFromPath } from '../publication/imageResources.ts';
import { isPresentationOnlyActionSequence } from '../skills/skillPresentationTargets.ts';
import { simplifyNativeSequences } from '../optimization/nativeSequenceOptimization.ts';
import { projectGameplayTags } from '../combatProjectionCommon.ts';
import {
  buffPresentationNames,
  buffPresentationIcons,
} from '../../../config/buffPresentationNames.ts';
import { createActionGraphBuilder } from '../actions/actionGraphBuilder.ts';
import { buffHasNoAffixIdentityWriter } from './buffCastIdentityProof.ts';
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
  isDynamicSingleEnemyTagTargetGroup,
  isStaticExplicitBadFactionEnemyTargetGroup,
  isStaticSingleEnemyOwnerAllyTargetGroup,
  isStaticSingleEnemyTargetGroup,
  isZeroSpaceSingleEnemySmartTargetGroup,
  isPartyExceptOwnerInstantSearch,
  isPartyInstantSearch,
  scalarOperand,
  actionValueOperand,
  DAMAGE_TYPES,
} from '../combatProjectionCommon.ts';
import { compileBuffLeafNode } from '../actions/combatEntityAndTimeProjection.ts';
import { compileEventCondition } from '../conditions/combatConditionProjection.ts';
import { canOmitUnusedNativeCondition } from '../optimization/nativeConditionUsage.ts';
import { assertPresentationCalculationIsolation } from '../scenario/presentationCalculationIsolation.ts';
import {
  compareKnownNumbers,
  isStaticControlledOperatorWrite,
  isStaticZeroSpacePointWrite,
  propagateGuaranteedSingletonZeroSpaceFacts,
} from '../optimization/targetGroupCardinalityAnalysis.ts';

// Start/Enable 没有外部能力事件，Source 是创建者，Target/InputTarget 是持有者。
// 生命周期执行器以 Buff 来源绑定 caster；不能从不存在的 event 中读取来源或目标。
const BUFF_LIFECYCLE_CONTEXT: Omit<CombatActionProjectionContextSource, 'graph'> = {
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'buffOwner',
};

// Buff.BindAbilityEventEnvironment：205 的输入是新 Buff 施加者，
// 但监听 Buff 的 ActionSource 始终是该监听器的创建者，不能用物理事件 sourceId 替代。
const BUFF_BEFORE_ADDED_CONTEXT: Omit<CombatActionProjectionContextSource, 'graph'> = {
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'buffSource',
  actionTargetTarget: 'eventSource',
  restrictEventSourceTargetProjection: true,
};

// 伤害与物理异常的受击侧事件都把本次来源作为动作 InputTarget；监听 Buff 自身的
// ActionSource 仍是创建者。波格兰尼奇据此把终结技附加增益施加给异常来源，并在
// 连携伤害分支用 SourceFinder(ActionSource) 与 Target 比较来源链。
const BUFF_BEFORE_TAKE_CONTEXT: Omit<CombatActionProjectionContextSource, 'graph'> = {
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'buffSource',
  actionTargetTarget: 'eventSource',
  restrictEventSourceTargetProjection: true,
};

// 驱散与点燃保留 Buff 的 Owner/Source，本次触发者只作为输入 Target。
const BUFF_INPUT_TARGET_CONTEXT: Omit<CombatActionProjectionContextSource, 'graph'> = {
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
    | 'isBlackboardKeyUnusedByExternalResources'
    | 'fixedBuffOwnerTarget'
    | 'fixedBuffSourceTarget'
    | 'gameplayTagRegistry'
    | 'predefinedTagQueries'
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
  // 生命周期、定时入口和修正条件共用黑板；写入裁剪必须看到整个 Buff。
  source = simplifyNativeSequences(
    source,
    contextOverrides.isBlackboardKeyUnusedByExternalResources,
    'resource',
  );
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
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
  const beforeEnhanceSequences: CompiledBuffSequenceSource[] = [];
  const finishSequences: CompiledBuffSequenceSource[] = [];
  const dispelledSequences: CompiledBuffSequenceSource[] = [];
  const releaseSequences: CompiledBuffSequenceSource[] = [];
  const timelineActions = buffShowsTimelineActions(source) ? source.graph.timelineActions : [];
  const allSequences = [
    ...timelineActions.map(item => item.sequence),
    ...source.graph.buffEvents.flatMap(item => item.actions),
    ...source.graph.abilityEvents.flatMap(item => item.actions),
    ...source.graph.igniteEvents.flatMap(item => item.actions),
    ...source.damageModifiers.map(modifier => modifier.condition),
    ...source.healModifiers.map(modifier => modifier.condition),
    ...source.poiseModifiers.map(modifier => modifier.condition),
  ];
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
          isZeroSpaceSingleEnemySmartTargetGroup(node.body.value.action)) &&
        (isStaticExplicitBadFactionEnemyTargetGroup(node.body.value.action) ||
          (node.body.value.action.selectorOwner === 'ActionSource' &&
            contextOverrides.fixedBuffSourceTarget === 'caster') ||
          contextOverrides.fixedBuffOwnerTarget === 'caster' ||
          contextOverrides.fixedBuffOwnerTarget === 'enemy' ||
          contextOverrides.fixedBuffOwnerTarget === 'currentAbilityEntity')
          ? [node.body.value.action.targetGroupKey]
          : [],
      ),
  ]);
  const targetGroupNodes = allSequences.flatMap(collectKnownNativeActionNodes);
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
          isZeroSpaceSingleEnemySmartTargetGroup(write),
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
  const combatInvisibleRandomBlackboardKeys = collectCombatInvisibleRandomKeys(
    allSequences.map(sequence =>
      simplifyNativeSequences(sequence, contextOverrides.isBlackboardKeyUnusedByExternalResources),
    ),
    key => contextOverrides.isBlackboardKeyUnusedByExternalResources?.(key) === true,
  );
  const combatInvisiblePresentationBlackboardKeys =
    collectCombatInvisiblePresentationAssignmentKeys(
      allSequences,
      key => contextOverrides.isBlackboardKeyUnusedByExternalResources?.(key) === true,
    );
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
    materializedTargetGroupKeys: collectMaterializedSequenceTargetGroups(allSequences),
    unobservedTargetQueryOutputs: collectUnobservedTargetQueryOutputs(allSequences),
    graph,
    enabledAnimationEventListenerPresent: allSequences
      .flatMap(collectNativeActionNodes)
      .some(
        node =>
          node.metadata.enabled &&
          node.body.kind === 'leaf' &&
          node.body.value.family === 'animationEventListener' &&
          !isPresentationOnlyActionSequence(node.body.value.action.actionOnEvent),
      ),
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
    const timelineContext = {
      ...BUFF_LIFECYCLE_CONTEXT,
      abilityEntityQueries,
      ...projectionContextOverrides,
      guaranteedSingletonZeroSpaceTargetGroupKeys:
        guaranteedSingletonZeroSpaceTargetGroupKeysByTimeline[timelineIndex],
      timelineRange: { startFrame: timeline.startFrame, endFrame: timeline.endFrame },
    };
    const sequence = compileLinearSequence(
      timeline.sequence,
      visualOnlyIds,
      timelineContext,
      extensions,
    );
    return sequence.$sequence === null
      ? []
      : [{ startFrame: timeline.startFrame, endFrame: timeline.endFrame, sequence }];
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
                : event.event === 'OnBuffBeforeTryEnhanced'
                  ? beforeEnhanceSequences
                  : event.event === 'OnBuffAfterTryEnhanced'
                    ? afterEnhanceSequences
                    : event.event === 'OnBuffDispelled'
                      ? dispelledSequences
                      : event.event === 'OnBuffFinish'
                        ? finishSequences
                        : event.event === 'OnBuffReleased'
                          ? releaseSequences
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
      // 叠层前后回调的默认 Target 是持有者，Source 由运行时绑定本次叠层者。
      // Finish/EnhanceChanged 保留现有事件投影，不能据此一并放宽未核实的来源映射。
      const compiled = compileLinearSequence(
        sequence,
        visualOnlyIds,
        event.event === 'OnBuffDispelled'
          ? { ...BUFF_INPUT_TARGET_CONTEXT, abilityEntityQueries, ...projectionContextOverrides }
          : event.event === 'OnBuffStart' ||
              event.event === 'OnBuffEnable' ||
              event.event === 'DuringBuffEnable' ||
              event.event === 'OnBuffFinish' ||
              event.event === 'OnBuffReleased' ||
              event.event === 'OnBuffBeforeTryEnhanced' ||
              event.event === 'OnBuffAfterTryEnhanced'
            ? { ...BUFF_LIFECYCLE_CONTEXT, abilityEntityQueries, ...projectionContextOverrides }
            : { ...BUFF_ACTION_CONTEXT, abilityEntityQueries, ...projectionContextOverrides },
        extensions,
      );
      if (compiled.$sequence !== null) target.push(compiled);
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
      if (sequences.every(sequence => sequence.$sequence === null)) {
        effectiveOmittedAbilityEvents.add(event.event);
      }
    } catch {
      // 保持严格失败；这里仅是纯表现事件的前置证明，不吞正式编译错误。
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
      isEmptySequence: sequence => sequence.$sequence === null,
    },
  ).map(({ event, priority, sequence }) => ({ event, priority, sequence }));
  const igniteEventResponses = source.graph.igniteEvents.map(event => ({
    igniteType: event.igniteType,
    finishAfterIgnited: event.finishAfterIgnited,
    sequences: event.actions.map(sequence =>
      compileLinearSequence(
        sequence,
        visualOnlyIds,
        {
          ...BUFF_INPUT_TARGET_CONTEXT,
          abilityEntityQueries,
          ...projectionContextOverrides,
        },
        extensions,
      ),
    ),
  }));
  const blackboard = Object.fromEntries(
    source.graph.declaredBlackboard.map(item => [item.key, item.value]),
  );
  const definition = {
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
    ...(source.lifecycle.ignoreTagImmune ? { ignoreTagImmune: true } : {}),
    ...(source.lifecycle.dispelLevel === null ? {} : { dispelLevel: source.lifecycle.dispelLevel }),
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
    ...(source.presentation.hasIcon ||
    source.presentation.spritePath !== '' ||
    buffPresentationNames[source.graph.buffId] ||
    buffPresentationIcons[source.graph.buffId]
      ? {
          presentation: {
            ...compilePresentation(source.presentation),
            ...(buffPresentationIcons[source.graph.buffId]
              ? {
                  icon: buffPresentationIcons[source.graph.buffId]!,
                  visible: true,
                  showInSquadIcon: true,
                }
              : {}),
            ...(buffPresentationNames[source.graph.buffId]
              ? { nameKey: buffPresentationNames[source.graph.buffId] }
              : {}),
          },
        }
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
    ...compileBuffPoiseModifiers(source, projectionContextOverrides),
    ...compileBuffShields(source),
    ...(scheduledSequences.length === 0 ? {} : { scheduledSequences }),
    ...(startSequences.length === 0 &&
    enableSequences.length === 0 &&
    triggerSequences.length === 0 &&
    enhanceChangedSequences.length === 0 &&
    afterEnhanceSequences.length === 0 &&
    beforeEnhanceSequences.length === 0 &&
    dispelledSequences.length === 0 &&
    releaseSequences.length === 0 &&
    finishSequences.length === 0
      ? {}
      : {
          lifecycleSequences: {
            ...(startSequences.length === 0 ? {} : { start: startSequences }),
            ...(enableSequences.length === 0 ? {} : { enable: enableSequences }),
            ...(triggerSequences.length === 0 ? {} : { trigger: triggerSequences }),
            ...(enhanceChangedSequences.length === 0
              ? {}
              : { enhanceChanged: enhanceChangedSequences }),
            ...(finishSequences.length === 0 ? {} : { finish: finishSequences }),
            ...(dispelledSequences.length === 0 ? {} : { dispelled: dispelledSequences }),
            ...(releaseSequences.length === 0 ? {} : { release: releaseSequences }),
            ...(beforeEnhanceSequences.length === 0
              ? {}
              : { beforeEnhance: beforeEnhanceSequences }),
            ...(afterEnhanceSequences.length === 0 ? {} : { afterEnhance: afterEnhanceSequences }),
          },
        }),
    ...(abilityEventResponses.length === 0 ? {} : { abilityEventResponses }),
    ...(igniteEventResponses.length === 0 ? {} : { igniteEventResponses }),
  };
  return { ...definition, actionGraph: { main: graph.finish(), macros: {} } };
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

function compileBuffDamageModifiers(
  source: BuffRuntimeSource,
  context: Pick<CombatActionProjectionContextSource, 'gameplayTagRegistry' | 'graph'>,
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
    const condition = compileModifierCondition(modifier.condition, context, 'damage');
    const conditionSource = condition === undefined ? {} : { condition };
    // 原生先执行条件再遍历处理器；只有空条件和空处理器同时成立才可省略。
    if (modifier.processors.length === 0 && conditionSource.condition === undefined) return [];
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
    if (processors.length === 0 && conditionSource.condition === undefined) return [];
    return [{ enabledSide, ...conditionSource, processors }];
  });
  return modifiers.length === 0 ? {} : { damageModifiers: modifiers };
}

function compileBuffHealModifiers(
  source: BuffRuntimeSource,
  context: Pick<CombatActionProjectionContextSource, 'gameplayTagRegistry' | 'graph'>,
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
    const condition = compileModifierCondition(modifier.condition, context, 'heal');
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
    return { enabledSide, ...(condition === undefined ? {} : { condition }), processors };
  });
  return modifiers.length === 0 ? {} : { healModifiers: modifiers };
}

function compileBuffPoiseModifiers(
  source: BuffRuntimeSource,
  context: Pick<CombatActionProjectionContextSource, 'gameplayTagRegistry' | 'graph'>,
): {
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
    const condition = compileModifierCondition(modifier.condition, context, 'poise');
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
    return { enabledSide, ...(condition === undefined ? {} : { condition }), processors };
  });
  return modifiers.length === 0 ? {} : { poiseModifiers: modifiers };
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

function compileModifierCondition(
  source: NativeSequenceSource<KnownNativeActionLeafSource>,
  context: Pick<CombatActionProjectionContextSource, 'gameplayTagRegistry' | 'graph'>,
  kind: NonNullable<CombatActionProjectionContextSource['modifierContext']>,
): CompiledBuffSequenceSource | undefined {
  const program = compileCombatConditionSequenceSource(source, {
    ...context,
    actionOwnerTarget: 'buffOwner',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'actionInputTarget',
    modifierContext: kind,
  });
  if (program.$sequence === null) return undefined;
  return program;
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
  return compileActionSequenceProgram(simplifyNativeSequences(source), {
    ...createBuffSequenceProjection(visualOnlyIds, context),
    resultIsConsumed: true,
  });
}

function compileLinearSequence(
  inputSource: NativeSequenceSource<KnownNativeActionLeafSource>,
  visualOnlyIds: ReadonlySet<string>,
  context: CombatActionProjectionContextSource,
  extensions: CombatActionProjectionExtensionsSource = {},
): CompiledBuffSequenceSource {
  const source = simplifyNativeSequences(
    inputSource,
    context.isBlackboardKeyUnusedByExternalResources,
  );
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
    return { $sequence: null };
  }
  const result = compileActionSequenceProgram(
    source,
    createBuffSequenceProjection(visualOnlyIds, context, extensions),
  );
  // 先按既有固定命中/零空间边界投影，再检查仍被消费的值。
  // 角度可改变原生范围，但被整体省略的选点分支不再是 Next 数值消费者。
  assertPresentationCalculationIsolation([source], [result], context.graph);
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
    if (node.body.kind === 'leaf' && node.body.value.family === 'tagQueryListener') {
      const action = node.body.value.action;
      const query =
        'custom' in action.query
          ? action.query.custom
          : context.predefinedTagQueries?.[action.query.predefined];
      if (!query)
        throw new Error(
          `${node.sourcePath}: missing predefined tag query ${'predefined' in action.query ? action.query.predefined : ''}`,
        );
      const sequence = compileActionSequenceProgram(action.sequence, {
        ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
        initialState: () => partyTargetGroups,
      });
      return {
        steps: [
          {
            kind: 'listenForTagQuery' as const,
            parameters: {
              tags: projectGameplayTags(query.tagIds, context, node.sourcePath),
              tagQueryType: query.queryType,
              executeOnMatch: action.executeOnMatch,
              sequence,
            },
          },
        ],
        // 回调可延后执行，不能将其目标组写入提升到注册动作之后。
        state: partyTargetGroups,
      };
    }
    if (
      node.body.kind === 'leaf' &&
      node.body.value.family === 'presentation' &&
      node.body.value.action.kind === 'playAnimation' &&
      node.body.value.action.onEnd !== undefined
    ) {
      const animation = node.body.value.action;
      const onEnd = compileActionSequenceProgram(animation.onEnd!, {
        ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
        initialState: () => partyTargetGroups,
      });
      return {
        steps:
          onEnd.$sequence === null
            ? []
            : [
                {
                  kind: 'playAnimation' as const,
                  parameters: {
                    durationSeconds: animation.durationSeconds,
                    blendOutSeconds: animation.blendOutSeconds,
                    executeOnNormalEndOnly: animation.executeOnNormalEndOnly,
                  },
                  onEnd,
                },
              ],
        state: partyTargetGroups,
      };
    }
    if (node.body.kind === 'leaf' && node.body.value.family === 'comboQte') {
      const qte = node.body.value.action;
      return {
        steps: [
          {
            kind: 'showComboRingQte' as const,
            parameters: {
              earlyDurationSeconds: actionValueOperand(qte.earlyDuration),
              activeDurationSeconds: actionValueOperand(qte.activeDuration),
            },
            triggeredAction: compileActionSequenceProgram(qte.triggeredAction, {
              ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
              initialState: () => partyTargetGroups,
            }),
          },
        ],
        state: partyTargetGroups,
      };
    }
    if (
      node.body.kind === 'leaf' &&
      node.body.value.family === 'aura' &&
      node.body.value.action.kind !== 'auraReference'
    ) {
      const aura = node.body.value.action;
      const callbackContext: CombatActionProjectionContextSource = {
        ...context,
        actionTargetTarget: aura.target === 'enemy' ? 'enemy' : 'currentOperator',
        ...(aura.kind === 'directRangedAura' && aura.targetGroupKey !== undefined
          ? {
              staticEnemyTargetGroupKeys: new Set([
                ...(context.staticEnemyTargetGroupKeys ?? []),
                aura.targetGroupKey,
              ]),
            }
          : {}),
      };
      const compileCallback = (sequence: typeof aura.actionOnEnter) =>
        compileActionSequenceProgram(sequence, {
          ...createBuffSequenceProjection(visualOnlyIds, callbackContext, extensions),
          initialState: () => partyTargetGroups,
        });
      return {
        steps: [
          {
            kind: 'aura' as const,
            parameters:
              aura.kind === 'globalPartyAura'
                ? projectAuraParameters(node, visualOnlyIds, context)
                : {
                    targets:
                      aura.target === 'enemy'
                        ? { kind: 'fixed' as const, target: 'enemy' as const }
                        : { kind: 'characterTeam' as const, excludeOwner: false },
                    buffs: [],
                  },
            onEnter: compileCallback(aura.actionOnEnter),
            onExit:
              aura.kind === 'globalPartyAura'
                ? compileCallback(aura.actionOnExit)
                : { $sequence: null },
          },
        ],
        state: partyTargetGroups,
      };
    }

    const visibleTargetGroups = runtimeTargetGroups(partyTargetGroups);
    const branchContext = {
      ...context,
      guaranteedSingletonZeroSpaceTargetGroupKeys: new Set([
        ...(context.guaranteedSingletonZeroSpaceTargetGroupKeys ?? []),
        ...[...partyTargetGroups]
          .filter(([, value]) => value === 'guaranteedSingletonZeroSpace')
          .map(([key]) => key),
      ]),
    };
    // 查询生产者使用其输出证明；消费者优先读取本段已改写的身份，不能沿用过期的敌人推断。
    const currentContext =
      node.body.kind === 'leaf' && node.body.value.family === 'targetGroup'
        ? branchContext
        : {
            ...branchContext,
            staticEnemyTargetGroupKeys: new Set(
              [...(context.staticEnemyTargetGroupKeys ?? [])].filter(key => {
                const current = visibleTargetGroups.get(key);
                return current === undefined || current === 'enemy';
              }),
            ),
          };
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
        ? compileEventListenerNode(
            node,
            visualOnlyIds,
            visibleTargetGroups,
            currentContext,
            extensions,
          )
        : compileBuffLeafNode(node, visualOnlyIds, visibleTargetGroups, currentContext, extensions);
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
    sequence: context.graph.sequence,
    canDiscardCondition: canOmitUnusedNativeCondition,
    canDiscardUnusedLeaf: node =>
      node.body.kind === 'leaf' &&
      node.body.value.family === 'targetGroup' &&
      node.body.value.action.producerType === 'FindTargetAction' &&
      context.unobservedTargetQueryOutputs?.has(node.body.value.action.targetGroupKey) === true,
    initialState: () =>
      new Map<string, BuffProjectionTargetGroup>([
        ...[...(context.operatorTargetGroupKeys ?? [])].map(
          key => [key, 'contextOperator'] as const,
        ),
        ...[...(context.staticAbilityEntityTargetGroupKeys ?? [])].map(
          key => [key, 'abilityEntity'] as const,
        ),
        ...[...(context.randomPointTargetGroupKeys?.values() ?? [])].map(
          key => [key, 'spatialPoint'] as const,
        ),
      ]),
    compileCondition: (node, targetGroups) =>
      compileEventCondition(node, context, runtimeTargetGroups(targetGroups)),
    createConditionCheckStep: condition => ({ kind: 'checkCondition', parameters: { condition } }),
    createInvertNextResultStep: () => ({ kind: 'invertNextResult', parameters: {} }),
    createAnyConditionStep: conditions => ({
      kind: 'anyCondition',
      parameters: {},
      conditions: conditions.map(condition => projectConditionInput(condition, context.graph)),
    }),
    createIfElseStep: ({ condition, whenTrue, whenFalse, alwaysNext }) => {
      return {
        kind: 'ifElse',
        parameters: { alwaysNext },
        condition: projectConditionInput(condition, context.graph),
        whenTrue,
        whenFalse,
      };
    },
    compileLeaf,
    compileActionWithCallback: (node, state) => {
      const callback = compileActionSequenceProgram(node.body.callback, {
        ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
        initialState: () => state,
      });
      if (callback.$sequence !== null) {
        throw new Error(
          `${node.sourcePath}: combat-visible targetPointInvalid callback requires native trigger projection`,
        );
      }
      // 子树已消去后才检查持有动作；不能因原始回调非空就拒绝或让其无条件执行。
      return compileLeaf({ ...node, body: { kind: 'leaf', value: node.body.value } }, state);
    },
    refineIfElseBranch: (node, state, branch) => {
      if (branch !== 'whenTrue') return undefined;
      const conditions = node.body.condition.actions.filter(child => child.metadata.enabled);
      const condition = conditions[0];
      if (
        conditions.length !== 1 ||
        condition?.body.kind !== 'leaf' ||
        condition.body.value.family !== 'condition'
      ) {
        return undefined;
      }
      const check = condition.body.value.action;
      // 输入 Target 在模拟中是单个对象；集合 Context 的“存在匹配项”不能推导全组类型。
      if (
        check.kind === 'objectTypeMatch' &&
        check.target.targetSource === 'Target' &&
        check.objectTypeMask === 'Enemy'
      ) {
        return {
          ...createBuffSequenceProjection(
            visualOnlyIds,
            { ...context, actionTargetTarget: 'enemy' },
            extensions,
          ),
          initialState: () => state,
        };
      }
      if (check.kind !== 'entityCount') return undefined;
      const count = check;
      if (
        count.targetSource !== 'Context' ||
        context.atMostOneZeroSpaceTargetGroupKeys?.has(count.targetGroupKey) !== true ||
        count.containsHittableTarget ||
        count.excludeDeadEntity ||
        count.storeKey !== '' ||
        compareKnownNumbers(1, count.comparison, count.minimumCount) !== true ||
        compareKnownNumbers(0, count.comparison, count.minimumCount) !== false
      ) {
        return undefined;
      }
      const refined = new Map(state);
      refined.set(count.targetGroupKey, 'guaranteedSingletonZeroSpace');
      return {
        ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
        initialState: () => refined,
      };
    },
    compilePhysicsCast: (node, state) =>
      context.combatInvisiblePhysicsCastPaths?.has(node.sourcePath) === true
        ? { steps: [], state }
        : null,
    compileTimelineControl: (first, partyTargetGroups) => {
      if (
        first.body.kind === 'leaf' &&
        first.body.value.family === 'timelineControl' &&
        first.body.value.action.kind === 'interruptCurrentSkill'
      ) {
        return {
          steps: [
            {
              kind: 'interruptCurrentSkill',
              parameters: {
                targets: projectActionTargetQuery(
                  first.body.value.action.owner,
                  context,
                  `${first.sourcePath}.skillOwner`,
                ),
              },
            },
          ],
          state: partyTargetGroups,
        };
      }
      const jump = projectTimelineJump(first, context, sequence =>
        compileActionSequenceProgram(sequence, {
          ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
          initialState: () => partyTargetGroups,
          resultIsConsumed: true,
        }),
      );
      if (jump !== null) {
        return { steps: [jump], state: partyTargetGroups };
      }
      return null;
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
              parameters: { targets: { kind: 'context', key: node.body.target.targetGroupKey } },
              body,
            },
          ],
          state: partyTargetGroups,
        };
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
          steps: [
            {
              kind: 'forEachContextTarget',
              parameters: { targets: { kind: 'fixed', target: 'enemy' } },
              body,
            },
          ],
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
          steps: [
            {
              kind: 'forEachContextTarget',
              parameters: { targets: { kind: 'fixed', target: 'enemy' } },
              body,
            },
          ],
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
              parameters: { targets: { kind: 'context', key: node.body.target.targetGroupKey } },
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
        // 单目标证明不等于敌人身份证明；位置目标仍保留位置身份。
        const loopContext: CombatActionProjectionContextSource = {
          ...context,
          actionTargetTarget: 'actionInputTarget',
          actionInputIsZeroSpace: true,
        };
        const body = compileActionSequenceProgram(node.body.action, {
          ...createBuffSequenceProjection(visualOnlyIds, loopContext, extensions),
          initialState: () => partyTargetGroups,
        });
        return {
          steps: [
            {
              kind: 'forEachContextTarget',
              parameters: { targets: { kind: 'context', key: node.body.target.targetGroupKey } },
              body,
            },
          ],
          state: partyTargetGroups,
        };
      }
      const entityGroup =
        node.body.target.targetSource === 'Context' &&
        partyTargetGroups.get(node.body.target.targetGroupKey) === 'abilityEntity';
      const spawnedEntities =
        node.body.target.targetSource === 'InstantSearch' &&
        node.body.target.finderType === 'OwnerSpawnedEntityFinder';
      if (
        (entityGroup || spawnedEntities) &&
        !node.body.action.onlyExecuteWhenSourceIsMainCharacter &&
        !node.body.action.onlyExecuteWhenSourceIsGuard
      ) {
        const targets = projectActionTargetQuery(node.body.target, context, node.sourcePath);
        if (targets.kind === 'ownerSpawned' && targets.objectType !== 'abilityEntity') return null;
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
              parameters: { targets },
              body,
            },
          ],
          state: partyTargetGroups,
        };
      }
      const excludeOwner = isPartyExceptOwnerInstantSearch(node.body.target);
      if (!excludeOwner && !isPartyInstantSearch(node.body.target)) return null;
      const body = compileActionSequenceProgram(node.body.action, {
        ...createBuffSequenceProjection(
          visualOnlyIds,
          {
            ...context,
            actionTargetTarget: 'currentOperator',
          },
          extensions,
        ),
        initialState: () => partyTargetGroups,
      });
      return {
        steps: [
          {
            kind: 'forEachContextTarget',
            parameters: { targets: { kind: 'characterTeam', excludeOwner } },
            body,
          },
        ],
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
      const body = compileActionSequenceProgram(node.body.action, {
        ...createBuffSequenceProjection(visualOnlyIds, context, extensions),
        initialState: () => partyTargetGroups,
      });
      return { steps: [{ kind: 'once', parameters: {}, body }], state: partyTargetGroups };
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
        (target.targetSource !== 'Context' || target.targetGroupKey === '')
          ? target.targetSource === 'Target' &&
            (context.actionTargetTarget === 'enemy' ||
              context.actionTargetTarget === 'actionInputTarget')
            ? context.actionTargetTarget
            : target.targetSource === 'Owner' && context.actionOwnerTarget === 'caster'
              ? ('caster' as const)
              : target.targetSource === 'Source' && context.actionSourceTarget === 'caster'
                ? ('caster' as const)
                : null
          : null;
      const groupedEnemy =
        target.targetSource === 'Context' &&
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
        (groupedEnemy
          ? ('enemy' as const)
          : groupedParty
            ? ('currentOperator' as const)
            : target.targetSource === 'Context' &&
                target.targetGroupKey !== '' &&
                target.finderType === null &&
                target.validatorTypes.length === 0 &&
                target.postProcessorTypes.length === 0
              ? ('actionInputTarget' as const)
              : null);
      if (channelTarget === null) return null;
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
            catchUpMissedTicks: node.body.catchUpMissedTicks,
            target: groupedEnemy
              ? { kind: 'fixed' as const, target: 'enemy' as const }
              : target.targetSource === 'Context'
                ? { kind: 'context' as const, key: target.targetGroupKey }
                : {
                    kind:
                      target.targetSource === 'Owner'
                        ? ('owner' as const)
                        : target.targetSource === 'Source'
                          ? ('source' as const)
                          : ('inputTarget' as const),
                  },
            executeEachFrame: node.body.executeEachFrame,
            triggerIntervalSeconds: node.body.triggerIntervalSeconds,
            maxCountPerTarget: node.body.maxCountPerTarget,
            targetTriggerIntervalSeconds: node.body.targetTriggerIntervalSeconds,
          },
        },
        body,
      };
      return {
        steps: [repeated],
        state: partyTargetGroups,
      };
    },
    canOmitTogglable: node => isCombatInvisibleTogglable(node),
    rootFilterError: 'sequence owner/guard root filters are not yet supported',
    unsupportedNodeError: node => `${node.sourcePath}: unsupported Buff runtime action`,
  };
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
      if (event === 'skillEnd' && sequence.$sequence !== null) {
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
    // 有图标时 visible 缺省即可显示；无图标的显式显示和显式隐藏不能省略。
    ...(!source.hasIcon || source.spritePath === '' ? { visible: source.hasIcon } : {}),
    ...(source.spritePath === ''
      ? {}
      : { icon: imageRefFromPath(`/icons/${source.spritePath}.webp`) }),
    // 两个显式 false 共同表示不进入敌人状态栏；缺省并不等价。
    ...(!source.showInHeadBarCommon && !source.showInHeadBarAttached
      ? { showInHeadBarCommon: false, showInHeadBarAttached: false }
      : {
          ...(source.showInHeadBarCommon ? { showInHeadBarCommon: true } : {}),
          ...(source.showInHeadBarAttached ? { showInHeadBarAttached: true } : {}),
        }),
    ...(source.showInSquadIcon ? { showInSquadIcon: true } : {}),
    ...(source.iconStyleInSquad === 'SpellAbnormal' ? { iconStyleInSquad: 'SpellAbnormal' } : {}),
    ...(source.abnormalColorType !== 'Physical'
      ? { abnormalColorType: source.abnormalColorType }
      : {}),
  };
}

function signed(value: number, negate: boolean): number {
  return negate ? -value : value;
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
