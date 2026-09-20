/** Buff 寿命推进与 MarkFinish 的无状态算法，保留同步动作和状态赋值的原有顺序。 */
import type { BuffFinishReason } from '../state/foundationState';
import { type BuffReference } from '../state/foundationState';
import type {
  BuffChildrenState,
  BuffLifecycleState,
  BuffTriggerState,
} from '../state/instanceState';
import { buffReferenceKey } from './buffReference';

export function refreshBuffDuration(state: BuffLifecycleState, incoming: number | null): void {
  if (state.remainingDuration === null || incoming === null) state.remainingDuration = null;
  else if (incoming > state.remainingDuration + 0.00001) state.remainingDuration = incoming;
}

export function extendBuffDuration(state: BuffLifecycleState, incoming: number | null): void {
  if (state.remainingDuration === null || incoming === null) state.remainingDuration = null;
  else state.remainingDuration += incoming;
}

/** 原生 RawSetLifeTime 不把无限时长实例改为有限时长。 */
export function setFiniteBuffDuration(state: BuffLifecycleState, duration: number): void {
  if (state.remainingDuration !== null) state.remainingDuration = Math.max(0, duration);
}

/** 增层事件先于属性刷新，事件读取到新层数和旧属性。 */
export function enhanceBuffLifecycle(
  state: BuffLifecycleState,
  host: {
    changed(): void;
    refreshAttributes(): void;
  },
): void {
  state.enhanceCount += 1;
  host.changed();
  host.refreshAttributes();
}

export function decreaseBuffEnhancements(
  state: BuffLifecycleState,
  count: number,
  host: {
    finish(): boolean;
    changed(): void;
    refreshAttributes(): void;
    refreshStacking(): void;
    notify(): void;
  },
): boolean {
  if (state.finished || count <= 0) return false;
  if (state.enhanceCount <= count) return host.finish();
  state.enhanceCount -= count;
  host.changed();
  host.refreshAttributes();
  host.refreshStacking();
  host.notify();
  return true;
}

export interface BuffFinishHost {
  addExtendTags(): void;
  finishAction(): void;
  endDuringEnable(): void;
  finishChildren(): void;
  removeExtendTags(): void;
  refreshStacking(): void;
  unregisterModifiers(): void;
  notifyFinished(): void;
}

export function finishBuffLifecycle(
  state: BuffLifecycleState,
  reason: BuffFinishReason,
  host: BuffFinishHost,
): boolean {
  if (state.finished || state.finishing) return false;
  if (!state.finishable) {
    host.addExtendTags();
    return false;
  }
  state.finishing = true;
  state.finishReason = reason;
  host.finishAction();
  host.endDuringEnable();
  const hadRegisteredModifiers = state.enabled;
  state.enabled = false;
  state.finished = true;
  host.finishChildren();
  host.removeExtendTags();
  host.refreshStacking();
  if (hadRegisteredModifiers) host.unregisterModifiers();
  state.finishing = false;
  host.notifyFinished();
  return true;
}

export interface BuffTickHost {
  trigger(elapsed: number): void;
  tickDuringEnable(elapsed: number): void;
  canTimedGrow(): boolean;
  growTimed(): boolean;
  finishLifetime(): void;
}

export function tickBuffLifecycle(
  state: BuffLifecycleState,
  delta: number,
  host: BuffTickHost,
): void {
  if (state.finished) return;
  if (!Number.isFinite(delta)) throw new TypeError('buff delta time must be finite');
  if (state.timePaused) return;
  const elapsed = Math.max(0, delta);
  state.passedTime += elapsed;
  if (state.enabled) {
    host.trigger(elapsed);
    host.tickDuringEnable(elapsed);
  }
  if (state.timedGrowthPeriod !== null) {
    if (!host.canTimedGrow()) return;
    state.timedGrowthRemaining -= elapsed;
    while (state.timedGrowthRemaining <= 0.00001) {
      if (!host.growTimed()) {
        state.timedGrowthRemaining = state.timedGrowthPeriod;
        break;
      }
      state.timedGrowthRemaining += state.timedGrowthPeriod;
      if (!host.canTimedGrow()) {
        state.timedGrowthRemaining = state.timedGrowthPeriod;
        break;
      }
    }
    return;
  }
  if (state.remainingDuration === null) return;
  state.remainingDuration -= elapsed;
  if (state.remainingDuration <= 0.00001) host.finishLifetime();
}

/** 父子关系算法。结束时沿用实时遍历，结束回调中新添的子实例也在本轮处理。 */

export function attachBuffChild(state: BuffChildrenState, reference: BuffReference): void {
  state.members.set(buffReferenceKey(reference), reference);
}

export function finishBuffChildren(
  state: BuffChildrenState,
  finish: (reference: BuffReference) => void,
): void {
  for (const reference of state.members.values()) finish(reference);
  state.members.clear();
}

/**
 * Buff 周期触发的无状态算法。按原有余量和 epsilon 补齐本帧到期次数。
 * 每次触发可同步关闭宿主，因此必须在每一项之前重新检查，不能先算好次数后盲目全执行。
 */

const BUFF_LIFETIME_EPSILON = 0.00001;

export function advanceBuffTriggers(
  state: BuffTriggerState,
  deltaTime: number,
  host: { isEnabled(): boolean; trigger(): void },
): void {
  if (state.remainingCount === 0 || state.intervalSeconds === null) return;
  state.remainingSeconds -= deltaTime;
  if (state.remainingSeconds > BUFF_LIFETIME_EPSILON) return;
  const triggerCount = Math.max(0, Math.trunc(-state.remainingSeconds / state.intervalSeconds)) + 1;
  state.remainingSeconds += triggerCount * state.intervalSeconds;
  for (let index = 0; index < triggerCount; index++) {
    if (state.remainingCount === 0 || !host.isEnabled()) break;
    state.remainingCount -= 1;
    host.trigger();
  }
}
