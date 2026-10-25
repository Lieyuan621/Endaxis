import { applyProjectileResourcePatch } from '../src/patches/projectiles.ts';
import { describe, expect, it } from 'vitest';
import type { SkillCastResourceDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import {
  compileProjectileCallbackSkillSource,
  createProjectileProjectionExtensionSource,
} from '../src/compiler/abilities/projectileRuntimeProjection.ts';
import {
  createActionGraphBuilder,
  readActionGraphChain,
} from '../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../src/compiler/actions/combatActionProjectionTypes.ts';
import type { CombatActionProjectionContextSource } from '../src/compiler/combatProjectionCommon.ts';
import type { KnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import type { NativeActionNodeSource } from '../src/source/controlFlow.ts';
import { gameplayTagIdFromPath } from '../src/source/nativeGameplayTags.ts';
import type { ProjectileMoveModeSource } from '../src/source/projectileMovement.ts';
import type { ProjectileRuntimeSource } from '../src/source/projectileRuntime.ts';
import type { ProjectileLaunchActionSource } from '../src/source/referenceActions.ts';
import type { SkillActionGraphSource } from '../src/source/skillActionGraph.ts';
import { parseTargetReferenceSource } from '../src/source/target.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';
import { returnProjectionContext } from './support/avywennaReturnProjection.ts';
import {
  projectProjectileFlightSource,
  projectProjectileFlightTemplateSource,
} from '../src/compiler/abilities/projectileFlightProjection.ts';

it('投射物 PointFinder 保留中心贴地和偏移，交由现有端点解析计算', () => {
  const input = reachInput();
  const target = parseTargetReferenceSource(
    {
      ...targetFixture('InstantSearch', {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+PointFinder+Data, Gameplay.Beyond',
          positionOffset: { x: scalarFixture(0), y: scalarFixture(2), z: scalarFixture(3) },
          rotationOffset: { x: scalarFixture(0), y: scalarFixture(0), z: scalarFixture(0) },
        },
        validatorData: [],
        postProcessorData: [],
      }),
      centerType: 'CurrentTarget',
      centerToGround: true,
      selectorDirection: 'TargetToSource',
    },
    'fixture.point',
  );
  const flight = projectProjectileFlightSource(
    input.runtime,
    { ...input.launch, target },
    {
      ...input.projectionContext,
      graph: createActionGraphBuilder<CompiledBuffStepSource>(),
    },
    'fixture',
  );
  expect(flight.segments[0]?.target).toEqual({
    target: { kind: 'fixed', target: 'enemy' },
    offset: {
      centerOnGround: true,
      facing: 'enemyToOperator',
      local: [0, 2, 3].map(value => ({ kind: 'constant', value })),
    },
  });
});

it('分段飞行只要求实际使用的端点可解析，不能把未知端点默认为敌人', () => {
  const input = reachInput();
  const unknown = parseTargetReferenceSource(targetFixture('Context'), 'fixture.unknown');
  const launch = {
    ...input.launch,
    target: unknown,
    presetPoints: [{ key: 'unused', point: unknown }],
  };
  const runtime = {
    ...input.runtime,
    useSegmentMove: true,
    moveSegments: [
      {
        startPointKey: 'LaunchPoint',
        endPointKey: 'LaunchPoint',
        moveModeId: 'Default',
        earlyNextByDuration: false,
        segmentDuration: 0,
        skipHitAndBlockDetection: false,
      },
    ],
  };
  const context = {
    ...input.projectionContext,
    graph: createActionGraphBuilder<CompiledBuffStepSource>(),
  };
  expect(
    projectProjectileFlightSource(runtime, launch, context, 'fixture').segments[0]?.target,
  ).toEqual({ side: 'operator' });
  expect(() =>
    projectProjectileFlightSource(
      { ...runtime, useSegmentMove: false },
      launch,
      context,
      'fixture',
    ),
  ).toThrow('unsupported action target Context');
  expect(() =>
    projectProjectileFlightSource(
      { ...runtime, moveSegments: [{ ...runtime.moveSegments[0]!, endPointKey: 'unused' }] },
      launch,
      context,
      'fixture',
    ),
  ).toThrow('unsupported action target Context');
});

const scalar = { value: 1, blackboardKey: null, levelValues: null };
const curve = { keys: [], preInfinity: 2, postInfinity: 2 };
const point = {
  usePresetPoint: false,
  presetPointKey: '',
  xRatioRange: [scalar, scalar],
  yzAngleRange: [scalar, scalar],
  yzRadiusRange: [scalar, scalar],
  scaledYzRadius: false,
} as const;
const straightMovement: ProjectileMoveModeSource = {
  moveType: 0,
  traceType: 0,
  traceTime: scalar,
  traceUntilDistance: scalar,
  speed: scalar,
  speedCurve: curve,
  useSpeedScaleWithDistance: false,
  speedScaleWithDistance: curve,
  lockVelocityToXZ: false,
  groundedMove: false,
  limitAngularSpeed: false,
  angularSpeed: scalar,
  angularSpeedCurve: curve,
  parabolaDef: 0,
  travelDuration: scalar,
  vertexYOffset: scalar,
  gravity: scalar,
  bezierMidPoint1: point,
  bezierMidPoint2: point,
};

type ProjectileFixture = {
  sourcePath: string;
  recycleDelaySeconds: number;
  castResource: SkillCastResourceDefinition;
  callbackContext: typeof returnProjectionContext;
  projectionContext: Omit<CombatActionProjectionContextSource, 'graph'>;
  reachGraph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  template: { projectileId: string; entityBlackboard: [] };
  launch: ProjectileLaunchActionSource;
  runtime: ProjectileRuntimeSource;
};

function projectFixture(
  input: ProjectileFixture & {
    hitGraph?: SkillActionGraphSource<KnownNativeActionLeafSource>;
    independentLifetime?: {
      castResource?: ProjectileFixture['castResource'];
      recycleDelaySeconds: number;
    };
    allowGameplayTagFilter?: boolean;
  },
) {
  const graph = input.hitGraph ?? input.reachGraph;
  const project = createProjectileProjectionExtensionSource({
    catalog: {
      runtimes: new Map([[input.runtime.projectileId, input.runtime]]),
      templates: new Map([[input.template.projectileId, input.template]]),
      callbackGraphs: new Map([[graph.skillId, graph]]),
      callbackCastResources: new Map([
        [graph.skillId, input.independentLifetime?.castResource ?? input.castResource],
      ]),
    },
    callbackContext: input.callbackContext,
  });
  const hostGraph = createActionGraphBuilder<CompiledBuffStepSource>();
  const result = project(input.launch, input.sourcePath, {
    ...input.projectionContext,
    graph: hostGraph,
  });
  if (result.length !== 1 || result[0]?.kind !== 'launchProjectile')
    throw new Error('expected one projectile launch');
  return { steps: result };
}

function reachInput(): ProjectileFixture {
  const target = parseTargetReferenceSource(targetFixture('Target'), 'fixture.target');
  const source = parseTargetReferenceSource(targetFixture('Source'), 'fixture.source');
  const zero = [0, 0, 0] as const;
  return {
    sourcePath: 'fixture.launch',
    recycleDelaySeconds: 1,
    castResource: {
      costFrame: 0,
      cooldownSeconds: 0,
      maxChargeTime: 1,
      cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
    },
    callbackContext: returnProjectionContext,
    projectionContext: returnProjectionContext,
    reachGraph: statefulCallback(true),
    template: { projectileId: 'projectile', entityBlackboard: [] },
    launch: {
      kind: 'projectileLaunch',
      projectileId: 'projectile',
      projectileSkillId: '',
      projectileSource: source,
      syncTimeScale: false,
      assignBlackboard: false,
      assignEntityBlackboard: false,
      assignments: [],
      emitPosition: source,
      emitMountPoint: 'None',
      useWeaponMountPoint: false,
      weaponIndex: 0,
      weaponMountPoint: 0,
      overrideEmitBone: false,
      emitPositionFixedOffset: zero,
      emitPositionForwardMode: 'SourceForward',
      emitPositionRandomOffset: zero,
      target,
      targetFilterMode: 'None',
      targetFilterSettings: null,
      alsoLaunchToHittableTarget: false,
      overrideHitBone: false,
      hitMountPoint: 'None',
      hitBoneFixedOffset: zero,
      hitBoneForwardMode: 'SourceForward',
      hitBoneRandomOffset: zero,
      presetPoints: [],
      callbacks: [{ event: 'reach', enabled: true, skillId: 'callback' }],
    },
    runtime: {
      projectileId: 'projectile',
      decodeStatus: 'complete',
      activeSkills: {
        skillIds: ['callback'],
        initialNativeSkillTypeById: { callback: 'normalSkill' },
      },
      finishDuration: 10,
      finishDistance: { value: 0, blackboardKey: null, levelValues: null },
      finishOnReach: true,
      finishOnBlock: false,
      useHitBlockReachOrder: false,
      hitOnReach: false,
      allowHitSameTarget: false,
      hitIntervalPerTarget: 0,
      maxHitCount: -1,
      collisionDetectTiming: 0,
      hitAndBlockDetectDelayTime: 0,
      hitAndBlockDetectDelayDistance: 0,
      keepMoveOnReach: false,
      canTraceTargetAfterReach: false,
      colliderShape: null,
      blockLayerDef: { value: 0, name: 'Nothing' },
      targetFilter: {
        checkAlive: true,
        autoSetTargetFaction: false,
        factionTarget: 0,
        targetFactionType: 0,
        filterObjectType: false,
        objectType: 0,
        filterSlot: false,
        filterGameplayTag: false,
        gameplayTagQuery: null,
      },
      presetPointKeys: ['LaunchPoint', 'TargetPoint'],
      useSegmentMove: false,
      moveModes: new Map([['Default', straightMovement]]),
      moveSegments: [],
    },
  };
}

it('保留原生投射物 Owner 来源，不替换为 Buff 的 Source', () => {
  const input = reachInput();
  input.launch = {
    ...input.launch,
    projectileSource: parseTargetReferenceSource(targetFixture('Owner'), 'fixture.source'),
  };
  const projected = projectFixture(input);
  expect(projected.steps[0]).toMatchObject({
    kind: 'launchProjectile',
    parameters: { source: 'actionOwner' },
  });
});

it('未支持的投射物来源不能默认为 Source', () => {
  const input = reachInput();
  input.launch = {
    ...input.launch,
    projectileSource: parseTargetReferenceSource(targetFixture('Target'), 'fixture.source'),
  };
  expect(() => projectFixture(input)).toThrow('projectile source must resolve to Source or Owner');
});

it('Source 来源不读取未启用的目标组名', () => {
  const input = reachInput();
  const expected = projectFixture(input);
  input.launch = {
    ...input.launch,
    projectileSource: { ...input.launch.projectileSource, targetGroupKey: 'projectileSource' },
  };
  expect(projectFixture(input)).toEqual(expected);
});

describe('独立到达回调的编译', () => {
  it('零空间输入只证明可到达，OnlyHit 仍按实际输入身份筛选', () => {
    const input = reachInput();
    const result = projectFixture({
      ...input,
      projectionContext: {
        ...input.projectionContext,
        actionTargetTarget: 'actionInputTarget',
        actionInputIsZeroSpace: true,
      },
      launch: {
        ...input.launch,
        targetFilterMode: 'OnlyHit',
        targetFilterSettings: input.launch.target,
      },
    });
    const launch = result.steps[0];
    if (launch?.kind !== 'launchProjectile') throw new Error('expected projectile');
    expect(launch.parameters).toMatchObject({
      onlyHitTargets: { kind: 'inputTarget' },
      flight: {
        finishOnReach: true,
        finishDurationSeconds: { kind: 'constant', value: input.runtime.finishDuration },
      },
    });
  });

  it('发射回调保留独立程序与事件，不改成到达或命中回调', () => {
    const input = reachInput();
    input.launch = {
      ...input.launch,
      callbacks: [{ event: 'launch', enabled: true, skillId: input.reachGraph.skillId }],
    };
    // 原到达样本包含对输入目标的处决技力操作，不能错误地仍按敌人编译。
    expect(() => projectFixture(input)).toThrow('unaudited AbilityEntity action finisherSpGain');
    input.reachGraph = {
      ...input.reachGraph,
      actionGroup: {
        ...input.reachGraph.actionGroup,
        timelineActions: input.reachGraph.actionGroup.timelineActions.slice(0, 1),
      },
    };
    expect(projectFixture(input).steps[0]!.callbacks).toEqual([
      expect.objectContaining({
        event: 'launch',
        skill: expect.objectContaining({ skillId: input.reachGraph.skillId }),
      }),
    ]);
  });

  it('独立落地回调编译成统一投射物程序，不展开进发射者技能', () => {
    const input = reachInput();
    input.launch = {
      ...input.launch,
      callbacks: [{ event: 'block', enabled: true, skillId: 'callback' }],
    };
    input.runtime = {
      ...input.runtime,
      finishOnReach: false,
      finishOnBlock: true,
      blockLayerDef: { value: 1, name: 'WallAndGround' },
      colliderShape: { shapeType: 1, radius: 1, center: [0, 0, 0] as const, extent: [0, 0, 0] },
    };
    expect(projectFixture(input).steps).toEqual([
      expect.objectContaining({
        kind: 'launchProjectile',
        parameters: expect.objectContaining({
          flight: expect.objectContaining({ landingAtTarget: true }),
        }),
        callbacks: [expect.objectContaining({ event: 'block' })],
      }),
    ]);
    expect(() =>
      projectFixture({
        ...input,
        runtime: { ...input.runtime, hitAndBlockDetectDelayTime: 1 },
      }),
    ).toThrow('projectile collision delay requires lifecycle projection');
    input.launch = {
      ...input.launch,
      callbacks: [
        ...input.launch.callbacks,
        { event: 'finish', enabled: true, skillId: 'callback' },
      ],
    };
    expect(projectFixture(input).steps).toEqual([
      expect.objectContaining({
        kind: 'launchProjectile',
        parameters: expect.objectContaining({
          flight: expect.objectContaining({ landingAtTarget: true }),
        }),
        callbacks: [
          expect.objectContaining({ event: 'block' }),
          expect.objectContaining({ event: 'finish' }),
        ],
      }),
    ]);
  });

  it('没有场景表面时自定义表面阻挡层不改变到达程序，敌人层不能被忽略', () => {
    const input = reachInput();
    const runtime = {
      ...input.runtime,
      blockLayerDef: { value: -1 as const, name: 'Custom' as const },
      blockLayerMask: 193,
    };
    expect(projectFixture({ ...input, runtime })).toEqual(projectFixture(input));
    expect(() =>
      projectFixture({ ...input, runtime: { ...runtime, blockLayerMask: 1 << 12 } }),
    ).toThrow('projectile environment blocking is not modeled');
  });
  it('即时写入和延迟读取留在同一个回调程序中，不调度到发射者的技能上', () => {
    const input = reachInput();
    const scope = projectFixture(input);
    expect(scope.steps).toHaveLength(1);
    const action = scope.steps[0]!;
    expect(action.kind).toBe('launchProjectile');
    if (action.kind !== 'launchProjectile') throw new Error('unexpected action');
    expect(action.callbacks[0]!.skill.blackboard).toEqual({ value: 1 });
    expect(
      action.callbacks[0]!.skill.scheduledSequences.map(t => [t.startFrame, t.endFrame]),
    ).toEqual([
      [0, 0],
      [2, 3],
    ]);
    expect(
      action.callbacks[0]!.skill.scheduledSequences.every(
        t =>
          readActionGraphChain(action.callbacks[0]!.skill.actionGraph.main, t.sequence).length > 0,
      ),
    ).toBe(true);
    expect(action.callbacks[0]!.skill.naturalDurationFrames).toBe(30);
  });

  it('不能把到达后仍存活的投射物提前结束', () => {
    const input = reachInput();
    const scope = projectFixture({
      ...input,
      runtime: { ...input.runtime, finishOnReach: false },
    });
    expect(scope.steps[0]).toMatchObject({
      kind: 'launchProjectile',
      parameters: {
        flight: {
          finishDurationSeconds: { kind: 'constant', value: input.runtime.finishDuration },
          finishOnReach: false,
        },
      },
    });
  });

  it('来源时钟同步保留在发射动作上，由投射物生命周期订阅', () => {
    const input = reachInput();
    const scope = projectFixture({
      ...input,
      launch: { ...input.launch, syncTimeScale: true },
    });
    expect(scope.steps[0]).toMatchObject({
      kind: 'launchProjectile',
      parameters: { syncTimeScale: true },
    });
  });
});

it.each([
  [-1, false],
  [1, false],
  [-1, true],
  [1, true],
] as const)('命中路由保留完整回调和寿命：上限 %s，过滤 %s', (maxHitCount, filtered) => {
  const input = reachInput();
  const launch = {
    ...input.launch,
    callbacks: [{ event: 'hit' as const, enabled: true, skillId: 'callback' }],
  };
  const runtime = {
    ...input.runtime,
    maxHitCount,
    finishOnReach: false,
    colliderShape: {
      shapeType: 1,
      radius: 1,
      center: [0, 0, 0] as const,
      extent: [0, 0, 0] as const,
    },
    targetFilter: {
      ...input.runtime.targetFilter,
      autoSetTargetFaction: true,
      factionTarget: 1,
      filterGameplayTag: filtered,
      gameplayTagQuery: filtered
        ? { queryType: 'exceptAny' as const, tagIds: [gameplayTagIdFromPath('Immune/Physical')] }
        : null,
    },
  };
  const project = createProjectileProjectionExtensionSource({
    catalog: {
      runtimes: new Map([['projectile', runtime]]),
      templates: new Map([['projectile', input.template!]]),
      callbackGraphs: new Map([['callback', input.reachGraph]]),
      callbackCastResources: new Map([['callback', input.castResource!]]),
    },
    callbackContext: input.callbackContext,
  });
  const hostGraph = createActionGraphBuilder<CompiledBuffStepSource>();
  const steps = project(launch, input.sourcePath, {
    ...input.projectionContext,
    graph: hostGraph,
  })!;
  expect(steps).toHaveLength(1);
  const action = steps[0]!;
  if (action.kind !== 'launchProjectile') throw new Error('expected independent hit');
  expect(action.parameters).toMatchObject({
    inheritActionBlackboard: launch.assignBlackboard,
    entityInitialValues: {},
    flight: { finishDurationSeconds: { kind: 'constant', value: 10 } },
    recycleDelaySeconds: 1,
    hit: {
      finishOnHit: maxHitCount === 1,
      maxHitCount,
      ...(filtered
        ? {
            hitTagFilter: { tagQueryType: 'exceptAny', tags: ['Immune/Physical'] },
            retryRejectedHit: true,
          }
        : {}),
    },
  });
  expect(action.callbacks[0]!.skill.blackboard).toEqual({ value: 1 });
  expect(
    action.callbacks[0]!.skill.scheduledSequences.map(t => [t.startFrame, t.endFrame]),
  ).toEqual([
    [0, 0],
    [2, 3],
  ]);
});

it.each([false, true])('空阵营掩码只禁止实体碰撞，不禁止到达命中（hitOnReach=%s）', hitOnReach => {
  const input = reachInput();
  const action = projectFixture({
    ...input,
    launch: { ...input.launch, callbacks: [{ event: 'hit', enabled: true, skillId: 'callback' }] },
    runtime: {
      ...input.runtime,
      hitOnReach,
      maxHitCount: 1,
      colliderShape: { shapeType: 1, radius: 1, center: [0, 0, 0], extent: [0, 0, 0] },
      targetFilter: {
        ...input.runtime.targetFilter,
        autoSetTargetFaction: false,
        targetFactionType: 0,
      },
    },
  }).steps[0]!;
  if (!('flight' in action.parameters)) throw new Error('expected projected flight');
  expect(action.parameters.flight?.collision).toBeUndefined();
  expect(action.callbacks.some(callback => callback.event === 'hit')).toBe(hitOnReach);
  expect(action.parameters.hit !== undefined).toBe(hitOnReach);
});

it('无命中回调时仍保留影响寿命的碰撞计数和标签条件', () => {
  const input = reachInput();
  const result = projectFixture({
    ...input,
    runtime: {
      ...input.runtime,
      maxHitCount: 1,
      hitOnReach: false,
      finishOnReach: false,
      colliderShape: { shapeType: 1, radius: 1, center: [0, 0, 0], extent: [0, 0, 0] },
      targetFilter: {
        ...input.runtime.targetFilter,
        autoSetTargetFaction: true,
        factionTarget: 1,
        filterGameplayTag: true,
        gameplayTagQuery: {
          queryType: 'exceptAny',
          tagIds: [gameplayTagIdFromPath('Immune/Physical')],
        },
      },
    },
  });
  const action = result.steps[0]!;
  expect(action.callbacks.some(callback => callback.event === 'hit')).toBe(false);
  expect('hit' in action.parameters ? action.parameters.hit : undefined).toMatchObject({
    maxHitCount: 1,
    hitTagFilter: { tagQueryType: 'exceptAny', tags: ['Immune/Physical'] },
  });
});

it('飞向主控的投射物仍按碰撞阵营决定命中对象', () => {
  const input = reachInput();
  const scope = projectFixture({
    ...input,
    launch: {
      ...input.launch,
      target: parseTargetReferenceSource(targetFixture('MainCharacter'), 'fixture.target'),
      callbacks: [{ event: 'hit', enabled: true, skillId: 'callback' }],
    },
    runtime: {
      ...input.runtime,
      finishOnReach: false,
      maxHitCount: 1,
      colliderShape: { shapeType: 1, radius: 1, center: [0, 0, 0] as const, extent: [0, 0, 0] },
      targetFilter: { ...input.runtime.targetFilter, autoSetTargetFaction: true, factionTarget: 1 },
    },
  });
  expect(scope.steps[0]?.kind).toBe('launchProjectile');
});

it.each([false, true])(
  '两段投射物不能在碰撞先于到达时省略第二次命中：%s',
  useHitBlockReachOrder => {
    const input = reachInput();
    const project = () =>
      projectFixture({
        ...input,
        hitGraph: statefulCallback(false),
        launch: {
          ...input.launch,
          callbacks: [{ event: 'hit', enabled: true, skillId: 'callback' }],
        },
        runtime: {
          ...input.runtime,
          useHitBlockReachOrder,
          useSegmentMove: true,
          allowHitSameTarget: true,
          colliderShape: { shapeType: 1, radius: 1, center: [0, 0, 0] as const, extent: [0, 0, 0] },
          targetFilter: {
            ...input.runtime.targetFilter,
            autoSetTargetFaction: true,
            factionTarget: 1,
          },
          moveSegments: [
            {
              startPointKey: 'LaunchPoint',
              endPointKey: 'TargetPoint',
              moveModeId: 'Default',
              earlyNextByDuration: true,
              segmentDuration: 1,
              skipHitAndBlockDetection: false,
            },
            {
              startPointKey: 'TargetPoint',
              endPointKey: 'TargetPoint',
              moveModeId: 'Default',
              earlyNextByDuration: false,
              segmentDuration: 0,
              skipHitAndBlockDetection: false,
            },
          ],
        },
      });
    const action = project().steps[0]!;
    expect(action.kind).toBe('launchProjectile');
    if (!('flight' in action.parameters)) throw new Error('expected projected flight');
    expect(action.parameters.flight?.hitBeforeReach).toBe(useHitBlockReachOrder);
    expect(action.parameters.flight?.segments).toHaveLength(2);
    expect(action.parameters.hit?.repeatIntervalSeconds).toBe(input.runtime.hitIntervalPerTarget);
  },
);

function callbackNode(
  body: NativeActionNodeSource<KnownNativeActionLeafSource>['body'],
): NativeActionNodeSource<KnownNativeActionLeafSource> {
  return {
    sourcePath: 'fixture.callback',
    metadata: {
      nativeType: 'fixture',
      nativeName: 'fixture',
      enabled: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 0,
    },
    body,
  };
}

function statefulCallback(write: boolean): SkillActionGraphSource<KnownNativeActionLeafSource> {
  const seed = graph(30);
  const scalar = (value: number, blackboardKey: string | null = null) => ({
    value,
    blackboardKey,
    levelValues: null,
  });
  const empty = seed.actionGroup.timelineActions[0]!;
  return {
    ...seed,
    declaredBlackboard: [{ key: 'value', value: 1, isDynamic: true }],
    actionGroup: {
      passiveEvents: [],
      timelineActions: [
        {
          ...empty,
          sequence: {
            ...empty.sequence,
            actions: write
              ? [
                  callbackNode({
                    kind: 'leaf',
                    value: {
                      family: 'blackboardCalculation',
                      action: {
                        kind: 'blackboardCalculation',
                        key: 'value',
                        operation: 'Add',
                        left: scalar(1),
                        right: scalar(1),
                        addend: null,
                      },
                    },
                  }),
                ]
              : [],
          },
        },
        {
          ...empty,
          startFrame: 2,
          endFrame: 3,
          sequence: {
            ...empty.sequence,
            actions: [
              callbackNode({
                kind: 'switch',
                choice: scalar(0, 'value'),
                alwaysNext: true,
                options: [
                  {
                    value: scalar(2),
                    action: {
                      ...empty.sequence,
                      actions: [
                        callbackNode({
                          kind: 'leaf',
                          value: {
                            family: 'finisherSpGain',
                            action: {
                              kind: 'finisherSpGain',
                              factor: scalar(1),
                              source: parseTargetReferenceSource(
                                targetFixture('Source'),
                                'fixture.source',
                              ),
                              target: parseTargetReferenceSource(
                                targetFixture('Target'),
                                'fixture.target',
                              ),
                            },
                          },
                        }),
                      ],
                    },
                  },
                ],
              }),
            ],
          },
        },
      ],
    },
  };
}

function graph(durationFrame: number): SkillActionGraphSource<KnownNativeActionLeafSource> {
  return {
    skillId: 'callback',
    level: 1,
    durationFrame,
    declaredBlackboard: [],
    actionGroup: {
      passiveEvents: [],
      timelineActions: [
        [0, 0],
        [0, 3],
        [0, 10],
        [12, 20],
      ].map(([startFrame, endFrame]) => ({
        startFrame: startFrame!,
        endFrame: endFrame!,
        forceSyncAnimation: { forceSync: false, montageName: '', targetFrame: 0, playbackSpeed: 1 },
        sequence: {
          onlyExecuteWhenSourceIsMainCharacter: false,
          onlyExecuteWhenSourceIsGuard: false,
          actions: [],
        },
      })),
    },
  };
}

describe('complete projectile callback skill source', () => {
  it('compiles a native jump against the callback timeline rather than the launching skill', () => {
    const source = graph(90);
    const timeline = source.actionGroup.timelineActions[0]!;
    const compiled = compileProjectileCallbackSkillSource({
      graph: {
        ...source,
        actionGroup: {
          ...source.actionGroup,
          timelineActions: [
            {
              ...timeline,
              startFrame: 3,
              endFrame: 7,
              sequence: {
                ...timeline.sequence,
                actions: [
                  callbackNode({
                    kind: 'timelineJump',
                    destinationFrame: 78,
                    condition: { ...timeline.sequence, actions: [] },
                  }),
                ],
              },
            },
          ],
        },
      },
      context: returnProjectionContext,
    });
    expect(
      readActionGraphChain(compiled.program.finish(), compiled.timelineActions[0]!.sequence),
    ).toMatchObject([{ kind: 'jumpTimeline', parameters: { destinationFrame: 78 } }]);
  });
  it('keeps immediate writes and delayed reads in the same full callback program', () => {
    const compiled = compileProjectileCallbackSkillSource({
      graph: statefulCallback(true),
      context: returnProjectionContext,
    });
    expect(compiled.timelineActions.map(t => [t.startFrame, t.endFrame])).toEqual([
      [0, 0],
      [2, 3],
    ]);
    expect(
      compiled.timelineActions.every(
        t => readActionGraphChain(compiled.program.finish(), t.sequence).length > 0,
      ),
    ).toBe(true);
  });
  it('keeps all native action intervals and their order, even when empty after projection', () => {
    const source = graph(900);
    const compiled = compileProjectileCallbackSkillSource({
      graph: source,
      context: returnProjectionContext,
    });
    expect(compiled.naturalDurationFrames).toBe(900);
    expect(compiled.declaredBlackboard).toBe(source.declaredBlackboard);
    expect(compiled.timelineActions.map(t => [t.startFrame, t.endFrame])).toEqual([
      [0, 0],
      [0, 3],
      [0, 10],
      [12, 20],
    ]);
    expect(
      compiled.timelineActions.every(
        t => readActionGraphChain(compiled.program.finish(), t.sequence).length === 0,
      ),
    ).toBe(true);
  });

  it('uses the native minimum one-frame duration, not the last action end', () => {
    const compiled = compileProjectileCallbackSkillSource({
      graph: graph(0),
      context: returnProjectionContext,
    });
    expect(compiled.naturalDurationFrames).toBe(1);
    expect(compiled.timelineActions.at(-1)?.endFrame).toBe(20);
  });

  it.each([-1, 0.5, NaN, Infinity])('rejects invalid native duration %s', duration => {
    expect(() =>
      compileProjectileCallbackSkillSource({
        graph: graph(duration),
        context: returnProjectionContext,
      }),
    ).toThrow('invalid callback durationFrame');
  });
});

it.each(['02', '03', 'attack'])('梨诺只省略上射弹的敌人碰撞：%s', suffix => {
  const input = reachInput();
  const projectileId =
    suffix === 'attack'
      ? 'projectile_chr_0035_liino_normal_attack'
      : `projectile_chr_0035_liino_normal_attack_${suffix}`;
  const flight = projectProjectileFlightSource(
    {
      ...input.runtime,
      projectileId,
      colliderShape: { shapeType: 1, radius: 0.2, center: [0, 0, 0], extent: [0, 0, 0] },
      targetFilter: { ...input.runtime.targetFilter, autoSetTargetFaction: true, factionTarget: 1 },
    },
    { ...input.launch, projectileId },
    { ...input.projectionContext, graph: createActionGraphBuilder<CompiledBuffStepSource>() },
    'fixture',
  );
  expect(flight.collision !== undefined).toBe(suffix === 'attack');
  expect(flight.segments).toHaveLength(1);
});

it('投射物模板保留变量身份，不吸收发射动作的目标或赋值', () => {
  const input = reachInput();
  const runtime = {
    ...input.runtime,
    finishDistance: {
      ...input.runtime.finishDistance,
      value: 20,
      blackboardKey: 'EntityBB_maxDistance',
    },
  };
  const template = projectProjectileFlightTemplateSource(runtime, 'fixture');
  expect(template.finishDistanceMeters).toEqual({ blackboardKey: 'EntityBB_maxDistance' });
  expect(template).not.toHaveProperty('start');
  expect(template.segments[0]).not.toHaveProperty('target');
  const flight = projectProjectileFlightSource(
    runtime,
    input.launch,
    { ...input.projectionContext, graph: createActionGraphBuilder<CompiledBuffStepSource>() },
    'fixture',
  );
  expect(flight.finishDistanceMeters).toEqual({ kind: 'blackboard', key: 'EntityBB_maxDistance' });
  expect(template.finishDistanceMeters).toEqual({ blackboardKey: 'EntityBB_maxDistance' });
});

it('回收雷枪补丁只改工作副本半径，原生结构变化时拒绝生成', () => {
  const base = reachInput().runtime;
  const source: ProjectileRuntimeSource = {
    ...base,
    projectileId: 'projectile_chr_0012_avywen_combo_skill_lance_back',
    colliderShape: { shapeType: 1, radius: 1.5, center: [0, 0, 0], extent: [0, 0, 0] },
    targetFilter: { ...base.targetFilter, autoSetTargetFaction: true, factionTarget: 1 },
  };
  expect(applyProjectileResourcePatch(base)).toBe(base);
  expect(applyProjectileResourcePatch(source)).toEqual({
    ...source,
    colliderShape: { ...source.colliderShape, radius: 2.6 },
  });
  expect(source.colliderShape?.radius).toBe(1.5);
  expect(() => applyProjectileResourcePatch({ ...source, hitOnReach: true })).toThrow(
    'patch expected',
  );
  expect(() =>
    applyProjectileResourcePatch({
      ...source,
      colliderShape: { ...source.colliderShape!, radius: 2 },
    }),
  ).toThrow('patch expected');
});
