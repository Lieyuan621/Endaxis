/**
 * 将共享战斗资源接入确定性逐帧循环。
 * 装配时应放在 AbilitySystem 之前，以保持原生 BattleManager Frame Tick 先于技能 PreLate Tick。
 */
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import { COMBAT_FRAME_INTERVAL, type CombatClock } from '../time/combatClock';
import type { CombatResources } from './combatResources';
import type { FrameRuntime } from '../runtime/combatSimulation';

/** 每帧推进一次战斗内共享技力自然恢复。 */
export class CombatResourceRuntime implements FrameRuntime {
  constructor(
    readonly resources: CombatResources,
    readonly clock: CombatClock,
    readonly receipt: CombatReceiptSink,
  ) {}

  advanceFrame(): void {
    this.advance(COMBAT_FRAME_INTERVAL);
  }

  /** BattleManager 传入经过全局缩放的时间，恢复量与恢复暂停计时共用该增量。 */
  advance(deltaSeconds: number): void {
    // Endaxis 准备期不推进自然恢复；到达 0 帧的区间仍属于准备期。
    if (this.clock.frame <= 0) return;
    const change = this.resources.advanceInCombatSpRecovery(deltaSeconds);
    if (change.actualValue === 0) return;
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'SpChanged',
      data: {
        recipient: 'team',
        baseValue: change.baseValue,
        requestedValue: change.requestedValue,
        actualValue: change.actualValue,
        previousValue: change.previousValue,
        currentValue: change.currentValue,
        gainKind: change.gainKind,
        // 每帧的自动回复；曲线展示时不再单独标点。
        source: 'autoRecovery',
      },
    });
  }
}
