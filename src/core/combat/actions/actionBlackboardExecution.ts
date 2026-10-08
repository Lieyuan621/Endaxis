import { valueInputExpression, valueInputBlackboardKey } from '../../compiler/compiledGraphData';
import type { CompiledValueInput } from '../../compiler/compiledGraphData.ts';
/** 黑板的读取、赋值与子作用域创建。只操作传入数据，不持有运行实例或隐藏缓存。 */
import type { ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives.ts';

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
  for (const [key, value] of Object.entries(values)) {
    state.values.set(key, value);
    state.artsIntensityFactors?.delete(key);
    state.valueCalculations?.delete(key);
  }
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
  target.artsIntensityFactors?.delete(key);
  target.valueCalculations?.delete(key);
  return true;
}

/** 调用方已按原生 GetFloat 完成比较时，不能再按实体板的另一个值跳过赋值。 */
export function assignDynamicBlackboardUnconditionally(
  state: ActionBlackboardState,
  key: string,
  value: number,
): void {
  const target = dynamicTarget(state, key);
  target.values.set(key, value);
  target.artsIntensityFactors?.delete(key);
  target.valueCalculations?.delete(key);
}

export function resolveBlackboardOperand(
  operand: CompiledValueInput,
  state: ActionBlackboardState,
): number {
  return resolveActionOperand(operand, key => readActionBlackboard(state, key));
}

/** 共用的缺键与回退规则；读取端口只在本次解析中使用。 */
export function resolveActionOperand(
  operand: CompiledValueInput,
  read: (key: string) => ActionBlackboardValue | undefined,
): number {
  const expression = valueInputExpression(operand);
  if (expression.kind === 'constant') return expression.value;
  // 参数操作数由宏调用宿主在消费前代入；到达这里说明定义越过了校验。
  if (expression.kind === 'parameter')
    throw new Error(`macro parameter '${expression.parameter}' outside a macro call host`);
  const value = read(expression.key);
  if (typeof value === 'number') return value;
  if (expression.fallback !== undefined) return expression.fallback;
  throw new Error(`action blackboard value '${expression.key}' is missing`);
}

export function createLocalBlackboardState(
  parent: ActionBlackboardState,
  initialValues: Readonly<Record<string, ActionBlackboardValue>>,
  inheritDirect: boolean,
  entityInitialValues?: Readonly<Record<string, ActionBlackboardValue>>,
  entityAssignments?: Readonly<Record<string, CompiledValueInput>>,
  resolveOperand: (operand: CompiledValueInput) => number = operand =>
    resolveBlackboardOperand(operand, parent),
): ActionBlackboardState {
  const assigned =
    entityAssignments === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(entityAssignments).map(([key, operand]) => [key, resolveOperand(operand)]),
        );
  const result = createActionBlackboardState(
    inheritDirect ? { ...initialValues, ...Object.fromEntries(parent.values) } : initialValues,
    entityInitialValues === undefined && assigned === undefined
      ? parent.entity
      : createActionBlackboardState({ ...entityInitialValues, ...assigned }),
  );
  if (inheritDirect && parent.artsIntensityFactors)
    result.artsIntensityFactors = new Map(parent.artsIntensityFactors);
  if (inheritDirect && parent.valueCalculations)
    result.valueCalculations = new Map(parent.valueCalculations);
  if (assigned && result.entity) {
    for (const [key, operand] of Object.entries(entityAssignments ?? {})) {
      const sourceKey = valueInputBlackboardKey(operand);
      if (sourceKey === undefined) continue;
      const source = parent.values.has(sourceKey) ? parent : parent.entity;
      const factor = source?.artsIntensityFactors?.get(sourceKey);
      if (factor !== undefined) (result.entity.artsIntensityFactors ??= new Map()).set(key, factor);
      const calculation = source?.valueCalculations?.get(sourceKey);
      if (calculation !== undefined)
        (result.entity.valueCalculations ??= new Map()).set(key, calculation);
    }
  }
  return result;
}
