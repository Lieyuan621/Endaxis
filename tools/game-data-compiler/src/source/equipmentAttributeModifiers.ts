import {
  parseAttributeTypeValue,
  parseModifierTypeValue,
  parseModifyAttributeTypeValue,
  type AttributeModifierIdentitySource,
  type ResolvedAttributeModifierSource,
} from './attributeModifiers.ts';
import {
  requireArray,
  requireExactFields,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseItemIdentitySource, type ItemIdentitySource } from './itemIdentity.ts';

const EQUIPMENT_FIELDS = new Set([
  'displayAttrModifiers',
  'displayBaseAttrModifier',
  'domainId',
  'equipAttrModifiers',
  'itemId',
  'minWearLv',
  'partType',
  'suitID',
]);
const EQUIPMENT_MODIFIER_FIELDS = new Set([
  'attrIndex',
  'attrType',
  'attrValues',
  'modifierType',
  'modifyAttributeType',
]);
const DISPLAY_MODIFIER_FIELDS = new Set([
  'attrIndex',
  'attrType',
  'attrValue',
  'compositeAttr',
  'enhanceGuaranteeTimesRuleId',
  'enhancedAttrIndex',
  'enhancedAttrValues',
  'modifierType',
]);
export type EquipmentItemIdentitySource = ItemIdentitySource;

export const EQUIPMENT_PART_TYPES = ['Body', 'Hand', 'EDC', 'EndNum', 'Head', 'Ring'] as const;
export type EquipmentPartTypeSource = (typeof EQUIPMENT_PART_TYPES)[number];

const EQUIPMENT_PART_TYPE_BY_NATIVE_VALUE: Readonly<Record<number, EquipmentPartTypeSource>> = {
  0: 'Body',
  1: 'Hand',
  2: 'EDC',
  3: 'EndNum',
  4: 'Head',
  5: 'Ring',
};

/**
 * EquipAttributeModifierData 的公共源 IR。
 * 名称身份供公共属性修正编译器消费，native* 字段保留 TableCfg 的原始数值证据。
 */
export interface EquipmentAttributeModifierSource extends AttributeModifierIdentitySource {
  readonly sourcePath: string;
  readonly attributeIndex: number;
  readonly attributeValues: readonly number[];
  readonly nativeModifyAttributeType: number;
  readonly nativeAttributeType: number;
  readonly nativeModifierType: number;
}

export interface EquipmentDisplayAttributeModifierSource extends AttributeModifierIdentitySource {
  readonly sourcePath: string;
  /** UI 中的词条顺序，不是精锻档位所绑定的模拟 attrIndex。 */
  readonly displayIndex: number;
  /** 与 equipAttrModifiers.attrIndex 对应的真实精锻身份。 */
  readonly enhancedAttributeIndex: number;
  readonly compositeAttribute: string;
  readonly attributeValues: readonly number[];
  readonly nativeAttributeType: number;
  readonly nativeModifierType: number;
}

export interface EquipmentItemSource {
  readonly sourcePath: string;
  readonly equipmentId: string;
  readonly identity: EquipmentItemIdentitySource;
  readonly domainId: string;
  readonly suitId: string;
  readonly minimumWearLevel: number;
  readonly partType: EquipmentPartTypeSource;
  readonly nativePartType: number;
  readonly attributeModifiers: readonly EquipmentAttributeModifierSource[];
  readonly displayAttributeModifiers: readonly EquipmentDisplayAttributeModifierSource[];
}

export interface ResolvedEquipmentAttributeModifierSource extends ResolvedAttributeModifierSource {
  readonly attributeIndex: number;
  readonly enhancementLevel: number;
}

/**
 * 联合读取 ItemTable 身份与 EquipTable 战斗事实。
 * 属性修正只来自 EquipTable；ItemTable 不被误当作战斗规则来源。
 */
export function parseEquipmentItemSources(
  equipTableValue: unknown,
  itemTableValue: unknown,
  equipmentIds: readonly string[],
  equipSourceName = 'EquipTable',
  itemSourceName = 'ItemTable',
): EquipmentItemSource[] {
  const equipTable = requireRecord(equipTableValue, equipSourceName);
  const itemTable = requireRecord(itemTableValue, itemSourceName);
  if (new Set(equipmentIds).size !== equipmentIds.length) {
    throw new Error('equipmentIds: duplicate equipment ID');
  }

  return equipmentIds.map(equipmentId => {
    const sourcePath = `${equipSourceName}.${equipmentId}`;
    const row = requireRecord(equipTable[equipmentId], sourcePath);
    requireExactFields(row, EQUIPMENT_FIELDS, sourcePath);
    const embeddedId = requireString(row.itemId, `${sourcePath}.itemId`);
    if (embeddedId !== equipmentId) {
      throw new Error(`${sourcePath}.itemId: expected ${JSON.stringify(equipmentId)}`);
    }

    parseDisplayModifier(
      row.displayBaseAttrModifier,
      `${sourcePath}.displayBaseAttrModifier`,
      true,
    );
    const displayAttributeModifiers = requireArray(
      row.displayAttrModifiers,
      `${sourcePath}.displayAttrModifiers`,
    ).map((modifier, index) => {
      const parsed = parseDisplayModifier(
        modifier,
        `${sourcePath}.displayAttrModifiers[${index}]`,
        false,
      );
      if (parsed === null) throw new Error('non-empty display modifier unexpectedly parsed empty');
      return parsed;
    });
    if (displayAttributeModifiers.length === 0) {
      throw new Error(`${sourcePath}.displayAttrModifiers: expected at least one display modifier`);
    }

    const modifiers = requireArray(row.equipAttrModifiers, `${sourcePath}.equipAttrModifiers`).map(
      (rawModifier, index) =>
        parseEquipmentAttributeModifier(rawModifier, `${sourcePath}.equipAttrModifiers[${index}]`),
    );
    if (modifiers.length === 0) {
      throw new Error(`${sourcePath}.equipAttrModifiers: expected at least one modifier`);
    }

    const nativePartType = requireNonNegativeInteger(row.partType, `${sourcePath}.partType`);
    const partType = EQUIPMENT_PART_TYPE_BY_NATIVE_VALUE[nativePartType];
    if (partType === undefined) {
      throw new Error(
        `${sourcePath}.partType: unknown Beyond.GEnums.PartType value ${nativePartType}`,
      );
    }

    return {
      sourcePath,
      equipmentId,
      identity: parseItemIdentitySource(itemTable[equipmentId], equipmentId, itemSourceName),
      domainId: requireString(row.domainId, `${sourcePath}.domainId`),
      suitId: requireString(row.suitID, `${sourcePath}.suitID`),
      minimumWearLevel: requireNonNegativeInteger(row.minWearLv, `${sourcePath}.minWearLv`),
      partType,
      nativePartType,
      attributeModifiers: modifiers,
      displayAttributeModifiers,
    };
  });
}

/**
 * 原生以 attrIndex 查询实例精锻档；缺少该索引时使用 0，越界不夹取也不回退。
 */
export function resolveEquipmentAttributeModifiers(
  equipment: EquipmentItemSource,
  enhancementLevels: ReadonlyMap<number, number>,
): ResolvedEquipmentAttributeModifierSource[] {
  return equipment.attributeModifiers.map(modifier => {
    const enhancementLevel = enhancementLevels.get(modifier.attributeIndex) ?? 0;
    if (!Number.isInteger(enhancementLevel) || enhancementLevel < 0) {
      throw new Error(
        `${modifier.sourcePath}: enhancement level for attrIndex ${modifier.attributeIndex} must be a non-negative integer`,
      );
    }
    const value = modifier.attributeValues[enhancementLevel];
    if (value === undefined) {
      throw new Error(
        `${modifier.sourcePath}.attrValues: no value for enhancement level ${enhancementLevel}`,
      );
    }
    return {
      sourcePath: modifier.sourcePath,
      attributeIndex: modifier.attributeIndex,
      enhancementLevel,
      modifyAttributeType: modifier.modifyAttributeType,
      attributeType: modifier.attributeType,
      formulaItem: modifier.formulaItem,
      value,
    };
  });
}

function parseEquipmentAttributeModifier(
  value: unknown,
  path: string,
): EquipmentAttributeModifierSource {
  const modifier = requireRecord(value, path);
  requireExactFields(modifier, EQUIPMENT_MODIFIER_FIELDS, path);
  const nativeModifyAttributeType = requireNonNegativeInteger(
    modifier.modifyAttributeType,
    `${path}.modifyAttributeType`,
  );
  const nativeAttributeType = requireNonNegativeInteger(modifier.attrType, `${path}.attrType`);
  const nativeModifierType = requireNonNegativeInteger(
    modifier.modifierType,
    `${path}.modifierType`,
  );
  const attributeValues = requireArray(modifier.attrValues, `${path}.attrValues`).map(
    (item, index) => requireNumber(item, `${path}.attrValues[${index}]`),
  );
  if (attributeValues.length === 0) {
    throw new Error(`${path}.attrValues: expected at least one value`);
  }
  return {
    sourcePath: path,
    attributeIndex: requireNonNegativeInteger(modifier.attrIndex, `${path}.attrIndex`),
    modifyAttributeType: parseModifyAttributeTypeValue(
      nativeModifyAttributeType,
      `${path}.modifyAttributeType`,
    ),
    attributeType: parseAttributeTypeValue(nativeAttributeType, `${path}.attrType`),
    formulaItem: parseModifierTypeValue(nativeModifierType, `${path}.modifierType`),
    attributeValues,
    nativeModifyAttributeType,
    nativeAttributeType,
    nativeModifierType,
  };
}

function parseDisplayModifier(
  value: unknown,
  path: string,
  allowEmpty: boolean,
): EquipmentDisplayAttributeModifierSource | null {
  const modifier = requireRecord(value, path);
  if (allowEmpty && Object.keys(modifier).length === 0) return null;
  requireExactFields(modifier, DISPLAY_MODIFIER_FIELDS, path);
  const nativeAttributeType = requireNonNegativeInteger(modifier.attrType, `${path}.attrType`);
  const nativeModifierType = requireNonNegativeInteger(
    modifier.modifierType,
    `${path}.modifierType`,
  );
  const baseValue = requireNumber(modifier.attrValue, `${path}.attrValue`);
  const enhancedValues = requireArray(
    modifier.enhancedAttrValues,
    `${path}.enhancedAttrValues`,
  ).map((item, index) => requireNumber(item, `${path}.enhancedAttrValues[${index}]`));
  requireString(modifier.enhanceGuaranteeTimesRuleId, `${path}.enhanceGuaranteeTimesRuleId`);
  const compositeAttribute = requireString(modifier.compositeAttr, `${path}.compositeAttr`);
  return {
    sourcePath: path,
    displayIndex: requireNonNegativeInteger(modifier.attrIndex, `${path}.attrIndex`),
    enhancedAttributeIndex: requireNonNegativeInteger(
      modifier.enhancedAttrIndex,
      `${path}.enhancedAttrIndex`,
    ),
    compositeAttribute,
    attributeValues: [baseValue, ...enhancedValues],
    modifyAttributeType:
      compositeAttribute === 'Main' ? 'Main' : compositeAttribute === 'Sub' ? 'Sub' : 'Specific',
    attributeType: parseAttributeTypeValue(nativeAttributeType, `${path}.attrType`),
    formulaItem: parseModifierTypeValue(nativeModifierType, `${path}.modifierType`),
    nativeAttributeType,
    nativeModifierType,
  };
}
