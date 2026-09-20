import type { ConsumableDefinition } from '../../../../../packages/game-data-contract/src/consumables.ts';
import { parseItemIdentitySource } from '../../source/itemIdentity.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  requireString,
} from '../../source/primitives.ts';

const USE_ITEM_FIELDS = new Set([
  'duration',
  'effectType',
  'gameModeForbidTagList',
  'isPersistentBuff',
  'isValuableDepot',
  'itemId',
  'itemUseDesc',
  'stackingKey',
  'targetNumType',
  'uiType',
  'useActions',
]);
const ACTION_FIELDS = new Set(['buffBBData', 'skillBBData', 'useType']);
const BUFF_DATA_FIELDS = new Set(['blackboard', 'buffId']);
const SKILL_DATA_FIELDS = new Set(['blackboard', 'skillId', 'skillPath']);
const BLACKBOARD_FIELDS = new Set(['key', 'value', 'valueStr']);

export interface CompiledConsumableCatalog {
  readonly definitions: readonly ConsumableDefinition[];
  readonly buffIds: readonly string[];
}

/**
 * 投影当前产品支持的主动增益物品。数值枚举只在来源边界用于识别原生类别，
 * 输出契约只保留可读的 operatorBuff/exclusiveGroup 语义。
 */
export function compileConsumableCatalog(
  useItemTableValue: unknown,
  itemTableValue: unknown,
): CompiledConsumableCatalog {
  const useItems = requireRecord(useItemTableValue, 'UseItemTable');
  const items = requireRecord(itemTableValue, 'ItemTable');
  const definitions: ConsumableDefinition[] = [];
  const buffIds = new Set<string>();

  for (const [itemId, raw] of Object.entries(useItems).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const path = `UseItemTable.${itemId}`;
    const row = requireRecord(raw, path);
    requireExactFields(row, USE_ITEM_FIELDS, path);
    if (requireString(row.itemId, `${path}.itemId`) !== itemId)
      throw new Error(`${path}.itemId: identity mismatch`);
    const durationSeconds = requireNumber(row.duration, `${path}.duration`);
    const effectType = requireInteger(row.effectType, `${path}.effectType`);
    const targetNumType = requireInteger(row.targetNumType, `${path}.targetNumType`);
    const uiType = requireInteger(row.uiType, `${path}.uiType`);
    const persistent = requireBoolean(row.isPersistentBuff, `${path}.isPersistentBuff`);
    requireBoolean(row.isValuableDepot, `${path}.isValuableDepot`);
    requireRecord(row.itemUseDesc, `${path}.itemUseDesc`);
    const stackingKey = requireString(row.stackingKey, `${path}.stackingKey`);
    requireArray(row.gameModeForbidTagList, `${path}.gameModeForbidTagList`).forEach(
      (value, index) => requireInteger(value, `${path}.gameModeForbidTagList[${index}]`),
    );
    const actions = requireArray(row.useActions, `${path}.useActions`);

    const supported =
      persistent &&
      durationSeconds > 0 &&
      effectType === 2 &&
      targetNumType === 0 &&
      uiType === 3 &&
      stackingKey === 'buff';
    if (!supported) continue;
    const item = parseItemIdentitySource(items[itemId], itemId);
    const applications = actions.map((rawAction, actionIndex) => {
      const actionPath = `${path}.useActions[${actionIndex}]`;
      const action = requireRecord(rawAction, actionPath);
      requireExactFields(action, ACTION_FIELDS, actionPath);
      if (requireInteger(action.useType, `${actionPath}.useType`) !== 2)
        throw new Error(`${actionPath}.useType: active operator Buff item must use type 2`);
      const buff = requireRecord(action.buffBBData, `${actionPath}.buffBBData`);
      requireExactFields(buff, BUFF_DATA_FIELDS, `${actionPath}.buffBBData`);
      const skill = requireRecord(action.skillBBData, `${actionPath}.skillBBData`);
      requireExactFields(skill, SKILL_DATA_FIELDS, `${actionPath}.skillBBData`);
      if (
        requireString(skill.skillId, `${actionPath}.skillBBData.skillId`) !== '' ||
        requireString(skill.skillPath, `${actionPath}.skillBBData.skillPath`) !== '' ||
        requireArray(skill.blackboard, `${actionPath}.skillBBData.blackboard`).length !== 0
      ) {
        throw new Error(`${actionPath}: active operator Buff item must not launch a skill`);
      }
      const buffId = requireNonEmptyString(buff.buffId, `${actionPath}.buffBBData.buffId`);
      const values: Record<string, number> = {};
      requireArray(buff.blackboard, `${actionPath}.buffBBData.blackboard`).forEach(
        (rawValue, valueIndex) => {
          const valuePath = `${actionPath}.buffBBData.blackboard[${valueIndex}]`;
          const value = requireRecord(rawValue, valuePath);
          requireExactFields(value, BLACKBOARD_FIELDS, valuePath);
          const key = requireNonEmptyString(value.key, `${valuePath}.key`);
          if (Object.hasOwn(values, key)) throw new Error(`${valuePath}.key: duplicate key`);
          if (requireString(value.valueStr, `${valuePath}.valueStr`) !== '')
            throw new Error(`${valuePath}.valueStr: active Buff blackboard must be numeric`);
          values[key] = requireNumber(value.value, `${valuePath}.value`);
        },
      );
      buffIds.add(buffId);
      return { buffId, blackboardValues: Object.freeze(values) };
    });
    if (applications.length === 0) throw new Error(`${path}: active Buff item has no actions`);
    definitions.push(
      Object.freeze({
        id: itemId,
        iconPath: `/consumables/${item.iconId}.webp`,
        rarity: item.rarity,
        kind: 'operatorBuff' as const,
        durationSeconds,
        exclusiveGroup: 'operatorConsumableBuff' as const,
        applications: Object.freeze(applications),
      }),
    );
  }
  return { definitions: Object.freeze(definitions), buffIds: [...buffIds].sort() };
}
