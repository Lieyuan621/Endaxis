import { describe, expect, it } from 'vitest';
import {
  compileProjectileCallbackSkillSource,
  createZeroDistanceProjectileProjectionExtensionSource,
} from '../src/compiler/abilities/projectileRuntimeProjection.ts';
import type { SkillActionGraphSource } from '../src/source/skillActionGraph.ts';
import type { KnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { returnProjectionContext } from './support/avywennaReturnProjection.ts';
import type { NativeActionNodeSource } from '../src/source/controlFlow.ts';
import { parseTargetReferenceSource } from '../src/source/target.ts';
import { targetFixture } from './sourceFixtures.ts';
import { gameplayTagIdFromPath } from '../src/source/nativeGameplayTags.ts';

type ProjectileFixture = {
  sourcePath: string;
  recycleDelaySeconds: number;
  castResource: import('../../../packages/game-data-contract/src/skills.ts').SkillCastResourceDefinition;
  callbackContext: typeof returnProjectionContext;
  projectionContext: typeof returnProjectionContext;
  reachGraph: SkillActionGraphSource<KnownNativeActionLeafSource>;
  template: { projectileId: string; entityBlackboard: [] };
  launch: import('../src/source/referenceActions.ts').ProjectileLaunchActionSource;
  runtime: import('../src/source/projectileRuntime.ts').ProjectileRuntimeSource;
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
  const project = createZeroDistanceProjectileProjectionExtensionSource({
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
  const result = project(input.launch, input.sourcePath, input.projectionContext);
  if (result.length !== 1 || result[0]?.kind !== 'withActionBlackboardScope')
    throw new Error('expected launch scope');
  return result[0];
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
      moveModeTypes: new Map([['Default', 0]]),
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
  expect(projected.body.steps[0]).toMatchObject({
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
      colliderShape: { shapeType: 1, radius: 1, extent: [0, 0, 0] },
    };
    expect(projectFixture(input).body.steps).toEqual([
      expect.objectContaining({
        kind: 'launchProjectile',
        parameters: expect.objectContaining({ finish: 'firstTickBlock' }),
        callbacks: [expect.objectContaining({ event: 'block' })],
      }),
    ]);
    expect(() =>
      projectFixture({
        ...input,
        runtime: { ...input.runtime, hitAndBlockDetectDelayTime: 1 },
      }),
    ).toThrow('outside the proven zero-distance block shape');
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
    expect(scope.body.steps).toHaveLength(1);
    const action = scope.body.steps[0]!;
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
      action.callbacks[0]!.skill.scheduledSequences.every(t => t.sequence.steps.length > 0),
    ).toBe(true);
    expect(action.callbacks[0]!.skill.naturalDurationFrames).toBe(30);
  });

  it('不能把到达后仍存活的投射物提前结束', () => {
    const input = reachInput();
    const scope = projectFixture({
      ...input,
      runtime: { ...input.runtime, finishOnReach: false },
    });
    expect(scope.body.steps[0]).toMatchObject({
      kind: 'launchProjectile',
      parameters: {
        finish: {
          reachAfterTicks: 1,
          maxDurationSeconds: input.runtime.finishDuration,
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
    expect(scope.body.steps[0]).toMatchObject({
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
    colliderShape: { shapeType: 1, radius: 1, extent: [0, 0, 0] as const },
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
  const project = createZeroDistanceProjectileProjectionExtensionSource({
    catalog: {
      runtimes: new Map([['projectile', runtime]]),
      templates: new Map([['projectile', input.template!]]),
      callbackGraphs: new Map([['callback', input.reachGraph]]),
      callbackCastResources: new Map([['callback', input.castResource!]]),
    },
    callbackContext: input.callbackContext,
  });
  const steps = project(launch, input.sourcePath, input.projectionContext)!;
  expect(steps).toHaveLength(1);
  const scope = steps[0]!;
  if (scope.kind !== 'withActionBlackboardScope') throw new Error('expected projectile scope');
  const action = scope.body.steps[0]!;
  if (action.kind !== 'launchProjectile') throw new Error('expected independent hit');
  expect(action.parameters).toEqual({
    finish: 10,
    recycleDelaySeconds: 1,
    hit: {
      finishOnHit: maxHitCount === 1,
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
      colliderShape: { shapeType: 1, radius: 1, extent: [0, 0, 0] },
      targetFilter: { ...input.runtime.targetFilter, autoSetTargetFaction: true, factionTarget: 1 },
    },
  });
  expect(scope.body.steps[0]?.kind).toBe('launchProjectile');
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
          colliderShape: { shapeType: 1, radius: 1, extent: [0, 0, 0] },
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
    if (useHitBlockReachOrder)
      expect(project).toThrow('outside the proven zero-distance first-tick shape');
    else expect(project().kind).toBe('withActionBlackboardScope');
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
  it('keeps immediate writes and delayed reads in the same full callback program', () => {
    const compiled = compileProjectileCallbackSkillSource({
      graph: statefulCallback(true),
      context: returnProjectionContext,
    });
    expect(compiled.timelineActions.map(t => [t.startFrame, t.endFrame])).toEqual([
      [0, 0],
      [2, 3],
    ]);
    expect(compiled.timelineActions.every(t => t.sequence.steps.length > 0)).toBe(true);
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
    expect(compiled.timelineActions.every(t => t.sequence.steps.length === 0)).toBe(true);
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
