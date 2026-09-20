/**
 * `CombatVitals` 与事件/回执系统之间的运行时适配层。
 * 调用方每帧只更新一次，避免重复发布失衡恢复等边界事件。
 */
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import { COMBAT_FRAME_INTERVAL, type CombatClock } from '../time/combatClock';
import type { CombatVitals, PoiseTimerTransition } from './combatVitals';
import type { FrameRuntime } from '../runtime/combatSimulation';

/** `CombatVitalsRuntime` 当前对实体所有者发布的事件。 */
export type CombatVitalsEvent = 'poiseRecovered';

/** 将一个生命账本接入时钟、回执和实体事件所需的端口。 */
export interface CombatVitalsRuntimeDependencies {
  readonly ownerId: string;
  readonly clock: CombatClock;
  readonly vitals: CombatVitals;
  readonly receipt: CombatReceiptSink;
  readonly emitOwnerEvent: (event: CombatVitalsEvent) => void;
  readonly beforePoiseRecovered?: () => void;
}

/** 推进生命相关计时器，并在原生边界发布状态转换。 */
export class CombatVitalsRuntime implements FrameRuntime {
  constructor(readonly dependencies: CombatVitalsRuntimeDependencies) {}

  advanceFrame(): void {
    this.advance(COMBAT_FRAME_INTERVAL);
  }

  /** 失衡恢复使用全局缩放时钟；固定帧入口仅用于无时间膨胀的调用方。 */
  advance(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError('combat vitals delta seconds must be a non-negative finite number');
    }
    this.dependencies.vitals.tick(deltaSeconds, transition => {
      this.#publish(transition);
    });
  }

  #publish(transition: PoiseTimerTransition): void {
    if (transition === 'poiseRecovered') {
      this.dependencies.beforePoiseRecovered?.();
      this.dependencies.emitOwnerEvent('poiseRecovered');
    }
    this.dependencies.receipt.record({
      frame: this.dependencies.clock.frame,
      time: this.dependencies.clock.time,
      event: transition === 'poiseRecovered' ? 'PoiseRecovered' : 'PoiseBrokenTagEnded',
      targetId: this.dependencies.ownerId,
      data: {
        poise: this.dependencies.vitals.poise,
        hasPoiseBrokenTag: this.dependencies.vitals.hasPoiseBrokenTag,
      },
    });
  }
}
