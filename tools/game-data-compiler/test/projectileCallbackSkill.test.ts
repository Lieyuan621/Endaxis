import { describe, expect, it } from 'vitest';
import type { ProjectileLaunchSchedule } from '../../../packages/game-data-contract/src/projectileSchedule.ts';
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
import type { ProjectileRuntimeSource } from '../src/source/projectileRuntime.ts';
import type { ProjectileLaunchActionSource } from '../src/source/referenceActions.ts';
import type { SkillActionGraphSource } from '../src/source/skillActionGraph.ts';
import { parseTargetReferenceSource } from '../src/source/target.ts';
import { targetFixture } from './sourceFixtures.ts';
import { returnProjectionContext } from './support/avywennaReturnProjection.ts';

type ProjectileFixture = {
  schedule?: ProjectileLaunchSchedule;
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
    ...(input.schedule ? { resolveSchedule: () => input.schedule! } : {}),
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
      serverActionIndex: 0,
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
      hitOnReach: false,
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

describe('发射动作的显式回调时间表', () => {
  it('保留具体发射的身份与重复回调帧', () => {
    const input = reachInput();
    input.schedule = {
      endFrame: 12,
      callbacks: [{ event: 'reach', triggerFrames: [3, 9] }],
    };
    input.runtime = {
      ...input.runtime,
    };
    input.runtime = { ...input.runtime };
    const result = projectFixture(input);
    expect(result.steps[0]!.parameters.schedule).toEqual(input.schedule);
    expect(result.steps[0]!.parameters).not.toHaveProperty('flight');
    expect(result.steps[0]!.parameters).not.toHaveProperty('launch');
  });

  it('拒绝把其他事件的时间表套到当前回调技能', () => {
    const input = reachInput();
    input.schedule = {
      endFrame: 12,
      callbacks: [{ event: 'hit', triggerFrames: [3] }],
    };
    expect(() => projectFixture(input)).toThrow('schedule does not match compiled callbacks');
  });
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
      schedule: expect.objectContaining({ endFrame: 0 }),
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
    };
    expect(projectFixture(input).steps).toEqual([
      expect.objectContaining({
        kind: 'launchProjectile',
        parameters: expect.objectContaining({
          schedule: expect.objectContaining({ endFrame: 0 }),
        }),
        callbacks: [expect.objectContaining({ event: 'block' })],
      }),
    ]);

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
          schedule: expect.objectContaining({ endFrame: 0 }),
        }),
        callbacks: [
          expect.objectContaining({ event: 'block' }),
          expect.objectContaining({ event: 'finish' }),
        ],
      }),
    ]);
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

  it('显式时间表保留与到达并存的阻挡回调', () => {
    const input = reachInput();
    input.launch = {
      ...input.launch,
      callbacks: [
        ...input.launch.callbacks,
        { event: 'block', enabled: true, skillId: input.reachGraph.skillId },
      ],
    };
    input.schedule = {
      endFrame: 7,
      callbacks: [
        { event: 'reach', triggerFrames: [] },
        { event: 'block', triggerFrames: [7] },
      ],
    };
    const action = projectFixture(input).steps[0]!;
    expect(action.callbacks.map(callback => callback.event)).toEqual(['reach', 'block']);
    expect(action.parameters.schedule).toEqual(input.schedule);
  });

  it('不能把到达后仍存活的投射物提前结束', () => {
    const input = reachInput();
    input.schedule = {
      endFrame: 30,
      callbacks: [{ event: 'reach', triggerFrames: [3] }],
    };
    const scope = projectFixture({
      ...input,
      runtime: { ...input.runtime },
    });
    expect(scope.steps[0]).toMatchObject({
      kind: 'launchProjectile',
      parameters: {
        schedule: input.schedule,
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

it.each([false, true])('命中回调保留目标标签过滤：%s', filtered => {
  const input = reachInput();
  const launch = {
    ...input.launch,
    callbacks: [{ event: 'hit' as const, enabled: true, skillId: 'callback' }],
  };
  const runtime = {
    ...input.runtime,
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
    schedule: expect.objectContaining({ endFrame: 0 }),
    recycleDelaySeconds: 1,
    hit: {
      ...(filtered
        ? {
            hitTagFilter: { tagQueryType: 'exceptAny', tags: ['Immune/Physical'] },
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
      targetFilter: {
        ...input.runtime.targetFilter,
        autoSetTargetFaction: false,
        targetFactionType: 0,
      },
    },
  }).steps[0]!;
  expect(action.callbacks.some(callback => callback.event === 'hit')).toBe(hitOnReach);
  expect(action.parameters.hit !== undefined).toBe(hitOnReach);
});

it('无命中回调时不携带命中过滤', () => {
  const input = reachInput();
  const result = projectFixture({
    ...input,
    runtime: {
      ...input.runtime,
      hitOnReach: false,
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
  expect(action.parameters.hit).toBeUndefined();
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
      targetFilter: { ...input.runtime.targetFilter, autoSetTargetFaction: true, factionTarget: 1 },
    },
  });
  expect(scope.steps[0]?.kind).toBe('launchProjectile');
});

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

it('明确裁剪的发射不生成节点、回调或实例寿命', () => {
  const input = reachInput();
  const project = createProjectileProjectionExtensionSource({
    shouldOmitLaunch: () => true,
    catalog: { runtimes: new Map(), templates: new Map(), callbackGraphs: new Map() },
    callbackContext: input.callbackContext,
  });
  expect(
    project({ ...input.launch, callbacks: [] }, input.sourcePath, {
      ...input.projectionContext,
      graph: createActionGraphBuilder<CompiledBuffStepSource>(),
    }),
  ).toEqual([]);
});
