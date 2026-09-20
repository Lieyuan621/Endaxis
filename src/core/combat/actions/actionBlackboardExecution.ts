/** 黑板的读取、赋值与子作用域创建。只操作传入数据，不持有运行实例或隐藏缓存。 */
import type { ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives.ts';
import type { ActionValueOperand } from '../../game-data/operatorDefinition';
import { createActionBlackboardState, type ActionBlackboardState } from '../state/foundationState';

export function readActionBlackboard(
  state: ActionBlackboardState,
  key: string,
): ActionBlackboardValue | undefined {
  // 只回退到 entity 的 direct 层，不能递归查找更上层实体板。
  return state.values.has(key) ? state.values.get(key) : state.entity?.values.get(key);
}

export function assignActionBlackboard(
  state: ActionBlackboardState,
  values?: Readonly<Record<string, ActionBlackboardValue>>,
): void {
  if (values === undefined) return;
  for (const [key, value] of Object.entries(values)) state.values.set(key, value);
}

function dynamicTarget(state: ActionBlackboardState, key: string): ActionBlackboardState {
  return key.startsWith('EntityBB_') ? (state.entity ?? state) : state;
}

export function assignDynamicBlackboard(
  state: ActionBlackboardState,
  key: string,
  value: number,
): boolean {
  const target = dynamicTarget(state, key);
  const current = target.values.get(key);
  if (typeof current === 'number' && Math.abs(current - value) <= 0.00001) return false;
  target.values.set(key, value);
  return true;
}

/** 调用方已按原生 GetFloat 完成比较时，不能再按实体板的另一个值跳过赋值。 */
export function assignDynamicBlackboardUnconditionally(
  state: ActionBlackboardState,
  key: string,
  value: number,
): void {
  dynamicTarget(state, key).values.set(key, value);
}

export function resolveBlackboardOperand(
  operand: ActionValueOperand,
  state: ActionBlackboardState,
): number {
  return resolveActionOperand(operand, key => readActionBlackboard(state, key));
}

/** 共用的缺键与回退规则；读取端口只在本次解析中使用。 */
export function resolveActionOperand(
  operand: ActionValueOperand,
  read: (key: string) => ActionBlackboardValue | undefined,
): number {
  if (operand.kind === 'constant') return operand.value;
  const value = read(operand.key);
  if (typeof value === 'number') return value;
  if (operand.fallback !== undefined) return operand.fallback;
  throw new Error(`action blackboard value '${operand.key}' is missing`);
}

export function createLocalBlackboardState(
  parent: ActionBlackboardState,
  initialValues: Readonly<Record<string, ActionBlackboardValue>>,
  inheritDirect: boolean,
  entityInitialValues?: Readonly<Record<string, ActionBlackboardValue>>,
  entityAssignments?: Readonly<Record<string, ActionValueOperand>>,
  resolveOperand: (operand: ActionValueOperand) => number = operand =>
    resolveBlackboardOperand(operand, parent),
): ActionBlackboardState {
  const assigned =
    entityAssignments === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(entityAssignments).map(([key, operand]) => [key, resolveOperand(operand)]),
        );
  return createActionBlackboardState(
    inheritDirect ? { ...initialValues, ...Object.fromEntries(parent.values) } : initialValues,
    entityInitialValues === undefined && assigned === undefined
      ? parent.entity
      : createActionBlackboardState({ ...entityInitialValues, ...assigned }),
  );
}
