/**
 * 把通用状态所有者接到逐帧模拟和状态动作端口，并只为自然到期补充运行时回执。
 * 主动施加与消费由 StatusOperationExecutor 记录，避免同一事实重复写入。
 */
import type { CombatStatusContainer, CombatStatusTransition } from './combatStatuses';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { FrameRuntime } from '../runtime/combatSimulation';
import type { CombatClock } from '../time/combatClock';
import {
  recordStatusTransition,
  type CombatStatusOperationTarget,
  type StatusActionRequest,
} from './statusOperationExecutor';

export class CombatStatusRuntime implements CombatStatusOperationTarget, FrameRuntime {
  readonly targetId: string;

  constructor(
    readonly container: CombatStatusContainer,
    readonly clock: CombatClock,
    readonly receipt: CombatReceiptSink,
  ) {
    this.targetId = container.ownerId;
  }

  getStacks(statusKey: string): number {
    return this.container.getStacks(statusKey);
  }

  applyStatus(request: StatusActionRequest<'applyStatus'>): CombatStatusTransition {
    if ((request.parameters.modifiers?.length ?? 0) > 0) {
      throw new Error(
        `status '${request.parameters.statusKey}' modifiers require a dedicated runtime executor`,
      );
    }
    return this.container.apply({
      statusKey: request.parameters.statusKey,
      sourceId: request.sourceId,
      skillId: request.skillId,
      ...(request.parameters.stacks === undefined ? {} : { stacks: request.parameters.stacks }),
      ...(request.parameters.maxStacks === undefined
        ? {}
        : { maxStacks: request.parameters.maxStacks }),
      ...(request.parameters.durationFrames === undefined
        ? {}
        : { durationFrames: request.parameters.durationFrames }),
    });
  }

  consumeStatus(request: StatusActionRequest<'consumeStatus'>): CombatStatusTransition {
    return this.container.consume({
      statusKey: request.parameters.statusKey,
      sourceId: request.sourceId,
      skillId: request.skillId,
      ...(request.parameters.stacks === undefined ? {} : { stacks: request.parameters.stacks }),
    });
  }

  advanceFrame(): void {
    for (const transition of this.container.advanceFrame()) {
      recordStatusTransition(this.receipt, this.clock, this.targetId, transition, {
        requestedStacks: null,
        requestedDurationFrames: null,
        requestedMaxStacks: null,
      });
    }
  }
}
