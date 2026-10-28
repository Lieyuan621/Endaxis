import type { ProjectileCallbackState, ProjectileHitTargets } from '../state/instanceState';
import { advanceProjectileSchedule } from './projectileScheduleExecution';
import { createProjectileScheduleState } from '../state/projectileScheduleState';
import type { ProjectileLaunchSchedule } from '../../../../packages/game-data-contract/src/projectileSchedule';

import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { createActionBlackboardState, type ActionBlackboardState } from '../state/foundationState';
import type { ProjectileLifecycleState } from '../state/instanceState';

export interface ProjectileLaunchData {
  readonly schedule: ProjectileLaunchSchedule;
  readonly originCastId?: string;

  readonly entityBlackboard?: ActionBlackboardState;
  readonly callbacks?: readonly ProjectileCallbackState[];
  readonly hitTargets?: ProjectileHitTargets;
  readonly source?: RuntimeTargetRef;
  readonly recycleDelaySeconds: number;
}

/** 创建的是过去发射行为产生的待处理对象，必须随状态保存。编号由整场实体分配器提供。 */
export function launchProjectile(
  state: ProjectileLifecycleState,
  instanceId: number,
  request: ProjectileLaunchData,
): void {
  const blackboard = request.entityBlackboard ?? createActionBlackboardState();
  const finishDelay = Math.fround(request.schedule.endFrame / 30);
  const recycleDelay = Math.fround(request.recycleDelaySeconds);
  if (!Number.isFinite(finishDelay) || finishDelay < 0)
    throw new RangeError('projectile finish delay must be positive and finite');
  if (!Number.isFinite(recycleDelay) || request.recycleDelaySeconds < 0)
    throw new RangeError('projectile recycle delay must be non-negative and finite');
  if (!Number.isSafeInteger(instanceId) || instanceId <= 0)
    throw new RangeError('projectile AbilityEntity instance id must be a positive safe integer');
  if (state.instances.has(instanceId))
    throw new Error(`duplicate projectile AbilityEntity instance id '${instanceId}'`);
  state.instances.set(instanceId, {
    schedule: createProjectileScheduleState(request.schedule),
    originCastId: request.originCastId,
    callbacks: request.callbacks ?? [],
    hitTargets: request.hitTargets,
    entityBlackboard: blackboard,
    buffs: null,
    instanceId,
    ...(request.source === undefined ? {} : { source: { ...request.source } }),
    phase: 'active',
    remainingSeconds: finishDelay,

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
  }
  return true;
}

/** 端口只在推进过程中使用，不保存在状态中。相互触发的事件仍然同步执行。 */
export interface ProjectileLifecycleHost {
  invokeScheduledCallback?(instanceId: number, callbackIndex: number): void;

  resolveTickDeltaSeconds(instanceId: number): number | null;
  beforeReset(instanceId: number): void;
  resolveResetHandler(handlerId: number): () => void;
  released(instanceId: number): void;
}

/** 按实例时钟执行回调时间表，并处理回收和重置。 */
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
    if (instance.phase === 'active') {
      const invoke = host.invokeScheduledCallback;
      if (!invoke && instance.schedule.definition.callbacks.length)
        throw new Error('projectile schedule requires a callback port');
      advanceProjectileSchedule(
        instance.schedule,
        nativeDelta,
        () => instance.phase === 'active',
        index => invoke?.(instance.instanceId, index),
      );
      if (
        instance.phase === 'active' &&
        instance.schedule.elapsedFrames >= instance.schedule.definition.endFrame
      ) {
        instance.phase = 'finished';
        instance.remainingSeconds = instance.recycleDelaySeconds;
      }
    } else {
      instance.remainingSeconds = Math.max(0, Math.fround(instance.remainingSeconds - nativeDelta));
      if (instance.remainingSeconds === 0) instance.phase = 'marked';
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
