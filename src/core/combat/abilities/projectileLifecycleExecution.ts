import type { ProjectileCallbackState, ProjectileHitTargets } from '../state/instanceState';
import type { ResolvedProjectileFlight } from '../state/projectileMovementState';
import {
  advanceProjectileMovement,
  createProjectileMovement,
  projectileDistanceExceeded,
  projectileCollidesWithTarget,
  type ProjectileRangeSample,
  resolveProjectileValue,
} from './projectileMovementExecution';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { createActionBlackboardState, type ActionBlackboardState } from '../state/foundationState';
import type { ProjectileLifecycleState, ProjectileLifetimeState } from '../state/instanceState';

export interface ProjectileLaunchData {
  readonly originCastId?: string;
  readonly sampleRange?: ProjectileRangeSample;
  readonly flight: ResolvedProjectileFlight;
  readonly operatorEnemyDistanceMeters?: number;
  readonly entityBlackboard?: ActionBlackboardState;
  readonly callbacks?: readonly ProjectileCallbackState[];
  readonly hitTargets?: ProjectileHitTargets;
  readonly source?: RuntimeTargetRef;
  readonly recycleDelaySeconds: number;
  /** 命中次数与检测规则；逐目标过滤由 hit 端口执行。 */
  readonly hitPolicy?: {
    readonly maxHitCount?: number;
    readonly repeatIntervalSeconds?: number;
    readonly finishOnHit: boolean;
    readonly retryRejectedHit?: boolean;
    readonly onReach?: boolean;
  };
}

/** 创建的是过去发射行为产生的待处理对象，必须随状态保存。编号由整场实体分配器提供。 */
export function launchProjectile(
  state: ProjectileLifecycleState,
  instanceId: number,
  request: ProjectileLaunchData,
): void {
  const blackboard = request.entityBlackboard ?? createActionBlackboardState();
  const movement = createProjectileMovement(
    request.flight,
    request.operatorEnemyDistanceMeters ?? 0,
    blackboard,
    request.sampleRange,
  );
  if (request.hitPolicy && !request.hitPolicy.onReach && !request.flight.collision)
    throw new Error(
      'projectile flight collision shape must be projected before enabling collision hits',
    );
  const finishDelay = Math.fround(
    resolveProjectileValue(request.flight.finishDurationSeconds, blackboard),
  );
  const recycleDelay = Math.fround(request.recycleDelaySeconds);
  if (!Number.isFinite(finishDelay) || finishDelay <= 0)
    throw new RangeError('projectile finish delay must be positive and finite');
  if (!Number.isFinite(recycleDelay) || request.recycleDelaySeconds < 0)
    throw new RangeError('projectile recycle delay must be non-negative and finite');
  if (!Number.isSafeInteger(instanceId) || instanceId <= 0)
    throw new RangeError('projectile AbilityEntity instance id must be a positive safe integer');
  if (state.instances.has(instanceId))
    throw new Error(`duplicate projectile AbilityEntity instance id '${instanceId}'`);
  state.instances.set(instanceId, {
    originCastId: request.originCastId,
    callbacks: request.callbacks ?? [],
    hitTargets: request.hitTargets,
    entityBlackboard: blackboard,
    movement,
    buffs: null,
    instanceId,
    ...(request.source === undefined ? {} : { source: { ...request.source } }),
    phase: 'active',
    remainingSeconds: finishDelay,
    finishOnReach: request.flight.finishOnReach,
    hitState: request.hitPolicy === undefined ? null : { pending: true, ...request.hitPolicy },
    recycleDelaySeconds: recycleDelay,
    resetListeners: new Map(),
  });
}

export function registerProjectileReset(
  state: ProjectileLifecycleState,
  instanceId: number,
  handlerId: number,
): number {
  const instance = state.instances.get(instanceId);
  if (instance === undefined || instance.phase === 'reset')
    throw new Error('cannot retain an already reset projectile');
  const id = state.nextResetRegistrationId++;
  instance.resetListeners.set(id, handlerId);
  return id;
}

export function unregisterProjectileReset(
  state: ProjectileLifecycleState,
  instanceId: number,
  registrationId: number,
): void {
  state.instances.get(instanceId)?.resetListeners.delete(registrationId);
}

/** FinishOwner 的 ByAction/null：停止飞行，不施放结束技能，仍经过延迟回收及 reset。 */
export function finishProjectileByAction(
  state: ProjectileLifecycleState,
  instanceId: number,
): boolean {
  const instance = state.instances.get(instanceId);
  if (!instance || instance.phase === 'reset') return false;
  if (instance.phase === 'active') {
    instance.phase = 'finished';
    instance.remainingSeconds = instance.recycleDelaySeconds;
    if (instance.hitState) instance.hitState.pending = false;
  }
  return true;
}

/** 端口只在推进过程中使用，不保存在状态中。相互触发的事件仍然同步执行。 */
export interface ProjectileLifecycleHost {
  sampleRange?(instanceId: number, minimum: number, maximum: number): number;
  resolveTickDeltaSeconds(instanceId: number): number | null;
  /** 到达回调发生在结束标记之前；持续时间耗尽不会触发到达。 */
  reach?(instanceId: number): void;
  block?(instanceId: number): void;
  /** 返回实际接受的目标数；被过滤的目标不累计命中次数。 */
  hit?(instanceId: number): number;
  finish(instanceId: number): void;
  beforeReset(instanceId: number): void;
  resolveResetHandler(handlerId: number): () => void;
  released(instanceId: number): void;
}

/** 回调可以主动销毁弹体；其结果优先于命中次数导致的结束。 */
function applyCollisionHit(
  instance: ProjectileLifetimeState,
  host: ProjectileLifecycleHost,
): boolean {
  const hitState = instance.hitState!;
  hitState.pending = false;
  if (host.hit === undefined) throw new Error('projectile collision requires a hit port');
  const hit = host.hit(instance.instanceId);
  if (instance.phase !== 'active') return true;
  if (hitState.repeatIntervalSeconds !== undefined || hitState.retryRejectedHit)
    hitState.pending = true;
  if (!hit || !recordProjectileHit(instance, hit)) return false;
  instance.phase = 'finished';
  instance.remainingSeconds = instance.recycleDelaySeconds;
  host.finish(instance.instanceId);
  return true;
}

function recordProjectileHit(instance: ProjectileLifetimeState, count: number): boolean {
  const hit = instance.hitState!;
  hit.hitCount = (hit.hitCount ?? 0) + count;
  const maximum = hit.maxHitCount ?? (hit.finishOnHit ? 1 : -1);
  return maximum > 0 && hit.hitCount >= maximum;
}

/** 回调取得事件发生时的位置快照，后续移动或回收不改变已传出的空间点。 */
function captureCallbackPosition(
  instance: ProjectileLifetimeState,
  event: 'reach' | 'block',
): void {
  const position =
    event === 'reach' ? instance.movement.targetPosition : instance.movement.position;
  for (const callback of instance.callbacks) {
    if (callback.event !== event || callback.inputTarget?.kind !== 'spatialPoint') continue;
    callback.inputTarget = { ...callback.inputTarget, position: [...position] };
  }
}

function applyMovementCollision(
  instance: ProjectileLifetimeState,
  host: ProjectileLifecycleHost,
  skipCollision: boolean | undefined,
): boolean {
  const movement = instance.movement;
  return (
    instance.phase === 'active' &&
    !skipCollision &&
    !!instance.hitState?.pending &&
    !instance.hitState.onReach &&
    projectileCollidesWithTarget(movement, instance.entityBlackboard) &&
    applyCollisionHit(instance, host)
  );
}

/** 推进移动与碰撞；结束、标记回收和重置分别处理，回调由当前步进宿主提供。 */
export function advanceProjectileLifetimes(
  state: ProjectileLifecycleState,
  host: ProjectileLifecycleHost,
): void {
  // 结束回调可再发射投射物，新对象不在本轮准入集合里。
  for (const instance of [...state.instances.values()]) {
    if (instance.phase === 'reset') continue;
    const delta = host.resolveTickDeltaSeconds(instance.instanceId);
    if (delta === null) continue;
    const nativeDelta = Math.fround(delta);
    if (!Number.isFinite(nativeDelta) || delta < 0)
      throw new RangeError('projectile Tick delta must be non-negative and finite');
    if (instance.phase === 'marked') {
      host.beforeReset(instance.instanceId);
      instance.phase = 'reset';
      try {
        const callbacks = [...instance.resetListeners.values()].map(id =>
          host.resolveResetHandler(id),
        );
        for (const callback of callbacks) callback();
      } finally {
        instance.resetListeners.clear();
        delete instance.source;
        // 回池不等于实体释放。剩余 Buff 保留状态和引用，但不再随投射物计时。
        if (!instance.buffs?.instances.size) state.instances.delete(instance.instanceId);
        host.released(instance.instanceId);
      }
      continue;
    }
    // 首个移动 Tick 先碰撞再移动/到达。命中回调执行时对象还未结束，查找应能看见它。
    if (
      instance.phase === 'active' &&
      instance.hitState?.pending &&
      !instance.hitState.onReach &&
      instance.movement.firstTick &&
      !instance.movement.definition.segments[instance.movement.segmentIndex]!.skipCollision &&
      projectileCollidesWithTarget(instance.movement, instance.entityBlackboard, true)
    ) {
      if (applyCollisionHit(instance, host)) continue;
    }
    const movement = instance.phase === 'active' ? instance.movement : undefined;
    const skipCollision = movement?.definition.segments[movement.segmentIndex]!.skipCollision;
    const reachedByMovement =
      movement !== undefined &&
      advanceProjectileMovement(
        movement,
        instance.entityBlackboard,
        nativeDelta,
        host.sampleRange === undefined
          ? undefined
          : (minimum, maximum) => host.sampleRange!(instance.instanceId, minimum, maximum),
      );
    const collisionAfterReach = reachedByMovement && !movement?.definition.hitBeforeReach;
    if (!collisionAfterReach && applyMovementCollision(instance, host, skipCollision)) continue;
    // 原生 Update 使用 remaining <= 0，不能套用 isReady 的 epsilon。
    instance.remainingSeconds = Math.max(0, Math.fround(instance.remainingSeconds - nativeDelta));
    let exceededDistance =
      movement !== undefined && projectileDistanceExceeded(movement, instance.entityBlackboard);
    if (instance.remainingSeconds > 0 && !reachedByMovement && !exceededDistance) continue;
    if (instance.phase === 'active') {
      const reached = reachedByMovement;
      if (reached && movement?.definition.landingAtTarget) {
        captureCallbackPosition(instance, 'block');
        host.block?.(instance.instanceId);
        if (instance.phase !== 'active') continue;
        instance.phase = 'finished';
        instance.remainingSeconds = instance.recycleDelaySeconds;
        continue;
      }
      let finishedByHit = false;
      // _TriggerReach 先施放 Reach 技能，随后才执行 hitOnReach。
      if (reached) {
        captureCallbackPosition(instance, 'reach');
        host.reach?.(instance.instanceId);
      }
      if (instance.phase !== 'active') continue;
      if (reached && instance.hitState?.pending && instance.hitState.onReach) {
        instance.hitState.pending = false;
        if (host.hit === undefined) throw new Error('projectile reach hit requires a hit port');
        const count = host.hit(instance.instanceId);
        finishedByHit = count > 0 && recordProjectileHit(instance, count);
        if (instance.phase !== 'active') continue;
      }
      // Reach/Hit 技能可以写实体变量，距离上限必须读取回调后的值。
      if (movement !== undefined && reached)
        exceededDistance = projectileDistanceExceeded(movement, instance.entityBlackboard);
      if (
        collisionAfterReach &&
        !instance.finishOnReach &&
        !finishedByHit &&
        applyMovementCollision(instance, host, skipCollision)
      )
        continue;
      if (
        reached &&
        !instance.finishOnReach &&
        !finishedByHit &&
        !exceededDistance &&
        instance.remainingSeconds > 0
      )
        continue;
      instance.phase = 'finished';
      instance.remainingSeconds = instance.recycleDelaySeconds;
      host.finish(instance.instanceId);
    } else {
      instance.phase = 'marked';
    }
  }
}

export function beginProjectileAbilityFrame(state: ProjectileLifecycleState): void {
  if (state.admittedAbilities !== null)
    throw new Error('projectile ability phase has not finished');
  state.admittedAbilities = [...state.instances.values()]
    .filter(instance => instance.phase !== 'reset')
    .map(instance => instance.instanceId);
}

export function advanceProjectileAbilityFrame(
  state: ProjectileLifecycleState,
  advanceAbility: (instanceId: number) => void,
): void {
  const admitted = state.admittedAbilities;
  if (admitted === null) throw new Error('projectile ability phase must be captured first');
  try {
    for (const id of admitted) {
      const instance = state.instances.get(id);
      if (instance !== undefined && instance.phase !== 'reset') advanceAbility(id);
    }
  } finally {
    state.admittedAbilities = null;
  }
}
