/**
 * 单个战斗实体生命和失衡状态的唯一所有者。
 * 这里只维护数值与计时，不发布 UI 状态；事件和事实记录由上层运行时适配器负责。
 */
import { createPeriodicTimerState, type CombatVitalsState } from '../state/environmentState';
import {
  hasVitalsPoise,
  inVitalsPoiseRecovery,
  takeVitalsDamage,
  healVitals,
  applyVitalsPoiseDelta,
  beginVitalsPoiseBreak,
  tickVitals,
  registerVitalsHealthFloor,
  removeVitalsHealthFloor,
} from './combatVitalsExecution';
import { isPeriodicTimerValid, readPeriodicTimerProgress } from '../time/periodicTimerExecution';

/** 创建一个实体生命与失衡账本所需的完整初始状态。 */
export interface CombatVitalsSnapshot {
  readonly health: number;
  readonly maxHealth: number;
  readonly maxPoise: number;
  readonly poiseKnotThresholds?: readonly number[];
  readonly poise: number;
  readonly poiseRecoveryTime: number;
  readonly poiseRecoveryTimeMultiplier: number;
  readonly poiseBrokenEndTime: number;
  readonly poiseImmune: boolean;
}

/** 一次生命伤害写入的请求值、实际值和前后状态。 */
export interface HealthDamageResult {
  readonly requestedDamage: number;
  readonly actualDamage: number;
  readonly previousHealth: number;
  readonly currentHealth: number;
}

/** 一次治疗写入的原始值、实际值、溢出值和前后状态。 */
export interface HealthHealResult {
  readonly requestedHealing: number;
  readonly actualHealing: number;
  readonly overhealing: number;
  readonly previousHealth: number;
  readonly currentHealth: number;
}

/** 失衡计时器跨越边界时可能发布的状态转换。 */
export type PoiseTimerTransition = 'poiseRecovered' | 'poiseBrokenTagEnded';

/** 现有宿主接口；动作宿主保存生命下限编号，恢复后可在当前分支按编号移除。 */
export class CombatVitals {
  readonly runtimeState: CombatVitalsState;
  private healthChanged?: () => void;

  /** 装配当前分支的事件出口；恢复只绑定，不重放生命变化。 */
  bindHealthChangeObserver(observer: () => void): void {
    this.healthChanged = observer;
  }

  /** 为恢复后的生命与失衡数据建立对象接口，不重置计时器或生命下限登记。 */
  static bindRuntimeState(state: CombatVitalsState): CombatVitals {
    return CombatVitals.bind(state);
  }

  constructor(snapshot: CombatVitalsSnapshot) {
    this.runtimeState = createCombatVitalsState(snapshot);
  }

  private static bind(state: CombatVitalsState): CombatVitals {
    const vitals = Object.create(CombatVitals.prototype) as CombatVitals;
    Object.defineProperty(vitals, 'runtimeState', {
      value: state,
      enumerable: true,
      configurable: false,
      writable: false,
    });
    return vitals;
  }
  get health(): number {
    return this.runtimeState.health;
  }
  get maxHealth(): number {
    return this.runtimeState.maxHealth;
  }
  get poise(): number {
    return this.runtimeState.poise;
  }
  get maxPoise(): number {
    return this.runtimeState.maxPoise;
  }
  /** 当前损失比例已达到的节点数；恢复和切面恢复直接由同一账本得出。 */
  get brokenPoiseKnotCount(): number {
    if (!this.hasPoise) return 0;
    const lostRatio = 1 - this.poise / this.maxPoise;
    return this.runtimeState.poiseKnotThresholds.filter(threshold => lostRatio >= threshold - 1e-5)
      .length;
  }
  get hasPoise(): boolean {
    return hasVitalsPoise(this.runtimeState);
  }
  get poiseImmune(): boolean {
    return this.runtimeState.poiseImmune;
  }
  set poiseImmune(value: boolean) {
    this.runtimeState.poiseImmune = value;
  }
  get inPoiseRecovery(): boolean {
    return inVitalsPoiseRecovery(this.runtimeState);
  }
  get poiseRecoveryProgress(): number {
    return isPeriodicTimerValid(this.runtimeState.poiseRecoveryTimer)
      ? readPeriodicTimerProgress(this.runtimeState.poiseRecoveryTimer)
      : 0;
  }
  get hasPoiseBrokenTag(): boolean {
    return this.runtimeState.hasPoiseBrokenTag;
  }
  set stopPoiseRecovery(value: boolean) {
    this.runtimeState.stopPoiseRecovery = value;
  }
  takeDamage(value: number): HealthDamageResult {
    const result = takeVitalsDamage(this.runtimeState, value);
    if (result.currentHealth !== result.previousHealth) this.healthChanged?.();
    return result;
  }
  heal(value: number): HealthHealResult {
    const result = healVitals(this.runtimeState, value);
    if (result.currentHealth !== result.previousHealth) this.healthChanged?.();
    return result;
  }
  applyPoiseDelta(delta: number): number {
    return applyVitalsPoiseDelta(this.runtimeState, delta);
  }
  beginPoiseBreakIfZero(): boolean {
    return beginVitalsPoiseBreak(this.runtimeState);
  }
  tick(
    deltaTime: number,
    onTransition?: (transition: PoiseTimerTransition) => void,
  ): readonly PoiseTimerTransition[] {
    return tickVitals(this.runtimeState, deltaTime, onTransition);
  }
  registerHealthFloor(value: number): () => void {
    const id = this.requestHealthFloor(value);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.removeHealthFloor(id);
    };
  }

  /** 动作宿主保存编号并在当前分支结束时移除，不保存闭包。 */
  requestHealthFloor(value: number): number {
    return registerVitalsHealthFloor(this.runtimeState, value);
  }

  removeHealthFloor(id: number): void {
    removeVitalsHealthFloor(this.runtimeState, id);
  }
}

function createCombatVitalsState(snapshot: CombatVitalsSnapshot): CombatVitalsState {
  for (const [name, value] of Object.entries(snapshot)) {
    if (typeof value === 'number' && (!Number.isFinite(value) || value < 0))
      throw new RangeError(`${name} must be a non-negative finite number`);
  }
  if (snapshot.poise > snapshot.maxPoise + 0.00001) throw new RangeError('poise exceeds maxPoise');
  if (snapshot.maxHealth <= 0) throw new RangeError('maxHealth must be positive');
  if (snapshot.health > snapshot.maxHealth) throw new RangeError('health exceeds maxHealth');
  return {
    health: snapshot.health,
    poise: snapshot.poise,
    poiseImmune: snapshot.poiseImmune,
    maxHealth: snapshot.maxHealth,
    maxPoise: snapshot.maxPoise,
    poiseKnotThresholds: [...(snapshot.poiseKnotThresholds ?? [])],
    poiseRecoveryTime: snapshot.poiseRecoveryTime,
    poiseRecoveryTimeMultiplier: snapshot.poiseRecoveryTimeMultiplier,
    poiseBrokenEndTime: snapshot.poiseBrokenEndTime,
    stopPoiseRecovery: false,
    hasPoiseBrokenTag: false,
    poiseRecoveryTimer: createPeriodicTimerState(),
    poiseBrokenEndTimer: createPeriodicTimerState(),
    healthFloors: new Map(),
    nextHealthFloorId: 1,
  };
}
