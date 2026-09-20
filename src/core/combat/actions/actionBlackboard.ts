/**
 * 将现有黑板对象调用接到纯数据黑板算法。共享实体板在数据中保持同一引用。
 * 此绑定不提供整场恢复入口；对象身份缓存仍需随技能宿主迁移。
 */
export { type ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives.ts';
import type { ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives.ts';
import type { ActionValueOperand } from '../../game-data/operatorDefinition';
import { createActionBlackboardState, type ActionBlackboardState } from '../state/foundationState';
import {
  assignActionBlackboard,
  assignDynamicBlackboard,
  assignDynamicBlackboardUnconditionally,
  createLocalBlackboardState,
  readActionBlackboard,
  resolveActionOperand,
} from './actionBlackboardExecution';

/** 技能 direct 层与共享 entity 层的现有对象绑定。 */
export class ActionBlackboard {
  #state: ActionBlackboardState;
  /** 仅供未迁移的宿主接线使用；正式执行器直接接收步进数据，不持有此对象。 */
  get runtimeState(): ActionBlackboardState {
    return this.#state;
  }

  /** 为恢复后的数据重新建立对象接线，不执行赋值或游戏动作。 */
  static bindRuntimeState(state: ActionBlackboardState): ActionBlackboard {
    return ActionBlackboard.#bind(state);
  }
  constructor(
    values?: Readonly<Record<string, ActionBlackboardValue>>,
    entityBlackboard?: ActionBlackboard,
  ) {
    this.#state = createActionBlackboardState(
      values,
      entityBlackboard === undefined ? undefined : entityBlackboard.#state,
    );
  }
  assign(values?: Readonly<Record<string, ActionBlackboardValue>>): void {
    assignActionBlackboard(this.#state, values);
  }
  getString(key: string): string | undefined {
    const value = readActionBlackboard(this.#state, key);
    return typeof value === 'string' ? value : undefined;
  }
  getNumber(key: string): number | undefined {
    const value = readActionBlackboard(this.#state, key);
    return typeof value === 'number' ? value : undefined;
  }
  getValue(key: string): ActionBlackboardValue | undefined {
    return readActionBlackboard(this.#state, key);
  }
  assignDynamic(key: string, value: number): boolean {
    return assignDynamicBlackboard(this.#state, key, value);
  }
  /** 调用方已比较过 GetFloat 时，直接写入目标层。 */
  assignDynamicUnconditionally(key: string, value: number): void {
    assignDynamicBlackboardUnconditionally(this.#state, key, value);
  }
  snapshot(): Readonly<Record<string, ActionBlackboardValue>> {
    return Object.fromEntries(this.#state.values);
  }
  /** 复制 direct 值，实体板仍共享，不是整场切面。 */
  detachedSnapshot(): ActionBlackboard {
    return ActionBlackboard.#bind(createActionBlackboardState(this.snapshot(), this.#state.entity));
  }
  restore(values: Readonly<Record<string, ActionBlackboardValue>>): void {
    this.#state.values.clear();
    this.assign(values);
  }
  createLocalScope(
    initialValues: Readonly<Record<string, ActionBlackboardValue>>,
    inheritDirect: boolean,
    entityInitialValues?: Readonly<Record<string, ActionBlackboardValue>>,
    entityAssignments?: Readonly<Record<string, ActionValueOperand>>,
  ): ActionBlackboard {
    return ActionBlackboard.#bind(
      createLocalBlackboardState(
        this.#state,
        initialValues,
        inheritDirect,
        entityInitialValues,
        entityAssignments,
        operand => resolveActionValueOperand(operand, this),
      ),
    );
  }
  static #bind(state: ActionBlackboardState): ActionBlackboard {
    const board = new ActionBlackboard();
    board.#state = state;
    return board;
  }
}

/** 缺键严格报错，只有操作数显式声明 fallback 时允许回退。 */
export function resolveActionValueOperand(
  operand: ActionValueOperand,
  blackboard: ActionBlackboard,
): number {
  return resolveActionOperand(operand, key => blackboard.getNumber(key));
}
