import {
  parseAttributeTypeValue,
  parseModifierTypeValue,
  parseModifyAttributeTypeValue,
  type AttributeModifierIdentitySource,
} from './attributeModifiers.ts';
import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';

const BUNDLE_FIELDS = new Set(['dataList', 'desc', 'id']);
const ENTRY_FIELDS = new Set([
  'activeCondition',
  'attachBuff',
  'attachSkill',
  'attrModifier',
  'modifyType',
  'skillBbModifier',
  'skillParamModifier',
]);

export const OPERATOR_PROGRESSION_MODIFY_TYPES = [
  'none',
  'addPassiveSkill',
  'changeSkillParameter',
  'changeSkillBlackboard',
  'modifyAttribute',
  'addBuff',
] as const;
export type OperatorProgressionModifyTypeSource =
  (typeof OPERATOR_PROGRESSION_MODIFY_TYPES)[number];

export const SKILL_VALUE_MODIFY_TYPES = ['none', 'add', 'multiply', 'overwrite'] as const;
export type SkillValueModifyTypeSource = (typeof SKILL_VALUE_MODIFY_TYPES)[number];

export const MODIFIABLE_SKILL_PARAMETERS = [
  'none',
  'costValue',
  'cooldown',
  'maximumChargeTime',
  'cooldownDisplay',
] as const;
export type ModifiableSkillParameterSource = (typeof MODIFIABLE_SKILL_PARAMETERS)[number];

export interface ProgressionAttachedSkillSource {
  readonly skillId: string;
  readonly skillPath: string;
  readonly blackboard: Readonly<Record<string, number>>;
}

export interface ProgressionAttachedBuffSource {
  readonly buffId: string;
  readonly blackboard: Readonly<Record<string, number>>;
}

export interface ProgressionAttributeModifierSource extends AttributeModifierIdentitySource {
  readonly value: number;
}

export interface ProgressionSkillBlackboardModifierSource {
  readonly skillId: string;
  readonly key: string;
  readonly numberValue: number;
  readonly stringValue: string;
  readonly modifyType: SkillValueModifyTypeSource;
}

export interface ProgressionSkillParameterModifierSource {
  readonly skillId: string;
  readonly parameter: ModifiableSkillParameterSource;
  readonly value: number;
  readonly modifyType: SkillValueModifyTypeSource;
}

/** PotentialTalentEffectData 中一项完整联合载荷。非活动槽位也保留其已验证的默认值。 */
export interface OperatorProgressionEffectEntrySource {
  readonly sourcePath: string;
  readonly modifyType: OperatorProgressionModifyTypeSource;
  readonly activeConditions: readonly string[];
  readonly attachedSkill: ProgressionAttachedSkillSource;
  readonly attachedBuff: ProgressionAttachedBuffSource;
  readonly attributeModifier: ProgressionAttributeModifierSource;
  readonly skillBlackboardModifier: ProgressionSkillBlackboardModifierSource;
  readonly skillParameterModifier: ProgressionSkillParameterModifierSource;
}

export interface OperatorProgressionEffectBundleSource {
  readonly sourcePath: string;
  readonly effectId: string;
  readonly entries: readonly OperatorProgressionEffectEntrySource[];
}

/** 严格读取天赋和潜能共用的 PotentialTalentEffectTable；不在来源层决定如何安装效果。 */
export function parseOperatorProgressionEffectBundles(
  value: unknown,
  effectIds: readonly string[],
  sourceName = 'PotentialTalentEffectTable',
): OperatorProgressionEffectBundleSource[] {
  const table = requireRecord(value, sourceName);
  if (new Set(effectIds).size !== effectIds.length) {
    throw new Error('effectIds: duplicate effect ID');
  }
  return effectIds.map(effectId => {
    const sourcePath = `${sourceName}.${effectId}`;
    const row = requireRecord(table[effectId], sourcePath);
    requireExactFields(row, BUNDLE_FIELDS, sourcePath);
    const embeddedId = requireNonEmptyString(row.id, `${sourcePath}.id`);
    if (embeddedId !== effectId) {
      throw new Error(`${sourcePath}.id: expected ${JSON.stringify(effectId)}`);
    }
    validateI18nText(row.desc, `${sourcePath}.desc`);
    return {
      sourcePath,
      effectId,
      entries: requireArray(row.dataList, `${sourcePath}.dataList`).map((entry, index) =>
        parseEffectEntry(entry, `${sourcePath}.dataList[${index}]`),
      ),
    };
  });
}

function parseEffectEntry(value: unknown, path: string): OperatorProgressionEffectEntrySource {
  const row = requireRecord(value, path);
  requireExactFields(row, ENTRY_FIELDS, path);
  const result: OperatorProgressionEffectEntrySource = {
    sourcePath: path,
    modifyType: parseEnumValue(
      row.modifyType,
      OPERATOR_PROGRESSION_MODIFY_TYPES,
      `${path}.modifyType`,
      'PotentialModifyType',
    ),
    // 原生 CheckSkillConditions 会跳过空字符串；来源层必须保留它，不能提前删改数组。
    activeConditions: requireArray(row.activeCondition, `${path}.activeCondition`).map(
      (condition, index) => requireString(condition, `${path}.activeCondition[${index}]`),
    ),
    attachedSkill: parseAttachedSkill(row.attachSkill, `${path}.attachSkill`),
    attachedBuff: parseAttachedBuff(row.attachBuff, `${path}.attachBuff`),
    attributeModifier: parseAttributeModifier(row.attrModifier, `${path}.attrModifier`),
    skillBlackboardModifier: parseSkillBlackboardModifier(
      row.skillBbModifier,
      `${path}.skillBbModifier`,
    ),
    skillParameterModifier: parseSkillParameterModifier(
      row.skillParamModifier,
      `${path}.skillParamModifier`,
    ),
  };
  validateInactivePayloads(result);
  validateActivePayload(result);
  return result;
}

function parseAttachedSkill(value: unknown, path: string): ProgressionAttachedSkillSource {
  const row = requireRecord(value, path);
  requireExactFields(row, new Set(['blackboard', 'skillId', 'skillPath']), path);
  return {
    skillId: requireString(row.skillId, `${path}.skillId`),
    skillPath: requireString(row.skillPath, `${path}.skillPath`),
    blackboard: parseBlackboard(row.blackboard, `${path}.blackboard`),
  };
}

function parseAttachedBuff(value: unknown, path: string): ProgressionAttachedBuffSource {
  const row = requireRecord(value, path);
  requireExactFields(row, new Set(['blackboard', 'buffId']), path);
  return {
    buffId: requireString(row.buffId, `${path}.buffId`),
    blackboard: parseBlackboard(row.blackboard, `${path}.blackboard`),
  };
}

function parseBlackboard(value: unknown, path: string): Readonly<Record<string, number>> {
  const result: Record<string, number> = {};
  requireArray(value, path).forEach((rawEntry, index) => {
    const entryPath = `${path}[${index}]`;
    const entry = requireRecord(rawEntry, entryPath);
    requireExactFields(entry, new Set(['key', 'value', 'valueStr']), entryPath);
    const key = requireNonEmptyString(entry.key, `${entryPath}.key`);
    if (key in result) throw new Error(`${path}: duplicate key ${key}`);
    const stringValue = requireString(entry.valueStr, `${entryPath}.valueStr`);
    if (stringValue) throw new Error(`${entryPath}.valueStr: expected empty string`);
    result[key] = requireNumber(entry.value, `${entryPath}.value`);
  });
  return result;
}

function parseAttributeModifier(value: unknown, path: string): ProgressionAttributeModifierSource {
  const row = requireRecord(value, path);
  requireExactFields(
    row,
    new Set(['attrType', 'attrValue', 'modifierType', 'modifyAttributeType']),
    path,
  );
  return {
    attributeType: parseAttributeTypeValue(row.attrType, `${path}.attrType`),
    value: requireNumber(row.attrValue, `${path}.attrValue`),
    formulaItem: parseModifierTypeValue(row.modifierType, `${path}.modifierType`),
    modifyAttributeType: parseModifyAttributeTypeValue(
      row.modifyAttributeType,
      `${path}.modifyAttributeType`,
    ),
  };
}

function parseSkillBlackboardModifier(
  value: unknown,
  path: string,
): ProgressionSkillBlackboardModifierSource {
  const row = requireRecord(value, path);
  requireExactFields(
    row,
    new Set(['bbKey', 'floatValue', 'modifyType', 'skillId', 'stringValue']),
    path,
  );
  return {
    skillId: requireString(row.skillId, `${path}.skillId`),
    key: requireString(row.bbKey, `${path}.bbKey`),
    numberValue: requireNumber(row.floatValue, `${path}.floatValue`),
    stringValue: requireString(row.stringValue, `${path}.stringValue`),
    modifyType: parseEnumValue(
      row.modifyType,
      SKILL_VALUE_MODIFY_TYPES,
      `${path}.modifyType`,
      'SkillParamModifyType',
    ),
  };
}

function parseSkillParameterModifier(
  value: unknown,
  path: string,
): ProgressionSkillParameterModifierSource {
  const row = requireRecord(value, path);
  requireExactFields(row, new Set(['modifyType', 'paramType', 'paramValue', 'skillId']), path);
  return {
    skillId: requireString(row.skillId, `${path}.skillId`),
    parameter: parseEnumValue(
      row.paramType,
      MODIFIABLE_SKILL_PARAMETERS,
      `${path}.paramType`,
      'ModifiableSkillParam',
    ),
    value: requireNumber(row.paramValue, `${path}.paramValue`),
    modifyType: parseEnumValue(
      row.modifyType,
      SKILL_VALUE_MODIFY_TYPES,
      `${path}.modifyType`,
      'SkillParamModifyType',
    ),
  };
}

function validateInactivePayloads(entry: OperatorProgressionEffectEntrySource): void {
  const path = entry.sourcePath;
  if (entry.modifyType !== 'addPassiveSkill' && !isEmptyAttachedSkill(entry.attachedSkill)) {
    throw new Error(`${path}.attachSkill: inactive payload is not empty`);
  }
  if (entry.modifyType !== 'addBuff' && !isEmptyAttachedBuff(entry.attachedBuff)) {
    throw new Error(`${path}.attachBuff: inactive payload is not empty`);
  }
  if (
    entry.modifyType !== 'modifyAttribute' &&
    !isEmptyAttributeModifier(entry.attributeModifier)
  ) {
    throw new Error(`${path}.attrModifier: inactive payload is not empty`);
  }
  if (
    entry.modifyType !== 'changeSkillBlackboard' &&
    !isEmptySkillBlackboardModifier(entry.skillBlackboardModifier)
  ) {
    throw new Error(`${path}.skillBbModifier: inactive payload is not empty`);
  }
  if (
    entry.modifyType !== 'changeSkillParameter' &&
    !isEmptySkillParameterModifier(entry.skillParameterModifier)
  ) {
    throw new Error(`${path}.skillParamModifier: inactive payload is not empty`);
  }
}

function validateActivePayload(entry: OperatorProgressionEffectEntrySource): void {
  switch (entry.modifyType) {
    case 'none':
      return;
    case 'addPassiveSkill':
      if (!entry.attachedSkill.skillId) {
        throw new Error(`${entry.sourcePath}.attachSkill.skillId: expected non-empty string`);
      }
      if (entry.attachedSkill.skillPath) {
        throw new Error(`${entry.sourcePath}.attachSkill.skillPath: expected empty string`);
      }
      return;
    case 'addBuff':
      if (!entry.attachedBuff.buffId) {
        throw new Error(`${entry.sourcePath}.attachBuff.buffId: expected non-empty string`);
      }
      return;
    case 'changeSkillBlackboard':
      if (
        !entry.skillBlackboardModifier.skillId ||
        !entry.skillBlackboardModifier.key ||
        entry.skillBlackboardModifier.modifyType === 'none'
      ) {
        throw new Error(`${entry.sourcePath}.skillBbModifier: incomplete active payload`);
      }
      return;
    case 'changeSkillParameter':
      if (
        !entry.skillParameterModifier.skillId ||
        entry.skillParameterModifier.parameter === 'none' ||
        entry.skillParameterModifier.modifyType === 'none'
      ) {
        throw new Error(`${entry.sourcePath}.skillParamModifier: incomplete active payload`);
      }
      return;
    case 'modifyAttribute':
      return;
  }
}

function isEmptyAttachedSkill(value: ProgressionAttachedSkillSource): boolean {
  return !value.skillId && !value.skillPath && Object.keys(value.blackboard).length === 0;
}

function isEmptyAttachedBuff(value: ProgressionAttachedBuffSource): boolean {
  return !value.buffId && Object.keys(value.blackboard).length === 0;
}

function isEmptyAttributeModifier(value: ProgressionAttributeModifierSource): boolean {
  return (
    value.modifyAttributeType === 'Specific' &&
    value.attributeType === 'Level' &&
    value.formulaItem === 'Addition' &&
    value.value === 0
  );
}

function isEmptySkillBlackboardModifier(value: ProgressionSkillBlackboardModifierSource): boolean {
  return (
    !value.skillId &&
    !value.key &&
    !value.stringValue &&
    value.numberValue === 0 &&
    value.modifyType === 'none'
  );
}

function isEmptySkillParameterModifier(value: ProgressionSkillParameterModifierSource): boolean {
  return (
    !value.skillId && value.parameter === 'none' && value.value === 0 && value.modifyType === 'none'
  );
}

function parseEnumValue<const T extends readonly string[]>(
  value: unknown,
  values: T,
  path: string,
  enumName: string,
): T[number] {
  const index = requireNonNegativeInteger(value, path);
  const result = values[index];
  if (result === undefined) throw new Error(`${path}: unsupported ${enumName} ${index}`);
  return result;
}

function validateI18nText(value: unknown, path: string): void {
  const row = requireRecord(value, path);
  requireExactFields(row, new Set(['id', 'text']), path);
  requireNumber(row.id, `${path}.id`);
  requireString(row.text, `${path}.text`);
}
