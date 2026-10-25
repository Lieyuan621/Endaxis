import type {
  ProjectileDefinition,
  ProjectileHitDefinition,
} from '../../../../../packages/game-data-contract/src/projectiles.ts';
import { omitsProjectileEnemyCollision } from './projectileSimulationScope.ts';
import {
  projectProjectileFlightSource,
  projectProjectileFlightTemplateSource,
} from './projectileFlightProjection.ts';
import {
  isSupportedSingleEnemyOrGoodCharacterTargetFilter,
  isFixedGoodCharacterTargetFilter,
  isEmptyProjectileCollisionPopulation,
} from './projectileCollisionProjection.ts';
import type { ActionTargetQuery } from '../../../../../packages/game-data-contract/src/conditions.ts';
import type { SkillCastResourceDefinition } from '../../../../../packages/game-data-contract/src/index.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { DeclaredBlackboardValueSource } from '../../source/blackboard.ts';
import { collectNativeActionNodes } from '../../source/controlFlow.ts';
import type { ProjectileRuntimeSource } from '../../source/projectileRuntime.ts';
import { projectileMovementBlackboardReads } from './projectileMovementDependencies.ts';
import type { ProjectileLaunchActionSource } from '../../source/referenceActions.ts';
import type { SkillActionGraphSource } from '../../source/skillActionGraph.ts';
import {
  createActionGraphBuilder,
  type ActionGraphBuilder,
} from '../actions/actionGraphBuilder.ts';
import type {
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from '../actions/combatActionProjectionTypes.ts';
import { compileCombatActionSequenceSource } from '../buffs/buffRuntimeProjection.ts';
import type {
  CombatActionProjectionContextSource,
  CombatActionProjectionExtensionsSource,
} from '../combatProjectionCommon.ts';
import { isStaticSingleEnemyTargetGroup, projectGameplayTags } from '../combatProjectionCommon.ts';
import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
import {
  collectMaterializedTargetGroups,
  collectPresentationOnlyTargetGroups,
} from '../skills/skillPresentationTargets.ts';
import {
  compileProjectileBlackboardSource,
  numericInitialValues,
  omitDeadSingleEnemyBounceBookkeeping,
} from './projectileBlackboard.ts';

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

export interface ProjectileProjectionCatalogSource {
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

type ProjectileLaunchHitParameters = Omit<ProjectileHitDefinition, 'target'> & {
  target?: 'controlledOperator' | 'allOperators' | 'currentTarget';
};

/**
 * 把版本化 ProjectileData、实体模板与回调 SkillData 目录接成公共动作扩展。
 * 移动参数与回调共用同一发射定义；未知端点和形状在来源路径上报错。
 */
export function createProjectileProjectionExtensionSource(input: {
  readonly catalog: ProjectileProjectionCatalogSource;
  readonly registerProjectile?: (id: string, definition: ProjectileDefinition) => void;
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
    // 只开放回调输入不依赖飞行目标的 launch-only 路线。目标集合可能为空或有多个，
    // 必须交给运行时逐发射点×目标枚举，不能当成静态单点消掉。
    const enumeratedEntityPoints =
      enabled.length === 1 &&
      enabled[0]!.event === 'launch' &&
      launch.emitPosition.targetSource === 'Context' &&
      launch.target.targetSource === 'Context' &&
      projectionContext.staticAbilityEntityTargetGroupKeys?.has(
        launch.emitPosition.targetGroupKey,
      ) === true &&
      projectionContext.staticAbilityEntityTargetGroupKeys?.has(launch.target.targetGroupKey) ===
        true;
    const callback = (event: 'launch' | 'block' | 'finish' | 'hit' | 'reach') => {
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
    const onlyHitTargets = assertSupportedLaunchTargetControls(
      launch,
      sourcePath,
      projectionContext,
      true,
    );
    if (!['Source', 'Owner'].includes(launch.projectileSource.targetSource))
      throw new Error(`${sourcePath}: projectile source must resolve to Source or Owner`);
    if (!hasNoModeledBlockingSurfaces(runtime))
      throw new Error(`${sourcePath}: projectile environment blocking is not modeled`);
    // 独立落地路线在落点触发 Block，超时仍保留 Finish 兜底。
    const landsAtTarget =
      enabled.some(route => route.event === 'block') &&
      enabled.every(
        route => route.event === 'launch' || route.event === 'block' || route.event === 'finish',
      );

    const collisionCanHit = !isEmptyProjectileCollisionPopulation(runtime.targetFilter);
    const routes = enabled.flatMap(route =>
      (route.event === 'block' && !landsAtTarget) ||
      (route.event === 'hit' && !runtime.hitOnReach && !collisionCanHit)
        ? []
        : [{ event: route.event, skillId: route.skillId }],
    );
    const hasHit = routes.some(route => route.event === 'hit');
    const tracksHits =
      hasHit ||
      (runtime.maxHitCount > 0 &&
        (runtime.hitOnReach ||
          (collisionCanHit &&
            runtime.colliderShape !== null &&
            runtime.colliderShape.shapeType !== 0)));
    if (runtime.hitAndBlockDetectDelayTime !== 0)
      throw new Error(`${sourcePath}: projectile collision delay requires lifecycle projection`);
    if (landsAtTarget && !runtime.finishOnBlock)
      throw new Error(
        `${sourcePath}: non-finishing projectile landing requires lifecycle projection`,
      );
    const hitsParty =
      tracksHits && !runtime.hitOnReach && isFixedGoodCharacterTargetFilter(runtime.targetFilter);
    if (hitsParty && runtime.allowHitSameTarget)
      throw new Error(`${sourcePath}: repeated party hits require per-member interval state`);
    if (hitsParty)
      callbackContext = {
        ...callbackContext,
        actionTargetTarget: 'actionInputTarget',
        actionInputIsOperator: true,
      };
    if (runtime.collisionDetectTiming !== 0 || runtime.canTraceTargetAfterReach)
      throw new Error(
        `${sourcePath}: projectile collision timing or post-reach tracing requires projection`,
      );
    if (
      tracksHits &&
      !runtime.hitOnReach &&
      !isSupportedSingleEnemyOrGoodCharacterTargetFilter(runtime.targetFilter)
    )
      throw new Error(`${sourcePath}: unsupported projectile collision population`);
    if (!Number.isFinite(runtime.finishDuration) || runtime.finishDuration <= 0)
      throw new Error(`${sourcePath}: projectile duration must be positive and finite`);
    const flight = {
      ...projectProjectileFlightSource(runtime, launch, projectionContext, sourcePath),
      ...(landsAtTarget ? { landingAtTarget: true } : {}),
    };
    const hitTagFilter = !runtime.hitOnReach
      ? projectProjectileHitTagFilter(runtime, callbackContext, sourcePath)
      : undefined;
    const callbacks = routes.map(route => {
      const graph = callback(route.event);
      const compiled = compileProjectileCallbackSkillSource({
        graph,
        context:
          route.event === 'launch'
            ? {
                ...callbackContext,
                actionTargetTarget: 'currentAbilityEntity',
                actionInputIsOperator: false,
              }
            : callbackContext,
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
          ...(graph.normalSkillSubType === 'AdditionalNormalSkill'
            ? { normalSkillSubType: 'additionalNormalSkill' as const }
            : {}),
          naturalDurationFrames: compiled.naturalDurationFrames,
          castResource: compiled.castResource,
          blackboard: numericInitialValues(compiled.declaredBlackboard, sourcePath),
          scheduledSequences: [...compiled.timelineActions],
        },
      };
    });
    const movementBlackboardReads = projectileMovementBlackboardReads(runtime);
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
          movementBlackboardReads,
        ),
      }));
    });
    const nativeHit: ProjectileHitDefinition | undefined = omitsProjectileEnemyCollision(
      launch.projectileId,
      runtime,
    )
      ? undefined
      : {
          ...(!runtime.hitOnReach && isFixedGoodCharacterTargetFilter(runtime.targetFilter)
            ? { target: 'allOperators' as const }
            : {}),
          ...(runtime.hitOnReach ? { onReach: true } : {}),
          finishOnHit: runtime.maxHitCount === 1,
          maxHitCount: runtime.maxHitCount,
          ...(runtime.allowHitSameTarget && !runtime.hitOnReach
            ? { repeatIntervalSeconds: runtime.hitIntervalPerTarget }
            : {}),
          ...(hitTagFilter === undefined ? {} : { hitTagFilter, retryRejectedHit: true }),
        };
    const hit: ProjectileLaunchHitParameters | undefined =
      tracksHits && nativeHit
        ? {
            ...nativeHit,
            ...(runtime.hitOnReach && launch.target.targetSource === 'MainCharacter'
              ? { target: 'controlledOperator' as const }
              : {}),
            ...(reachesCurrentOperator ? { target: 'currentTarget' as const } : {}),
          }
        : undefined;
    const blackboard = compileProjectileBlackboardSource({
      movementBlackboardReads,
      sourcePath,
      launch,
      template,
      invocations: callbacks.map(({ route, compiled, skill }) => ({
        program: compiled.program,
        event: route.event,
        skillId: compiled.skillId,
        declaredBlackboard: compiled.declaredBlackboard,
        sequence: compiled.program.sequence(
          skill.scheduledSequences.flatMap(timeline => compiled.program.actions(timeline.sequence)),
        ),
      })),
      allowMissingEntityBlackboardEvidence: true,
      blockEndsFlight: landsAtTarget,
    });
    input.registerProjectile?.(launch.projectileId, {
      flight: projectProjectileFlightTemplateSource(runtime, sourcePath),
      blackboard: blackboard.entityInitialValues,
      ...(nativeHit === undefined ? {} : { hit: nativeHit }),
    });
    return [
      {
        kind: 'launchProjectile',
        parameters: {
          ...blackboard,
          projectileId: launch.projectileId,
          flight,
          ...(enumeratedEntityPoints
            ? {
                emitters: {
                  kind: 'context' as const,
                  contextKey: launch.emitPosition.targetGroupKey,
                },
                targets: { kind: 'context' as const, contextKey: launch.target.targetGroupKey },
              }
            : {}),
          ...(onlyHitTargets === undefined ? {} : { onlyHitTargets }),
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
    ];
  };
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
  const presentationOnlyTargetGroupKeys = collectPresentationOnlyTargetGroups(graph);
  const callbackContext: CombatActionProjectionContextSource = {
    ...context,
    graph: program,
    presentationOnlyTargetGroupKeys,
    materializedTargetGroupKeys: collectMaterializedTargetGroups(
      graph,
      presentationOnlyTargetGroupKeys,
    ),
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
      {
        ...callbackContext,
        timelineRange: { startFrame: timeline.startFrame, endFrame: timeline.endFrame },
      },
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
  retainDynamicFilter = false,
): ActionTargetQuery | undefined {
  if (launch.alsoLaunchToHittableTarget !== false) {
    throw new Error(
      `${path}.alsoLaunchToHittableTarget: additional projectile launches are not modeled`,
    );
  }
  if (
    launch.targetFilterMode === 'OnlyHit' &&
    launch.targetFilterSettings !== null &&
    (targetReferenceSelectsUniqueEnemy(launch.targetFilterSettings, context) ||
      context?.provenOnlyHitProjectilePaths?.has(path) === true)
  ) {
    // 唯一可能碰撞的敌人属于白名单，过滤前后可见 hit 集合相同。
  } else if (
    retainDynamicFilter &&
    launch.targetFilterMode === 'OnlyHit' &&
    launch.targetFilterSettings !== null &&
    context !== undefined
  ) {
    return projectActionTargetQuery(
      launch.targetFilterSettings,
      context,
      `${path}.targetFilterSettings`,
    );
  } else if (launch.targetFilterMode !== 'None') {
    throw new Error(
      `${path}.targetFilterMode: projectile target filter ${launch.targetFilterMode} is not modeled`,
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
