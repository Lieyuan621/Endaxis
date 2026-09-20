import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatClock } from '../time/combatClock';
import type { UltimatePresentationState } from '../state/environmentState';

/** HideUIAction 普通分支的全场状态；不提供未经证实的统一施法门禁。 */
export class UltimatePresentationRuntime {
  constructor(
    readonly clock: CombatClock,
    readonly receipt: CombatReceiptSink,
    readonly runtimeState: UltimatePresentationState = { inUltimateCasting: false },
  ) {}

  get inUltimateCasting(): boolean {
    return this.runtimeState.inUltimateCasting;
  }

  setActive(active: boolean, sourceId: string, sourceActionId: string): void {
    // 原生为直接布尔写入，不擅自改成引用计数。
    this.runtimeState.inUltimateCasting = active;
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'UltimatePresentationChanged',
      sourceId,
      data: { sourceActionId, active, showUi: !active },
    });
  }
}
