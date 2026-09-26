import type { BuffApplicationActionSource } from '../source/buffActions.ts';
import type { ProjectileLaunchActionSource } from '../source/referenceActions.ts';
import type { ScalarSource } from '../source/scalar.ts';
import type { CompiledBuffNumberSource } from './buffs/buffProjectionTypes.ts';
import type { CompiledBuffStepSource } from './actions/combatActionProjectionTypes.ts';
import type { GameplayTagRegistry } from '../source/nativeGameplayTags.ts';
import type { CompiledAbilityEntityTemplateCatalogSource } from './abilities/abilityEntityCatalog.ts';
import type { GlobalBuffActionSource } from '../source/globalBuffActions.ts';
import type { SkillSettingReadActionSource } from '../source/skillSettingActions.ts';
import type { TargetGroupActionSource } from '../source/targetGroup.ts';
import type { ActionValueOperand } from '../../../../packages/game-data-contract/src/conditions.ts';
import type { ComparisonOperator } from '../../../../packages/game-data-contract/src/primitives.ts';
import type { SkillSlotReplacementActionSource } from '../source/skillSlotActions.ts';
import type { TargetReferenceSource } from '../source/target.ts';
import type { SkillTypeMutationActionSource } from '../source/presentationActions.ts';

/** 公共投影的底层约定：宿主/目标身份、已证明的即时搜索、数值引用和共享枚举映射。
 * 条件、动作及 Buff 装配共用同一份实现；不得反向调用序列编排或具体动作投影。 */

export type ProjectedTargetGroup =
  | 'party'
  | 'partyExceptCaster'
  | 'abilityEntity'
  /** SourceFinder 写入的动态单层来源结果，不能折叠为运行时 buffSource。 */
  | 'sourceFinderResult'
  | 'controlledOperator'
  | 'contextOperator'
  | 'lowestHealthRatioOperatorExceptCaster'
  | 'casterAndControlledOperator'
  | 'casterAndLowestHealthRatioOperatorExceptCaster'
  /** 标签筛选后的敌人集合，可能为空；不能直接替换成唯一敌人。 */
  | 'dynamicEnemy'
  | 'enemy'
  | 'empty'
  | 'spatialPoint';

/** 我方能力实体的无筛选友方命中盒，在全范围模型中取队伍成员。 */
export function isPartyHitBoxTargetGroup(
  write: TargetGroupActionSource,
  context: CombatActionProjectionContextSource,
): boolean {
  return (
    write.producerType === 'FindTargetAction' &&
    write.finderType === 'HitBoxFinder' &&
    write.finderAutoSetTargetFaction === true &&
    write.finderFactionTarget === 'Ally' &&
    write.finderTargetObjectType === 'Normal' &&
    write.finderCheckAlive === true &&
    context.actionSourceTarget === 'caster' &&
    context.actionOwnerTarget === 'currentAbilityEntity' &&
    write.center === 'ActionOwner' &&
    write.centerContextKey === '' &&
    write.selectorOwner === 'ActionOwner' &&
    write.selectorOwnerContextKey === '' &&
    write.validatorTypes.length === 0 &&
    write.postProcessorTypes.length === 0 &&
    write.priorityFilters.length === 0 &&
    write.shuffleTargets.length === 0 &&
    write.distanceValidators.length === 0
  );
}

export function isPlainOwnerTarget(target: TargetReferenceSource): boolean {
  return (
    target.targetSource === 'Owner' &&
    target.targetGroupKey === '' &&
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
    target.finderShape === null &&
    target.finderOwnerPartsQuery === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

/** 原生动作身份由宿主及事件方向共同投影，不能把物理事件来源一律当作 ActionSource。 */
export interface CombatActionProjectionContextSource {
  /** 当前独立资源的节点容器；进入分支复用，进入另一个原生资源必须重新创建。 */
  readonly graph: import('./actions/actionGraphBuilder.ts').ActionGraphBuilder<
    import('./actions/combatActionProjectionTypes.ts').CompiledBuffStepSource
  >;
  /** 完整 Buff 施加链已证明只会解析到纯表现 Buff 的动态 ID 黑板键。 */
  readonly combatInvisibleDynamicBuffBlackboardKeys?: ReadonlySet<string>;
  /** 仅基础攻击组装配保留 AllowNextSkillAction，用于按实际条件分支发布技能块边界。 */
  readonly preserveSkillOperableBoundary?: boolean;
  /** 当前 Buff AbilityEvent；仅用于投影原生事件负载条件，不替代公开事件身份。 */
  readonly nativeAbilityEvent?: string | number;
  /** 同步伤害修正宿主具有 BeforeApplyDamageModifierContext；不代表发生 AbilitySystem 广播。 */
  readonly damageModifierContext?: true;
  /** 回调宿主未投影时显式 unavailable；读取 Owner 必须失败，不能借用发射者。 */
  /** 来源侧标签解析；动作、条件、Buff 和时间槽共用，不依赖某个领域宿主。 */
  readonly gameplayTagRegistry?: GameplayTagRegistry;
  readonly actionOwnerTarget: 'buffOwner' | 'caster' | 'currentAbilityEntity' | 'unavailable';
  /** 接收侧 Buff 事件保留监听器创建者；其他路径沿用已审计的宿主投影。 */
  readonly actionSourceTarget: 'caster' | 'buffSource';
  /** 主动命中可显式绑定 enemy；不伪造 Buff 事件。接收侧 Target 是事件施加者。 */
  readonly actionTargetTarget:
    | 'caster'
    | 'actionInputTarget'
    | 'enemy'
    | 'buffOwner'
    | 'currentAbilityEntity'
    | 'eventTarget'
    | 'eventSource'
    | 'currentOperator'
    | 'partyExceptCaster'
    | 'partyExceptCasterAndSameCharacterType';
  /**
   * 旧接收侧 Buff 回调只审计过 eventSource 的有限动作/条件集合。
   * eventSource 本身是公共目标身份，不能再用它暗示调用方一定是 Buff 回调。
   */
  readonly restrictEventSourceTargetProjection?: boolean;
  /**
   * 同版本模板与标签目录；仅适用于已核实查询标签不会被运行时增删的 born-tag 筛选。
   * 动态实体标签需另接运行时验证，不能以目录候选替代；目录本身也不是已生成实例集合。
   */
  readonly abilityEntityQueries?: {
    readonly catalog: CompiledAbilityEntityTemplateCatalogSource;
    readonly gameplayTagRegistry: GameplayTagRegistry;
  };
  /** 由整名 Buff 依赖数据流证明，用于归约相对 buffOwner 的选敌/条件；缺失时仍严格失败。 */
  readonly fixedBuffOwnerTarget?: 'caster' | 'enemy' | 'currentAbilityEntity';
  /** 由完整施加链证明的 Buff 来源种类；与 owner 独立。 */
  readonly fixedBuffSourceTarget?: 'caster' | 'enemy' | 'currentAbilityEntity';
  /** 已由同一主动技能动作图证明会命中唯一木桩的命名目标组。 */
  readonly staticEnemyTargetGroupKeys?: ReadonlySet<string>;
  /** 事件宿主可证明的命名 Context 身份；例如连携检查中的 trigger 就是事件发布者。 */
  readonly contextTargetGroupTargets?: ReadonlyMap<
    string,
    'caster' | 'enemy' | 'eventTarget' | 'buffOwner' | 'buffSource' | 'currentAbilityEntity'
  >;
  /** 已由完整图证明恒为空的命名目标组。 */
  readonly staticEmptyTargetGroupKeys?: ReadonlySet<string>;
  /** 运行时可为空、但任一成员都已证明只能是唯一木桩的命名目标组。 */
  readonly singleEnemyTargetGroupKeys?: ReadonlySet<string>;
  /** 当前时间线之前的写入仅产生干员；数量和具体成员仍从运行时 Context 读取。 */
  readonly operatorTargetGroupKeys?: ReadonlySet<string>;
  /** 跨时间段可证明只含固定敌人或固定空间点的 Context；仅用于零空间锚点，不代表实体身份。 */
  readonly staticZeroSpaceTargetGroupKeys?: ReadonlySet<string>;
  /** 同名 Context 的每次写入都至多产生一个敌人或 FixedPoint；成员身份可变且集合可为空。 */
  readonly atMostOneZeroSpaceTargetGroupKeys?: ReadonlySet<string>;
  /** 按原生控制流传播后，已证明在当前时间线入口恰有一个零空间成员的 Context。 */
  readonly guaranteedSingletonZeroSpaceTargetGroupKeys?: ReadonlySet<string>;
  /** 来源控制流已经证明该发射点的 OnlyHit 白名单包含唯一敌人。按动作路径记录，
   * 避免把同名、但可能保存 FixedPoint 的 Context 全局误标成敌人。 */
  readonly provenOnlyHitProjectilePaths?: ReadonlySet<string>;
  /** 条件分支已证明发射目标 Context 当前保存唯一敌人；与 OnlyHit 白名单证明分开。 */
  readonly provenZeroSpaceProjectilePaths?: ReadonlySet<string>;
  /** RandomPointFinder 命名空间点组的原生 pointNum；只折叠几何，不折叠回调次数。 */
  readonly dynamicSpatialPointCounts?: ReadonlyMap<string, ActionValueOperand>;
  /** 仍有运行时 Context 数量读取的组；静态查询也必须实际写入，不能只保存编译期事实。 */
  readonly materializedTargetGroupKeys?: ReadonlySet<string>;
  /** 完整主动技能中仅由 SpawnAbilityEntity 写入的 Context；集合可为空，但成员身份固定。 */
  readonly staticAbilityEntityTargetGroupKeys?: ReadonlySet<string>;
  /** 完整技能内所有读取均为表现的查询；不能在单个序列内自行推断。 */
  readonly presentationOnlyTargetGroupKeys?: ReadonlySet<string>;
  readonly unconsumedTargetGroupKeys?: ReadonlySet<string>;
  /** 完整技能数据流已证明只被 PointFinder 空间坐标消费的随机动作黑板键。 */
  readonly combatInvisibleRandomBlackboardKeys?: ReadonlySet<string>;
  /** 只在表现分支间传递的确定性动作黑板键；写入与消费可一并省略。 */
  readonly combatInvisiblePresentationBlackboardKeys?: ReadonlySet<string>;
  /** 接收黑板的完整资源闭包已经检查；仅允许省略所有接收者都未使用的局部键。 */
  readonly isBlackboardKeyUnusedByExternalResources?: (key: string) => boolean;
  /** 完整技能已证明没有读取或整板传出的局部常量赋值；不能用于 Buff 或实体板。 */
  readonly unconsumedSkillLocalKeys?: ReadonlySet<string>;
  /** 完整 SkillData 数据流证明不会留下战斗可见输出的 PhysicsCast 源路径。 */
  readonly combatInvisiblePhysicsCastPaths?: ReadonlySet<string>;
  /** 完整主动技能图中是否存在启用且非纯表现的动画事件监听器；未提供时不得假定倍率无战斗影响。 */
  readonly enabledAnimationEventListenerPresent?: boolean;
  /**
   * 完整 Buff 闭包中 ShowComboRingQte.triggeredAction 写入的 Owner 动态黑板键。
   * 主动技能只能用这些来源键识别同一 QTE 判定；单技能/无闭包入口不得自行猜测。
   */
  readonly comboQteTriggerBlackboardKeys?: ReadonlySet<string>;
  /** 仅技能时间轴宿主提供；Buff 生命周期和即时回调不具有可跳转时间轴。 */
  readonly timelineRange?: { readonly startFrame: number; readonly endFrame: number };
  /** 当前场景额外提供的 IHittableObject 数量；未声明时不得假定为零。 */
  readonly fixedHittableTargetCount?: number;
  /**
   * 当前动作环境的普通 SkillCastInfo 已被来源链证明就是需要过滤的来源施法。
   * 仅此标记允许把 limitSkillCastId 投影为 sameSourceSkillCast；Buff 必须证明完整
   * 定义没有 affix 写入，且当前回调保留普通来源编号，不能把普通来源冒充非零 affix。
   */
  readonly actionEnvironmentSkillCastInfoIsSourceCast?: boolean;
  /** 调用方已证明施法输入来自友方角色；不改变输入目标的运行时绑定方式。 */
  readonly actionInputIsOperator?: boolean;
}

/** 领域宿主可显式补入公共动作叶子的已审计投影；未提供时仍严格失败。 */
export interface CombatActionProjectionExtensionsSource {
  /** 仅主动 SkillData 的根调度 Sequence 开放；递归子树不会继承。 */
  readonly allowRootTimelineFinish?: boolean;
  readonly compileProjectileLaunch?: (
    action: ProjectileLaunchActionSource,
    sourcePath: string,
    context: CombatActionProjectionContextSource,
  ) => readonly CompiledBuffStepSource[];
  readonly resolveTimeDilationPriority?: (tagId: number, sourcePath: string) => number;
  readonly compileGlobalBuffAction?: (
    action: GlobalBuffActionSource,
    sourcePath: string,
    context: CombatActionProjectionContextSource,
  ) => readonly CompiledBuffStepSource[];
  readonly compileSkillSettingRead?: (
    action: SkillSettingReadActionSource,
    sourcePath: string,
    context: CombatActionProjectionContextSource,
  ) => readonly CompiledBuffStepSource[];
  /** 主动技能整名装配提供原生 skillId 到稳定技能组/技能 key 的映射。 */
  readonly compileSkillSlotReplacement?: (
    action: SkillSlotReplacementActionSource,
    sourcePath: string,
    context: CombatActionProjectionContextSource,
  ) => readonly CompiledBuffStepSource[];
  readonly compileSkillTypeMutation?: (
    action: SkillTypeMutationActionSource,
    sourcePath: string,
    context: CombatActionProjectionContextSource,
  ) => readonly CompiledBuffStepSource[];
}

export const BUFF_ACTION_CONTEXT: Omit<CombatActionProjectionContextSource, 'graph'> = {
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'eventTarget',
};

export function requireActionOwnerProjection(
  context: CombatActionProjectionContextSource,
  sourcePath: string,
): 'buffOwner' | 'caster' | 'currentAbilityEntity' {
  if (context.actionOwnerTarget === 'unavailable') {
    throw new Error(`${sourcePath}: action Owner projection is unavailable`);
  }
  return context.actionOwnerTarget;
}

/**
 * 固定唯一敌人模型中的静态敌方目标组搜索。HitBox 的形状、中心和方向在零空间下
 * 不改变集合；checkAlive=false 只会放宽死亡目标，不能引入第二个普通敌人实例。
 * NoInteractive 只排除场景交互物；标准敌方木桩仍属于该候选集合。
 * 过滤、后处理仍须为空，且必须保留原生布尔字段而不是接受未解析状态。
 */
export function isStaticSingleEnemyTargetGroup(write: TargetGroupActionSource): boolean {
  const hasDistanceValidator = write.validatorTypes.includes('DistanceValidator');
  const fixedModelValidatorsPass =
    write.validatorTypes.every(
      type => type === 'InScreenValidator' || type === 'DistanceValidator',
    ) &&
    (!hasDistanceValidator || zeroDistanceValidatorsAlwaysPass(write));
  return (
    isSingleEnemyFinder(write) && fixedModelValidatorsPass && postProcessingKeepsSingleEnemy(write)
  );
}

/**
 * Buff 宿主已经证明是唯一敌人时，HitBoxFinder 的 Ally 阵营搜索仍只能返回该木桩。
 * 这不是把 Ally 普遍改写成敌人；调用方必须同时提供 fixed enemy owner 证据。
 */
export function isStaticSingleEnemyOwnerAllyTargetGroup(write: TargetGroupActionSource): boolean {
  return (
    write.producerType === 'FindTargetAction' &&
    write.finderType === 'HitBoxFinder' &&
    write.finderFactionTarget === 'Ally' &&
    write.finderTargetObjectType === 'Normal' &&
    write.finderCheckAlive !== null &&
    write.validatorTypes.length === 0 &&
    postProcessingKeepsSingleEnemy(write)
  );
}

/**
 * HitBoxFinder 关闭自动阵营推导并把目标阵营显式固定为 Bad 时，Ally 是相对该 Bad
 * 阵营取同阵营对象，而不是相对动作宿主取友方。固定模型中 Normal 活体候选因此仍是唯一敌人。
 */
export function isStaticExplicitBadFactionEnemyTargetGroup(
  write: TargetGroupActionSource,
): boolean {
  return (
    write.producerType === 'FindTargetAction' &&
    write.finderType === 'HitBoxFinder' &&
    write.finderFactionTarget === 'Ally' &&
    write.finderTargetObjectType === 'Normal' &&
    write.finderCheckAlive !== null &&
    write.finderAutoSetTargetFaction === false &&
    write.finderTargetFactionType === 'Bad' &&
    write.validatorTypes.length === 0 &&
    postProcessingKeepsSingleEnemy(write)
  );
}

/**
 * 唯一敌人候选与当前动作输入 Target 取交集。调用方必须已经证明该 Target 就是唯一木桩；
 * 这里仅验收 TargetContainsValidator 的完整来源形状，不自行猜测动作输入身份。
 */
export function isCurrentTargetRestrictedSingleEnemyTargetGroup(
  write: TargetGroupActionSource,
): boolean {
  const parents = write.targetContainsParents ?? [];
  return (
    isSingleEnemyFinder(write) &&
    write.validatorTypes.length === 1 &&
    write.validatorTypes[0] === 'TargetContainsValidator' &&
    parents.length === 1 &&
    parents[0]!.targetSource === 'Target' &&
    parents[0]!.targetGroupKey === '' &&
    postProcessingKeepsSingleEnemy(write)
  );
}

/**
 * 固定木桩候选经原生 TagValidator 动态筛选的目标组。集合仍至多包含唯一敌人，
 * 但是否为空必须在动作执行时读取敌人当前 GameplayTag，不能升级成静态敌人证明。
 */
export function isDynamicSingleEnemyTagTargetGroup(write: TargetGroupActionSource): boolean {
  return (
    isSingleEnemyFinder(write) &&
    write.validatorTypes.length === 1 &&
    write.validatorTypes[0] === 'TagValidator' &&
    write.validatorTagQueries.length === 1 &&
    write.validatorTagQueries[0]![1].length > 0 &&
    postProcessingKeepsSingleEnemy(write)
  );
}

/**
 * SmartTarget SelectByBuff 在标准场景中只可能返回空集或唯一木桩。
 * 这里完整限制选择器载荷；“非空”仍由后续 Context 数量条件在运行时判断。
 */
export function isDynamicSingleEnemySmartTargetGroup(write: TargetGroupActionSource): boolean {
  const selection = write.smartTargetSelection ?? null;
  return (
    write.producerType === 'FindTargetAction' &&
    write.finderType === 'SmartTargetFinder' &&
    write.validatorTypes.length === 0 &&
    write.postProcessorTypes.length === 0 &&
    write.priorityFilters.length === 0 &&
    write.shuffleTargets.length === 0 &&
    write.center === 'ActionSource' &&
    write.centerContextKey === '' &&
    write.selectorOwner === 'ActionSource' &&
    write.selectorOwnerContextKey === '' &&
    selection !== null &&
    selection.strategy === 'SelectByBuff' &&
    selection.buffIds.length === 1 &&
    selection.tagQuery.tagIds.length === 0 &&
    selection.buffFindCheckType === 'Id' &&
    selection.buffFindIds.length === 0 &&
    selection.buffFindTagQuery.tagIds.length === 0 &&
    !selection.useCustomRange &&
    selection.range.blackboardKey === '' &&
    !selection.limitFallbackRange
  );
}

/**
 * SmartTargetFinder 的智能分支无论命中与否都会回退 BattleManager.mainTarget；
 * 固定唯一敌人且距离为 0 时，SelectByBuff 的这组严格载荷最终恒为同一木桩。
 * selector owner 的阵营方向由调用处结合固定 caster/source 身份继续约束。
 */
export function isZeroSpaceSingleEnemySmartTargetGroup(write: TargetGroupActionSource): boolean {
  const selection = write.smartTargetSelection ?? null;
  const selectionMatches =
    selection !== null &&
    ((selection.strategy === 'SelectByBuff' && selection.tagQuery.tagIds.length === 0) ||
      (selection.strategy === 'SelectByTag' &&
        selection.buffIds.length === 0 &&
        selection.tagQuery.tagIds.length > 0));
  return (
    write.producerType === 'FindTargetAction' &&
    write.finderType === 'SmartTargetFinder' &&
    write.validatorTypes.every(type => type === 'DistanceValidator') &&
    zeroDistanceValidatorsAlwaysPass(write) &&
    write.postProcessorTypes.length === 0 &&
    write.priorityFilters.length === 0 &&
    write.shuffleTargets.length === 0 &&
    write.center === 'ActionSource' &&
    write.centerContextKey === '' &&
    (write.selectorOwner === 'ActionOwner' || write.selectorOwner === 'ActionSource') &&
    write.selectorOwnerContextKey === '' &&
    selectionMatches &&
    selection !== null &&
    selection.buffFindCheckType === 'Id' &&
    selection.buffFindIds.length === 0 &&
    selection.buffFindTagQuery.tagIds.length === 0 &&
    !selection.useCustomRange &&
    selection.range.blackboardKey === '' &&
    (!selection.limitFallbackRange || selection.range.value >= 0)
  );
}

/**
 * 固定模型中距离恒为 0：`distance <= threshold` 要求全部等级阈值非负，
 * `distance < threshold` 则要求全部等级严格为正。其他比较方向不会被折叠。
 */
export function zeroDistanceValidatorsAlwaysPass(write: TargetGroupActionSource): boolean {
  const distanceTypeCount = write.validatorTypes.filter(
    type => type === 'DistanceValidator',
  ).length;
  if (distanceTypeCount !== write.distanceValidators.length) return false;
  return write.distanceValidators.every(distance => {
    if (distance.compareType !== 'LE' && distance.compareType !== 'LT') return false;
    const levelValues =
      distance.threshold.blackboardKey === null
        ? [distance.threshold.value]
        : distance.threshold.levelValues;
    const values =
      levelValues === null ? null : typeof levelValues === 'number' ? [levelValues] : levelValues;
    return (
      values !== null &&
      values.length > 0 &&
      values.every(value => (distance.compareType === 'LT' ? value > 0 : value >= 0))
    );
  });
}

function isSingleEnemyFinder(write: TargetGroupActionSource): boolean {
  return (
    (write.producerType === 'FindTargetAction' ||
      write.producerType === 'ContinuousFindTargetAction' ||
      write.producerType === 'ConvertToTargetContext') &&
    (write.finderType === 'AllEnemyFinder' ||
      write.finderType === 'InFightEnemyFinder' ||
      write.finderType === 'TyphoeaArcherySelectedFinder' ||
      write.finderType === 'MainTargetFinder' ||
      (write.finderType === 'HitBoxFinder' &&
        write.finderFactionTarget === 'Anti' &&
        (write.finderTargetObjectType === 'Normal' ||
          write.finderTargetObjectType === 'NoInteractive') &&
        write.finderCheckAlive !== null))
  );
}

function postProcessingKeepsSingleEnemy(write: TargetGroupActionSource): boolean {
  const priority = write.priorityFilters?.[0];
  return (
    write.postProcessorTypes.length === 0 ||
    (write.postProcessorTypes.length === 1 &&
      write.postProcessorTypes[0] === 'PriorityFilter' &&
      write.priorityFilters.length === 1 &&
      priority?.buffFilter.checkType === 'Id' &&
      priority.buffFilter.buffIds.length === 0 &&
      priority.buffFilter.tagQuery.queryType === 'hasAny' &&
      priority.buffFilter.tagQuery.tagIds.length === 0 &&
      (!priority.limitMaxNum || priority.maxNum >= 1))
  );
}

/**
 * 唯一敌人已作为当前 Target 进入动作时，命中盒“搜索敌人 → 排除当前 Target”必定为空。
 * 只接受萤石反弹分支观测到的完整后处理形状；未知排序或 Buff 过滤不在这里被吞掉。
 */
export function isEmptyStaticEnemyExclusionTargetGroup(write: TargetGroupActionSource): boolean {
  const priority = write.priorityFilters[0];
  return (
    write.producerType === 'FindTargetAction' &&
    write.finderType === 'HitBoxFinder' &&
    write.finderFactionTarget === 'Anti' &&
    write.finderTargetObjectType === 'Normal' &&
    write.finderCheckAlive === true &&
    write.finderOwnerPartsQuery === null &&
    write.finderSpawnedObjectType === null &&
    write.validatorTypes.length === 0 &&
    write.validatorTagQueries.length === 0 &&
    write.distanceValidators.length === 0 &&
    write.shuffleTargets.length === 0 &&
    write.selectorOwner === 'ActionOwner' &&
    write.selectorOwnerContextKey === '' &&
    write.center === 'ActionSource' &&
    write.centerContextKey === '' &&
    !write.excludesOwner &&
    write.excludesCurrentTarget &&
    write.postProcessorTypes.length === 2 &&
    write.postProcessorTypes[0] === 'ExcludeTarget' &&
    write.postProcessorTypes[1] === 'PriorityFilter' &&
    write.priorityFilters.length === 1 &&
    priority?.filterType === 'DistanceFromCenterAsc' &&
    priority.onlyReserveMaxPriorityTargets === false &&
    priority.limitMaxNum === true &&
    priority.maxNum === 1 &&
    priority.buffFilter.checkType === 'Id' &&
    priority.buffFilter.buffIds.length === 0 &&
    priority.buffFilter.tagQuery.queryType === 'hasAny' &&
    priority.buffFilter.tagQuery.tagIds.length === 0 &&
    priority.buffFilter.stackCountType === 'BuffCount'
  );
}

/** 固定小队模型中严格折叠已证明的“全队成员排除动作 owner”即时搜索。 */
export function isPartyExceptOwnerInstantSearch(
  target: BuffApplicationActionSource['target'],
): boolean {
  return (
    target.targetSource === 'InstantSearch' &&
    target.selectorOwner === 'ActionOwner' &&
    target.ownerContextKey === '' &&
    target.centerType === 'ActionSource' &&
    target.centerContextKey === '' &&
    !target.centerToGround &&
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    !target.enableAdvancedDirection &&
    target.selectorDirection === 'SourceForward' &&
    target.finderType === 'CharacterTeamFinder' &&
    target.finderShape === null &&
    target.finderOwnerPartsQuery === null &&
    target.validatorTypes.length === 1 &&
    target.validatorTypes[0] === 'ExcludeOwnerValidator' &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

/** 固定队伍模型中的 CharacterTeamFinder + MainCharacterValidator。
 * 原生 selector 在 Source 引用上仍执行 finder/validator，不能先短路成施术者。 */
export function isControlledOperatorInstantSearch(
  target: BuffApplicationActionSource['target'],
): boolean {
  return (
    (target.targetSource === 'InstantSearch' || target.targetSource === 'Source') &&
    target.finderType === 'CharacterTeamFinder' &&
    target.validatorTypes.length === 1 &&
    target.validatorTypes[0] === 'MainCharacterValidator' &&
    target.postProcessorTypes.length === 0
  );
}

/** MainTargetFinder 读取全局主目标；零空间下序列化的中心选项不改变唯一敌人身份。 */
export function isUniqueEnemyMainTargetInstantSearch(
  target: BuffApplicationActionSource['target'],
): boolean {
  return (
    target.targetSource === 'InstantSearch' &&
    target.targetGroupKey === '' &&
    target.selectorOwner === 'ActionOwner' &&
    target.ownerContextKey === '' &&
    (target.centerType === 'ActionSource' || target.centerType === 'ActionOwner') &&
    target.centerContextKey === '' &&
    !target.centerToGround &&
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    !target.enableAdvancedDirection &&
    target.selectorDirection === 'SourceForward' &&
    target.finderType === 'MainTargetFinder' &&
    target.finderShape === null &&
    target.finderOwnerPartsQuery === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

/**
 * 内联 HitBox 搜索在固定零空间场景中只会返回唯一敌方木桩。这里仍完整限制
 * 原生阵营、对象种类、存活过滤及 selector 后处理，不能仅凭 finder 名称放行。
 */
export function isUniqueEnemyHitBoxInstantSearch(
  target: BuffApplicationActionSource['target'],
): boolean {
  return (
    target.targetSource === 'InstantSearch' &&
    target.targetGroupKey === '' &&
    target.finderType === 'HitBoxFinder' &&
    target.finderFactionTarget === 'Anti' &&
    target.finderTargetObjectType === 'Normal' &&
    target.finderCheckAlive === true &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

export function isOwnerSpawnedAbilityEntityInstantSearch(
  target: BuffApplicationActionSource['target'],
): boolean {
  return (
    target.targetSource === 'InstantSearch' &&
    target.finderType === 'OwnerSpawnedEntityFinder' &&
    target.finderSpawnedObjectType === 'AbilityEntity' &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.validatorTagQueries.length === 0
  );
}

/** 固定小队模型中严格折叠无筛选的即时全队搜索。 */
export function isPartyInstantSearch(target: BuffApplicationActionSource['target']): boolean {
  return (
    target.targetSource === 'InstantSearch' &&
    target.selectorOwner === 'ActionOwner' &&
    target.ownerContextKey === '' &&
    target.centerType === 'ActionSource' &&
    target.centerContextKey === '' &&
    !target.centerToGround &&
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    !target.enableAdvancedDirection &&
    target.selectorDirection === 'SourceForward' &&
    target.finderType === 'CharacterTeamFinder' &&
    target.finderShape === null &&
    target.finderOwnerPartsQuery === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

export function scalarOperand(source: ScalarSource): CompiledBuffNumberSource {
  return source.blackboardKey === null ? source.value : { blackboardKey: source.blackboardKey };
}

export function actionValueOperand(
  source: ScalarSource,
  fallback?: number,
):
  | { readonly kind: 'constant'; readonly value: number }
  | {
      readonly kind: 'blackboard';
      readonly key: string;
      readonly fallback?: number;
    } {
  return source.blackboardKey === null
    ? { kind: 'constant', value: source.value }
    : {
        kind: 'blackboard',
        key: source.blackboardKey,
        ...(fallback === undefined ? {} : { fallback }),
      };
}

export const DAMAGE_TYPES: Readonly<
  Record<
    string,
    'physical' | 'true' | 'heat' | 'electric' | 'cryo' | 'lifeDrain' | 'nature' | 'ether'
  >
> = {
  Physical: 'physical',
  Real: 'true',
  Fire: 'heat',
  Pulse: 'electric',
  Cryst: 'cryo',
  LifeDrain: 'lifeDrain',
  Natural: 'nature',
  Ether: 'ether',
};

export const COMPARISON_OPERATORS: Readonly<Record<string, ComparisonOperator>> = {
  EQ: 'equal',
  NE: 'notEqual',
  GT: 'greater',
  GE: 'greaterOrEqual',
  LT: 'less',
  LE: 'lessOrEqual',
  Equals: 'equal',
  NotEquals: 'notEqual',
  GreaterThan: 'greater',
  GreaterThanOrEqual: 'greaterOrEqual',
  LessThan: 'less',
  LessThanOrEqual: 'lessOrEqual',
};
/** 公开定义只允许可读标签；空查询不要求目录，非空查询缺目录时必须失败。 */
export function projectGameplayTags(
  ids: readonly number[],
  context: Pick<
    CombatActionProjectionContextSource,
    'gameplayTagRegistry' | 'abilityEntityQueries'
  >,
  sourcePath: string,
): readonly string[] {
  const registry = context.gameplayTagRegistry ?? context.abilityEntityQueries?.gameplayTagRegistry;
  return ids.map((id, index) => {
    if (!registry)
      throw new Error(sourcePath + '[' + index + ']: 转换 GameplayTag 缺少来源标签目录');
    return registry.resolve(id, sourcePath + '[' + index + ']');
  });
}
