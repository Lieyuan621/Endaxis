// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
export {
  ATTRIBUTE_MODIFIER_SLOTS,
  ATTRIBUTE_MODIFIER_TIMINGS,
  type AttributeModifierSlot,
  type AttributeModifierTiming,
  type AttributeModifierValues,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import {
  type AttributeModifierSlot,
  type AttributeModifierValues,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
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
  readonly #state: import('../state/foundationState').CombatAttributeState<Key>;
  constructor(state = createCombatAttributeState<Key>()) {
    this.#state = state;
  }
  /** 供实体宿主纳入完整数据图；不提供单独恢复属性的入口。 */
  get runtimeState(): import('../state/foundationState').CombatAttributeState<Key> {
    return this.#state;
  }
  get modifierCount(): number {
    return this.#state.modifiers.length;
  }
  define(attribute: Key, rawValue: number, definition: CombatAttributeDefinition): void {
    defineCombatAttribute(this.#state, attribute, rawValue, definition);
  }
  setRawValue(attribute: Key, value: number): void {
    setCombatAttributeRawValue(this.#state, attribute, value);
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
    addCombatAttributeModifier(this.#state, modifier);
  }
  removeModifier(modifier: CombatAttributeModifier<Key>): boolean {
    return removeCombatAttributeModifier(this.#state, modifier);
  }
  clearInstantModifiers(): void {
    clearInstantAttributeModifiers(this.#state);
  }
  capture(attributes: readonly Key[]): ReadonlyMap<Key, number> {
    return new Map(attributes.map(attribute => [attribute, this.get(attribute)]));
  }
}
