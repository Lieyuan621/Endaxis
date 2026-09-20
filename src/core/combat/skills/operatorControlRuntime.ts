/** 主控变化在 Buff 推进前发布；上一帧身份随战斗数据一起保存。 */
import type { CombatClock } from '../time/combatClock';
import type { CombatRuntimeAssemblyOptions } from '../runtime/combatRuntimeAssembly';
import type { FrameRuntime } from '../runtime/combatSimulation';

export class OperatorControlRuntime implements FrameRuntime {
  readonly runtimeState: Map<string, boolean>;

  constructor(
    readonly operatorIds: readonly string[],
    readonly clock: CombatClock,
    private readonly readControl: CombatRuntimeAssemblyOptions['isOperatorControlled'],
    private readonly emit: CombatRuntimeAssemblyOptions['emitAbilityEvent'],
    restoredState?: Map<string, boolean>,
  ) {
    this.runtimeState =
      restoredState ??
      new Map(operatorIds.map(id => [id, readControl?.(id, clock.frame) ?? false]));
    if (
      this.runtimeState.size !== operatorIds.length ||
      operatorIds.some(id => !this.runtimeState.has(id))
    )
      throw new Error('restored control state does not match combat operators');
  }

  advanceFrame(): void {
    if (this.readControl === undefined) return;
    this.#apply(id => this.readControl!(id, this.clock.frame));
  }

  applyInput(controlledOperatorId?: string | null): void {
    if (controlledOperatorId === undefined) return;
    if (controlledOperatorId !== null && !this.runtimeState.has(controlledOperatorId)) {
      throw new Error(`unknown controlled operator '${controlledOperatorId}'`);
    }
    this.#apply(id => id === controlledOperatorId);
  }

  #apply(readControl: (id: string) => boolean): void {
    const changes: [string, boolean][] = [];
    for (const id of this.operatorIds) {
      const current = readControl(id);
      if (this.runtimeState.get(id) === current) continue;
      changes.push([id, current]);
    }
    // 所有监听器看到同一份本帧身份，不能随队员遍历顺序读到半次切人。
    for (const [id, current] of changes) this.runtimeState.set(id, current);
    for (const [id, current] of changes) {
      this.emit?.(id, current ? 'ownerSwitchToCenter' : 'ownerSwitchToGuard', {
        sourceId: id,
        targetId: id,
      });
    }
  }
}
