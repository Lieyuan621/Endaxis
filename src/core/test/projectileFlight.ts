import type {
  ProjectileDefinition,
  ProjectileFlightDefinition,
  ProjectileLaunchDefinition,
} from '../../../packages/game-data-contract/src/projectiles';
import type { ResolvedProjectileFlight } from '../combat/state/projectileMovementState';

/** 从地面上方一米垂直落下，验证真实移动触发的落地回调。 */
export const landingProjectileFlight = {
  start: { position: [0, 1, 0] },
  segments: [
    {
      target: { position: [0, 0, 0] },
      movement: {
        trace: { kind: 'none' },
        speed: { kind: 'constant', value: 60 },
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
  finishDurationSeconds: { kind: 'constant', value: 1 },
  finishDistanceMeters: { kind: 'constant', value: 100 },
  finishOnReach: true,
  landingAtTarget: true,
  keepMovingOnReach: false,
  reachRadiusMeters: { kind: 'constant', value: 0 },
} satisfies ResolvedProjectileFlight;

/** 两个固定端点重合；到达仍由移动器处理，而非发射时同步执行。 */
export const pointProjectileFlight = {
  ...landingProjectileFlight,
  start: { side: 'operator' },
  segments: [{ ...landingProjectileFlight.segments[0]!, target: { side: 'enemy' } }],
  landingAtTarget: false,
  collision: {
    kind: 'sphere',
    target: { side: 'enemy' },
    radiusMeters: { kind: 'constant', value: 0 },
  },
} satisfies ProjectileFlightDefinition;

/** 去程与返回各有独立移动阶段，用于验证跨阶段回调和恢复。 */
export const returnProjectileFlight = {
  ...pointProjectileFlight,
  segments: [
    ...pointProjectileFlight.segments,
    { ...pointProjectileFlight.segments[0]!, target: { side: 'operator' } },
  ],
} satisfies ProjectileFlightDefinition;

/** 停留在出生点直到超时，供只检查回收和结束回调的测试使用。 */
export function stationaryProjectileFlight(seconds: number, detectsHits = false) {
  return {
    ...pointProjectileFlight,
    collision: detectsHits ? pointProjectileFlight.collision : undefined,
    segments: [{ ...pointProjectileFlight.segments[0]!, skipCollision: !detectsHits }],
    finishOnReach: false,
    finishDurationSeconds: { kind: 'constant', value: seconds },
  } satisfies ProjectileFlightDefinition;
}

export const pointProjectileLaunch = {
  start: { side: 'operator' },
  segmentTargets: [{ side: 'enemy' }],
  landingAtTarget: false,
} satisfies ProjectileLaunchDefinition;

/** 固定驻留资源；与发射输入分别提供，测试也经过正式资源引用。 */
export function stationaryProjectileDefinition(
  seconds: number,
  blackboard: Readonly<Record<string, number>> = {},
): ProjectileDefinition {
  const {
    start: _start,
    landingAtTarget: _landing,
    segments,
    ...flight
  } = stationaryProjectileFlight(seconds);
  return {
    flight: {
      ...flight,
      segments: segments.map(({ target: _target, ...segment }) => ({
        ...segment,
        targetKey: null,
      })),
    },
    blackboard,
  };
}

export const returnProjectileLaunch: ProjectileLaunchDefinition = {
  ...pointProjectileLaunch,
  segmentTargets: [{ side: 'enemy' }, { side: 'operator' }],
};

export function returningProjectileDefinition(seconds: number): ProjectileDefinition {
  const { start: _start, landingAtTarget: _landing, segments, ...flight } = returnProjectileFlight;
  return {
    flight: {
      ...flight,
      finishDurationSeconds: { kind: 'constant', value: seconds },
      segments: segments.map(({ target: _target, ...segment }) => ({
        ...segment,
        targetKey: null,
      })),
    },
    blackboard: {},
  };
}

export const pointProjectileDefinition: ProjectileDefinition = (() => {
  const { start: _start, landingAtTarget: _landing, segments, ...flight } = pointProjectileFlight;
  return {
    flight: {
      ...flight,
      segments: segments.map(({ target: _target, ...segment }) => ({
        ...segment,
        targetKey: null,
      })),
    },
    blackboard: {},
  };
})();
