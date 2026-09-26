import type { DeclaredBlackboardValueSource } from '../../source/blackboard.ts';
import type { ProjectileLaunchActionSource } from '../../source/referenceActions.ts';
import type { ProjectileRuntimeSource } from '../../source/projectileRuntime.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { SkillActionGraphSource } from '../../source/skillActionGraph.ts';
import { collectNativeActionNodes } from '../../source/controlFlow.ts';
import { compileCombatActionSequenceSource } from '../buffs/buffRuntimeProjection.ts';
import type {
  CombatActionProjectionContextSource,
  CombatActionProjectionExtensionsSource,
} from '../combatProjectionCommon.ts';
import { projectGameplayTags } from '../combatProjectionCommon.ts';
import type { CompiledBuffSequenceSource } from '../actions/combatActionProjectionTypes.ts';
import {
  createActionGraphBuilder,
  type ActionGraphBuilder,
} from '../actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../actions/combatActionProjectionTypes.ts';
import {
  compileProjectileLaunchScopeSource,
  omitDeadSingleEnemyBounceBookkeeping,
  numericInitialValues,
} from './projectileCallbackScopes.ts';
import { isStaticSingleEnemyTargetGroup } from '../combatProjectionCommon.ts';
import {
  collectPresentationOnlyBlackboardKeys,
  isPresentationOnlyActionSequence,
} from '../skills/skillPresentationTargets.ts';
import type { SkillCastResourceDefinition } from '../../../../../packages/game-data-contract/src/index.ts';

/** A callback skill before any zero-distance/immediate execution optimization. */
export interface ProjectileCallbackSkillSource {
  readonly program: ActionGraphBuilder<CompiledBuffStepSource>;
  readonly skillId: string;
  readonly declaredBlackboard: readonly DeclaredBlackboardValueSource[];
  readonly naturalDurationFrames: number;
  readonly timelineActions: readonly {
    readonly startFrame: number;
    readonly endFrame: number;
    readonly sequence: CompiledBuffSequenceSource;
  }[];
  readonly castResource?: SkillCastResourceDefinition;
}

/** Native Launch looks up every enabled route, including routes not invoked by this projection. */
export function resolveProjectileRecycleDelaySource(
  launch: Pick<ProjectileLaunchActionSource, 'callbacks'>,
  callbackGraphs: ReadonlyMap<string, Pick<SkillActionGraphSource<unknown>, 'durationFrame'>>,
  sourcePath: string,
): number {
  let maxDurationFrame = 0;
  for (const route of launch.callbacks) {
    if (!route.enabled) continue;
    const graph = callbackGraphs.get(route.skillId);
    if (graph === undefined)
      throw new Error(`${sourcePath}: missing projectile callback SkillData ${route.skillId}`);
    if (!Number.isInteger(graph.durationFrame) || graph.durationFrame < 0)
      throw new Error(`${sourcePath}: invalid callback durationFrame for ${route.skillId}`);
    maxDurationFrame = Math.max(maxDurationFrame, Math.max(1, graph.durationFrame));
  }
  // Native SkillData.duration is max(durationFrame, 1) / 30, not callback action bounds.
  const delay = Math.fround(Math.fround(maxDurationFrame) / 30);
  if (!Number.isFinite(delay))
    throw new Error(`${sourcePath}: projectile callback duration exceeds native float range`);
  return delay;
}

export interface ZeroDistanceProjectileProjectionCatalogSource {
  readonly runtimes: ReadonlyMap<string, ProjectileRuntimeSource>;
  readonly templates: ReadonlyMap<
    string,
    {
      readonly projectileId: string;
      readonly entityBlackboard: readonly DeclaredBlackboardValueSource[];
    }
  >;
  readonly callbackGraphs: ReadonlyMap<string, SkillActionGraphSource<KnownNativeActionLeafSource>>;
  readonly callbackCastResources?: ReadonlyMap<string, SkillCastResourceDefinition>;
}

type ProjectileLaunchHitParameters = NonNullable<
  import('../../../../../packages/game-data-contract/src/actions.ts').CombatStepParameters['launchProjectile']['hit']
>;

/**
 * 把版本化 ProjectileData、实体模板与回调 SkillData 目录接成公共动作扩展。
 * 按结束条件和固定零空间模型选择已支持的生命周期；未知形状在来源路径上报错。
 */
export function createZeroDistanceProjectileProjectionExtensionSource(input: {
  readonly catalog: ZeroDistanceProjectileProjectionCatalogSource;
  readonly callbackContext: Omit<CombatActionProjectionContextSource, 'graph'>;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly callbackExtensions?: CombatActionProjectionExtensionsSource;
}): NonNullable<CombatActionProjectionExtensionsSource['compileProjectileLaunch']> {
  return (launch, sourcePath, projectionContext) => {
    let callbackContext: CombatActionProjectionContextSource = {
      ...input.callbackContext,
      graph: projectionContext.graph,
      // ProjectileComponent._CastSkill 在投射物自身 AbilitySystem 上 TryCast；
      // 因此回调动作 Owner 是投射物实体，Source/SkillCastInfo 才沿用来源施法者。
      actionOwnerTarget: 'currentAbilityEntity' as const,
      // ProjectileComponent._CastSkill copies its stored m_skillCastInfo into the callback
      // skill cast input. Conditions inside that callback therefore filter by this source cast.
      actionEnvironmentSkillCastInfoIsSourceCast: true,
      ...(projectionContext.abilityEntityQueries === undefined
        ? {}
        : { abilityEntityQueries: projectionContext.abilityEntityQueries }),
    };
    const runtime = input.catalog.runtimes.get(launch.projectileId);
    if (!runtime) throw new Error(`${sourcePath}: missing ProjectileData ${launch.projectileId}`);
    const reachesCurrentOperator =
      runtime.hitOnReach &&
      launch.target.targetSource === 'Target' &&
      projectionContext.actionTargetTarget === 'currentOperator';
    if (
      (runtime.hitOnReach && launch.target.targetSource === 'MainCharacter') ||
      reachesCurrentOperator
    )
      callbackContext = {
        ...callbackContext,
        actionTargetTarget: 'actionInputTarget',
        actionInputIsOperator: true,
      };
    const template = input.catalog.templates.get(launch.projectileId) ?? null;
    const enabled = launch.callbacks.filter(callback => callback.enabled);
    // 关闭槽位中的 skillId 不参与调用，但发射/reset 仍能被 SkillAffix 观察。
    // 未投影对象寿命前必须报告缺口，不能把“没有回调程序”当作“没有发射”。
    if (enabled.length === 0) {
      assertSupportedLaunchTargetControls(launch, sourcePath, projectionContext);
      if (
        launch.projectileSource.targetSource === 'Source' &&
        launch.projectileSource.targetGroupKey === '' &&
        isPlainZeroSpaceFixedPoint(launch.target, projectionContext, sourcePath) &&
        launch.presetPoints.length === 0 &&
        runtime.useSegmentMove &&
        runtime.moveSegments.length > 1 &&
        runtime.presetPointKeys.length === 2 &&
        runtime.presetPointKeys.includes('LaunchPoint') &&
        runtime.presetPointKeys.includes('TargetPoint') &&
        runtime.moveSegments.every(
          segment =>
            runtime.presetPointKeys.includes(segment.startPointKey) &&
            runtime.presetPointKeys.includes(segment.endPointKey) &&
            runtime.moveModeTypes.get(segment.moveModeId) === 0,
        ) &&
        runtime.finishOnReach &&
        !runtime.keepMoveOnReach &&
        !runtime.canTraceTargetAfterReach &&
        hasNoModeledBlockingSurfaces(runtime) &&
        runtime.maxHitCount <= 0 &&
        runtime.finishDistance.blackboardKey === null &&
        runtime.finishDistance.value >= 0 &&
        Number.isFinite(runtime.finishDuration) &&
        runtime.finishDuration > 0
      ) {
        // 原生每个移动Tick只推进一段；earlyNextByDuration在已reach分支读取，
        // 不构成每段的最短停留时间。零空间不累计行进距离，也不因无回调命中结束。
        return [
          {
            kind: 'launchProjectile',
            parameters: {
              ...(launch.syncTimeScale ? { syncTimeScale: true } : {}),
              finish: {
                reachAfterTicks: runtime.moveSegments.length,
                maxDurationSeconds: runtime.finishDuration,
              },
            },
            callbacks: [],
          },
        ];
      }
      if (
        launch.projectileSource.targetSource !== 'Source' ||
        launch.projectileSource.targetGroupKey !== '' ||
        runtime.moveModeTypes.get('Default') !== 0 ||
        !runtime.finishOnReach ||
        !isPlainZeroSpaceFixedPoint(launch.target, projectionContext, sourcePath)
      )
        throw new Error(
          `${sourcePath}: projectile ${launch.projectileId} has no enabled callbacks, but launch/reset lifetime is not projected`,
        );
      assertSupportedFirstTickReachShape(runtime, sourcePath, true);
      return [
        {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            ...(launch.syncTimeScale ? { syncTimeScale: true } : {}),
          },
          callbacks: [],
        },
      ];
    }
    const callback = (event: 'block' | 'finish' | 'hit' | 'reach') => {
      const routes = enabled.filter(item => item.event === event);
      if (routes.length !== 1 || !routes[0]!.skillId)
        throw new Error(`${sourcePath}: expected one enabled projectile ${event} callback`);
      const graph = input.catalog.callbackGraphs.get(routes[0]!.skillId);
      if (!graph)
        throw new Error(
          `${sourcePath}: missing projectile callback SkillData ${routes[0]!.skillId}`,
        );
      return graph;
    };
    if (
      enabled.length === 1 &&
      enabled[0]!.event === 'hit' &&
      isPresentationOnlyProjectileCallback(callback('hit'))
    ) {
      assertSupportedLaunchTargetControls(launch, sourcePath, projectionContext);
      // hitOnReach直接命中发射目标，不经碰撞过滤；已知唯一敌人且maxHitCount=1
      // 时，在首Tick到达后即因命中次数结束，即使finishOnReach本身关闭。
      const finishByReachHit =
        runtime.hitOnReach &&
        runtime.maxHitCount === 1 &&
        targetReferenceSelectsUniqueEnemy(launch.target, projectionContext);
      if (
        launch.projectileSource.targetSource !== 'Source' ||
        launch.projectileSource.targetGroupKey !== '' ||
        runtime.moveModeTypes.get('Default') !== 0 ||
        (!runtime.finishOnReach && !finishByReachHit) ||
        !isPlainZeroSpaceFixedPoint(launch.target, projectionContext, sourcePath)
      )
        throw new Error(
          `${sourcePath}: projectile ${launch.projectileId} has a presentation-only callback, but launch/reset lifetime is not projected ` +
            JSON.stringify({
              syncTimeScale: launch.syncTimeScale,
              source: launch.projectileSource.targetSource,
              sourceGroup: launch.projectileSource.targetGroupKey,
              moveType: runtime.moveModeTypes.get('Default'),
              finishOnReach: runtime.finishOnReach,
              finishByReachHit,
              zeroSpaceTarget: isPlainZeroSpaceFixedPoint(
                launch.target,
                projectionContext,
                sourcePath,
              ),
            }),
        );
      // 固定零空间中首个移动Tick到达。即使先碰撞并结束，也发生在同一Tick；
      // 不执行表现回调，但保留发射通知及所有启用路由参与求值的回收延迟。
      assertSupportedFirstTickReachShape(runtime, sourcePath, true);
      return [
        {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            ...(launch.syncTimeScale ? { syncTimeScale: true } : {}),
            recycleDelaySeconds: resolveProjectileRecycleDelaySource(
              launch,
              input.catalog.callbackGraphs,
              sourcePath,
            ),
          },
          callbacks: [],
        },
      ];
    }
    assertSupportedLaunchTargetControls(launch, sourcePath, projectionContext);
    if (!['Source', 'Owner'].includes(launch.projectileSource.targetSource))
      throw new Error(`${sourcePath}: projectile source must resolve to Source or Owner`);
    if (!hasNoModeledBlockingSurfaces(runtime))
      throw new Error(`${sourcePath}: projectile environment blocking is not modeled`);
    // 恢复原有零空间落地近似，只覆盖以阻挡结束飞行的独立落地路线。
    // 同时存在 hit/reach 的弹体仍按各自已证明的命中/到达路线处理。
    const landsOnFirstTick = enabled.length === 1 && enabled[0]!.event === 'block';
    if (landsOnFirstTick) assertSupportedFirstTickBlockShape(runtime, sourcePath);
    const routes = enabled.flatMap(route =>
      route.event === 'block' && !landsOnFirstTick
        ? []
        : [{ event: route.event, skillId: route.skillId }],
    );
    const hasHit = routes.some(route => route.event === 'hit');
    const hasReach = routes.some(route => route.event === 'reach');
    const hitsParty =
      hasHit && !runtime.hitOnReach && isFixedGoodCharacterTargetFilter(runtime.targetFilter);
    if (hitsParty)
      callbackContext = {
        ...callbackContext,
        actionTargetTarget: 'actionInputTarget',
        actionInputIsOperator: true,
      };
    if (hasHit) {
      // 发射目标只决定飞向哪里；碰撞回调的目标集合由 ProjectileData.targetFilter 决定。
      // 飞向主控干员不等于对全队逐人施放命中技能。
      if (hitsParty && runtime.maxHitCount > 0 && runtime.maxHitCount <= 4)
        throw new Error(`${sourcePath}: party projectile hit limit requires per-target counting`);
      assertSupportedFirstTickShape(runtime, sourcePath, {
        maxHitCounts: new Set([-1, 0, 1]),
        requireCollider: !runtime.hitOnReach,
        allowHitOnReach: true,
        allowFinishByFirstHitCount: true,
        allowAnyPositiveMaxHitCount: true,
        allowGameplayTagFilter: true,
        allowPersistentSingleTargetHit: true,
        allowTwoSegmentReachBeforeRepeatHit: true,
      });
    }
    if (hasReach || runtime.finishOnReach || runtime.hitOnReach) {
      if (!isPlainZeroSpaceFixedPoint(launch.target, projectionContext, sourcePath))
        throw new Error(
          `${sourcePath}: projectile reach target is not a proven zero-space point ` +
            JSON.stringify({
              source: launch.target.targetSource,
              group: launch.target.targetGroupKey,
              finder: launch.target.finderType,
              owner: projectionContext.actionOwnerTarget,
              input: projectionContext.actionTargetTarget,
            }),
        );
      if (!runtime.useSegmentMove) assertSupportedFirstTickReachShape(runtime, sourcePath, true);
    }
    if (!Number.isFinite(runtime.finishDuration) || runtime.finishDuration <= 0)
      throw new Error(`${sourcePath}: projectile duration must be positive and finite`);
    const finish: import('../../../../../packages/game-data-contract/src/actions.ts').CombatStepParameters['launchProjectile']['finish'] =
      landsOnFirstTick
        ? ('firstTickBlock' as const)
        : runtime.finishOnReach
          ? runtime.useSegmentMove && runtime.moveSegments.length > 1
            ? {
                reachAfterTicks: runtime.moveSegments.length,
                maxDurationSeconds: runtime.finishDuration,
              }
            : ('firstTickReach' as const)
          : hasReach || runtime.hitOnReach
            ? {
                reachAfterTicks: runtime.useSegmentMove ? runtime.moveSegments.length : 1,
                maxDurationSeconds: runtime.finishDuration,
                finishOnReach: false,
              }
            : runtime.finishDuration;
    const hitTagFilter =
      hasHit && !runtime.hitOnReach
        ? projectProjectileHitTagFilter(runtime, callbackContext, sourcePath)
        : undefined;
    const callbacks = routes.map(route => {
      const graph = callback(route.event);
      const compiled = compileProjectileCallbackSkillSource({
        graph,
        context: callbackContext,
        visualOnlyIds: input.visualOnlyIds,
        extensions: input.callbackExtensions,
        castResource: input.catalog.callbackCastResources?.get(graph.skillId),
      });
      const nativeSkillType = runtime.activeSkills?.initialNativeSkillTypeById[graph.skillId];
      if (compiled.castResource === undefined || nativeSkillType === undefined)
        throw new Error(
          `${sourcePath}: missing projectile callback skill registration or resource metadata for ${graph.skillId}`,
        );
      return {
        route,
        compiled,
        skill: {
          skillId: compiled.skillId,
          nativeSkillType,
          naturalDurationFrames: compiled.naturalDurationFrames,
          castResource: compiled.castResource,
          blackboard: numericInitialValues(compiled.declaredBlackboard, sourcePath),
          scheduledSequences: [...compiled.timelineActions],
        },
      };
    });
    // 裁剪必须作用于真正发射的程序，依赖收集随后读取同一份程序。
    callbacks.forEach((callback, callbackIndex) => {
      const timelines = callback.skill.scheduledSequences;
      const otherCallbacks = callbacks.flatMap((other, index) =>
        index === callbackIndex
          ? []
          : other.skill.scheduledSequences.flatMap(timeline =>
              other.compiled.program.reachableActions(timeline.sequence),
            ),
      );
      callback.skill.scheduledSequences = timelines.map((timeline, index) => ({
        ...timeline,
        sequence: omitDeadSingleEnemyBounceBookkeeping(
          callback.compiled.program,
          timeline.sequence,
          [
            ...timelines
              .slice(index + 1)
              .flatMap(item => callback.compiled.program.reachableActions(item.sequence)),
            ...otherCallbacks,
          ],
        ),
      }));
    });
    const hit: ProjectileLaunchHitParameters | undefined = hasHit
      ? {
          ...(hitsParty ? { target: 'allOperators' as const } : {}),
          ...(runtime.hitOnReach ? { onReach: true } : {}),
          ...(runtime.hitOnReach && launch.target.targetSource === 'MainCharacter'
            ? { target: 'controlledOperator' as const }
            : {}),
          ...(reachesCurrentOperator ? { target: 'currentTarget' as const } : {}),
          finishOnHit: runtime.maxHitCount === 1,
          ...(hitTagFilter === undefined
            ? {}
            : { hitTagFilter, retryRejectedHit: typeof finish === 'number' }),
        }
      : undefined;
    return [
      compileProjectileLaunchScopeSource({
        sourcePath,
        launch,
        template,
        invocations: callbacks.map(({ route, compiled, skill }) => ({
          program: compiled.program,
          event: route.event,
          skillId: compiled.skillId,
          declaredBlackboard: compiled.declaredBlackboard,
          sequence: compiled.program.sequence(
            skill.scheduledSequences.flatMap(timeline =>
              compiled.program.actions(timeline.sequence),
            ),
          ),
        })),
        allowMissingEntityBlackboardEvidence: true,
        body: projectionContext.graph.sequence([
          {
            kind: 'launchProjectile',
            parameters: {
              finish,
              ...(launch.projectileSource.targetSource === 'Owner'
                ? { source: 'actionOwner' as const }
                : {}),
              ...(launch.syncTimeScale ? { syncTimeScale: true } : {}),
              recycleDelaySeconds: resolveProjectileRecycleDelaySource(
                launch,
                input.catalog.callbackGraphs,
                sourcePath,
              ),
              ...(hit === undefined ? {} : { hit }),
            },
            callbacks: callbacks.map(({ route, skill, compiled }) => ({
              event: route.event,
              skill: {
                actionGraph: { main: compiled.program.finish(), macros: {} },
                ...skill,
              },
            })),
          },
        ]),
      }),
    ];
  };
}

function isPresentationOnlyProjectileCallback(
  graph: SkillActionGraphSource<KnownNativeActionLeafSource>,
): boolean {
  if (graph.actionGroup.passiveEvents.length > 0) return false;
  const presentationOnlyBlackboardKeys = collectPresentationOnlyBlackboardKeys(graph);
  return graph.actionGroup.timelineActions.every(timeline =>
    isPresentationOnlyActionSequence(timeline.sequence, presentationOnlyBlackboardKeys),
  );
}

function projectProjectileHitTagFilter(
  runtime: ProjectileRuntimeSource,
  context: CombatActionProjectionContextSource,
  sourcePath: string,
): ProjectileLaunchHitParameters['hitTagFilter'] {
  if (!runtime.targetFilter.filterGameplayTag) return undefined;
  const query = runtime.targetFilter.gameplayTagQuery;
  if (query === null)
    throw new Error(`${sourcePath}: enabled projectile GameplayTag filter has no query`);
  const registry = context.gameplayTagRegistry ?? context.abilityEntityQueries?.gameplayTagRegistry;
  if (!registry)
    throw new Error(`${sourcePath}.targetFilter.tagQuery.tags: 转换 GameplayTag 缺少来源标签目录`);
  const registeredTagIds = query.tagIds.filter(id => registry.find(id) !== undefined);
  if (registeredTagIds.length !== query.tagIds.length && query.queryType !== 'exceptAny') {
    // 只有 ExceptAny 可以在唯一被动木桩模型中安全剔除“目录不存在、因而运行时不可拥有”的项。
    // 其他查询的真假会因未知项改变，继续沿用 projectGameplayTags 的严格失败边界。
    projectGameplayTags(query.tagIds, context, `${sourcePath}.targetFilter.tagQuery.tags`);
  }
  if (registeredTagIds.length === 0 && query.queryType === 'exceptAny') {
    // Endaxis 运行时只持有从完整可读目录投影出的字符串标签，敌人又没有主动行为或外部标签写入。
    // 因此未注册原生 ID 不可能出现在唯一木桩上；ExceptAny 的全部条件均不可命中，命中回调恒可达。
    return undefined;
  }
  return {
    tagQueryType: query.queryType,
    tags: projectGameplayTags(
      registeredTagIds,
      context,
      `${sourcePath}.targetFilter.tagQuery.tags`,
    ),
  };
}

/** Preserve native skill duration and every independent action interval. */
export function compileProjectileCallbackSkillSource(input: {
  readonly graph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  readonly context: Omit<CombatActionProjectionContextSource, 'graph'>;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly extensions?: CombatActionProjectionExtensionsSource;
  readonly castResource?: SkillCastResourceDefinition;
}): ProjectileCallbackSkillSource {
  const { graph, context, visualOnlyIds = new Set(), extensions = {}, castResource } = input;
  const program = createActionGraphBuilder<CompiledBuffStepSource>();
  if (graph.actionGroup.passiveEvents.length > 0)
    throw new Error(`${graph.skillId}: projectile callback passive events are unsupported`);
  const discoveredEnemyGroups = graph.actionGroup.timelineActions.flatMap(timeline =>
    collectNativeActionNodes(timeline.sequence)
      .filter(
        node =>
          node.body.kind === 'leaf' &&
          node.body.value.family === 'targetGroup' &&
          isStaticSingleEnemyTargetGroup(node.body.value.action),
      )
      .map(node =>
        node.body.kind === 'leaf' && node.body.value.family === 'targetGroup'
          ? node.body.value.action.targetGroupKey
          : '',
      ),
  );
  const callbackContext: CombatActionProjectionContextSource = {
    ...context,
    graph: program,
    staticEnemyTargetGroupKeys: new Set([
      ...(context.staticEnemyTargetGroupKeys ?? []),
      ...discoveredEnemyGroups,
    ]),
  };
  if (!Number.isInteger(graph.durationFrame) || graph.durationFrame < 0)
    throw new Error(`${graph.skillId}: invalid callback durationFrame`);
  const timelineActions = graph.actionGroup.timelineActions.map(timeline => {
    const sequence = compileCombatActionSequenceSource(
      timeline.sequence,
      callbackContext,
      visualOnlyIds,
      extensions,
    );
    return { startFrame: timeline.startFrame, endFrame: timeline.endFrame, sequence };
  });
  return {
    program,
    skillId: graph.skillId,
    declaredBlackboard: graph.declaredBlackboard,
    naturalDurationFrames: Math.max(1, graph.durationFrame),
    timelineActions,
    ...(castResource === undefined ? {} : { castResource }),
  };
}

/**
 * 新增目标控制会改变命中资格或发射数量，不能由“零距离”自动推出无影响。
 * OnlyHit 是白名单：仅当过滤集合静态包含唯一敌人时可消去。
 * 即使没有战斗回调，发射仍须通过此守卫并保留对象寿命。
 */
function assertSupportedLaunchTargetControls(
  launch: ProjectileLaunchActionSource,
  path: string,
  context?: CombatActionProjectionContextSource,
): void {
  if (
    launch.targetFilterMode === 'OnlyHit' &&
    launch.targetFilterSettings !== null &&
    (targetReferenceSelectsUniqueEnemy(launch.targetFilterSettings, context) ||
      context?.provenOnlyHitProjectilePaths?.has(path) === true)
  ) {
    // 唯一可能碰撞的敌人属于白名单，过滤前后可见 hit 集合相同。
  } else if (launch.targetFilterMode !== 'None') {
    throw new Error(
      `${path}.targetFilterMode: projectile target filter ${launch.targetFilterMode} is not modeled`,
    );
  }
  if (launch.alsoLaunchToHittableTarget !== false) {
    throw new Error(
      `${path}.alsoLaunchToHittableTarget: additional projectile launches are not modeled`,
    );
  }
}

function targetReferenceSelectsUniqueEnemy(
  target: ProjectileLaunchActionSource['targetFilterSettings'],
  context?: CombatActionProjectionContextSource,
): boolean {
  if (target === null || context === undefined) return false;
  if (target.targetSource === 'MainTarget') return true;
  if (target.targetSource === 'Target') return context.actionTargetTarget === 'enemy';
  return (
    target.targetSource === 'Context' &&
    target.targetGroupKey !== '' &&
    context.staticEnemyTargetGroupKeys?.has(target.targetGroupKey) === true
  );
}

function assertSupportedFirstTickShape(
  runtime: ProjectileRuntimeSource,
  path: string,
  options: {
    readonly maxHitCounts?: ReadonlySet<number>;
    readonly requireCollider?: boolean;
    readonly allowHitOnReach?: boolean;
    readonly allowFinishByFirstHitCount?: boolean;
    readonly allowAnyPositiveMaxHitCount?: boolean;
    readonly allowGameplayTagFilter?: boolean;
    readonly allowPersistentSingleTargetHit?: boolean;
    readonly allowTwoSegmentReachBeforeRepeatHit?: boolean;
  } = {},
): void {
  const segment = runtime.moveSegments[0];
  const maxHitCounts = options.maxHitCounts ?? new Set([-1]);
  // ProjectileComponent.HitTarget increments m_hitCount, resolves maxHitCount, and calls
  // FinishProjectile(HitCount) as soon as the positive limit is reached. For a hit-only
  // route with maxHitCount=1, finishOnReach/keepMoveOnReach therefore cannot affect any
  // later combat-visible callback in the zero-distance single-target model. maxHitCount=-1
  // is only admitted by callers that also retain allowHitSameTarget=false below.
  const finishesOnFirstHit =
    options.allowFinishByFirstHitCount === true && runtime.maxHitCount === 1;
  const remainsInertAfterSingleTargetHit =
    options.allowPersistentSingleTargetHit === true && !runtime.allowHitSameTarget;
  const firstSegment = runtime.moveSegments[0];
  const secondSegment = runtime.moveSegments[1];
  const reachesBeforeSecondCollision =
    options.allowTwoSegmentReachBeforeRepeatHit === true &&
    !runtime.useHitBlockReachOrder &&
    runtime.finishOnReach &&
    !runtime.keepMoveOnReach &&
    runtime.useSegmentMove &&
    runtime.presetPointKeys.length === 2 &&
    runtime.presetPointKeys[0] === 'LaunchPoint' &&
    runtime.presetPointKeys[1] === 'TargetPoint' &&
    runtime.moveSegments.length === 2 &&
    firstSegment !== undefined &&
    firstSegment.startPointKey === 'LaunchPoint' &&
    firstSegment.moveModeId !== '' &&
    firstSegment.endPointKey === 'TargetPoint' &&
    firstSegment.earlyNextByDuration &&
    firstSegment.segmentDuration > 0 &&
    !firstSegment.skipHitAndBlockDetection &&
    runtime.moveModeTypes.get(firstSegment.moveModeId) === 0 &&
    secondSegment !== undefined &&
    secondSegment.startPointKey === 'TargetPoint' &&
    secondSegment.moveModeId !== '' &&
    secondSegment.endPointKey === 'TargetPoint' &&
    !secondSegment.earlyNextByDuration &&
    secondSegment.segmentDuration === 0 &&
    !secondSegment.skipHitAndBlockDetection &&
    runtime.moveModeTypes.get(secondSegment.moveModeId) === 0;
  const hasDefaultPointToPointRoute =
    runtime.presetPointKeys.length === 2 &&
    runtime.presetPointKeys[0] === 'LaunchPoint' &&
    runtime.presetPointKeys[1] === 'TargetPoint' &&
    !runtime.useSegmentMove &&
    (runtime.moveSegments.length === 0 ||
      (runtime.moveSegments.length === 1 &&
        segment !== undefined &&
        segment.startPointKey === 'LaunchPoint' &&
        segment.moveModeId === 'Default' &&
        segment.endPointKey === 'TargetPoint' &&
        !segment.earlyNextByDuration &&
        segment.segmentDuration === 0 &&
        !segment.skipHitAndBlockDetection));
  const hasSingleSegmentPointToPointRoute =
    runtime.presetPointKeys.length === 2 &&
    runtime.presetPointKeys[0] === 'LaunchPoint' &&
    runtime.presetPointKeys[1] === 'TargetPoint' &&
    runtime.useSegmentMove &&
    runtime.moveSegments.length === 1 &&
    segment !== undefined &&
    segment.startPointKey === 'LaunchPoint' &&
    segment.moveModeId === 'Default' &&
    segment.endPointKey === 'TargetPoint' &&
    !segment.earlyNextByDuration &&
    segment.segmentDuration === 0 &&
    !segment.skipHitAndBlockDetection;
  // ProjectileComponent.Reach 先把 m_isReached 置位，再以发射时保存的 targetWrapper
  // 直接调用一次 HitTarget。该分支不经过 collider、targetFilter 或
  // allowHitSameTarget；零距离点到点路线只需证明首次 Reach 可达。
  const hitsExactlyOnceOnReach =
    options.allowHitOnReach === true && runtime.hitOnReach && hasDefaultPointToPointRoute;
  const hasSupportedMovementShape =
    finishesOnFirstHit ||
    hitsExactlyOnceOnReach ||
    reachesBeforeSecondCollision ||
    hasDefaultPointToPointRoute ||
    // ProjectileMovementSubComponent 首 Tick 在移动前检查碰撞。固定零距离模型中，
    // 单段起终点路线的唯一木桩此时已在正体积碰撞体内；命中后
    // allowHitSameTarget=false 使剩余移动对 hit-only 战斗结果不可见。
    (remainsInertAfterSingleTargetHit && hasSingleSegmentPointToPointRoute);
  if (
    (!runtime.finishOnReach &&
      !finishesOnFirstHit &&
      !remainsInertAfterSingleTargetHit &&
      !hitsExactlyOnceOnReach) ||
    (runtime.hitOnReach && options.allowHitOnReach !== true) ||
    (runtime.allowHitSameTarget && !reachesBeforeSecondCollision && !hitsExactlyOnceOnReach) ||
    (!maxHitCounts.has(runtime.maxHitCount) &&
      !(options.allowAnyPositiveMaxHitCount === true && runtime.maxHitCount > 0)) ||
    runtime.collisionDetectTiming !== 0 ||
    runtime.hitAndBlockDetectDelayTime !== 0 ||
    runtime.hitAndBlockDetectDelayDistance !== 0 ||
    (runtime.keepMoveOnReach &&
      !finishesOnFirstHit &&
      !remainsInertAfterSingleTargetHit &&
      !hitsExactlyOnceOnReach) ||
    runtime.canTraceTargetAfterReach ||
    (!hitsExactlyOnceOnReach && !runtime.targetFilter.checkAlive) ||
    (!hitsExactlyOnceOnReach &&
      !isSupportedSingleEnemyOrGoodCharacterTargetFilter(runtime.targetFilter)) ||
    (!hitsExactlyOnceOnReach && runtime.targetFilter.filterSlot) ||
    (!hitsExactlyOnceOnReach &&
      runtime.targetFilter.filterGameplayTag &&
      (options.allowGameplayTagFilter !== true ||
        runtime.targetFilter.gameplayTagQuery === null)) ||
    (options.requireCollider === true &&
      (runtime.colliderShape === null || !hasPositiveCollisionVolume(runtime.colliderShape))) ||
    !hasSupportedMovementShape
  ) {
    throw new Error(`${path}: ProjectileData is outside the proven zero-distance first-tick shape`);
  }
}

function isSupportedSingleEnemyOrGoodCharacterTargetFilter(
  filter: ProjectileRuntimeSource['targetFilter'],
): boolean {
  if (filter.factionTarget !== 1) return false;
  if (filter.autoSetTargetFaction) return !filter.filterObjectType;
  return isFixedGoodCharacterTargetFilter(filter);
}

function isFixedGoodCharacterTargetFilter(
  filter: ProjectileRuntimeSource['targetFilter'],
): boolean {
  // FactionType.Good(4) + ObjectType.Character(8): Liino's expanding sound wave
  // invokes its hit callback once for every party operator in the all-range model.
  // Keep the masks exact so a different manual population cannot enter this fold.
  return (
    !filter.autoSetTargetFaction &&
    filter.targetFactionType === 4 &&
    filter.filterObjectType &&
    filter.objectType === 8
  );
}

function hasPositiveCollisionVolume(
  shape: NonNullable<ProjectileRuntimeSource['colliderShape']>,
): boolean {
  if (shape.shapeType === 1) return shape.radius > 0;
  if (shape.shapeType === 2) return shape.extent.every(value => value > 0);
  if (shape.shapeType === 3) {
    const ring = shape.ring ?? null;
    // ProjectileMovementSubComponent.OnLaunch 先从 ShapeData 求值并保存初始
    // inner/outer radius；_FilterRingShape 随后单独做环形距离、高度与扇区过滤。
    // 在 Endaxis 的零距离、全实例范围查找模型下，只有从中心开始的
    // 正体积整圆环可以无歧义折叠为首 Tick 命中；空心环或不完整扇区仍拒绝。
    return (
      ring !== null &&
      shape.radius > 0 &&
      ring.initialInnerRadius === 0 &&
      ring.initialOuterRadius > 0 &&
      ring.initialOuterRadius > ring.initialInnerRadius &&
      ring.height > 0 &&
      (!ring.isSector || ring.sectorAngle >= 360)
    );
  }
  return false;
}

function assertSupportedFirstTickReachShape(
  runtime: ProjectileRuntimeSource,
  path: string,
  allowHitOnReachWithoutRoute = false,
): void {
  const hasDefaultPointToPointRoute =
    runtime.presetPointKeys.includes('LaunchPoint') &&
    runtime.presetPointKeys.includes('TargetPoint') &&
    !runtime.useSegmentMove &&
    // 原生关闭分段时只取默认模式和发射目标；额外预设点及残留分段不参与路线。
    runtime.moveModeTypes.get('Default') === 0;
  if (
    (runtime.hitOnReach && !allowHitOnReachWithoutRoute) ||
    (runtime.keepMoveOnReach && !runtime.hitOnReach) ||
    runtime.canTraceTargetAfterReach ||
    !hasNoModeledBlockingSurfaces(runtime) ||
    !hasDefaultPointToPointRoute
  ) {
    throw new Error(`${path}: ProjectileData is outside the proven zero-distance reach shape`);
  }
}

/** 场景表面不在零空间战斗模型中；不因此创建阻挡事件或阻挡回调。 */
function assertSupportedFirstTickBlockShape(runtime: ProjectileRuntimeSource, path: string): void {
  const segment = runtime.moveSegments[0];
  if (
    !runtime.finishOnBlock ||
    runtime.hitOnReach ||
    runtime.collisionDetectTiming !== 0 ||
    runtime.hitAndBlockDetectDelayTime !== 0 ||
    runtime.hitAndBlockDetectDelayDistance !== 0 ||
    runtime.colliderShape?.shapeType !== 1 ||
    !(runtime.colliderShape.radius > 0) ||
    runtime.blockLayerDef?.value !== 1 ||
    runtime.blockLayerDef.name !== 'WallAndGround' ||
    runtime.presetPointKeys.length !== 2 ||
    runtime.presetPointKeys[0] !== 'LaunchPoint' ||
    runtime.presetPointKeys[1] !== 'TargetPoint' ||
    runtime.useSegmentMove ||
    (runtime.moveSegments.length !== 0 &&
      (runtime.moveSegments.length !== 1 ||
        segment === undefined ||
        segment.startPointKey !== 'LaunchPoint' ||
        segment.moveModeId !== 'Default' ||
        segment.endPointKey !== 'TargetPoint' ||
        segment.earlyNextByDuration ||
        segment.segmentDuration !== 0 ||
        segment.skipHitAndBlockDetection))
  )
    throw new Error(`${path}: ProjectileData is outside the proven zero-distance block shape`);
}

function hasNoModeledBlockingSurfaces(runtime: ProjectileRuntimeSource): boolean {
  if (runtime.blockLayerDef?.value === 0 || runtime.blockLayerDef?.value === 1) return true;
  // 当前游戏 TagManager：Default=0、Walkable=6、Climbable=7、Terrain=20。
  // 角色、敌人等其他层不属于场景表面，不能一并忽略。
  const sceneSurfaceMask = (1 << 0) | (1 << 6) | (1 << 7) | (1 << 20);
  return (
    runtime.blockLayerDef?.value === -1 &&
    runtime.blockLayerMask !== undefined &&
    (runtime.blockLayerMask & ~sceneSurfaceMask) === 0
  );
}

function isPlainZeroSpaceFixedPoint(
  target: ProjectileLaunchActionSource['target'],
  context: CombatActionProjectionContextSource,
  sourcePath?: string,
): boolean {
  const ownerIsCaster =
    (target.targetSource === 'Owner' && context.actionOwnerTarget === 'caster') ||
    (target.targetSource === 'Source' && context.actionSourceTarget === 'caster');
  // MainCharacter 分支直接取得角色句柄；残留组名和 Selector 配置不参与该分支。
  if (target.targetSource === 'MainCharacter') return true;
  const directTargetIsProvenZeroSpace =
    target.targetSource === 'Target' &&
    (context.actionTargetTarget === 'enemy' ||
      context.actionTargetTarget === 'caster' ||
      context.actionTargetTarget === 'currentOperator' ||
      context.actionTargetTarget === 'currentAbilityEntity');
  const contextTargetIsProvenZeroSpace =
    target.targetSource === 'Context' &&
    target.targetGroupKey !== '' &&
    (context.staticZeroSpaceTargetGroupKeys?.has(target.targetGroupKey) === true ||
      context.dynamicSpatialPointCounts?.has(target.targetGroupKey) === true ||
      (sourcePath !== undefined &&
        context.provenZeroSpaceProjectilePaths?.has(sourcePath) === true));
  const instantPointAnchoredToCaster =
    target.targetSource === 'InstantSearch' &&
    context.actionSourceTarget === 'caster' &&
    (target.selectorOwner === 'ActionSource' ||
      (target.selectorOwner === 'ActionOwner' && context.actionOwnerTarget === 'caster')) &&
    target.ownerContextKey === '' &&
    target.centerType === 'ActionSource' &&
    target.centerContextKey === '' &&
    // 贴地只改变坐标；固定木桩模型不区分位置高度，不改变固定点的存在性。
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    !target.enableAdvancedDirection;
  const fixedPoint = target.finderFixedPoint;
  const controlledOperatorSlotPoint =
    target.targetSource === 'InstantSearch' &&
    context.actionOwnerTarget === 'caster' &&
    target.selectorOwner === 'ActionOwner' &&
    target.ownerContextKey === '' &&
    target.centerType === 'ActionSource' &&
    target.centerContextKey === '' &&
    !target.centerToGround &&
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    !target.enableAdvancedDirection &&
    target.finderType === 'CharacterTeamFinder' &&
    target.validatorTypes.length === 1 &&
    target.validatorTypes[0] === 'MainCharacterValidator' &&
    target.postProcessorTypes.length === 1 &&
    target.postProcessorTypes[0] === 'ConvertToSlot' &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.validatorTagQueries.length === 0;
  const hasNoSelectorFilters =
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.validatorTagQueries.length === 0;
  if (ownerIsCaster) {
    // TargetResolution 的 Owner 分支直接取得动作 owner；TargetSettings 中随结构
    // 序列化的 finder/validator 不参与该分支。Endaxis 把 Owner 锚点及其偏移
    // 归入统一零空间，不能要求它伪装成 InstantSearch.FixedPointFinder。
    return true;
  }
  if (directTargetIsProvenZeroSpace) {
    // Target 直接沿用技能输入目标；只有 Context 才读取 targetGroupKey。
    // 其身份已经由外层施法上下文证明，未读取的组名和 selector 不参与解析。
    return true;
  }
  if (contextTargetIsProvenZeroSpace) {
    // TargetSource.Context 只按 targetGroupKey 读取已保存句柄，
    // TargetSettings 内同时序列化的 finder/validator/post-processor 字段不进入该分支。
    // 零空间证明来自目标组生产者，不能让这些未读取的残留字段反向否定它。
    return true;
  }
  if (controlledOperatorSlotPoint) {
    // CharacterTeamFinder + MainCharacterValidator 唯一选出当前主控干员，ConvertToSlot
    // 只把该角色转换为其编队槽位空间点。Endaxis 明确规定所有实例/空间点距离为 0，
    // 因而从施法者发射的点到点投射物在首个移动 Tick 到达；这里不把 reach 伪造成 hit。
    return true;
  }
  return (
    (ownerIsCaster ||
      instantPointAnchoredToCaster ||
      directTargetIsProvenZeroSpace ||
      contextTargetIsProvenZeroSpace) &&
    (contextTargetIsProvenZeroSpace ||
      instantPointAnchoredToCaster ||
      target.targetGroupKey === '') &&
    target.finderType === 'FixedPointFinder' &&
    fixedPoint !== undefined &&
    !fixedPoint.snapToNavmesh &&
    fixedPoint.sampleRadius.blackboardKey === null &&
    hasNoSelectorFilters
  );
}
