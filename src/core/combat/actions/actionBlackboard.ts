import { valueInputBlackboardKey } from '../../compiler/compiledGraphData';
import type { CompiledValueInput } from '../../compiler/compiledGraphData.ts';
/**
 * 将现有黑板对象调用接到纯数据黑板算法。共享实体板在数据中保持同一引用。
 * 此绑定不提供整场恢复入口；对象身份缓存仍需随技能宿主迁移。
 */
export { type ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives.ts';
import type { ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives.ts';

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
  #observeRead: ((key: string, value: ActionBlackboardValue | undefined) => void) | undefined;

  /** 诊断只观察真实读取；作用于本对象和当前同步调用，退出后恢复，不进入保存状态。 */
  observeReads<T>(
    observer: (key: string, value: ActionBlackboardValue | undefined) => void,
    execute: () => T,
  ): T {
    const previous = this.#observeRead;
    this.#observeRead = observer;
    try {
      return execute();
    } finally {
      this.#observeRead = previous;
    }
  }
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
  assign(
    values?: Readonly<Record<string, ActionBlackboardValue>>,
    factors?: Readonly<Record<string, import('../state/foundationState').ArtsIntensityFactor>>,
    calculations?: Readonly<
      Record<string, import('../state/foundationState').ActionValueCalculation>
    >,
  ): void {
    assignActionBlackboard(this.#state, values);
    for (const [key, factor] of Object.entries(factors ?? {})) {
      if (Number.isFinite(factor.multiplier) && factor.multiplier > 0)
        (this.#state.artsIntensityFactors ??= new Map()).set(key, factor);
    }
    for (const [key, calculation] of Object.entries(calculations ?? {}))
      (this.#state.valueCalculations ??= new Map()).set(key, limitValueCalculation(calculation));
  }
  getValueCalculation(
    key: string,
  ): import('../state/foundationState').ActionValueCalculation | undefined {
    return (this.#state.values.has(key) ? this.#state : this.#state.entity)?.valueCalculations?.get(
      key,
    );
  }
  setValueCalculation(
    key: string,
    calculation: import('../state/foundationState').ActionValueCalculation | undefined,
  ): void {
    const state = key.startsWith('EntityBB_') ? (this.#state.entity ?? this.#state) : this.#state;
    if (calculation === undefined) state.valueCalculations?.delete(key);
    else (state.valueCalculations ??= new Map()).set(key, limitValueCalculation(calculation));
  }
  getArtsIntensityFactor(key: string): number | undefined {
    return this.getArtsIntensityDetail(key)?.multiplier;
  }
  getArtsIntensityDetail(
    key: string,
  ): import('../state/foundationState').ArtsIntensityFactor | undefined {
    const state = this.#state.values.has(key) ? this.#state : this.#state.entity;
    return state?.artsIntensityFactors?.get(key);
  }
  setArtsIntensityFactor(
    key: string,
    factor: number | undefined,
    intensity?: number,
    baseValue?: number,
    additionalMultiplier?: number,
    unitEnhancementFactor?: boolean,
  ): void {
    const state = key.startsWith('EntityBB_') ? (this.#state.entity ?? this.#state) : this.#state;
    if (factor === undefined || !Number.isFinite(factor) || factor <= 0)
      state.artsIntensityFactors?.delete(key);
    else
      (state.artsIntensityFactors ??= new Map()).set(key, {
        multiplier: factor,
        intensity,
        baseValue,
        ...(additionalMultiplier === undefined ? {} : { additionalMultiplier }),
        ...(unitEnhancementFactor === undefined ? {} : { unitEnhancementFactor }),
      });
  }
  getString(key: string): string | undefined {
    const value = readActionBlackboard(this.#state, key);
    this.#observeRead?.(key, value);
    return typeof value === 'string' ? value : undefined;
  }
  getNumber(key: string): number | undefined {
    const value = readActionBlackboard(this.#state, key);
    this.#observeRead?.(key, value);
    return typeof value === 'number' ? value : undefined;
  }
  getValue(key: string): ActionBlackboardValue | undefined {
    const value = readActionBlackboard(this.#state, key);
    this.#observeRead?.(key, value);
    return value;
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
    const state = createActionBlackboardState(this.snapshot(), this.#state.entity);
    if (this.#state.artsIntensityFactors)
      state.artsIntensityFactors = new Map(this.#state.artsIntensityFactors);
    if (this.#state.valueCalculations)
      state.valueCalculations = new Map(this.#state.valueCalculations);
    return ActionBlackboard.#bind(state);
  }
  restore(
    values: Readonly<Record<string, ActionBlackboardValue>>,
    factors?: Readonly<Record<string, import('../state/foundationState').ArtsIntensityFactor>>,
    calculations?: Readonly<
      Record<string, import('../state/foundationState').ActionValueCalculation>
    >,
  ): void {
    this.#state.values.clear();
    this.#state.artsIntensityFactors?.clear();
    this.#state.valueCalculations?.clear();
    this.assign(values, factors, calculations);
  }
  createLocalScope(
    initialValues: Readonly<Record<string, ActionBlackboardValue>>,
    inheritDirect: boolean,
    entityInitialValues?: Readonly<Record<string, ActionBlackboardValue>>,
    entityAssignments?: Readonly<Record<string, CompiledValueInput>>,
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

/** 单次命中的解释只保留有限层级，避免循环更新黑板时无限增大存档。 */
export function limitValueCalculation(
  calculation: import('../state/foundationState').ActionValueCalculation,
  depth = 4,
): import('../state/foundationState').ActionValueCalculation {
  return {
    operation: calculation.operation,
    left: calculation.left,
    right: calculation.right,
    result: calculation.result,
    ...(calculation.sourceKind === undefined ? {} : { sourceKind: calculation.sourceKind }),
    ...(calculation.sourceColumn === undefined ? {} : { sourceColumn: calculation.sourceColumn }),
    ...(calculation.sourceSkillId === undefined
      ? {}
      : { sourceSkillId: calculation.sourceSkillId }),
    ...(calculation.sourceSkillLevel === undefined
      ? {}
      : { sourceSkillLevel: calculation.sourceSkillLevel }),
    ...(calculation.sourceKey === undefined ? {} : { sourceKey: calculation.sourceKey }),
    ...(calculation.leftKey === undefined ? {} : { leftKey: calculation.leftKey }),
    ...(calculation.rightKey === undefined ? {} : { rightKey: calculation.rightKey }),
    ...(depth <= 1 || calculation.leftCalculation === undefined
      ? {}
      : { leftCalculation: limitValueCalculation(calculation.leftCalculation, depth - 1) }),
    ...(depth <= 1 || calculation.rightCalculation === undefined
      ? {}
      : { rightCalculation: limitValueCalculation(calculation.rightCalculation, depth - 1) }),
  };
}

/** 缺键严格报错，只有操作数显式声明 fallback 时允许回退。 */
export function resolveActionValueOperand(
  operand: CompiledValueInput,
  blackboard: ActionBlackboard,
): number {
  return resolveActionOperand(operand, key => blackboard.getNumber(key));
}

/** 记录技能表基础值之后实际执行的乘除；不从运算结果反推基础值。 */
export function combineSkillSettingFactors(
  operation: import('../state/foundationState').ActionValueCalculation['operation'],
  left: import('../state/foundationState').ArtsIntensityFactor | undefined,
  right: import('../state/foundationState').ArtsIntensityFactor | undefined,
  leftValue: number,
  rightValue: number,
): import('../state/foundationState').ArtsIntensityFactor | undefined {
  if (operation === 'assign') return right;
  if (operation === 'multiply') {
    if (left && !right)
      return left.unitEnhancementFactor
        ? { ...left, baseValue: rightValue, unitEnhancementFactor: false }
        : { ...left, additionalMultiplier: (left.additionalMultiplier ?? 1) * rightValue };
    if (right && !left)
      return right.unitEnhancementFactor
        ? { ...right, baseValue: leftValue, unitEnhancementFactor: false }
        : { ...right, additionalMultiplier: (right.additionalMultiplier ?? 1) * leftValue };
  }
  if (operation === 'divide' && left && !right && rightValue !== 0)
    return { ...left, additionalMultiplier: (left.additionalMultiplier ?? 1) / rightValue };
  // 加法、取整或两个独立基础值相乘不能再表示为同一个表格基础值的乘积。
  return undefined;
}

export function resolveSkillSettingFactor(
  operand: CompiledValueInput | number,
  blackboard: ActionBlackboard,
): import('../state/foundationState').ArtsIntensityFactor | undefined {
  const key = valueInputBlackboardKey(operand);
  return key !== undefined ? blackboard.getArtsIntensityDetail(key) : undefined;
}

/** 原生要求变量已声明的直接读取；不经过图输入构造临时节点。 */
export function readRequiredActionNumber(blackboard: ActionBlackboard, key: string): number {
  const value = blackboard.getNumber(key);
  if (value === undefined) throw new Error(`action blackboard value '${key}' is missing`);
  return value;
}
