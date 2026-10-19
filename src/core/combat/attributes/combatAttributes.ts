// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
import type {
  AttributeModifierSlot,
  AttributeModifierValues,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import type { CombatAttributeState } from '../state/foundationState';
import {
  ATTRIBUTE_MODIFIER_SOURCES,
  createCombatAttributeState,
  type AttributeModifierSource,
  type CombatAttributeDefinition,
  type CombatAttributeModifier,
} from '../state/foundationState';
import {
  addCombatAttributeModifier,
  clearInstantAttributeModifiers,
  defineCombatAttribute,
  readCombatAttribute,
  removeCombatAttributeModifier,
  setCombatAttributeRawValue,
} from './combatAttributeExecution';
export {
  ATTRIBUTE_MODIFIER_SLOTS,
  ATTRIBUTE_MODIFIER_TIMINGS,
  type AttributeModifierSlot,
  type AttributeModifierTiming,
  type AttributeModifierValues,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
/**
 * 面板解析和战斗运行时共享的属性修正聚合核心。
 * 调用方必须按已确认的原生槽位注册修正，并显式管理启停，不能预先合并而丢失来源身份。
 */
export { createCombatAttributeModifier } from './combatAttributeExecution';
const IDENTITY_VALUES: AttributeModifierValues = {
  addition: 0,
  multiplier: 0,
  finalAddition: 0,
  finalMultiplier: 1,
  baseAddition: 0,
  baseMultiplier: 0,
  baseFinalAddition: 0,
  baseFinalMultiplier: 1,
};

export function attributeModifierValues(
  slot: AttributeModifierSlot,
  value: number,
): AttributeModifierValues {
  if (!Number.isFinite(value)) throw new TypeError('attribute modifier value must be finite');
  return { ...IDENTITY_VALUES, [slot]: value };
}

/** 属性集合的现有调用接口，状态与算法由独立模块提供。 */
export class CombatAttributeSet<Key extends string> {
  readonly #state: CombatAttributeState<Key>;
  readonly #observers = new Map<Key, (value: number, previous: number) => void>();
  #batching = false;
  constructor(state = createCombatAttributeState<Key>()) {
    this.#state = state;
  }
  /** 供实体宿主纳入完整数据图；不提供单独恢复属性的入口。 */
  get runtimeState(): CombatAttributeState<Key> {
    return this.#state;
  }
  get modifierCount(): number {
    return this.#state.modifiers.length;
  }
  /** 分支装配时绑定；回调不进入切面，绑定本身不重放属性变化。 */
  bindChangeObserver(attribute: Key, observer: (value: number, previous: number) => void): void {
    this.#observers.set(attribute, observer);
  }
  #beforeChange(attribute: Key): number | undefined {
    return !this.#batching && this.#observers.has(attribute) && this.has(attribute)
      ? this.get(attribute)
      : undefined;
  }
  /** 一次 Buff 修正集合的替换只发布最终值，不暴露新旧修正同时注册的过渡值。 */
  batchChanges<T>(update: () => T): T {
    if (this.#batching) return update();
    const previous = [...this.#observers.keys()].map(
      key => [key, this.#beforeChange(key)] as const,
    );
    this.#batching = true;
    try {
      return update();
    } finally {
      this.#batching = false;
      for (const [key, value] of previous) this.#afterChange(key, value);
    }
  }
  #afterChange(attribute: Key, previous: number | undefined): void {
    if (previous === undefined) return;
    const value = this.get(attribute);
    if (value !== previous) this.#observers.get(attribute)?.(value, previous);
  }
  define(attribute: Key, rawValue: number, definition: CombatAttributeDefinition): void {
    const previous = this.#beforeChange(attribute);
    defineCombatAttribute(this.#state, attribute, rawValue, definition);
    this.#afterChange(attribute, previous);
  }
  setRawValue(attribute: Key, value: number): void {
    const previous = this.#beforeChange(attribute);
    setCombatAttributeRawValue(this.#state, attribute, value);
    this.#afterChange(attribute, previous);
  }
  has(attribute: string): boolean {
    return this.#state.rawValues.has(attribute as Key);
  }
  /** 读取基础槽结算后的 Armed 值，不包含四个最终槽的修正。 */
  getArmed(
    attribute: Key,
    filter: AttributeModifierSource = ATTRIBUTE_MODIFIER_SOURCES.all,
  ): number {
    return readCombatAttribute(this.#state, attribute, 'armed', filter);
  }
  get(attribute: Key, filter: AttributeModifierSource = ATTRIBUTE_MODIFIER_SOURCES.all): number {
    return readCombatAttribute(this.#state, attribute, 'final', filter);
  }
  /** 仅为当前命中附加修正，不注册到实体，也不影响后续命中。 */
  getWithAdditionalModifiers(attribute: Key, values: readonly AttributeModifierValues[]): number {
    for (const modifier of values) {
      for (const [name, value] of Object.entries(modifier)) {
        if (!Number.isFinite(value))
          throw new TypeError(`attribute modifier ${name} must be finite`);
      }
    }
    return readCombatAttribute(
      this.#state,
      attribute,
      'final',
      ATTRIBUTE_MODIFIER_SOURCES.all,
      values,
    );
  }
  addModifier(modifier: CombatAttributeModifier<Key>): void {
    const previous = this.#beforeChange(modifier.attribute);
    addCombatAttributeModifier(this.#state, modifier);
    this.#afterChange(modifier.attribute, previous);
  }
  removeModifier(modifier: CombatAttributeModifier<Key>): boolean {
    const previous = this.#beforeChange(modifier.attribute);
    const removed = removeCombatAttributeModifier(this.#state, modifier);
    this.#afterChange(modifier.attribute, previous);
    return removed;
  }
  clearInstantModifiers(): void {
    const previous = [...this.#observers.keys()].map(
      key => [key, this.#beforeChange(key)] as const,
    );
    clearInstantAttributeModifiers(this.#state);
    for (const [key, value] of previous) this.#afterChange(key, value);
  }
}
