/**
 * 一次战斗实例的最小逐帧驱动器。
 * 当前注册顺序与原生同一 TickGroup 的列表顺序一致；跨阶段及跨实体注册来源仍由装配层显式确定。
 * 调用方不得依赖对象映射或集合的偶然遍历顺序注册系统。
 */
import { CombatClock } from '../time/combatClock';

/** 由 `CombatSimulation` 按帧驱动的运行时子系统。 */
export interface FrameRuntime {
  advanceFrame(): void;
}

/** 本次步进的外部输入入口；驱动器不保存入口，也不读取未来帧。 */
export interface CombatFrameInputs {
  readonly controlInputs?: () => void;
  readonly skillInputs: () => void;
  readonly externalEvents: () => void;
}

/** 先推进共享时钟，再按当前显式注册顺序更新运行时系统。 */
export class CombatSimulation {
  readonly #systems: (
    | FrameRuntime
    | keyof CombatFrameInputs
    | { phase: keyof CombatFrameInputs; fallback: FrameRuntime }
  )[] = [];

  constructor(readonly clock: CombatClock) {}

  add(system: FrameRuntime): void {
    this.#systems.push(system);
  }

  addInputPhase(phase: keyof CombatFrameInputs, fallback?: FrameRuntime): void {
    this.#systems.push(fallback === undefined ? phase : { phase, fallback });
  }

  advanceFrame(inputs?: CombatFrameInputs): void {
    if (inputs === undefined && this.#systems.some(system => typeof system === 'string')) {
      throw new Error('combat frame requires external input phases');
    }
    this.clock.advanceFrame();
    for (const system of this.#systems) {
      if (typeof system === 'string') inputs![system]!();
      else if ('phase' in system) {
        const apply = inputs?.[system.phase];
        if (apply === undefined) system.fallback.advanceFrame();
        else apply();
      } else system.advanceFrame();
    }
  }

  advanceFrames(count: number, inputs?: CombatFrameInputs): void {
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError('frame count must be a non-negative integer');
    }
    for (let frame = 0; frame < count; frame += 1) this.advanceFrame(inputs);
  }
}
