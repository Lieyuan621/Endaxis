/**
 * 投射物寿命的无状态算法。每次调用显式接收当前数据和本次步进的宿主端口。
 * 保留原生结束、标记回收、reset 三个阶段及 float32 运算；不推导空间命中或更改技能规则。
 */
import type { CombatStepParameters } from '../../game-data/operatorDefinition';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { ProjectileLifecycleState } from '../state/instanceState';

export type ProjectileFinishTiming = CombatStepParameters['launchProjectile']['finish'];

export interface ProjectileLaunchData {
  readonly callbacks?: readonly import('../state/instanceState').ProjectileCallbackState[];
  readonly source?: RuntimeTargetRef;
  readonly finishDelaySeconds: ProjectileFinishTiming;
  readonly recycleDelaySeconds: number;
  /** 仅用于编译器已证明的单目标至多一次命中；命中过滤由 hit 端口执行。 */
  readonly firstTickHit?: {
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
  const finishOnFirstTick = request.finishDelaySeconds === 'firstTickReach';
  const blockOnFirstTick = request.finishDelaySeconds === 'firstTickBlock';
  if (request.firstTickHit?.retryRejectedHit && typeof request.finishDelaySeconds !== 'number')
    throw new Error('retrying projectile hits requires a duration-only lifetime');
  const segmented =
    typeof request.finishDelaySeconds === 'object' ? request.finishDelaySeconds : null;
  if (
    segmented !== null &&
    (!Number.isSafeInteger(segmented.reachAfterTicks) || segmented.reachAfterTicks < 1)
  )
    throw new RangeError('projectile reach tick count must be a positive safe integer');
  const finishDelay = Math.fround(
    segmented?.maxDurationSeconds ??
      (typeof request.finishDelaySeconds === 'number' ? request.finishDelaySeconds : 0),
  );
  const recycleDelay = Math.fround(request.recycleDelaySeconds);
  if (
    !finishOnFirstTick &&
    !blockOnFirstTick &&
    (!Number.isFinite(finishDelay) || finishDelay <= 0)
  )
    throw new RangeError('projectile finish delay must be positive and finite');
  if (!Number.isFinite(recycleDelay) || request.recycleDelaySeconds < 0)
    throw new RangeError('projectile recycle delay must be non-negative and finite');
  if (!Number.isSafeInteger(instanceId) || instanceId <= 0)
    throw new RangeError('projectile AbilityEntity instance id must be a positive safe integer');
  if (state.instances.has(instanceId))
    throw new Error(`duplicate projectile AbilityEntity instance id '${instanceId}'`);
  state.instances.set(instanceId, {
    callbacks: request.callbacks ?? [],
    instanceId,
    ...(request.source === undefined ? {} : { source: { ...request.source } }),
    phase: 'active',
    remainingSeconds: finishDelay,
    remainingReachTicks: finishOnFirstTick ? 1 : (segmented?.reachAfterTicks ?? null),
    ...(blockOnFirstTick ? { pendingBlock: true } : {}),
    finishOnReach: segmented?.finishOnReach ?? true,
    firstTickHit:
      request.firstTickHit === undefined ? null : { pending: true, ...request.firstTickHit },
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

/** 端口只在推进过程中使用，不保存在状态中。相互触发的事件仍然同步执行。 */
export interface ProjectileLifecycleHost {
  resolveTickDeltaSeconds(instanceId: number): number | null;
  /** 到达回调发生在结束标记之前；持续时间耗尽不会触发到达。 */
  reach?(instanceId: number): void;
  block?(instanceId: number): void;
  /** 返回是否实际命中；被过滤的碰撞不能触发命中次数上限导致的结束。 */
  hit?(instanceId: number): boolean;
  finish(instanceId: number): void;
  beforeReset(instanceId: number): void;
  resolveResetHandler(handlerId: number): () => void;
  released(instanceId: number): void;
}

export function advanceProjectileLifetimes(
  state: ProjectileLifecycleState,
  host: ProjectileLifecycleHost,
): void {
  // 结束回调可再发射投射物，新对象不在本轮准入集合里。
  for (const instance of [...state.instances.values()]) {
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
        state.instances.delete(instance.instanceId);
        host.released(instance.instanceId);
      }
      continue;
    }
    // 首个移动 Tick 先碰撞再移动/到达。命中回调执行时对象还未结束，查找应能看见它。
    if (
      instance.phase === 'active' &&
      instance.firstTickHit?.pending &&
      !instance.firstTickHit.onReach
    ) {
      instance.firstTickHit.pending = false;
      if (host.hit === undefined) throw new Error('projectile first-tick hit requires a hit port');
      const hit = host.hit(instance.instanceId);
      if (!hit && instance.firstTickHit.retryRejectedHit) instance.firstTickHit.pending = true;
      if (hit && instance.firstTickHit.finishOnHit) {
        instance.phase = 'finished';
        instance.remainingReachTicks = null;
        instance.remainingSeconds = instance.recycleDelaySeconds;
        host.finish(instance.instanceId);
        continue;
      }
    }
    if (instance.phase === 'active' && instance.pendingBlock) {
      instance.pendingBlock = false;
      host.block?.(instance.instanceId);
      instance.phase = 'finished';
      instance.remainingReachTicks = null;
      instance.remainingSeconds = instance.recycleDelaySeconds;
      host.finish(instance.instanceId);
      continue;
    }
    // 原生 Update 使用 remaining <= 0，不能套用 isReady 的 epsilon。
    instance.remainingSeconds = Math.max(0, Math.fround(instance.remainingSeconds - nativeDelta));
    if (instance.phase === 'active' && instance.remainingReachTicks !== null)
      instance.remainingReachTicks--;
    if (instance.remainingSeconds > 0 && instance.remainingReachTicks !== 0) continue;
    if (instance.phase === 'active') {
      const reached = instance.remainingReachTicks === 0;
      instance.remainingReachTicks = null;
      let finishedByHit = false;
      if (reached && instance.firstTickHit?.pending && instance.firstTickHit.onReach) {
        instance.firstTickHit.pending = false;
        if (host.hit === undefined) throw new Error('projectile reach hit requires a hit port');
        finishedByHit = host.hit(instance.instanceId) && instance.firstTickHit.finishOnHit;
      }
      if (reached) host.reach?.(instance.instanceId);
      if (reached && !instance.finishOnReach && !finishedByHit && instance.remainingSeconds > 0)
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
  state.admittedAbilities = [...state.instances.keys()];
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
