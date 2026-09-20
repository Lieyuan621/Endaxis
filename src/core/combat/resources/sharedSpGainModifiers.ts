import {
  type SharedSpGainAttribute,
  type SharedSpGainModifier,
  type SharedSpGainModifierOperation,
  type SharedSpGainModifierState,
  type SharedSpRecoveryModifier,
  type SharedSpRecoveryModifierState,
} from '../state/foundationState';
/**
 * 聚合一次战斗共享 SP 的获取效率修正。
 *
 * 这里对应原生 BattleManager 的全局属性，而不是任一干员的个人属性。调用方应把
 * SkillSetting.atbGainEfficiency 作为稳定战斗配置传入，并让 Buff 按启停生命周期注册、注销
 * 同一个修正对象。最终写入共享 SP 账本及上限裁剪不属于本模块职责。
 */
import {
  SP_GAIN_SOURCES,
  type SpGainSource,
} from '../../../../packages/game-data-contract/src/primitives';

export const SHARED_SP_GAIN_SOURCES = SP_GAIN_SOURCES;
/** 共享 SP 的获取来源；来源决定是否应用普攻或重击专属效率。 */
export type SharedSpGainSource = SpGainSource;

export const SHARED_SP_GAIN_METHODS = ['gain', 'return'] as const;
/** 普通获取不会进入返还池；返还获取还会受到修正项的过滤标记约束。 */
export type SharedSpGainMethod = (typeof SHARED_SP_GAIN_METHODS)[number];

/** SkillSetting 中与共享 SP 获取有关的稳定战斗配置。 */
export interface SharedSpGainSettings {
  readonly baseGainEfficiency: number;
}

export function createSharedSpGainModifier(
  attribute: SharedSpGainAttribute,
  operation: SharedSpGainModifierOperation,
  value: number,
  applyToReturnSpGain: boolean,
): SharedSpGainModifier {
  requireFinite(value, 'shared SP gain modifier value');
  return { attribute, operation, value, applyToReturnSpGain };
}

/** 两段效率以及最终乘积，供资源回执保留可诊断的中间结果。 */
export interface SharedSpGainEfficiency {
  readonly gainEfficiency: number;
  readonly sourceEfficiency: number;
  readonly totalEfficiency: number;
}

/**
 * 一次战斗唯一的共享 SP 效率修正注册表。
 * 注册表按对象身份移除修正，避免同值 Buff 相互覆盖或错误注销。
 */
export class SharedSpGainModifierSet {
  constructor(
    readonly settings: SharedSpGainSettings,
    readonly runtimeState: SharedSpGainModifierState = { modifiers: [] },
  ) {
    requireFinite(settings.baseGainEfficiency, 'base shared SP gain efficiency');
  }

  get modifierCount(): number {
    return this.runtimeState.modifiers.length;
  }

  add(modifier: SharedSpGainModifier): void {
    if (!this.runtimeState.modifiers.includes(modifier)) this.runtimeState.modifiers.push(modifier);
  }

  remove(modifier: SharedSpGainModifier): boolean {
    const index = this.runtimeState.modifiers.indexOf(modifier);
    if (index < 0) return false;
    this.runtimeState.modifiers.splice(index, 1);
    return true;
  }

  resolve(source: SharedSpGainSource, method: SharedSpGainMethod): SharedSpGainEfficiency {
    return resolveSharedSpGain(this.runtimeState, this.settings, source, method);
  }
}

/** 按当前注册项计算获取效率；恢复后的状态可以直接使用，无需重建注册表对象。 */
export function resolveSharedSpGain(
  state: SharedSpGainModifierState,
  settings: SharedSpGainSettings,
  source: SharedSpGainSource,
  method: SharedSpGainMethod,
): SharedSpGainEfficiency {
  const gainEfficiency = resolveAttribute(
    state,
    'gainEfficiency',
    settings.baseGainEfficiency,
    method === 'return',
  );
  const sourceAttribute = sourceAttributeOf(source);
  const sourceEfficiency =
    sourceAttribute === null ? 1 : resolveAttribute(state, sourceAttribute, 1, false);
  return {
    gainEfficiency,
    sourceEfficiency,
    totalEfficiency: gainEfficiency * sourceEfficiency,
  };
}

function resolveAttribute(
  state: SharedSpGainModifierState,
  attribute: SharedSpGainAttribute,
  baseValue: number,
  filterReturnSpGain: boolean,
): number {
  const modifiers = state.modifiers.filter(
    modifier =>
      modifier.attribute === attribute && (!filterReturnSpGain || modifier.applyToReturnSpGain),
  );
  const addition = sum(modifiers, 'addition');
  const multiplier = sum(modifiers, 'multiplier');
  return (baseValue + addition) * Math.max(0, 1 + multiplier);
}

export function createSharedSpRecoveryModifier(
  operation: SharedSpGainModifierOperation,
  value: number,
): SharedSpRecoveryModifier {
  requireFinite(value, 'shared SP recovery modifier value');
  return { operation, value };
}

/** 战斗内自然技力恢复使用的全局修正集合。 */
export class SharedSpRecoveryModifierSet {
  constructor(readonly runtimeState: SharedSpRecoveryModifierState = { modifiers: [] }) {}

  add(modifier: SharedSpRecoveryModifier): void {
    if (!this.runtimeState.modifiers.includes(modifier)) this.runtimeState.modifiers.push(modifier);
  }

  remove(modifier: SharedSpRecoveryModifier): boolean {
    const index = this.runtimeState.modifiers.indexOf(modifier);
    if (index < 0) return false;
    this.runtimeState.modifiers.splice(index, 1);
    return true;
  }

  resolve(baseValue: number): number {
    return resolveSharedSpRecovery(this.runtimeState, baseValue);
  }
}

/** 按当前注册项计算每秒自然恢复量，不读写注册表以外的战斗数据。 */
export function resolveSharedSpRecovery(
  state: SharedSpRecoveryModifierState,
  baseValue: number,
): number {
  requireFinite(baseValue, 'shared SP recovery base value');
  return (
    (baseValue + sum(state.modifiers, 'addition')) *
    Math.max(0, 1 + sum(state.modifiers, 'multiplier'))
  );
}

function sourceAttributeOf(source: SharedSpGainSource): SharedSpGainAttribute | null {
  if (source === 'normalAttack') return 'normalAttackEfficiency';
  if (source === 'powerAttack') return 'powerAttackEfficiency';
  return null;
}

function sum<
  T extends { readonly operation: SharedSpGainModifierOperation; readonly value: number },
>(modifiers: readonly T[], operation: SharedSpGainModifierOperation): number {
  return modifiers.reduce(
    (total, modifier) => total + (modifier.operation === operation ? modifier.value : 0),
    0,
  );
}

function requireFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
}
