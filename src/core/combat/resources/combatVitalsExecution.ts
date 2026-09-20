/** 生命、治疗与失衡推进算法；计时边界仍先更新状态，再同步通知调用方。 */
import type { CombatVitalsState } from '../state/environmentState';
import type { HealthDamageResult, HealthHealResult, PoiseTimerTransition } from './combatVitals';
import {
  isPeriodicTimerValid,
  isPeriodicTimerReady,
  resetPeriodicTimer,
  invalidatePeriodicTimer,
  updatePeriodicTimer,
} from '../time/periodicTimerExecution';
const POISE_EPSILON = 0.00001;

export function hasVitalsPoise(state: CombatVitalsState): boolean {
  return state.maxPoise > POISE_EPSILON;
}
export function inVitalsPoiseRecovery(state: CombatVitalsState): boolean {
  return (
    isPeriodicTimerValid(state.poiseRecoveryTimer) &&
    !isPeriodicTimerReady(state.poiseRecoveryTimer)
  );
}

export function takeVitalsDamage(state: CombatVitalsState, value: number): HealthDamageResult {
  const previousHealth = state.health;
  const requestedDamage = Math.max(0, value);
  const floor = state.healthFloors.size === 0 ? 0 : Math.max(...state.healthFloors.values());
  // 安装高于当前生命的下限不会反向治疗；它只约束后续生命减少。
  state.health = Math.min(previousHealth, Math.max(floor, state.health - requestedDamage));
  return {
    requestedDamage,
    actualDamage: previousHealth - state.health,
    previousHealth,
    currentHealth: state.health,
  };
}

export function healVitals(state: CombatVitalsState, value: number): HealthHealResult {
  if (!Number.isFinite(value)) throw new RangeError('healing must be finite');
  const previousHealth = state.health;
  const requestedHealing = Math.max(0, value);
  state.health = Math.min(state.maxHealth, state.health + requestedHealing);
  const actualHealing = state.health - previousHealth;
  return {
    requestedHealing,
    actualHealing,
    overhealing: requestedHealing - actualHealing,
    previousHealth,
    currentHealth: state.health,
  };
}

export function applyVitalsPoiseDelta(state: CombatVitalsState, delta: number): number {
  if (!hasVitalsPoise(state)) return 0;
  const previousPoise = state.poise;
  const next = Math.min(state.maxPoise, Math.max(0, state.poise + delta));
  if (Math.abs(next - state.poise) > POISE_EPSILON) state.poise = next;
  return state.poise - previousPoise;
}

export function beginVitalsPoiseBreak(state: CombatVitalsState): boolean {
  if (
    !hasVitalsPoise(state) ||
    inVitalsPoiseRecovery(state) ||
    Math.abs(state.poise) > POISE_EPSILON
  ) {
    return false;
  }
  const recoveryTime = state.poiseRecoveryTime * state.poiseRecoveryTimeMultiplier;
  if (recoveryTime > 0) resetPeriodicTimer(state.poiseRecoveryTimer, recoveryTime, true);
  invalidatePeriodicTimer(state.poiseBrokenEndTimer);
  state.hasPoiseBrokenTag = true;
  return true;
}

export function tickVitals(
  state: CombatVitalsState,
  deltaTime: number,
  onTransition?: (transition: PoiseTimerTransition) => void,
): readonly PoiseTimerTransition[] {
  const transitions: PoiseTimerTransition[] = [];
  if (
    isPeriodicTimerValid(state.poiseRecoveryTimer) &&
    !state.stopPoiseRecovery &&
    updatePeriodicTimer(state.poiseRecoveryTimer, deltaTime)
  ) {
    invalidatePeriodicTimer(state.poiseRecoveryTimer);
    state.poise = state.maxPoise;
    if (state.poiseBrokenEndTime > 0) {
      resetPeriodicTimer(state.poiseBrokenEndTimer, state.poiseBrokenEndTime, true);
    } else {
      state.hasPoiseBrokenTag = false;
    }
    transitions.push('poiseRecovered');
    onTransition?.('poiseRecovered');
  }
  if (
    isPeriodicTimerValid(state.poiseBrokenEndTimer) &&
    updatePeriodicTimer(state.poiseBrokenEndTimer, deltaTime)
  ) {
    invalidatePeriodicTimer(state.poiseBrokenEndTimer);
    state.hasPoiseBrokenTag = false;
    transitions.push('poiseBrokenTagEnded');
    onTransition?.('poiseBrokenTagEnded');
  }
  return transitions;
}

/** 返回本次下限的编号，移除关系由宿主在当前分支执行。 */
export function registerVitalsHealthFloor(state: CombatVitalsState, value: number): number {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError('health floor must be a non-negative finite number');
  const id = state.nextHealthFloorId++;
  state.healthFloors.set(id, Math.min(value, state.maxHealth));
  return id;
}
export function removeVitalsHealthFloor(state: CombatVitalsState, id: number): void {
  state.healthFloors.delete(id);
}
