/** 技力支付、自然恢复、队伍回能及恢复限制的结算算法。只修改传入的资源状态；动态属性在结算时读取。 */
import type { CompiledSkillCost } from '../../compiler/combatProgram';
import type { SpGainKind } from '../../game-data/operatorDefinition';
import type { CombatResourceState, OperatorResources } from '../state/environmentState';
import type { GameplayTag } from '../tags/gameplayTags';
import {
  resolveSharedSpGain,
  resolveSharedSpRecovery,
  type SharedSpGainSource,
  type SharedSpGainSettings,
} from './sharedSpGainModifiers';
import type {
  CombatResourceRuntimeResolvers,
  SkillPaymentResult,
  SkillPaymentChange,
  SpChange,
  UltimateEnergyChange,
  UltimateEnergyChangeOptions,
} from './combatResources';
const RESOURCE_EPSILON = 0.0001;
const ULTIMATE_ENERGY_EPSILON = Math.fround(0.00001);

/** 按来源效率增加技力，超过上限的部分不进入余额；返还量同时记入返还池。 */
export function gainSp(
  state: CombatResourceState,
  settings: SharedSpGainSettings,
  value: number,
  gainKind: SpGainKind = 'gain',
  source?: SharedSpGainSource,
): SpChange {
  requireNonNegativeFinite(value, 'sp gain');
  const requestedValue =
    source === undefined
      ? value
      : value *
        resolveSharedSpGain(
          state.sharedSpGainModifiers,
          settings,
          source,
          gainKind === 'refund' ? 'return' : 'gain',
        ).totalEfficiency;
  const previousValue = state.sp;
  state.sp = Math.min(state.maxSp, previousValue + requestedValue);
  const actualValue = state.sp - previousValue;
  if (gainKind === 'refund') state.returnedSp += actualValue;
  return {
    baseValue: value,
    requestedValue,
    actualValue,
    previousValue,
    currentValue: state.sp,
    gainKind,
  };
}

/** 帧开始时仍在暂停就跳过整帧恢复；恢复溢出会消耗返还池。 */
export function advanceInCombatSpRecovery(
  state: CombatResourceState,
  settings: SharedSpGainSettings,
  deltaSeconds: number,
): SpChange {
  requireNonNegativeFinite(deltaSeconds, 'sp recovery delta');
  if (state.spRecoveryPauseRemaining > RESOURCE_EPSILON) {
    state.spRecoveryPauseRemaining -= deltaSeconds;
    return unchangedSpChange(state, 0);
  }

  const requestedValue =
    resolveSharedSpRecovery(state.sharedSpRecoveryModifiers, state.spRecoveryPerSecond) *
    deltaSeconds;
  const change = gainSp(state, settings, requestedValue);
  const overflow = requestedValue - change.actualValue;
  if (state.returnedSp > RESOURCE_EPSILON && overflow > RESOURCE_EPSILON) {
    state.returnedSp = Math.max(0, state.returnedSp - overflow);
  }
  return change;
}

export function getUltimateEnergy(state: CombatResourceState, operatorId: string): number {
  return requireOperator(state, operatorId).ultimateEnergy;
}

export function getMaxUltimateEnergy(state: CombatResourceState, operatorId: string): number {
  return requireOperator(state, operatorId).maxUltimateEnergy;
}

/** 按回能倍率、百分比上限、系数、许可标签的顺序结算，保留原生单精度舍入。 */
export function changeUltimateEnergy(
  state: CombatResourceState,
  resolvers: CombatResourceRuntimeResolvers,
  operatorId: string,
  baseValue: number,
  options: UltimateEnergyChangeOptions = {},
): UltimateEnergyChange {
  requireFinite(baseValue, 'ultimate energy base value');
  const coefficient = options.coefficient ?? 1;
  requireFinite(coefficient, 'ultimate energy coefficient');
  const operator = requireOperator(state, operatorId);
  let requestedValue = Math.fround(baseValue);
  if (baseValue > 0 && !options.ignoreGainMultiplier) {
    const multiplier =
      resolvers.ultimateEnergyGainMultiplier?.(operatorId) ?? operator.ultimateEnergyGainMultiplier;
    requireFinite(multiplier, `operator '${operatorId}' ultimate energy gain multiplier`);
    requestedValue = Math.fround(requestedValue * multiplier);
  }
  if (options.isPercentValue) {
    requestedValue = Math.fround(requestedValue * operator.maxUltimateEnergy);
  }
  requestedValue = Math.fround(requestedValue * coefficient);
  const previousValue = operator.ultimateEnergy;
  const applied = trySetUltimateEnergy(
    state,
    operator,
    previousValue + requestedValue,
    options.recoveryTag,
  );
  return {
    operatorId,
    baseValue,
    requestedValue,
    applied,
    actualValue: operator.ultimateEnergy - previousValue,
    previousValue,
    currentValue: operator.ultimateEnergy,
  };
}

export function canPay(
  state: CombatResourceState,
  operatorId: string,
  costs: readonly CompiledSkillCost[],
): boolean {
  return costs.every(cost => {
    const available =
      cost.resource === 'sp' ? state.sp : requireOperator(state, operatorId).ultimateEnergy;
    return available + RESOURCE_EPSILON >= cost.value;
  });
}

/** 先检查全部费用，再按配置顺序支付；强制排轴支付允许技力透支。 */
export function pay(
  state: CombatResourceState,
  operatorId: string,
  costs: readonly CompiledSkillCost[],
  options: { readonly forceTimelinePayment?: boolean } = {},
): SkillPaymentResult {
  if (!options.forceTimelinePayment && !canPay(state, operatorId, costs)) {
    return { paid: false, nonReturnedSpCost: 0, changes: [] };
  }
  let nonReturnedSpCost = 0;
  const changes: SkillPaymentChange[] = [];
  for (const cost of costs) {
    if (cost.resource === 'sp') {
      // 原生 Skill._ApplyCost 只在最终 ATB 费用大于 epsilon 时调用 CostAtb。
      if (cost.value <= RESOURCE_EPSILON) continue;
      const previousValue = state.sp;
      state.sp = options.forceTimelinePayment
        ? state.sp - cost.value
        : Math.max(0, state.sp - cost.value);
      const consumedReturnedSp = Math.min(state.returnedSp, cost.value);
      state.returnedSp -= consumedReturnedSp;
      nonReturnedSpCost = cost.value - consumedReturnedSp;
      state.spRecoveryPauseRemaining = state.spRecoveryPauseDuration;
      changes.push({
        resource: 'sp',
        baseValue: -cost.value,
        requestedValue: -cost.value,
        actualValue: state.sp - previousValue,
        previousValue,
        currentValue: state.sp,
      });
    } else {
      const previousValue = getUltimateEnergy(state, operatorId);
      // 原生 `Skill.ApplyCost` 会忽略终结技能量 Setter 的返回值。
      const applied = trySetUltimateEnergy(
        state,
        requireOperator(state, operatorId),
        previousValue - Math.fround(cost.value),
      );
      const currentValue = getUltimateEnergy(state, operatorId);
      changes.push({
        resource: 'ultimateEnergy',
        operatorId,
        baseValue: -cost.value,
        requestedValue: -cost.value,
        applied,
        actualValue: currentValue - previousValue,
        previousValue,
        currentValue,
      });
    }
  }
  return { paid: true, nonReturnedSpCost, changes };
}

export function gainSquadUltimateEnergyFromSkillCost(
  state: CombatResourceState,
  resolvers: CombatResourceRuntimeResolvers,
  sourceOperatorId: string,
  nonReturnedSpCost: number,
  coefficient: number,
): readonly UltimateEnergyChange[] {
  requireNonNegativeFinite(nonReturnedSpCost, 'nonReturnedSpCost');
  requireFinite(coefficient, 'coefficient');
  requireOperator(state, sourceOperatorId);

  return state.squad.map(member => {
    const gainPerSp =
      member.operatorId === sourceOperatorId
        ? state.normalSkillUltimateEnergy.selfGainPerSp
        : state.normalSkillUltimateEnergy.otherGainPerSp;
    const baseValue = coefficient * nonReturnedSpCost * gainPerSp;
    return changeUltimateEnergy(state, resolvers, member.operatorId, baseValue);
  });
}

export function requestUltimateEnergyRecoveryRestriction(
  state: CombatResourceState,
  operatorId: string,
  allowedRecoveryTags: ReadonlySet<GameplayTag>,
): number {
  requireOperator(state, operatorId);
  const handle = state.nextUltimateRecoveryRestrictionHandle++;
  state.ultimateRecoveryRestrictionHandles.set(handle, {
    operatorId,
    allowed: new Set(allowedRecoveryTags),
  });
  refreshUltimateEnergyRecoveryRestriction(state, operatorId);
  return handle;
}

export function revertUltimateEnergyRecoveryRestriction(
  state: CombatResourceState,
  resolvers: CombatResourceRuntimeResolvers,
  handle: number,
  clearUltimateEnergyOnEnd: boolean,
): UltimateEnergyChange | null {
  const entry = state.ultimateRecoveryRestrictionHandles.get(handle);
  if (entry === undefined) return null;
  state.ultimateRecoveryRestrictionHandles.delete(handle);
  refreshUltimateEnergyRecoveryRestriction(state, entry.operatorId);
  if (!clearUltimateEnergyOnEnd) return null;
  const current = getUltimateEnergy(state, entry.operatorId);
  return changeUltimateEnergy(state, resolvers, entry.operatorId, -current);
}

function refreshUltimateEnergyRecoveryRestriction(
  state: CombatResourceState,
  operatorId: string,
): void {
  const dynamic = [...state.ultimateRecoveryRestrictionHandles.values()].filter(
    entry => entry.operatorId === operatorId,
  );
  const operator = requireOperator(state, operatorId);
  if (dynamic.length === 0) {
    const base = state.baseUltimateRecoveryRestrictions.get(operatorId)!;
    operator.allowedUltimateEnergyRecoveryTags = base === null ? null : new Set(base);
    return;
  }
  const allowed = new Set<GameplayTag>();
  const base = state.baseUltimateRecoveryRestrictions.get(operatorId);
  if (base !== null && base !== undefined) for (const tag of base) allowed.add(tag);
  for (const entry of dynamic) for (const tag of entry.allowed) allowed.add(tag);
  operator.allowedUltimateEnergyRecoveryTags = allowed;
}

function trySetUltimateEnergy(
  state: CombatResourceState,
  operator: OperatorResources,
  value: number,
  recoveryTag?: GameplayTag,
): boolean {
  const restriction = operator.allowedUltimateEnergyRecoveryTags;
  if (
    !state.ultimateEnergySystemUnlocked ||
    (value > operator.ultimateEnergy &&
      restriction !== null &&
      (recoveryTag === undefined || !restriction.has(recoveryTag)))
  ) {
    return false;
  }
  // 原生余额和Setter入参为float，上限从double属性转float，差值也以float比较。
  // 保留双精度加减会让靠近容差的小额支付产生原生没有的写入与applied回执。
  const clamped = Math.min(
    Math.fround(operator.maxUltimateEnergy),
    Math.max(0, Math.fround(value)),
  );
  const difference = Math.fround(clamped - operator.ultimateEnergy);
  if (Math.abs(difference) <= ULTIMATE_ENERGY_EPSILON) return false;
  operator.ultimateEnergy = clamped;
  return true;
}

function unchangedSpChange(state: CombatResourceState, requestedValue: number): SpChange {
  return {
    baseValue: requestedValue,
    requestedValue,
    actualValue: 0,
    previousValue: state.sp,
    currentValue: state.sp,
    gainKind: 'gain',
  };
}

function requireOperator(state: CombatResourceState, operatorId: string): OperatorResources {
  const operator = state.operators.get(operatorId);
  if (operator === undefined) throw new Error(`squad operator '${operatorId}' is not configured`);
  return operator;
}
function requireNonNegativeFinite(value: number, path: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${path} must be a non-negative finite number`);
  }
}

function requireFinite(value: number, path: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${path} must be a finite number`);
  }
}
