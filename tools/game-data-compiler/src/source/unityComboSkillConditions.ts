/**
 * character-template-prefix-v1 的已解码 RID 适配，非新的动作语义解析器。
 * 仅接受下方白名单中的已审计直接叶子；转换序列化字段后仍进入唯一公共 Action/Condition 读取器。
 */
import { parseComboSkillConditionsSource } from './comboSkillConditions.ts';
import { parseBuffIconDuration } from './buffActions.ts';
import { readBlackboardAssignmentValueType } from './assignments.ts';
import { readBuffFindCheckType, readBuffStackNumType } from './buffFindSettings.ts';
import { readCompareType } from './conditionEnums.ts';
import { NATIVE_GAMEPLAY_TAG_QUERY_NAMES } from './tagQuery.ts';
import type { BlackboardLevelValues } from './scalar.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireRecord,
  requireString,
} from './primitives.ts';

import { readActionTarget, readDirectionType, readTargetSource } from './targetEnums.ts';
const META = ['isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex'];
const LEAF_FIELDS: Readonly<Record<string, readonly string[]>> = {
  'Beyond.Gameplay.Core.CheckComboSkillPending/Data': ['owner'],
  'Beyond.Gameplay.Core.Conditions.CheckObjectTypeMatch/Data': ['target', 'objectTypeMask'],
  'Beyond.Gameplay.Core.Conditions.CheckSpellInflictionType/Data': ['mask', 'savedKey'],
  'Beyond.Gameplay.Core.Conditions.CheckBuffStackNumByTag/Data': [
    'checkTarget',
    'tagQuery',
    'buffStackNumType',
    'compareType',
    'value',
  ],
  'Beyond.Gameplay.Core.CompareFloat/Data': ['valueA', 'compare', 'valueB'],
  'Beyond.Gameplay.Core.DebugPrintAction/Data': [
    'logType',
    'target',
    'color',
    'bbKey',
    'identifier',
  ],
  'Beyond.Gameplay.Core.Conditions.CheckDamageDecorateMask/Data': ['checkType', 'mask'],
  'Beyond.Gameplay.Core.Conditions.CheckTargetsEqual/Data': [
    'firstTargetSettings',
    'secondTargetSettings',
  ],
  'Beyond.Gameplay.Core.CheckBuffStackNumAdvanced/Data': [
    'checkTarget',
    'buffSettings',
    'buffStackNumType',
    'compareType',
    'value',
    'limitSkillCastId',
  ],
  'Beyond.Gameplay.Core.ModifyDynamicBlackboard/Data': [
    'key',
    'operation',
    'directValue',
    'value',
    'calculationTarget',
    'calculateType',
  ],
  'Beyond.Gameplay.Core.Conditions.CheckPhysicalInflictionType/Data': ['mask', 'savedKey'],
  'Beyond.Gameplay.Core.Conditions.CheckBuffIdInContextAdvanced/Data': [
    'checkType',
    'buffIdList',
    'query',
    'blackboardKey',
  ],
  'Beyond.Gameplay.Core.Conditions.CheckMainCharacterCondition/Data': ['checkTarget'],
  'Beyond.Gameplay.Core.Conditions.CheckBuffIdInContext/Data': [
    'checkType',
    'buffIdList',
    'query',
    'blackboardKey',
  ],
  'Beyond.Gameplay.Core.Conditions.CheckTagMatch/Data': ['checkTarget', 'query'],
  'Beyond.Gameplay.Core.Conditions.CheckHp/Data': ['hpOwner', 'compare', 'isRatio', 'value'],
  'Beyond.Gameplay.Core.Conditions.CheckBuffStackNum/Data': [
    'checkTarget',
    'buffId',
    'compareType',
    'value',
  ],
  'Beyond.Gameplay.Core.CreateBuffAction/Data': [
    'buffs',
    'count',
    'targetSettings',
    'buffSource',
    'contextKey',
    'autoFinishByAction',
    'inheritSkillIdList',
    'finishWithNextSkillIfNotInherited',
    'asChildBuff',
    'inheritSourceSkillCastId',
    'inheritSourceSkillCastInfo',
    'isExtra',
    'passTargetGroupsToBuff',
    'overrideBuffIconDuration',
    'buffIconDurationSource',
  ],
  'Beyond.Gameplay.Core.StoreBuffCount/Data': [
    'useCurrentBuff',
    'buffOwners',
    'buffId',
    'blackboardKey',
  ],
  'Beyond.Gameplay.Core.ReturnFalseAction/Data': [],
  'Beyond.Gameplay.Core.IfElseAction/IfElseActionData': [
    'conditionAction',
    'succeedActions',
    'failActions',
    'alwaysNext',
  ],
  'Beyond.Gameplay.Core.NotNextCheckAction/Data': [],
};

export function parseUnityComboSkillConditionsSource(
  value: unknown,
  referencesValue: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues = {},
) {
  const references = requireRecord(referencesValue, `${path}.references`);
  const usedReferences: { rid: string; sourcePath: string; source: Record<string, unknown> }[] = [];
  const expanded = requireArray(value, path).map((raw, index) => {
    const entryPath = `${path}[${index}]`;
    const entry = requireRecord(raw, entryPath);
    const sequencePath = `${entryPath}.comboSkillCheckAction`;
    const sequence = requireRecord(entry.comboSkillCheckAction, sequencePath);
    return {
      ...entry,
      comboSkillCheckAction: {
        ...sequence,
        actionData: requireArray(sequence.actionData, `${sequencePath}.actionData`).map(
          (value, actionIndex) => {
            const refPath = `${sequencePath}.actionData[${actionIndex}]`;
            const rid = requireString(value, refPath);
            if (!/^-?\d+$/.test(rid) || rid === '-2')
              throw new Error(`${refPath}: expected non-null RID string`);
            const reference = requireRecord(
              Object.hasOwn(references, rid) ? references[rid] : undefined,
              `${refPath} RID ${rid}`,
            );
            if (
              reference.rid !== rid ||
              reference.decodeStatus !== 'complete' ||
              reference.assembly !== 'Gameplay.Beyond'
            ) {
              throw new Error(
                `${refPath} RID ${rid}: mismatched, incomplete or unaudited reference`,
              );
            }
            usedReferences.push({ rid, sourcePath: refPath, source: reference });
            return normalizeLeaf(reference, references, usedReferences, `${refPath} RID ${rid}`);
          },
        ),
      },
    };
  });
  return {
    conditions: parseComboSkillConditionsSource(expanded, path, inheritedBlackboard),
    referenceSources: usedReferences,
  };
}

function enumName(value: unknown, names: readonly string[], path: string): string {
  const index = requireInteger(value, path);
  const name = names[index];
  if (name === undefined) throw new Error(`${path}: unsupported enum ${index}`);
  return name;
}

function normalizeLeaf(
  reference: Record<string, unknown>,
  references: Record<string, unknown>,
  usedReferences: { rid: string; sourcePath: string; source: Record<string, unknown> }[],
  path: string,
): Record<string, unknown> {
  const type = `${requireString(reference.namespace, `${path}.namespace`)}.${requireString(reference.class, `${path}.class`)}`;
  if (!Object.hasOwn(LEAF_FIELDS, type))
    throw new Error(`${path}: unsupported Unity action ${type}`);
  const data = requireRecord(reference.data, `${path}.data`);
  requireExactFields(data, new Set([...META, ...LEAF_FIELDS[type]!]), `${path}.data`);
  if (data.priorityLevel !== 0)
    throw new Error(`${path}: only audited Default priority is supported`);
  const result: Record<string, unknown> = {
    ...data,
    // Unity's managed-reference registry writes nested CLR classes with a slash
    // (for example IfElseAction/IfElseActionData).  The common source parser
    // consumes the canonical exported JSON spelling, which uses '+'.
    $type: `${type.replace('/', '+')}, Gameplay.Beyond`,
    priorityLevel: 'Default',
  };
  for (const key of [
    'target',
    'checkTarget',
    'hpOwner',
    'firstTargetSettings',
    'secondTargetSettings',
    'calculationTarget',
    'targetSettings',
    'buffOwners',
    'owner',
  ])
    if (key in data)
      result[key] = normalizeTarget(data[key], references, usedReferences, `${path}.${key}`);
  for (const key of ['valueA', 'valueB', 'value'])
    if (key in data) result[key] = normalizeScalar(data[key], `${path}.${key}`);
  for (const key of ['compare', 'compareType'])
    if (key in data) result[key] = readCompareType(data[key], `${path}.${key}`);
  if ('buffStackNumType' in data)
    result.buffStackNumType = readBuffStackNumType(
      data.buffStackNumType,
      `${path}.buffStackNumType`,
    );
  if ('tagQuery' in data) result.tagQuery = normalizeTagQuery(data.tagQuery, `${path}.tagQuery`);
  if ('query' in data) result.query = normalizeTagQuery(data.query, `${path}.query`);
  if ('buffSettings' in data)
    result.buffSettings = normalizeBuffFindSettings(data.buffSettings, `${path}.buffSettings`);
  if (type.endsWith('.CheckDamageDecorateMask/Data')) {
    result.checkType = enumName(
      data.checkType,
      ['Exact', ...NATIVE_GAMEPLAY_TAG_QUERY_NAMES],
      `${path}.checkType`,
    );
  }
  if (type.endsWith('.CheckPhysicalInflictionType/Data')) {
    result.mask = normalizeFlags(
      data.mask,
      ['Airborne', 'KnockDown', 'Fracture', 'Crush'],
      `${path}.mask`,
    );
  }
  if (
    type.endsWith('.CheckBuffIdInContext/Data') ||
    type.endsWith('.CheckBuffIdInContextAdvanced/Data')
  ) {
    result.checkType = enumName(data.checkType, ['Id', 'Tag'], `${path}.checkType`);
  }
  if (type.endsWith('.CheckBuffIdInContextAdvanced/Data')) {
    result.buffIdList = requireArray(data.buffIdList, `${path}.buffIdList`).map((value, index) =>
      normalizeBlackboardString(value, `${path}.buffIdList[${index}]`),
    );
  }
  if (type.endsWith('.ModifyDynamicBlackboard/Data')) {
    result.operation = enumName(
      data.operation,
      ['Assign', 'Add', 'Multiply', 'Divide', 'Floor', 'Ceil', 'RoundToInt'],
      `${path}.operation`,
    );
    result.calculateType = enumName(data.calculateType, ['HpRatio'], `${path}.calculateType`);
  }
  if (type.endsWith('.CreateBuffAction/Data')) {
    result.count = normalizeScalar(data.count, `${path}.count`);
    result.buffSource = readActionTarget(data.buffSource, `${path}.buffSource`);
    result.buffs = requireArray(data.buffs, `${path}.buffs`).map((value, index) =>
      normalizeCreateBuffInput(value, `${path}.buffs[${index}]`),
    );
    result.buffIconDurationSource = parseBuffIconDuration(
      data.buffIconDurationSource,
      `${path}.buffIconDurationSource`,
    );
  }
  if (type.endsWith('.IfElseAction/IfElseActionData')) {
    for (const key of ['conditionAction', 'succeedActions', 'failActions'])
      result[key] = normalizeReferencedSequence(
        data[key],
        references,
        usedReferences,
        `${path}.${key}`,
      );
  }
  return result;
}

function normalizeReferencedSequence(
  value: unknown,
  references: Record<string, unknown>,
  usedReferences: { rid: string; sourcePath: string; source: Record<string, unknown> }[],
  path: string,
) {
  const sequence = requireRecord(value, path);
  requireExactFields(
    sequence,
    new Set(['actionData', 'onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard']),
    path,
  );
  return {
    ...sequence,
    actionData: requireArray(sequence.actionData, `${path}.actionData`).map((value, index) => {
      const refPath = `${path}.actionData[${index}]`;
      const rid = requireString(value, refPath);
      const reference = requireRecord(references[rid], `${refPath} RID ${rid}`);
      if (
        reference.rid !== rid ||
        reference.decodeStatus !== 'complete' ||
        reference.assembly !== 'Gameplay.Beyond'
      )
        throw new Error(`${refPath} RID ${rid}: mismatched, incomplete or unaudited reference`);
      usedReferences.push({ rid, sourcePath: refPath, source: reference });
      return normalizeLeaf(reference, references, usedReferences, `${refPath} RID ${rid}`);
    }),
  };
}

function normalizeCreateBuffInput(value: unknown, path: string) {
  const input = requireRecord(value, path);
  requireExactFields(
    input,
    new Set(['buffId', 'assignBlackboard', 'assignItems', 'readIdFromBlackboard', 'buffIdKey']),
    path,
  );
  return {
    ...input,
    assignItems: requireArray(input.assignItems, `${path}.assignItems`).map((value, index) => {
      const itemPath = `${path}.assignItems[${index}]`;
      const item = requireRecord(value, itemPath);
      requireExactFields(
        item,
        new Set([
          'targetKey',
          'inputValueKey',
          'useDirectValue',
          'directValueType',
          'numericValue',
          'stringValue',
        ]),
        itemPath,
      );
      return {
        ...item,
        directValueType: readBlackboardAssignmentValueType(
          item.directValueType,
          `${itemPath}.directValueType`,
        ),
      };
    }),
  };
}

function normalizeBlackboardString(value: unknown, path: string) {
  const scalar = requireRecord(value, path);
  requireExactFields(scalar, new Set(['useKey', 'key', 'value']), path);
  return {
    useBlackboardKey: requireBoolean(scalar.useKey, `${path}.useKey`),
    blackboardKey: requireString(scalar.key, `${path}.key`),
    value: requireString(scalar.value, `${path}.value`),
  };
}

function normalizeFlags(value: unknown, names: readonly string[], path: string): string {
  const mask = requireInteger(value, path);
  if (mask <= 0 || mask >= 1 << names.length)
    throw new Error(`${path}: unsupported flag mask ${mask}`);
  return names.filter((_, index) => (mask & (1 << index)) !== 0).join(', ');
}

function normalizeBuffFindSettings(value: unknown, path: string) {
  const settings = requireRecord(value, path);
  requireExactFields(settings, new Set(['checkType', 'buffIdList', 'tagQuery']), path);
  return {
    checkType: readBuffFindCheckType(settings.checkType, `${path}.checkType`),
    buffIdList: requireArray(settings.buffIdList, `${path}.buffIdList`).map((value, index) =>
      requireString(value, `${path}.buffIdList[${index}]`),
    ),
    tagQuery: normalizeTagQuery(settings.tagQuery, `${path}.tagQuery`),
  };
}

function normalizeScalar(value: unknown, path: string) {
  const scalar = requireRecord(value, path);
  requireExactFields(scalar, new Set(['useKey', 'key', 'value']), path);
  return {
    useBlackboardKey: requireBoolean(scalar.useKey, `${path}.useKey`),
    blackboardKey: requireString(scalar.key, `${path}.key`),
    value: scalar.value,
  };
}

function normalizeTarget(
  value: unknown,
  references: Record<string, unknown>,
  usedReferences: { rid: string; sourcePath: string; source: Record<string, unknown> }[],
  path: string,
) {
  const target = requireRecord(value, path);
  const selector = requireRecord(target.selectorData, `${path}.selectorData`);
  requireExactFields(
    selector,
    new Set(['finderData', 'validatorData', 'postProcessorData']),
    `${path}.selectorData`,
  );
  const finderData = normalizeSelectorReference(
    selector.finderData,
    'finder',
    references,
    usedReferences,
    `${path}.selectorData.finderData`,
  );
  const validatorData = requireArray(
    selector.validatorData,
    `${path}.selectorData.validatorData`,
  ).map((value, index) =>
    normalizeSelectorReference(
      value,
      'validator',
      references,
      usedReferences,
      `${path}.selectorData.validatorData[${index}]`,
    ),
  );
  const postProcessorData = requireArray(
    selector.postProcessorData,
    `${path}.selectorData.postProcessorData`,
  ).map((value, index) =>
    normalizeSelectorReference(
      value,
      'postProcessor',
      references,
      usedReferences,
      `${path}.selectorData.postProcessorData[${index}]`,
    ),
  );
  const direction = requireRecord(target.advancedDirection, `${path}.advancedDirection`);
  if (direction.source !== '-2' || direction.target !== '-2')
    throw new Error(`${path}: non-empty direction RID graph is not normalized`);
  return {
    ...target,
    targetSource: readTargetSource(target.targetSource, `${path}.targetSource`),
    selectorOwner: readActionTarget(target.selectorOwner, `${path}.selectorOwner`),
    centerType: readActionTarget(target.centerType, `${path}.centerType`),
    target: readActionTarget(target.target, `${path}.target`),
    selectorDirection: readDirectionType(target.selectorDirection, `${path}.selectorDirection`),
    selectorData: {
      ...(finderData === null ? {} : { finderData }),
      validatorData,
      postProcessorData,
    },
  };
}

const EMPTY_SELECTOR_COMPONENT_TYPES = {
  finder: new Map([
    [
      'Beyond.Gameplay.Core.Selector/CharacterTeamFinder/Data',
      'Beyond.Gameplay.Core.Selector+CharacterTeamFinder+Data, Gameplay.Beyond',
    ],
  ]),
  validator: new Map([
    [
      'Beyond.Gameplay.Core.Selector/MainCharacterValidator/Data',
      'Beyond.Gameplay.Core.Selector+MainCharacterValidator+Data, Gameplay.Beyond',
    ],
  ]),
  postProcessor: new Map<string, string>(),
} as const;

/**
 * Unity managed-reference 会把无字段 selector 节点单独放在 RID 表中。这里仅把已经导出的
 * “类型明确且载荷严格为空”节点还原成公共 TargetSettings 读取器接受的 `$type` 对象；节点的
 * 目标语义仍只由公共 selector parser 解释，不能在连携适配器内复制。
 */
function normalizeSelectorReference(
  value: unknown,
  role: keyof typeof EMPTY_SELECTOR_COMPONENT_TYPES,
  references: Record<string, unknown>,
  usedReferences: { rid: string; sourcePath: string; source: Record<string, unknown> }[],
  path: string,
): Record<string, unknown> | null {
  const rid = requireString(value, path);
  if (rid === '-2') return null;
  if (!/^-?\d+$/.test(rid)) throw new Error(`${path}: expected RID string`);
  const reference = requireRecord(
    Object.hasOwn(references, rid) ? references[rid] : undefined,
    `${path} RID ${rid}`,
  );
  if (
    reference.rid !== rid ||
    reference.assembly !== 'Gameplay.Beyond' ||
    reference.decodeStatus !== 'raw' ||
    reference.length !== 0 ||
    reference.rawBase64 !== ''
  ) {
    throw new Error(`${path} RID ${rid}: expected audited empty selector reference`);
  }
  const type = `${requireString(reference.namespace, `${path}.namespace`)}.${requireString(reference.class, `${path}.class`)}`;
  const normalizedType = EMPTY_SELECTOR_COMPONENT_TYPES[role].get(type);
  if (normalizedType === undefined)
    throw new Error(`${path} RID ${rid}: unsupported empty ${role} ${type}`);
  usedReferences.push({ rid, sourcePath: path, source: reference });
  return { $type: normalizedType };
}

function normalizeTagQuery(value: unknown, path: string) {
  const query = requireRecord(value, path);
  requireExactFields(query, new Set(['queryType', 'tags']), path);
  const type = requireRecord(query.queryType, `${path}.queryType`);
  requireExactFields(type, new Set(['value', 'name']), `${path}.queryType`);
  const name = enumName(type.value, NATIVE_GAMEPLAY_TAG_QUERY_NAMES, `${path}.queryType.value`);
  if (type.name !== name) throw new Error(`${path}: tag query enum name/value mismatch`);
  return {
    queryType: name,
    tags: requireArray(query.tags, `${path}.tags`).map((value, index) => {
      const tagPath = `${path}.tags[${index}]`;
      const tag = requireRecord(value, tagPath);
      requireExactFields(tag, new Set(['tagId']), tagPath);
      const id = requireRecord(tag.tagId, `${tagPath}.tagId`);
      requireExactFields(id, new Set(['value', 'hex']), `${tagPath}.tagId`);
      const numeric = requireInteger(id.value, `${tagPath}.tagId.value`);
      if (numeric < -2147483648 || numeric > 2147483647)
        throw new Error(`${tagPath}: expected signed int32 tag`);
      if (id.hex !== `0x${(numeric >>> 0).toString(16).padStart(8, '0')}`)
        throw new Error(`${tagPath}: tag signed value/hex mismatch`);
      return { tagId: numeric };
    }),
  };
}
