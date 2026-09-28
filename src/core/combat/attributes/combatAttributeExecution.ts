/** 复用原生八槽公式及修正器注册规则；算法不持有属性状态。 */
import type {
  AttributeModifierTiming,
  AttributeModifierValues,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import {
  ATTRIBUTE_MODIFIER_SOURCES,
  type AttributeModifierSource,
  type CombatAttributeDefinition,
  type CombatAttributeModifier,
  type CombatAttributeState,
  type CombatAttributeValueStage,
} from '../state/foundationState';

/** 校验并创建修正项；注册时继续保留同一对象身份。 */
export function createCombatAttributeModifier<Key extends string>(
  attribute: Key,
  values: AttributeModifierValues,
  source: AttributeModifierSource,
  timing: AttributeModifierTiming,
): CombatAttributeModifier<Key> {
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) throw new TypeError(`attribute modifier ${name} must be finite`);
  }
  return { attribute, values, source, timing };
}

export function defineCombatAttribute<Key extends string>(
  state: CombatAttributeState<Key>,
  attribute: Key,
  rawValue: number,
  definition: CombatAttributeDefinition,
): void {
  assertFinite(rawValue, 'raw attribute value');
  assertDefinition(definition);
  state.rawValues.set(attribute, rawValue);
  state.definitions.set(attribute, definition);
}

export function setCombatAttributeRawValue<Key extends string>(
  state: CombatAttributeState<Key>,
  attribute: Key,
  value: number,
): void {
  assertFinite(value, 'raw attribute value');
  state.rawValues.set(attribute, value);
}

export function readCombatAttribute<Key extends string>(
  state: CombatAttributeState<Key>,
  attribute: Key,
  stage: CombatAttributeValueStage,
  filter: AttributeModifierSource,
  additionalValues: readonly AttributeModifierValues[] = [],
): number {
  const rawValue = state.rawValues.get(attribute);
  if (rawValue === undefined) {
    if (additionalValues.length > 0) throw new Error(`attribute '${attribute}' is not defined`);
    return 0;
  }
  const definition = state.definitions.get(attribute);
  if (definition === undefined) {
    if (
      additionalValues.length > 0 ||
      state.modifiers.some(
        modifier => modifier.attribute === attribute && (modifier.source & filter) !== 0,
      )
    ) {
      throw new Error(`attribute '${attribute}' requires explicit native bounds`);
    }
    return rawValue;
  }

  // 保持每个槽的原始累计顺序，一次遍历完成八槽聚合，不为每次属性读取创建临时数组。
  let baseAddition = 0,
    baseMultiplier = 0,
    baseFinalAddition = 0,
    baseFinalMultiplier = 1;
  let addition = 0,
    multiplier = 0,
    finalAddition = 0,
    finalMultiplier = 1;
  const registeredCount = state.modifiers.length;
  for (let index = 0; index < registeredCount + additionalValues.length; index++) {
    let values: AttributeModifierValues;
    if (index < registeredCount) {
      const modifier = state.modifiers[index]!;
      if (modifier.attribute !== attribute || (modifier.source & filter) === 0) continue;
      values = modifier.values;
    } else values = additionalValues[index - registeredCount]!;
    baseAddition += values.baseAddition;
    baseMultiplier += values.baseMultiplier;
    baseFinalAddition += values.baseFinalAddition;
    baseFinalMultiplier *= values.baseFinalMultiplier;
    addition += values.addition;
    multiplier += values.multiplier;
    finalAddition += values.finalAddition;
    finalMultiplier *= values.finalMultiplier;
  }
  const baseValue = clamp(
    rawValue + baseAddition + (definition.otherAttributeBaseAddition ?? 0),
    definition,
  );
  const armedValue = clamp(
    (baseValue * Math.max(0, 1 + baseMultiplier) + baseFinalAddition) *
      baseFinalMultiplier *
      (definition.otherAttributeBaseFinalMultiplier ?? 1),
    definition,
  );
  if (stage === 'armed') return armedValue;
  const finalValue =
    ((armedValue + addition) * Math.max(0, 1 + multiplier) + finalAddition) *
    finalMultiplier *
    (definition.otherAttributeFinalMultiplier ?? 1);
  return clamp(finalValue, definition);
}

export function addCombatAttributeModifier<Key extends string>(
  state: CombatAttributeState<Key>,
  modifier: CombatAttributeModifier<Key>,
): void {
  if (!state.definitions.has(modifier.attribute)) {
    throw new Error(`attribute '${modifier.attribute}' requires explicit native bounds`);
  }
  if (!state.modifiers.includes(modifier)) state.modifiers.push(modifier);
}

export function removeCombatAttributeModifier<Key extends string>(
  state: CombatAttributeState<Key>,
  modifier: CombatAttributeModifier<Key>,
): boolean {
  const index = state.modifiers.indexOf(modifier);
  if (index < 0) return false;
  state.modifiers.splice(index, 1);
  return true;
}

export function clearInstantAttributeModifiers<Key extends string>(
  state: CombatAttributeState<Key>,
): void {
  for (let index = state.modifiers.length - 1; index >= 0; index -= 1) {
    if (state.modifiers[index]!.source === ATTRIBUTE_MODIFIER_SOURCES.instant) {
      state.modifiers.splice(index, 1);
    }
  }
}

function clamp(value: number, definition: CombatAttributeDefinition): number {
  return Math.min(
    Math.max(value, definition.minimum ?? Number.NEGATIVE_INFINITY),
    definition.maximum ?? Number.POSITIVE_INFINITY,
  );
}

function assertDefinition(definition: CombatAttributeDefinition): void {
  for (const [name, value] of Object.entries(definition)) assertFinite(value, name);
  if (
    definition.minimum !== undefined &&
    definition.maximum !== undefined &&
    definition.minimum > definition.maximum
  ) {
    throw new RangeError('minimum attribute value cannot exceed maximum value');
  }
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
}
