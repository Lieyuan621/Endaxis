/**
 * 战斗原语与有序序列执行器之间的最小执行协议。
 * 新步骤应通过明确实现接入；不能把未知步骤当作成功空操作，也不能在这里引入 UI 语义。
 */
import type { ActionStepData, SequenceExecutionState } from '../state/actionState';

/** 单个步骤执行时可访问的序列上下文；后续运行时端口应显式扩展。 */
export interface CombatExecutionContext {
  /** 原生即时执行后的复位保留 DoOnce 标记；普通复位清除它。 */
  resetReason?: 'normal' | 'afterInstant';
  sequence?: SequenceExecutionState;
}

/** 战斗序列中的一个可执行操作。 */
export abstract class CombatStep {
  /** null 明确表示内部数据尚未接入；不等于无状态动作。 */
  get executionData(): ActionStepData | null {
    return null;
  }

  /** 只在构建新执行绑定时调用；未实现的步骤必须拒绝恢复，不能默默丢掉内部状态。 */
  bindExecutionData(_data: ActionStepData | null): void {
    throw new Error(`${this.constructor.name} does not support state binding`);
  }

  createRuntimeInstance(): CombatStep {
    return this;
  }

  reset(_context: CombatExecutionContext): void {}

  abstract execute(context: CombatExecutionContext): void;

  tryExecute(context: CombatExecutionContext): boolean {
    this.execute(context);
    return true;
  }

  tick(_deltaTime: number, _context: CombatExecutionContext): void {}

  end(_context: CombatExecutionContext): void {}
}
