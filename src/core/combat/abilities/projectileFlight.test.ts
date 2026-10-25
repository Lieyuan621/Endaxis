import { avywenna } from '../../../data/operators/avywenna.generated';
import {
  createProjectileMovement,
  advanceProjectileMovement,
  projectileCollidesWithTarget,
  projectileDistanceExceeded,
} from './projectileMovementExecution';
import { createActionBlackboardState } from '../state/foundationState';
import { offsetSpatialPoint, spatialPointDirection } from './spatialPointPosition';
import { bindRestoredCombatProjectileRelations } from '../runtime/restoration/combatRuntimeProjectileRestoration';
import { bindProjectileCallbackLifecycle } from './projectileCallbackRuntime';
import type { ProjectileHitTargets } from '../state/instanceState';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { ProjectileCallbackState } from '../state/instanceState';
import { expect, it } from 'vitest';
import type { ProjectileFlightDefinition } from '../../../../packages/game-data-contract/src/projectiles';
import { ProjectileLifecycleRuntime } from './projectileLifecycleRuntime';
import { resolveProjectileFlightEndpoints } from './projectileFlightEndpoints';

const constant = (value: number) => ({ kind: 'constant' as const, value });
const flight = {
  start: { side: 'operator' },
  segments: [
    {
      target: { side: 'enemy' },
      movement: {
        trace: { kind: 'none' },
        speed: constant(10),
        speedCurve: [
          {
            time: 0,
            value: 1,
            inTangent: 0,
            outTangent: 0,
            weightedMode: 0,
            inWeight: 0,
            outWeight: 0,
          },
        ],
        path: { kind: 'straight' },
      },
      skipCollision: false,
    },
  ],
  finishDurationSeconds: constant(1),
  finishDistanceMeters: constant(100),
  finishOnReach: true,
  keepMovingOnReach: false,
  reachRadiusMeters: constant(0),
} satisfies ProjectileFlightDefinition;

it.each([2, 10, 30])('两种原生抛物线参数在 %s 米均按同一物理轨迹到达', distance => {
  // combat-spec ProjectileParabolaMotionTests：一秒飞行、重力 8，中点高 1 米。
  for (const definition of [
    { kind: 'speedGravity' as const, gravity: constant(8) },
    {
      kind: 'vertexDuration' as const,
      durationSeconds: constant(1),
      vertexOffsetMeters: constant(1),
    },
  ]) {
    const blackboard = createActionBlackboardState();
    const movement = createProjectileMovement(
      {
        ...flight,
        finishDurationSeconds: constant(2),
        segments: [
          {
            ...flight.segments[0]!,
            movement: {
              ...flight.segments[0]!.movement,
              speed: constant(distance),
              path: { kind: 'parabola', definition },
            },
          },
        ],
      },
      distance,
      blackboard,
    );
    expect(advanceProjectileMovement(movement, blackboard, 0.5)).toBe(false);
    expect(movement.position).toEqual([distance / 2, 1, 0]);
    expect(advanceProjectileMovement(movement, blackboard, 0.5)).toBe(true);
    expect(movement.position).toEqual([distance, 0, 0]);
  }
});

it('飞行切面不保存编译节点，但保留回调改写实体变量后的距离上限', () => {
  const definition = resolveProjectileFlightEndpoints(
    {
      ...flight,
      finishDistanceMeters: {
        kind: 'valueNode',
        nodeId: 'limit',
        node: { type: 'number', expression: { kind: 'blackboard', key: 'limit' } },
      },
    },
    () => [0, 0, 0],
  );
  expect(definition.finishDistanceMeters).toEqual({ kind: 'blackboard', key: 'limit' });
  const board = createActionBlackboardState();
  board.values.set('limit', 10);
  const state = createProjectileMovement(definition, 20, board);
  advanceProjectileMovement(state, board, 0.5);
  const restored = structuredClone(state);
  expect(projectileDistanceExceeded(restored, board)).toBe(false);
  board.values.set('limit', 4);
  expect(projectileDistanceExceeded(restored, board)).toBe(true);
});

it('重复碰撞逐目标记录场景时间，首次命中不被其他目标阻挡，切面保留间隔', () => {
  let time = 0;
  const hitTargets: ProjectileHitTargets = {
    targets: [
      { kind: 'operator', operatorId: 'a' },
      { kind: 'operator', operatorId: 'b' },
    ],
    hitTagFilter: { tags: ['Immune/Physical'], tagQueryType: 'exceptAny' },
  };
  const bind = (state: ProjectileHitTargets) =>
    bindProjectileCallbackLifecycle([], () => 0.02, {
      state,
      repeatIntervalSeconds: 0.2,
      resolveTimeSeconds: () => time,
      matchesTags: target => target.kind === 'operator' && (target.operatorId === 'a' || time > 0),
    });
  const runtime = new ProjectileLifecycleRuntime();
  runtime.launch({
    ...bind(hitTargets),
    hitTargets,
    flight: {
      ...flight,
      start: { position: [1.1, 0, 0] },
      finishOnReach: false,
      collision: { kind: 'sphere', radiusMeters: constant(1), target: { side: 'enemy' } },
    },
    operatorEnemyDistanceMeters: 0,

    recycleDelaySeconds: 0,
    hitPolicy: { finishOnHit: false, maxHitCount: 4, repeatIntervalSeconds: 0.2 },
  });
  runtime.advanceFrame();
  expect(runtime.runtimeState.instances.get(1)!.hitState!.hitCount).toBe(1);
  time = 0.1;
  runtime.advanceFrame();
  expect(runtime.runtimeState.instances.get(1)!.hitState!.hitCount).toBe(2);
  const state = structuredClone(runtime.runtimeState);
  const restored = new ProjectileLifecycleRuntime(() => 2, {
    state,
    resolveHost: id => bind(state.instances.get(id)!.hitTargets!),
  });
  restored.advanceFrame();
  expect(state.instances.get(1)!.hitState!.hitCount).toBe(2);
  time = 0.2;
  restored.advanceFrame();
  expect(state.instances.get(1)!.hitState!.hitCount).toBe(3);
  expect(state.instances.get(1)!.phase).toBe('active');
  time = 0.3;
  restored.advanceFrame();
  expect(state.instances.get(1)!.hitState!.hitCount).toBe(4);
  expect(state.instances.get(1)!.phase).toBe('finished');
});

it('飞行中切面保留进度；命中、到达发生在同帧超时结束之前且只执行一次', () => {
  const events: string[] = [];
  const host = {
    resolveTickDeltaSeconds: () => 0.25,
    hit: () => {
      events.push('hit');
      return 1;
    },
    reach: () => {
      events.push('reach');
    },
    finish: () => {
      events.push('finish');
    },
    beforeReset: () => {
      events.push('reset');
    },
  };
  const original = new ProjectileLifecycleRuntime();
  original.launch({
    ...host,
    flight,
    operatorEnemyDistanceMeters: 10,

    recycleDelaySeconds: 0,
    hitPolicy: { onReach: true, finishOnHit: false },
  });
  original.advanceFrame();
  original.advanceFrame();
  expect(events).toEqual([]);
  expect(original.runtimeState.instances.get(1)?.movement?.position).toEqual([5, 0, 0]);
  const restored = new ProjectileLifecycleRuntime(() => 2, {
    state: structuredClone(original.runtimeState),
    resolveHost: () => host,
  });
  restored.advanceFrame();
  expect(events).toEqual([]);
  restored.advanceFrame();
  expect(events).toEqual(['reach', 'hit', 'finish']);
  restored.advanceFrame();
  restored.advanceFrame();
  expect(events).toEqual(['reach', 'hit', 'finish', 'reset']);
  expect(original.runtimeState.instances.get(1)?.movement?.position).toEqual([5, 0, 0]);
});

it('动态端点发射时固定位置，后续 Context 变化不改变飞行或切面', () => {
  const position: [number, number, number] = [10, 0, 0];
  const resolved = resolveProjectileFlightEndpoints(
    {
      ...flight,
      segments: [
        { ...flight.segments[0]!, target: { target: { kind: 'context', key: 'landing' } } },
      ],
    },
    () => position,
  );
  position[0] = 100;
  const restored = structuredClone(resolved);
  expect(restored.segments[0]?.target).toEqual({ position: [10, 0, 0] });
  const runtime = new ProjectileLifecycleRuntime();
  let reached = false;
  runtime.launch({
    flight: restored,

    recycleDelaySeconds: 0,
    resolveTickDeltaSeconds: () => 0.5,
    reach: () => {
      reached = true;
    },
    finish: () => {},
    beforeReset: () => {},
  });
  runtime.advanceFrame();
  expect(reached).toBe(false);
  runtime.advanceFrame();
  expect(reached).toBe(true);
});

it.each([
  ['enemyToOperator', [8.8, 1, -2.5]],
  ['operatorToEnemy', [11.2, 1, 2.5]],
] as const)('路径点按 %s 旋转局部偏移后加中心，而非骨骼偏移', (facing, expected) => {
  const resolved = resolveProjectileFlightEndpoints(
    {
      ...flight,
      start: {
        target: { kind: 'fixed', target: 'enemy' },
        offset: {
          facing,
          local: [constant(-2.5), constant(1), constant(1.2)],
        },
      },
    },
    () => [10, 0, 0],
    value => {
      if (value.kind !== 'constant') throw new Error('expected fixture constant');
      return value.value;
    },
  );
  expect(resolved.start).toEqual({ position: expected });
});

it('到达前超时不会触发命中或到达', () => {
  const events: string[] = [];
  const runtime = new ProjectileLifecycleRuntime();
  runtime.launch({
    flight,
    operatorEnemyDistanceMeters: 20,

    recycleDelaySeconds: 0,
    hitPolicy: { onReach: true, finishOnHit: false },
    resolveTickDeltaSeconds: () => 0.25,
    hit: () => {
      events.push('hit');
      return 1;
    },
    reach: () => {
      events.push('reach');
    },
    finish: () => {
      events.push('finish');
    },
    beforeReset: () => {},
  });
  for (let frame = 0; frame < 4; frame++) runtime.advanceFrame();
  expect(events).toEqual(['finish']);
});

it.each([
  { kind: 'sphere' as const, radiusMeters: constant(3) },
  {
    kind: 'box' as const,
    centerMeters: [constant(0), constant(0), constant(2)] as const,
    halfExtentsMeters: [constant(0.5), constant(0.5), constant(1)] as const,
  },
])('$kind 碰撞早于到达；命中结束取消同帧及后续的到达回调', collision => {
  const events: string[] = [];
  const runtime = new ProjectileLifecycleRuntime();
  runtime.launch({
    flight: {
      ...flight,
      collision: { ...collision, target: { side: 'enemy' } },
    },
    operatorEnemyDistanceMeters: 10,

    recycleDelaySeconds: 0,
    hitPolicy: { finishOnHit: true },
    resolveTickDeltaSeconds: () => 0.25,
    hit: () => {
      events.push('hit');
      return 1;
    },
    reach: () => {
      events.push('reach');
    },
    finish: () => {
      events.push('finish');
    },
    beforeReset: () => {},
  });
  runtime.advanceFrame();
  runtime.advanceFrame();
  expect(events).toEqual([]);
  runtime.advanceFrame();
  expect(events).toEqual(['hit', 'finish']);
  runtime.advanceFrame();
  expect(events).toEqual(['hit', 'finish']);
});

it('原地扩张圆环按扫过的环带命中，速度曲线不改变半径增速', () => {
  const hits: number[] = [];
  let frame = 0;
  const runtime = new ProjectileLifecycleRuntime();
  runtime.launch({
    flight: {
      ...flight,
      segments: [
        {
          ...flight.segments[0]!,
          target: { side: 'operator' },
          movement: {
            ...flight.segments[0]!.movement,
            speedCurve: [{ ...flight.segments[0]!.movement.speedCurve[0]!, value: 0 }],
          },
        },
      ],
      finishOnReach: false,
      collision: {
        kind: 'ring',
        target: { side: 'enemy' },
        innerRadiusMeters: constant(0),
        outerRadiusMeters: constant(0.5),
        innerRadiusSpeed: constant(40),
        outerRadiusSpeed: constant(40),
        heightMeters: constant(2),
      },
    },
    operatorEnemyDistanceMeters: 10,

    recycleDelaySeconds: 0,
    hitPolicy: { finishOnHit: false },
    resolveTickDeltaSeconds: () => 0.1,
    hit: () => {
      hits.push(frame);
      return 1;
    },
    finish: () => {},
    beforeReset: () => {},
  });
  for (frame = 1; frame <= 5; frame++) runtime.advanceFrame();
  expect(hits).toEqual([3]);
});

it.each([false, true])(
  '分段曲线按原生开关缩放控制点（%s），切面恢复不重新取样',
  scaleWithDistance => {
    const samples: [number, number][] = [];
    const sampleRange = (minimum: number, maximum: number) => {
      samples.push([minimum, maximum]);
      return minimum;
    };
    const segment = {
      ...flight.segments[0]!,
      movement: {
        ...flight.segments[0]!.movement,
        path: {
          kind: 'bezier' as const,
          controlPoints: [
            {
              distanceRatioRange: [constant(0.25), constant(0.25)] as const,
              angleDegreesRange: [constant(0), constant(90)] as const,
              radiusMetersRange: [constant(1), constant(2)] as const,
              scaleWithDistance,
            },
          ] as const,
        },
      },
    };
    const host = {
      resolveTickDeltaSeconds: () => 1 / 30,
      sampleRange,
      finish: () => {},
      beforeReset: () => {},
    };
    const original = new ProjectileLifecycleRuntime();
    original.launch({
      ...host,
      originCastId: 'cast:projectile',
      flight: {
        ...flight,
        segments: [segment, { ...segment, target: { side: 'operator' } }],
        finishDurationSeconds: constant(4),
      },
      operatorEnemyDistanceMeters: 10,

      recycleDelaySeconds: 0,
    });
    expect(samples).toEqual([
      [0, 90],
      [1, 2],
      [0.25, 0.25],
    ]);
    expect(original.runtimeState.instances.get(1)!.movement!.controlPoints).toEqual([
      scaleWithDistance ? [2.5, 0, 10] : [0.25, 0, 1],
    ]);
    original.advanceFrame();
    const saved = structuredClone(original.runtimeState);
    const restored = new ProjectileLifecycleRuntime(() => 2, {
      state: saved,
    });
    bindRestoredCombatProjectileRelations({
      sampleRange: castId => {
        expect(castId).toBe('cast:projectile');
        return sampleRange;
      },
      projectiles: restored,
      foundation: { shared: {} } as never,
      entities: { targets: new Map() } as never,
      createCallbackBindings: () => {
        throw new Error('无回调投射物不应创建回调宿主');
      },
    });
    expect(samples).toHaveLength(3);
    restored.advanceFrame();
    expect(samples).toHaveLength(3);
    for (let frame = 0; frame < 40 && saved.instances.get(1)?.movement?.segmentIndex === 0; frame++)
      restored.advanceFrame();
    expect(samples).toHaveLength(6);
    expect(saved.instances.get(1)?.movement?.segmentIndex).toBe(1);
    expect(original.runtimeState.instances.get(1)?.movement?.segmentIndex).toBe(0);
  },
);

it('固定路径点在朝向后应用配置旋转，贴地只修改中心高度', () => {
  const resolved = resolveProjectileFlightEndpoints(
    {
      ...flight,
      start: {
        target: { kind: 'source' },
        offset: {
          facing: 'operatorToEnemy',
          local: [constant(2), constant(1), constant(3)],
          rotation: [0, 1, 0, 0],
          centerOnGround: true,
        },
      },
    },
    () => [10, 8, 0],
    value => {
      if (value.kind !== 'constant') throw new Error('expected constant');
      return value.value;
    },
  );
  expect(resolved.start).toEqual({ position: [7, 1, 2] });
});

it.each([false, true])(
  '同帧到达与碰撞遵循原生顺序开关 %s，先结束则不执行另一回调',
  hitBeforeReach => {
    const events: string[] = [];
    const runtime = new ProjectileLifecycleRuntime();
    runtime.launch({
      flight: {
        ...flight,
        hitBeforeReach,
        collision: {
          kind: 'sphere',
          target: { side: 'enemy' },
          radiusMeters: constant(0.1),
        },
      },
      operatorEnemyDistanceMeters: 1,

      recycleDelaySeconds: 0,
      hitPolicy: { finishOnHit: true },
      resolveTickDeltaSeconds: () => 0.1,
      hit: () => {
        events.push('hit');
        return 1;
      },
      reach: () => {
        events.push('reach');
      },
      finish: () => {
        events.push('finish');
      },
      beforeReset: () => {},
    });
    runtime.advanceFrame();
    expect(events).toEqual([hitBeforeReach ? 'hit' : 'reach', 'finish']);
  },
);

it.each(['reach', 'block'] as const)('%s 回调收到事件位置快照，回收不改变已传出的空间点', event => {
  const callback: ProjectileCallbackState = {
    event,
    inputTarget: { kind: 'spatialPoint', pointId: 17 },
    programId: null,
    definitionOperatorId: 'caster',
    skillId: 'callback',
    blackboard: new ActionBlackboard().runtimeState,
    skillCastInfo: null,
    host: null,
  };
  let captured: unknown;
  const runtime = new ProjectileLifecycleRuntime(() => 1);
  const capture = () => {
    captured = callback.inputTarget;
  };
  runtime.launch({
    flight: { ...flight, landingAtTarget: event === 'block' },
    operatorEnemyDistanceMeters: 1,
    callbacks: [callback],
    callbackPrograms: [
      {
        skillId: 'callback',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1,
        initialBlackboard: {},
        timelineActions: [],
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
      },
    ],

    recycleDelaySeconds: 0,
    resolveTickDeltaSeconds: () => 0.1,
    reach: capture,
    block: capture,
    finish: () => {},
    beforeReset: () => {},
  });
  runtime.advanceFrame();
  expect(captured).toEqual({ kind: 'spatialPoint', pointId: 17, position: [1, 0, 0] });
  const snapshot = structuredClone(runtime.runtimeState);
  runtime.runtimeState.instances.get(1)!.movement!.position = [9, 0, 0];
  runtime.advanceFrame();
  expect(captured).toEqual({ kind: 'spatialPoint', pointId: 17, position: [1, 0, 0] });
  expect(snapshot.instances.get(1)!.callbacks[0]!.inputTarget).toEqual(captured);
});

it.each([false, true])('无 hit 回调仍按目标过滤计数并结束，切面保持白名单：%s', empty => {
  let accepted = false;
  const hitTargets: ProjectileHitTargets = {
    targets: empty ? [] : [{ kind: 'enemy' }],
    hitTagFilter: { tags: ['Immune/Physical'], tagQueryType: 'exceptAny' },
  };
  const bind = (targets: ProjectileHitTargets | undefined) =>
    bindProjectileCallbackLifecycle(
      [],
      () => 0.1,
      targets === undefined ? undefined : { state: targets, matchesTags: () => accepted },
    );
  const original = new ProjectileLifecycleRuntime(() => 1);
  original.launch({
    ...bind(hitTargets),
    hitTargets,
    flight: {
      ...flight,
      finishOnReach: false,
      collision: {
        kind: 'sphere',
        target: { side: 'enemy' },
        radiusMeters: constant(2),
      },
    },
    operatorEnemyDistanceMeters: 3,

    recycleDelaySeconds: 0,
    hitPolicy: { finishOnHit: true, maxHitCount: 1, retryRejectedHit: true },
  });
  original.advanceFrame();
  expect(original.runtimeState.instances.get(1)!.phase).toBe('active');
  const state = structuredClone(original.runtimeState);
  const restored = new ProjectileLifecycleRuntime(() => 2, {
    state,
    resolveHost: id => bind(state.instances.get(id)!.hitTargets),
  });
  accepted = true;
  restored.advanceFrame();
  expect(state.instances.get(1)!.phase).toBe(empty ? 'active' : 'finished');
  expect(state.instances.get(1)!.hitState!.hitCount ?? 0).toBe(empty ? 0 : 1);
});

it.each([2, 4])('一次碰撞接受 %s 个目标按实际人数累计，达到上限后结束', acceptedCount => {
  const hitTargets: ProjectileHitTargets = {
    targets: Array.from({ length: 4 }, (_, index) => ({
      kind: 'operator',
      operatorId: String(index),
    })),
    hitTagFilter: { tags: ['Immune/Physical'], tagQueryType: 'exceptAny' },
  };
  const runtime = new ProjectileLifecycleRuntime(() => 1);
  runtime.launch({
    ...bindProjectileCallbackLifecycle([], () => 0.1, {
      state: hitTargets,
      matchesTags: target =>
        target.kind === 'operator' && Number(target.operatorId) < acceptedCount,
    }),
    hitTargets,
    flight: {
      ...flight,
      start: { position: [2.1, 0, 0] },
      finishOnReach: false,
      collision: {
        kind: 'sphere',
        target: { side: 'operator' },
        radiusMeters: constant(2),
      },
    },
    operatorEnemyDistanceMeters: 1,

    recycleDelaySeconds: 0,
    hitPolicy: { finishOnHit: false, maxHitCount: 3 },
  });
  runtime.advanceFrame();
  const instance = runtime.runtimeState.instances.get(1)!;
  expect(instance.hitState!.hitCount).toBe(acceptedCount);
  expect(instance.phase).toBe(acceptedCount >= 3 ? 'finished' : 'active');
});

it('路径点使用已保存的两点方向，水平投影后旋转局部偏移', () => {
  const facing = { source: 'start', target: 'end', invert: false };
  const positions = { start: [2, 8, 3], end: [5, 20, 7] } as const;
  const direction = spatialPointDirection(facing, key => positions[key as keyof typeof positions]);
  const offset = { facing, centerOnGround: true };
  const result = offsetSpatialPoint([10, 9, 20], [0, 2, 5], offset, direction);
  expect(result).toEqual([13, 2, 24]);
  expect(
    offsetSpatialPoint(
      [10, 9, 20],
      [0, 2, 5],
      offset,
      spatialPointDirection(
        { ...facing, invert: true },
        key => positions[key as keyof typeof positions],
      ),
    ),
  ).toEqual([7, 2, 16]);
  expect(offsetSpatialPoint([0, 0, 0], [0, 0, 1], offset, [0, 0, 0])).toEqual([1, 0, 0]);
});

it('落地弹下穿落点高度时触发落地，不要求穿过目标点的到达容差', () => {
  const blackboard = createActionBlackboardState();
  const state = createProjectileMovement(
    {
      ...flight,
      landingAtTarget: true,
      reachRadiusMeters: constant(0.01),
      segments: [
        {
          ...flight.segments[0]!,
          target: { position: [6, 0, 0] },
          movement: {
            ...flight.segments[0]!.movement,
            speed: constant(50),
            path: {
              kind: 'parabola',
              definition: { kind: 'speedGravity', gravity: constant(250) },
            },
          },
        },
      ],
    },
    0,
    blackboard,
  );
  expect(advanceProjectileMovement(state, blackboard, 0.1)).toBe(false);
  const restored = structuredClone(state);
  expect(advanceProjectileMovement(restored, blackboard, 0.1)).toBe(true);
  expect(restored.position[1]).toBe(0);
  expect(restored.position[0]).toBeGreaterThan(5);
  expect(restored.position[0]).toBeLessThan(6);
});

it('零距离初始重叠按正常碰撞处理', () => {
  const blackboard = createActionBlackboardState();
  const state = createProjectileMovement(
    {
      ...flight,
      collision: { kind: 'sphere', target: { side: 'enemy' }, radiusMeters: constant(0.25) },
    },
    0,
    blackboard,
  );
  expect(projectileCollidesWithTarget(state, blackboard, true)).toBe(true);
});

it('回收雷枪补偿覆盖五米内侧枪，保留远距离落空、到达与切面结果', () => {
  const resource =
    avywenna.projectileDefinitions!.projectile_chr_0012_avywen_combo_skill_lance_back!;
  const collision = resource.flight.collision;
  if (
    collision?.kind !== 'sphere' ||
    !('kind' in collision.radiusMeters) ||
    collision.radiusMeters.kind !== 'constant'
  )
    throw new Error('expected constant recall collision radius');
  const run = (distance: number, radius: number, restore = false, destroy = false) => {
    const events: string[] = [];
    let frame = 0;
    const host = {
      finish: () => {},
      beforeReset: () => {},
      resolveTickDeltaSeconds: () => 1 / 30,
      hit: () => {
        events.push(`hit:${frame}`);
        return 1;
      },
      reach: () => {
        events.push(`reach:${frame}`);
      },
    };
    let runtime = new ProjectileLifecycleRuntime();
    // 连携侧枪 (5, 0, 3)；召回从沿反向延伸四米、抬高 0.2 米的位置开始。
    runtime.launch({
      ...host,
      flight: {
        ...flight,
        start: { position: [5 + 20 / Math.sqrt(34), 0.2, 3 + 12 / Math.sqrt(34)] },
        segments: [{ ...flight.segments[0]!, target: { side: 'operator' } }],
        finishDurationSeconds: constant(10),
        collision: { kind: 'sphere', target: { side: 'enemy' }, radiusMeters: constant(radius) },
      },
      operatorEnemyDistanceMeters: distance,
      recycleDelaySeconds: 0,
      hitPolicy: { onReach: false, finishOnHit: false, maxHitCount: -1 },
    });
    for (frame = 0; frame < 60; frame++) {
      if (restore && frame === 2) {
        runtime = new ProjectileLifecycleRuntime(() => 2, {
          state: structuredClone(runtime.runtimeState),
          resolveHost: () => host,
        });
      }
      if (destroy && frame === 2) runtime.finishByAction({ kind: 'abilityEntity', instanceId: 1 });
      runtime.advanceFrame();
    }
    return events;
  };
  for (const distance of [0, 2, 3, 4, 5]) {
    const result = run(distance, collision.radiusMeters.value);
    expect(result.filter(event => event.startsWith('hit:'))).toHaveLength(1);
    expect(run(distance, collision.radiusMeters.value, true)).toEqual(result);
    expect(result.filter(event => event.startsWith('reach:'))).toEqual(
      run(distance, 1.5).filter(event => event.startsWith('reach:')),
    );
  }
  expect(run(5, collision.radiusMeters.value, false, true)).toEqual([]);
  expect(run(3, 1.5).filter(event => event.startsWith('hit:'))).toHaveLength(0);
  expect(
    run(8, collision.radiusMeters.value).filter(event => event.startsWith('hit:')),
  ).toHaveLength(0);
});
