import {
  readActionBlackboard,
  resolveBlackboardExpression,
} from '../actions/actionBlackboardExecution';
import type { ProjectileValue } from '../state/projectileMovementState';
import type { ActionBlackboardState } from '../state/foundationState';
import type {
  ResolvedProjectileFlight,
  ProjectileMovementState,
  ProjectilePosition,
} from '../state/projectileMovementState';
import { evaluateTimeScaleCurve } from '../time/timeScaleCurve';

export function resolveProjectileValue(
  value: ProjectileValue,
  blackboard: ActionBlackboardState,
): number {
  return resolveBlackboardExpression(value, key => readActionBlackboard(blackboard, key));
}

const length = (v: ProjectilePosition) => Math.hypot(...v);
const subtract = (a: ProjectilePosition, b: ProjectilePosition): ProjectilePosition => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const point = (p: ResolvedProjectileFlight['start'], distance: number): ProjectilePosition =>
  'position' in p ? p.position : [p.side === 'enemy' ? distance : 0, 0, 0];

/** 原生局部 X 为侧向，Y 为上方，Z 为飞行方向。 */
function projectileAxes(
  direction: ProjectilePosition,
): readonly [ProjectilePosition, ProjectilePosition, ProjectilePosition] {
  const distance = length(direction);
  const forward: ProjectilePosition =
    distance === 0
      ? [1, 0, 0]
      : [direction[0] / distance, direction[1] / distance, direction[2] / distance];
  const horizontal = Math.hypot(forward[0], forward[2]);
  const side: ProjectilePosition =
    horizontal === 0 ? [0, 0, 1] : [-forward[2] / horizontal, 0, forward[0] / horizontal];
  const up: ProjectilePosition = [
    -side[2] * forward[1],
    side[2] * forward[0] - side[0] * forward[2],
    side[0] * forward[1],
  ];
  return [side, up, forward];
}

/** 端口不进入切面；已取样的控制点保存在移动状态中。 */
export type ProjectileRangeSample = (minimum: number, maximum: number) => number;

export function createProjectileMovement(
  definition: ResolvedProjectileFlight,
  operatorEnemyDistanceMeters: number,
  blackboard: ActionBlackboardState,
  sampleRange?: ProjectileRangeSample,
): ProjectileMovementState {
  if (!definition.segments.length) throw new Error('projectile flight requires a movement segment');
  if (!Number.isFinite(operatorEnemyDistanceMeters) || operatorEnemyDistanceMeters < 0)
    throw new RangeError('projectile scene distance must be non-negative and finite');
  const start = point(definition.start, operatorEnemyDistanceMeters);
  const state: ProjectileMovementState = {
    definition,
    operatorEnemyDistanceMeters,
    launchPosition: start,
    position: start,
    previousPosition: start,
    segmentStart: start,
    targetPosition: start,
    segmentIndex: 0,
    elapsedSeconds: 0,
    scaledElapsedSeconds: 0,
    distanceScale: 1,
    travelDurationSeconds: 0,
    horizontalSpeed: 0,
    verticalSpeed: 0,
    gravity: 0,
    traceLimit: 0,
    traceRemainingSeconds: 0,
    controlPoints: [],
    reached: false,
    firstTick: true,
    ring:
      definition.collision?.kind === 'ring'
        ? {
            innerRadius: resolveProjectileValue(definition.collision.innerRadiusMeters, blackboard),
            outerRadius: resolveProjectileValue(definition.collision.outerRadiusMeters, blackboard),
            previousInnerRadius: resolveProjectileValue(
              definition.collision.innerRadiusMeters,
              blackboard,
            ),
          }
        : null,
  };
  startSegment(state, blackboard, sampleRange);
  return state;
}

function startSegment(
  state: ProjectileMovementState,
  blackboard: ActionBlackboardState,
  sampleRange?: ProjectileRangeSample,
): void {
  const segment = state.definition.segments[state.segmentIndex]!;
  const movement = segment.movement;
  const value = (operand: Parameters<typeof resolveProjectileValue>[0]) =>
    resolveProjectileValue(operand, blackboard);
  state.segmentStart = state.position;
  state.targetPosition = point(segment.target, state.operatorEnemyDistanceMeters);
  state.elapsedSeconds = state.scaledElapsedSeconds = 0;
  const difference = subtract(state.targetPosition, state.segmentStart);
  const distance = length(difference);
  state.distanceScale = movement.distanceScaleCurve
    ? evaluateTimeScaleCurve(movement.distanceScaleCurve, distance)
    : 1;
  const speed = value(movement.speed);
  state.travelDurationSeconds = distance / speed;
  state.horizontalSpeed = speed;
  state.verticalSpeed = state.gravity = 0;
  state.traceLimit =
    movement.trace.kind === 'duration'
      ? value(movement.trace.seconds)
      : movement.trace.kind === 'distance'
        ? value(movement.trace.meters)
        : 0;
  state.traceRemainingSeconds = Math.max(0, state.traceLimit);
  state.controlPoints = [];
  if (movement.path.kind === 'bezier') {
    const [side, up, forward] = projectileAxes(difference);
    state.controlPoints = movement.path.controlPoints.map(control => {
      const sample = (range: typeof control.distanceRatioRange) => {
        const minimum = value(range[0]);
        const maximum = value(range[1]);
        if (!sampleRange)
          throw new Error('projectile control point requires a range sample source');
        return sampleRange(minimum, maximum);
      };
      // 原生顺序：角度、半径、沿程比例；不能在生成时把范围折成常量。
      const angle = (sample(control.angleDegreesRange) * Math.PI) / 180;
      const radius = sample(control.radiusMetersRange);
      const along = sample(control.distanceRatioRange);
      const scale = control.scaleWithDistance ? distance : 1;
      const vertical = Math.sin(angle) * radius * scale;
      const lateral = Math.cos(angle) * radius * scale;
      const coordinate = (axis: number) =>
        state.segmentStart[axis]! +
        forward[axis]! * along * scale +
        up[axis]! * vertical +
        side[axis]! * lateral;
      return [coordinate(0), coordinate(1), coordinate(2)];
    });
  }
  if (movement.path.kind !== 'parabola' || distance === 0) return;
  const horizontalDistance = Math.hypot(difference[0], difference[2]);
  const definition = movement.path.definition;
  if (definition.kind === 'speedGravity') {
    state.gravity = value(definition.gravity);
    const duration = horizontalDistance / speed;
    state.verticalSpeed = difference[1] / duration + state.gravity * duration * 0.5;
  } else {
    const duration = value(definition.durationSeconds);
    const vertex =
      Math.max(state.segmentStart[1], state.targetPosition[1]) +
      value(definition.vertexOffsetMeters);
    const ratio = Math.sqrt((vertex - state.segmentStart[1]) / (vertex - state.targetPosition[1]));
    const ascentDuration = (ratio * duration) / (ratio + 1);
    state.horizontalSpeed = horizontalDistance / duration;
    state.verticalSpeed = (2 * (vertex - state.segmentStart[1])) / ascentDuration;
    state.gravity = state.verticalSpeed / ascentDuration;
  }
}

/** 到达检查使用扫掠线段，不能让一帧越过目标的高速弹体漏掉 Reach。 */
export function projectileReachesPoint(
  previous: ProjectilePosition,
  current: ProjectilePosition,
  target: ProjectilePosition,
  radius: number,
): boolean {
  const tolerance = radius * radius + 0.00001;
  const remaining = subtract(target, current);
  if (remaining.reduce((sum, value) => sum + value * value, 0) <= tolerance) return true;
  const move = subtract(current, previous);
  const moveLength = length(move);
  if (moveLength <= 0.01) return false;
  const toTarget = subtract(target, previous);
  const projection =
    toTarget.reduce((sum, value, index) => sum + value * move[index]!, 0) /
    (moveLength * moveLength);
  if (projection < 0 || projection > 1) return false;
  return (
    toTarget.reduce((sum, value, index) => sum + (value - move[index]! * projection) ** 2, 0) <=
    tolerance
  );
}

export function projectileDistanceExceeded(
  state: ProjectileMovementState,
  blackboard: ActionBlackboardState,
): boolean {
  const distance = resolveProjectileValue(state.definition.finishDistanceMeters, blackboard);
  return (
    subtract(state.position, state.launchPosition).reduce((sum, value) => sum + value * value, 0) >
    distance * distance + 0.00001
  );
}

/** 球形弹体扫过目标点；与 Reach 分开，碰撞可以早于移动终点。 */
export function projectileCollidesWithTarget(
  state: ProjectileMovementState,
  blackboard: ActionBlackboardState,
  beforeMove = false,
): boolean {
  const collision = state.definition.collision;
  if (collision === undefined) return false;
  if (collision.kind === 'box') {
    const delta = beforeMove
      ? subtract(state.targetPosition, state.segmentStart)
      : subtract(state.position, state.previousPosition);
    const axes = projectileAxes(
      length(delta) === 0 ? subtract(state.targetPosition, state.segmentStart) : delta,
    );
    const target = point(collision.target, state.operatorEnemyDistanceMeters);
    const from = subtract(target, beforeMove ? state.position : state.previousPosition);
    const to = subtract(target, state.position);
    let enter = 0;
    let exit = 1;
    for (const [axis, basis] of axes.entries()) {
      const center = resolveProjectileValue(collision.centerMeters[axis]!, blackboard);
      const extent = resolveProjectileValue(collision.halfExtentsMeters[axis]!, blackboard);
      const a = from[0] * basis[0] + from[1] * basis[1] + from[2] * basis[2] - center;
      const b = to[0] * basis[0] + to[1] * basis[1] + to[2] * basis[2] - center;
      if (a === b) {
        if (Math.abs(a) > extent) return false;
        continue;
      }
      const t1 = (-extent - a) / (b - a);
      const t2 = (extent - a) / (b - a);
      enter = Math.max(enter, Math.min(t1, t2));
      exit = Math.min(exit, Math.max(t1, t2));
      if (enter > exit) return false;
    }
    return true;
  }
  if (collision.kind === 'ring') {
    const ring = state.ring!;
    const target = point(collision.target, state.operatorEnemyDistanceMeters);
    const radius = Math.hypot(target[0] - state.position[0], target[2] - state.position[2]);
    return (
      radius >= (beforeMove ? ring.innerRadius : ring.previousInnerRadius) &&
      radius <= ring.outerRadius &&
      Math.abs(target[1] - state.position[1]) <=
        resolveProjectileValue(collision.heightMeters, blackboard) * 0.5
    );
  }
  return projectileReachesPoint(
    beforeMove ? state.position : state.previousPosition,
    state.position,
    point(collision.target, state.operatorEnemyDistanceMeters),
    resolveProjectileValue(collision.radiusMeters, blackboard),
  );
}

/** 只推进当前段。回调、命中和结束均由已有生命周期按原生阶段顺序执行。 */
export function advanceProjectileMovement(
  state: ProjectileMovementState,
  blackboard: ActionBlackboardState,
  deltaSeconds: number,
  sampleRange?: ProjectileRangeSample,
): boolean {
  state.firstTick = false;
  state.previousPosition = state.position;
  const collision = state.definition.collision;
  if (collision?.kind === 'ring') {
    const ring = state.ring!;
    ring.previousInnerRadius = ring.innerRadius;
    ring.outerRadius = Math.fround(
      ring.outerRadius +
        resolveProjectileValue(collision.outerRadiusSpeed, blackboard) * deltaSeconds,
    );
    ring.innerRadius = Math.fround(
      ring.innerRadius +
        resolveProjectileValue(collision.innerRadiusSpeed, blackboard) * deltaSeconds,
    );
  }
  if (state.reached && !state.definition.keepMovingOnReach) return false;
  const segment = state.definition.segments[state.segmentIndex]!;
  const movement = segment.movement;
  if (movement.trace.kind === 'duration')
    state.traceRemainingSeconds = Math.max(
      0,
      Math.fround(state.traceRemainingSeconds - deltaSeconds),
    );
  const value = (operand: Parameters<typeof resolveProjectileValue>[0]) =>
    resolveProjectileValue(operand, blackboard);
  const difference = subtract(state.targetPosition, state.segmentStart);
  const distance = length(difference);
  const duration = value(state.definition.finishDurationSeconds);
  const sampleTime =
    (state.elapsedSeconds + (movement.path.kind === 'straight' ? 0 : deltaSeconds * 0.5)) /
    duration;
  const effectiveDelta =
    evaluateTimeScaleCurve(movement.speedCurve, sampleTime) * deltaSeconds * state.distanceScale;
  if (distance === 0) {
    state.position = state.targetPosition;
  } else if (movement.path.kind === 'straight') {
    const step = value(movement.speed) * effectiveDelta;
    state.position = [
      state.position[0] + (difference[0] / distance) * step,
      state.position[1] + (difference[1] / distance) * step,
      state.position[2] + (difference[2] / distance) * step,
    ];
  } else if (movement.path.kind === 'parabola') {
    const remaining = subtract(state.targetPosition, state.position);
    const tracing =
      !state.reached &&
      (movement.trace.kind === 'always' ||
        (movement.trace.kind === 'duration' &&
          (state.traceLimit < -0.00001 || state.traceRemainingSeconds > 0.00001)) ||
        (movement.trace.kind === 'distance' &&
          length(remaining) ** 2 > state.traceLimit ** 2 - 0.00001));
    const direction = tracing ? remaining : difference;
    const horizontalDistance = Math.hypot(direction[0], direction[2]);
    const step = state.horizontalSpeed * effectiveDelta;
    const timeToTarget = horizontalDistance / state.horizontalSpeed;
    const acceleration = tracing
      ? (2 * (remaining[1] - state.verticalSpeed * timeToTarget)) / (timeToTarget * timeToTarget)
      : -state.gravity;
    const verticalStep = state.reached
      ? (state.verticalSpeed + acceleration * effectiveDelta) * effectiveDelta
      : (state.verticalSpeed + acceleration * effectiveDelta * 0.5) * effectiveDelta;
    state.position = [
      state.position[0] +
        (horizontalDistance === 0 ? 0 : (direction[0] / horizontalDistance) * step),
      state.position[1] + verticalStep,
      state.position[2] +
        (horizontalDistance === 0 ? 0 : (direction[2] / horizontalDistance) * step),
    ];
    state.verticalSpeed += acceleration * effectiveDelta;
  } else {
    const progress = (state.scaledElapsedSeconds + effectiveDelta) / state.travelDurationSeconds;
    // 原生允许进度超过 1；强制到达在位移之后判断，不能先截断曲线参数。
    const points = [state.segmentStart, ...state.controlPoints, state.targetPosition];
    for (let count = points.length - 1; count > 0; count--)
      for (let index = 0; index < count; index++) {
        const a = points[index]!;
        const b = points[index + 1]!;
        points[index] = [
          a[0] + (b[0] - a[0]) * progress,
          a[1] + (b[1] - a[1]) * progress,
          a[2] + (b[2] - a[2]) * progress,
        ];
      }
    state.position = points[0]!;
  }
  if (!state.position.every(Number.isFinite))
    throw new Error(
      'projectile movement is undefined for these fixed endpoints and movement parameters',
    );
  state.elapsedSeconds = Math.fround(state.elapsedSeconds + deltaSeconds);
  state.scaledElapsedSeconds += effectiveDelta;
  if (state.reached) return false;
  const last = state.segmentIndex === state.definition.segments.length - 1;
  // 落地近似使用落点高度；下落穿过该高度即可阻挡，不要求同时穿过目标点。
  if (
    last &&
    state.definition.landingAtTarget &&
    !segment.skipCollision &&
    state.previousPosition[1] >= state.targetPosition[1] &&
    state.position[1] <= state.targetPosition[1] &&
    state.position[1] < state.previousPosition[1]
  ) {
    const fraction =
      (state.previousPosition[1] - state.targetPosition[1]) /
      (state.previousPosition[1] - state.position[1]);
    state.position = [
      state.previousPosition[0] + (state.position[0] - state.previousPosition[0]) * fraction,
      state.targetPosition[1],
      state.previousPosition[2] + (state.position[2] - state.previousPosition[2]) * fraction,
    ];
    state.reached = true;
    return true;
  }
  const reached =
    (movement.path.kind === 'bezier' &&
      state.scaledElapsedSeconds > state.travelDurationSeconds + 0.00001) ||
    projectileReachesPoint(
      state.previousPosition,
      state.position,
      state.targetPosition,
      value(state.definition.reachRadiusMeters),
    );
  if (reached && last) {
    state.position = state.targetPosition;
    state.reached = true;
    return true;
  }
  if (
    !last &&
    (reached ||
      (segment.earlyNextAfterSeconds !== undefined &&
        state.elapsedSeconds >= value(segment.earlyNextAfterSeconds)))
  ) {
    state.segmentIndex++;
    startSegment(state, blackboard, sampleRange);
  }
  return false;
}
