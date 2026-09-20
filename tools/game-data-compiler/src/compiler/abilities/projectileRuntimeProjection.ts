import type { DeclaredBlackboardValueSource } from '../../source/blackboard.ts';
import { mergeIndependentActionSequencesSource } from '../actions/independentActionSequences.ts';
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
import type {
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from '../actions/combatActionProjectionTypes.ts';
import {
  compileSynchronousProjectileCallbackScopesSource,
  numericInitialValues,
  type CompiledActionBlackboardScopeSource,
  type ProjectileCallbackInvocationSource,
} from './projectileCallbackScopes.ts';
import { isStaticSingleEnemyTargetGroup } from '../combatProjectionCommon.ts';
import {
  collectPresentationOnlyBlackboardKeys,
  isPresentationOnlyActionSequence,
} from '../skills/skillPresentationTargets.ts';
import type { SkillCastResourceDefinition } from '../../../../../packages/game-data-contract/src/index.ts';

/** A callback skill before any zero-distance/immediate execution optimization. */
export interface ProjectileCallbackSkillSource {
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

export interface ZeroDistanceProjectileCallbackSource {
  readonly skillId: string;
  readonly declaredBlackboard: readonly DeclaredBlackboardValueSource[];
  readonly sequence: CompiledBuffSequenceSource;
  readonly delayedSequences: readonly {
    readonly startFrame: number;
    readonly endFrame: number;
    readonly sequence: CompiledBuffSequenceSource;
  }[];
  readonly delayedSequencesNeedFreshScope?: boolean;
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

/**
 * 把版本化 ProjectileData、实体模板与回调 SkillData 目录接成公共动作扩展。
 * 按结束条件和固定零空间模型选择已支持的生命周期；未知形状在来源路径上报错。
 */
export function createZeroDistanceProjectileProjectionExtensionSource(input: {
  readonly catalog: ZeroDistanceProjectileProjectionCatalogSource;
  readonly callbackContext: CombatActionProjectionContextSource;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly callbackExtensions?: CombatActionProjectionExtensionsSource;
}): NonNullable<CombatActionProjectionExtensionsSource['compileProjectileLaunch']> {
  return (launch, sourcePath, projectionContext) => {
    const callbackContext = {
      ...input.callbackContext,
      // ProjectileComponent._CastSkill 在投射物自身 AbilitySystem 上 TryCast；
      // 因此回调动作 Owner 是投射物实体，Source/SkillCastInfo 才沿用来源施法者。
      actionOwnerTarget: 'currentAbilityEntity' as const,
      // ProjectileComponent._CastSkill copies its stored m_skillCastInfo into the callback
      // skill cast input. Conditions inside that callback therefore filter by this source cast.
      actionEnvironmentSkillCastInfoIsSourceCast: true,
      ...(projectionContext.abilityEntityQueries === undefined
        ? {}
        : { abilityEntityQueries: projectionContext.abilityEntityQueries }),
      ...(projectionContext.scheduleRelativeProjectileCallback === undefined
        ? {}
        : {
            scheduleRelativeProjectileCallback:
              projectionContext.scheduleRelativeProjectileCallback,
          }),
    };
    const runtime = input.catalog.runtimes.get(launch.projectileId);
    if (!runtime) throw new Error(`${sourcePath}: missing ProjectileData ${launch.projectileId}`);
    const template = input.catalog.templates.get(launch.projectileId) ?? null;
    const enabled = launch.callbacks.filter(callback => callback.enabled);
    // 关闭槽位中的 skillId 不参与调用，但发射/reset 仍能被 SkillAffix 观察。
    // 未投影对象寿命前必须报告缺口，不能把“没有回调程序”当作“没有发射”。
    if (enabled.length === 0) {
      assertSupportedLaunchTargetControls(launch, sourcePath, projectionContext);
      if (
        !launch.syncTimeScale &&
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
        runtime.blockLayerDef?.value === 0 &&
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
            kind: 'launchProjectileLifetime',
            parameters: {
              finish: {
                reachAfterTicks: runtime.moveSegments.length,
                maxDurationSeconds: runtime.finishDuration,
              },
            },
          },
        ];
      }
      if (
        launch.syncTimeScale ||
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
      return [{ kind: 'launchProjectileLifetime', parameters: { finish: 'firstTickReach' } }];
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
        launch.syncTimeScale ||
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
      assertSupportedFirstTickReachShape(runtime, sourcePath, true, runtime.finishOnBlock === true);
      return [
        {
          kind: 'launchProjectileLifetime',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: resolveProjectileRecycleDelaySource(
              launch,
              input.catalog.callbackGraphs,
              sourcePath,
            ),
          },
        },
      ];
    }
    assertSupportedLaunchTargetControls(launch, sourcePath, projectionContext);
    if (enabled.length === 1 && enabled[0]!.event === 'block') {
      return [
        compileZeroDistanceFirstTickBlockProjectileSource({
          sourcePath,
          launch,
          runtime,
          template,
          blockGraph: callback('block'),
          callbackContext,
          visualOnlyIds: input.visualOnlyIds,
          callbackExtensions: input.callbackExtensions,
        }),
      ];
    }
    if (enabled.length === 1 && enabled[0]!.event === 'hit') {
      const hitsFriendlyCharacters = isFixedGoodCharacterTargetFilter(runtime.targetFilter);
      const hit = compileZeroDistanceFirstTickHitProjectileSource({
        sourcePath,
        launch,
        runtime,
        template,
        hitGraph: callback('hit'),
        callbackContext: hitsFriendlyCharacters
          ? { ...callbackContext, actionTargetTarget: 'currentOperator' }
          : callbackContext,
        projectionContext,
        visualOnlyIds: input.visualOnlyIds,
        callbackExtensions: input.callbackExtensions,
        allowGameplayTagFilter: true,
      });
      const filtered = wrapProjectileHitWithGameplayTagFilter(
        hit,
        runtime,
        callbackContext,
        sourcePath,
      );
      if (!hitsFriendlyCharacters) return [filtered];
      const contextKey = `${sourcePath}:projectile-good-characters`;
      return [
        {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: contextKey, selection: { kind: 'allOperators' } },
        },
        {
          kind: 'forEachContextTarget',
          parameters: { contextKey },
          body: { steps: [filtered] },
        },
      ];
    }
    if (enabled.length === 1 && enabled[0]!.event === 'reach') {
      return [
        compileZeroDistanceFirstTickReachProjectileSource({
          sourcePath,
          launch,
          runtime,
          template,
          reachGraph: callback('reach'),
          callbackContext,
          projectionContext,
          visualOnlyIds: input.visualOnlyIds,
          callbackExtensions: input.callbackExtensions,
        }),
      ];
    }
    if (
      enabled.length === 2 &&
      enabled.some(item => item.event === 'block') &&
      enabled.some(item => item.event === 'finish') &&
      enabled[0]!.skillId === enabled[1]!.skillId &&
      runtime.blockLayerDef?.value === 1 &&
      runtime.blockLayerDef.name === 'WallAndGround'
    ) {
      // 1.4.4 机器码按 blockLayerDef 数值解释；导出 name=Nothing 不是权威标签。
      // 原生可以因墙/地提前结束，但 Endaxis 固定木桩场景没有环境碰撞几何，
      // 因而只保留仍必然到达的 duration 上界回调。这是产品空间模型，不是原生不可达证明。
      if (launch.syncTimeScale) {
        throw new Error(
          `${sourcePath}: duration-finish projectile with synced source time is unsupported`,
        );
      }
      if (
        !Number.isFinite(runtime.finishDuration) ||
        runtime.finishDuration <= 0 ||
        runtime.finishDistance.blackboardKey !== null ||
        !Number.isFinite(runtime.finishDistance.value) ||
        runtime.finishDistance.value < 0 ||
        runtime.finishOnReach ||
        runtime.hitOnReach
      ) {
        throw new Error(`${sourcePath}: unsupported duration-finish ProjectileData shape`);
      }
      const finish = compileProjectileCallbackSkillSource({
        graph: callback('finish'),
        castResource: input.catalog.callbackCastResources?.get(callback('finish').skillId),
        context: callbackContext,
        visualOnlyIds: input.visualOnlyIds,
        extensions: input.callbackExtensions,
      });
      if (finish.castResource === undefined)
        throw new Error(`${sourcePath}: missing cast resource metadata for ${finish.skillId}`);
      const nativeSkillType = runtime.activeSkills?.initialNativeSkillTypeById[finish.skillId];
      if (nativeSkillType === undefined)
        throw new Error(
          `${sourcePath}: projectile callback ${finish.skillId} requires its owning AbilitySystem skill registration`,
        );
      const callbackScope = compileSynchronousProjectileCallbackScopesSource({
        sourcePath,
        launch,
        template,
        invocations: [
          {
            event: 'finish',
            ...finish,
            // Only used to discover entity-board dependencies; execution retains intervals below.
            sequence: {
              steps: finish.timelineActions.flatMap(timeline => timeline.sequence.steps),
            },
          },
        ],
        allowMissingEntityBlackboardEvidence: true,
      });
      return [
        {
          ...callbackScope,
          // 原生 _Launch 先求值 assignPairs，再创建投射物；不能到结束回调时
          // 才读取发射者 EntityBB。回调技能自己的 direct scope 留在延迟 body 内。
          body: {
            steps: [
              {
                kind: 'scheduleProjectileFinishCallback',
                parameters: {
                  delaySeconds: runtime.finishDuration,
                  recycleDelaySeconds: resolveProjectileRecycleDelaySource(
                    launch,
                    input.catalog.callbackGraphs,
                    sourcePath,
                  ),
                },
                callback: {
                  skillId: finish.skillId,
                  nativeSkillType,
                  naturalDurationFrames: finish.naturalDurationFrames,
                  castResource: finish.castResource,
                  blackboard: numericInitialValues(finish.declaredBlackboard, sourcePath),
                  scheduledSequences: finish.timelineActions,
                },
              },
            ],
          },
        },
      ];
    }
    if (
      enabled.length === 2 &&
      enabled.some(item => item.event === 'block') &&
      enabled.some(item => item.event === 'hit') &&
      isPresentationOnlyProjectileCallback(callback('block'))
    ) {
      // 原生首 Tick 先做敌人 collision/hit、随后才移动并检测 block。
      // 这里不猜测墙体是否存在；只证明 block 子技能即使可达也完全是表现，而 hit
      // 仍由首碰撞形状严格验证。故产品投影只执行影响伤害的 hit 回调。
      const hit = compileZeroDistanceFirstTickHitProjectileSource({
        sourcePath,
        launch,
        runtime,
        template,
        hitGraph: callback('hit'),
        callbackContext,
        projectionContext,
        visualOnlyIds: input.visualOnlyIds,
        callbackExtensions: input.callbackExtensions,
        allowGameplayTagFilter: true,
      });
      return [wrapProjectileHitWithGameplayTagFilter(hit, runtime, callbackContext, sourcePath)];
    }
    if (
      enabled.length === 2 &&
      enabled.some(item => item.event === 'block') &&
      enabled.some(item => item.event === 'hit') &&
      runtime.blockLayerDef?.value === 1 &&
      runtime.blockLayerDef.name === 'WallAndGround'
    ) {
      // 固定木桩场景不建模墙体或地面碰撞几何；block 路由在产品模型中不可达。
      // 敌人仍与首 Tick 碰撞体共点，因此独立的 hit 回调按公共首碰撞门禁严格投影。
      return [
        compileZeroDistanceFirstTickHitProjectileSource({
          sourcePath,
          launch,
          runtime,
          template,
          hitGraph: callback('hit'),
          callbackContext,
          projectionContext,
          visualOnlyIds: input.visualOnlyIds,
          callbackExtensions: input.callbackExtensions,
          allowGameplayTagFilter: true,
        }),
      ];
    }
    if (
      enabled.length === 2 &&
      enabled.some(item => item.event === 'block') &&
      enabled.some(item => item.event === 'hit') &&
      enabled[0]!.skillId === enabled[1]!.skillId
    ) {
      // 原生首 Tick 顺序为 collision(hit) → move/block；零距离唯一木桩
      // 先命中并以 maxHitCount=1 结束该投射物，因此同路由的 block 是未到达备选。
      return [
        compileZeroDistanceFirstTickHitProjectileSource({
          sourcePath,
          launch,
          runtime,
          template,
          hitGraph: callback('hit'),
          callbackContext,
          projectionContext,
          visualOnlyIds: input.visualOnlyIds,
          callbackExtensions: input.callbackExtensions,
        }),
      ];
    }
    if (
      enabled.length === 2 &&
      enabled.some(item => item.event === 'block') &&
      enabled.some(item => item.event === 'hit') &&
      runtime.blockLayerDef?.value === 0 &&
      runtime.blockLayerDef.name === 'Nothing'
    ) {
      // ProjectileMovementSubComponent._CalculateTouchingLayer 已证明原值 0 会把
      // block layer mask 清零；因此序列化的 block 路由不可达。不同 SkillData
      // 也不能迫使它执行，只保留唯一木桩首帧实际可达的 hit 回调。
      return [
        compileZeroDistanceFirstTickHitProjectileSource({
          sourcePath,
          launch,
          runtime,
          template,
          hitGraph: callback('hit'),
          callbackContext,
          projectionContext,
          visualOnlyIds: input.visualOnlyIds,
          callbackExtensions: input.callbackExtensions,
        }),
      ];
    }
    const unsupported = enabled.filter(item => item.event !== 'hit' && item.event !== 'reach');
    if (unsupported.length > 0 || enabled.length !== 2)
      throw new Error(
        `${sourcePath}: unsupported projectile callback set ${enabled.map(item => item.event).join(',')}`,
      );
    return [
      compileZeroDistanceProjectileLaunchFromSources({
        sourcePath,
        launch,
        runtime,
        template,
        hitGraph: callback('hit'),
        reachGraph: callback('reach'),
        callbackContext,
        visualOnlyIds: input.visualOnlyIds,
        callbackExtensions: input.callbackExtensions,
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

/**
 * 目标点已经由固定空间点证明与发射点同处 Endaxis 零空间时，首个移动 Tick 必然触发 reach。
 * 该路径不伪造碰撞命中，也不读取只服务 hit/block 的碰撞体与目标过滤字段。
 */
export function compileZeroDistanceFirstTickReachProjectileSource(input: {
  readonly sourcePath: string;
  readonly launch: ProjectileLaunchActionSource;
  readonly runtime: ProjectileRuntimeSource;
  readonly template: {
    readonly projectileId: string;
    readonly entityBlackboard: readonly DeclaredBlackboardValueSource[];
  } | null;
  readonly reachGraph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  readonly callbackContext: CombatActionProjectionContextSource;
  readonly projectionContext: CombatActionProjectionContextSource;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly callbackExtensions?: CombatActionProjectionExtensionsSource;
}): CompiledActionBlackboardScopeSource {
  const { sourcePath, launch, runtime, template } = input;
  assertSupportedLaunchTargetControls(launch, sourcePath, input.projectionContext);
  if (runtime.projectileId !== launch.projectileId)
    throw new Error(`${sourcePath}: ProjectileData identity mismatch`);
  if (!isPlainZeroSpaceFixedPoint(launch.target, input.projectionContext, sourcePath))
    throw new Error(
      `${sourcePath}: projectile reach target is not a proven zero-space point ` +
        JSON.stringify({
          targetSource: launch.target.targetSource,
          targetGroupKey: launch.target.targetGroupKey,
          dynamicSpatialPointKeys: [
            ...(input.projectionContext.dynamicSpatialPointCounts?.keys() ?? []),
          ],
        }),
    );
  assertSupportedFirstTickReachShape(runtime, sourcePath, true);
  const reach = compileImmediateProjectileCallbackSkillSource({
    graph: input.reachGraph,
    context: input.callbackContext,
    visualOnlyIds: input.visualOnlyIds,
    extensions: input.callbackExtensions,
  });
  scheduleDelayedProjectileCallbackSource(reach, input.callbackContext, sourcePath, launch);
  return compileSynchronousProjectileCallbackScopesSource({
    sourcePath,
    launch,
    template,
    invocations: [{ event: 'reach', ...reach }],
    allowMissingEntityBlackboardEvidence: true,
  });
}

/** 首帧必然碰撞但没有 reach 路由的投射物；只执行原生启用的 hit 回调。 */
export function compileZeroDistanceFirstTickHitProjectileSource(input: {
  readonly sourcePath: string;
  readonly launch: ProjectileLaunchActionSource;
  readonly runtime: ProjectileRuntimeSource;
  readonly template: {
    readonly projectileId: string;
    readonly entityBlackboard: readonly DeclaredBlackboardValueSource[];
  } | null;
  readonly hitGraph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  readonly callbackContext: CombatActionProjectionContextSource;
  readonly projectionContext?: CombatActionProjectionContextSource;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly callbackExtensions?: CombatActionProjectionExtensionsSource;
  /** 仅供已经把过滤结果保留为显式条件的调用方启用。 */
  readonly allowGameplayTagFilter?: boolean;
}): CompiledActionBlackboardScopeSource {
  const { sourcePath, launch, runtime, template } = input;
  assertSupportedLaunchTargetControls(
    launch,
    sourcePath,
    input.projectionContext ?? input.callbackContext,
  );
  if (runtime.projectileId !== launch.projectileId)
    throw new Error(`${sourcePath}: ProjectileData identity mismatch`);
  if (
    runtime.hitOnReach &&
    !isPlainZeroSpaceFixedPoint(
      launch.target,
      input.projectionContext ?? input.callbackContext,
      sourcePath,
    )
  ) {
    throw new Error(`${sourcePath}: hitOnReach target is not a proven zero-space point`);
  }
  assertSupportedFirstTickShape(runtime, sourcePath, {
    // 原生 allowHitSameTarget=false 使同一目标在整枚投射物
    // 生命周期内最多成功命中一次。因此唯一木桩下，-1 与首击回收的 1
    // 对 hit-only 路由都只产生一次战斗可见回调。
    maxHitCounts: new Set([-1, 1]),
    allowAnyPositiveMaxHitCount: true,
    allowGameplayTagFilter: input.allowGameplayTagFilter,
    requireCollider: !runtime.hitOnReach,
    allowHitOnReach: true,
    allowFinishByFirstHitCount: true,
    // hit-only 路由没有后续战斗回调；allowHitSameTarget=false 已由
    // 原生命中过滤实现为整枚投射物的每目标一次过滤，因此实体在
    // 首次命中后继续存活不会对唯一木桩产生第二次可见结果。
    allowPersistentSingleTargetHit: true,
    // 两段直线都在零空间同点时，原生首 tick 只在 collision 后 advance；
    // 第二 tick 先 Reach 并因 finishOnReach 结束，早于普通 collision。
    allowTwoSegmentReachBeforeRepeatHit: true,
  });
  const hit = compileImmediateProjectileCallbackSkillSource({
    graph: input.hitGraph,
    context: input.callbackContext,
    visualOnlyIds: input.visualOnlyIds,
    extensions: input.callbackExtensions,
    allowIndependentDelayedBlackboardReads: runtime.hitOnReach,
  });
  scheduleDelayedProjectileCallbackSource(hit, input.callbackContext, sourcePath, launch);
  return compileSynchronousProjectileCallbackScopesSource({
    sourcePath,
    launch,
    template,
    invocations: [{ event: 'hit', ...hit }],
    // 此形状不做实体板赋值，回调声明也不读取 EntityBB；完整 ProjectileData 已足够
    // 证明同步 hit 路由，不要求另造一个空模板目录项。
    allowMissingEntityBlackboardEvidence: true,
  });
}

function wrapProjectileHitWithGameplayTagFilter(
  hit: CompiledActionBlackboardScopeSource,
  runtime: ProjectileRuntimeSource,
  context: CombatActionProjectionContextSource,
  sourcePath: string,
): CompiledBuffStepSource {
  if (!runtime.targetFilter.filterGameplayTag) return hit;
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
  if (registeredTagIds.length === 0) {
    // Endaxis 运行时只持有从完整可读目录投影出的字符串标签，敌人又没有主动行为或外部标签写入。
    // 因此未注册原生 ID 不可能出现在唯一木桩上；ExceptAny 的全部条件均不可命中，命中回调恒可达。
    return hit;
  }
  return {
    kind: 'conditional',
    parameters: {
      condition: {
        kind: 'entityTagMatch',
        target: 'enemy',
        tagQueryType: query.queryType,
        tags: projectGameplayTags(
          registeredTagIds,
          context,
          `${sourcePath}.targetFilter.tagQuery.tags`,
        ),
      },
    },
    whenTrue: { steps: [hit] },
  };
}

/**
 * 将首 tick 墙地阻挡回调编译为同步回调。空间折叠只消除行进距离；阻挡层、检测时机、
 * 碰撞体和回调路由仍须由 ProjectileData/LaunchProjectile 逐项证明。
 */
export function compileZeroDistanceFirstTickBlockProjectileSource(input: {
  readonly sourcePath: string;
  readonly launch: ProjectileLaunchActionSource;
  readonly runtime: ProjectileRuntimeSource;
  readonly template: {
    readonly projectileId: string;
    readonly entityBlackboard: readonly DeclaredBlackboardValueSource[];
  } | null;
  readonly blockGraph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  readonly callbackContext: CombatActionProjectionContextSource;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly callbackExtensions?: CombatActionProjectionExtensionsSource;
}): CompiledActionBlackboardScopeSource {
  const { sourcePath, launch, runtime, template } = input;
  assertSupportedLaunchTargetControls(launch, sourcePath);
  if (runtime.projectileId !== launch.projectileId)
    throw new Error(`${sourcePath}: ProjectileData identity mismatch`);
  assertSupportedFirstTickBlockShape(runtime, sourcePath);
  const block = compileImmediateProjectileCallbackSkillSource({
    graph: input.blockGraph,
    context: input.callbackContext,
    visualOnlyIds: input.visualOnlyIds,
    extensions: input.callbackExtensions,
  });
  scheduleDelayedProjectileCallbackSource(block, input.callbackContext, sourcePath, launch);
  return compileSynchronousProjectileCallbackScopesSource({
    sourcePath,
    launch,
    template,
    invocations: [{ event: 'block', ...block }],
    allowMissingEntityBlackboardEvidence: true,
  });
}

/** Preserve native skill duration and every independent action interval. */
export function compileProjectileCallbackSkillSource(input: {
  readonly graph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  readonly context: CombatActionProjectionContextSource;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly extensions?: CombatActionProjectionExtensionsSource;
  readonly castResource?: SkillCastResourceDefinition;
}): ProjectileCallbackSkillSource {
  const { graph, context, visualOnlyIds = new Set(), extensions = {}, castResource } = input;
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
    skillId: graph.skillId,
    declaredBlackboard: graph.declaredBlackboard,
    naturalDurationFrames: Math.max(1, graph.durationFrame),
    timelineActions,
    ...(castResource === undefined ? {} : { castResource }),
  };
}

/**
 * Transitional projection for existing zero-distance consumers, not a complete skill host.
 * The full source above owns compilation; only this adapter merges immediate intervals.
 */
export function compileImmediateProjectileCallbackSkillSource(
  input: Parameters<typeof compileProjectileCallbackSkillSource>[0] & {
    /** 仅供旧宿主随后按帧重建独立 callback direct scope 的已验证形状。 */
    readonly allowIndependentDelayedBlackboardReads?: boolean;
  },
): ZeroDistanceProjectileCallbackSource {
  const callback = compileProjectileCallbackSkillSource(input);
  const timelines = callback.timelineActions;
  let delayedSequencesNeedFreshScope = false;
  timelines.forEach((timeline, index) => {
    if (timeline.startFrame !== 0) {
      const readsBlackboard = sequenceReadsActionBlackboard(timeline.sequence);
      if (readsBlackboard && !input.allowIndependentDelayedBlackboardReads)
        throw new Error(
          `${callback.skillId}.timelineActions[${index}]: delayed projectile callback reads action blackboard`,
        );
      delayedSequencesNeedFreshScope ||= readsBlackboard;
    }
  });
  // The transitional delayed scopes restore defaults, not the callback's live direct
  // board. A write in the immediate interval is just as observable as a delayed write.
  // Do not silently accept that dataflow until a persistent callback host consumes it.
  if (
    delayedSequencesNeedFreshScope &&
    timelines.some(timeline => callbackMutatesActionState(timeline.sequence))
  )
    throw new Error(
      `${callback.skillId}: delayed projectile callback mutates persistent action state`,
    );
  return {
    skillId: callback.skillId,
    declaredBlackboard: callback.declaredBlackboard,
    sequence: mergeIndependentActionSequencesSource(
      timelines
        .filter(timeline => timeline.startFrame === 0 && timeline.sequence.steps.length > 0)
        .map(timeline => timeline.sequence),
      `${callback.skillId}:immediate-timeline`,
    ),
    delayedSequences: timelines.filter(
      timeline => timeline.startFrame !== 0 && timeline.sequence.steps.length > 0,
    ),
    ...(delayedSequencesNeedFreshScope ? { delayedSequencesNeedFreshScope: true } : {}),
  };
}

function sequenceReadsActionBlackboard(sequence: CompiledBuffSequenceSource): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (value === null || typeof value !== 'object') return false;
    const record = value as Readonly<Record<string, unknown>>;
    if (record.kind === 'blackboard') return true;
    return Object.values(record).some(visit);
  };
  return visit(sequence);
}

function callbackMutatesActionState(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(callbackMutatesActionState);
  if (value === null || typeof value !== 'object') return false;
  const record = value as Readonly<Record<string, unknown>>;
  if (
    typeof record.kind === 'string' &&
    [
      'modifyActionValue',
      'storeSourceAttributeValue',
      'storeEntityPropertyValue',
      'storeEventHealValues',
      'storeShieldValue',
      'setHealthFloor',
      'calculateActionValue',
      'readCurrentBuffRemainingDuration',
      'readBuffRemainingDuration',
      'readBuffStackCount',
      'readEventBuffBlackboard',
      'readBuffBlackboard',
      'storeEventSpGainAmount',
      'storeCurrentTimelineFrame',
      'readSkillSettingData',
    ].includes(record.kind)
  )
    return true;
  return Object.values(record).some(callbackMutatesActionState);
}

function scheduleDelayedProjectileCallbackSource(
  callback: ZeroDistanceProjectileCallbackSource,
  context: CombatActionProjectionContextSource,
  sourcePath: string,
  launch: ProjectileLaunchActionSource,
): void {
  if (callback.delayedSequences.length === 0) return;
  const schedule = context.scheduleRelativeProjectileCallback;
  if (schedule === undefined)
    throw new Error(`${sourcePath}: delayed projectile callback requires a relative scheduler`);
  if (!callback.delayedSequencesNeedFreshScope) {
    callback.delayedSequences.forEach(schedule);
    return;
  }
  if (
    launch.assignEntityBlackboard ||
    launch.assignments.length > 0 ||
    callback.declaredBlackboard.some(value => value.key.startsWith('EntityBB_'))
  ) {
    throw new Error(`${sourcePath}: delayed projectile callback requires persistent entity state`);
  }
  const initialValues = Object.fromEntries(
    callback.declaredBlackboard.map(value => {
      if (typeof value.value !== 'number' || !Number.isFinite(value.value))
        throw new Error(`${sourcePath}: delayed callback has non-numeric blackboard ${value.key}`);
      return [value.key, value.value] as const;
    }),
  );
  // 即便起点相同，每个原生时间轴节点也有自己的失败边界和结束帧。
  // 这条路径已拒绝跨回调写黑板；每个节点可独立恢复同一声明值。
  for (const [index, item] of callback.delayedSequences.entries()) {
    const startFrame = item.startFrame;
    schedule({
      startFrame,
      endFrame: item.endFrame,
      sequence: {
        steps: [
          {
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: `${sourcePath}:${callback.skillId}:delayed:${startFrame}:${index}`,
              lifetime: 'execution',
              alwaysNext: true,
              initialValues,
              inheritParent: launch.assignBlackboard,
            },
            body: item.sequence,
          },
        ],
      },
    });
  }
}

/** 由完整 hit/reach SkillData 动作图建立首帧投射物回调链。 */
export function compileZeroDistanceProjectileLaunchFromSources(input: {
  readonly sourcePath: string;
  readonly launch: ProjectileLaunchActionSource;
  readonly runtime: ProjectileRuntimeSource;
  readonly template: {
    readonly projectileId: string;
    readonly entityBlackboard: readonly DeclaredBlackboardValueSource[];
  } | null;
  readonly hitGraph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  readonly reachGraph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  readonly callbackContext: CombatActionProjectionContextSource;
  readonly visualOnlyIds?: ReadonlySet<string>;
  readonly callbackExtensions?: CombatActionProjectionExtensionsSource;
}): CompiledActionBlackboardScopeSource {
  assertSupportedLaunchTargetControls(input.launch, input.sourcePath);
  const callbackInput = {
    context: input.callbackContext,
    visualOnlyIds: input.visualOnlyIds,
    extensions: input.callbackExtensions,
  };
  const hit = compileImmediateProjectileCallbackSkillSource({
    graph: input.hitGraph,
    ...callbackInput,
  });
  const reach = compileImmediateProjectileCallbackSkillSource({
    graph: input.reachGraph,
    ...callbackInput,
  });
  scheduleDelayedProjectileCallbackSource(
    hit,
    input.callbackContext,
    input.sourcePath,
    input.launch,
  );
  scheduleDelayedProjectileCallbackSource(
    reach,
    input.callbackContext,
    input.sourcePath,
    input.launch,
  );
  return compileZeroDistanceFirstTickProjectileSource({
    sourcePath: input.sourcePath,
    launch: input.launch,
    runtime: input.runtime,
    template: input.template,
    hit,
    reach,
  });
}

/**
 * 只投影“首帧与唯一木桩重叠且同帧到达”的 ProjectileData 形状。
 * 该形状的原生阶段为 collision(hit) → move/reach；其他形状严格拒绝。
 */
export function compileZeroDistanceFirstTickProjectileSource(input: {
  readonly sourcePath: string;
  readonly launch: ProjectileLaunchActionSource;
  readonly runtime: ProjectileRuntimeSource;
  readonly template: {
    readonly projectileId: string;
    readonly entityBlackboard: readonly DeclaredBlackboardValueSource[];
  } | null;
  readonly hit: ZeroDistanceProjectileCallbackSource;
  readonly reach: ZeroDistanceProjectileCallbackSource;
}): CompiledActionBlackboardScopeSource {
  const { sourcePath, launch, runtime, template, hit, reach } = input;
  assertSupportedLaunchTargetControls(launch, sourcePath);
  if (runtime.projectileId !== launch.projectileId)
    throw new Error(`${sourcePath}: ProjectileData identity mismatch`);
  assertSupportedFirstTickShape(runtime, sourcePath);
  const invocations: ProjectileCallbackInvocationSource[] = [
    { event: 'hit', ...hit },
    { event: 'reach', ...reach },
  ];
  return compileSynchronousProjectileCallbackScopesSource({
    sourcePath,
    launch,
    template,
    invocations,
  });
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

function assertSupportedFirstTickBlockShape(runtime: ProjectileRuntimeSource, path: string): void {
  const segment = runtime.moveSegments[0];
  if (
    // ProjectileMovementSubComponent.OnTick performs the first collision/block check
    // before moving and reaching the target. finishOnReach therefore cannot suppress
    // this synchronous first-tick block callback; it only governs the later reach path.
    runtime.hitOnReach ||
    runtime.collisionDetectTiming !== 0 ||
    runtime.hitAndBlockDetectDelayTime !== 0 ||
    runtime.hitAndBlockDetectDelayDistance !== 0 ||
    runtime.colliderShape === null ||
    runtime.colliderShape.shapeType !== 1 ||
    !(runtime.colliderShape.radius > 0) ||
    runtime.blockLayerDef === null ||
    runtime.blockLayerDef.value !== 1 ||
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
  ) {
    throw new Error(`${path}: ProjectileData is outside the proven zero-distance block shape`);
  }
}

function assertSupportedFirstTickReachShape(
  runtime: ProjectileRuntimeSource,
  path: string,
  allowHitOnReachWithoutRoute = false,
  allowInertFirstTickBlock = false,
): void {
  const segment = runtime.moveSegments[0];
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
        segment.segmentDuration === 0));
  if (
    (runtime.hitOnReach && !allowHitOnReachWithoutRoute) ||
    runtime.keepMoveOnReach ||
    runtime.canTraceTargetAfterReach ||
    // 标准木桩场景没有墙体或地面阻挡实例；Nothing(0) 与
    // WallAndGround(1) 都无法在同点 reach 前产生可见回调差异。
    (!allowInertFirstTickBlock &&
      runtime.blockLayerDef?.value !== 0 &&
      runtime.blockLayerDef?.value !== 1) ||
    !hasDefaultPointToPointRoute
  ) {
    throw new Error(`${path}: ProjectileData is outside the proven zero-distance reach shape`);
  }
}

function isPlainZeroSpaceFixedPoint(
  target: ProjectileLaunchActionSource['target'],
  context: CombatActionProjectionContextSource,
  sourcePath?: string,
): boolean {
  const ownerIsCaster =
    (target.targetSource === 'Owner' && context.actionOwnerTarget === 'caster') ||
    (target.targetSource === 'Source' && context.actionSourceTarget === 'caster');
  const directTargetIsProvenZeroSpace =
    target.targetSource === 'Target' &&
    target.targetGroupKey === '' &&
    (context.actionTargetTarget === 'enemy' ||
      context.actionTargetTarget === 'caster' ||
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
    !target.centerToGround &&
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
  if (ownerIsCaster && target.targetGroupKey === '') {
    // TargetResolution 的 Owner 分支直接取得动作 owner；TargetSettings 中随结构
    // 序列化的 finder/validator 不参与该分支。Endaxis 把 Owner 锚点及其偏移
    // 归入统一零空间，不能要求它伪装成 InstantSearch.FixedPointFinder。
    return true;
  }
  if (directTargetIsProvenZeroSpace) {
    // Target 的空组分支直接沿用技能输入目标；其身份已经由外层施法上下文
    // 证明，TargetSettings 中未读取的 selector 残留不参与解析。
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
