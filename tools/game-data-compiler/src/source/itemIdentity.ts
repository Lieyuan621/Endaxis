import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';

const ITEM_FIELDS = new Set([
  'backpackCanDiscard',
  'decoDesc',
  'desc',
  'iconCompositeId',
  'iconId',
  'id',
  'maxBackpackStackCount',
  'maxStackCount',
  'modelKey',
  'name',
  'noObtainWayConditionId',
  'noObtainWayHint',
  'noObtainWayId',
  'notObtainShow',
  'notObtainShowTimeId',
  'obtainWayIds',
  'outcomeItemIds',
  'rarity',
  'showAllDepotCount',
  'showingType',
  'sortId1',
  'sortId2',
  'type',
  'valuableDepotRedDot',
  'valuableTabType',
]);

/** ItemTable 中与语言无关的公共物品身份；名称与描述只保留在原生 locale 引用中。 */
export interface ItemIdentitySource {
  readonly sourcePath: string;
  readonly itemId: string;
  readonly iconId: string;
  readonly iconCompositeId: string;
  readonly rarity: number;
  readonly itemType: number;
}

/**
 * 严格读取单条 ItemTable 身份。装备、武器等领域只能消费此结果，不能各自复制字段表。
 */
export function parseItemIdentitySource(
  value: unknown,
  itemId: string,
  sourceName = 'ItemTable',
): ItemIdentitySource {
  const sourcePath = `${sourceName}.${itemId}`;
  const row = requireRecord(value, sourcePath);
  requireExactFields(row, ITEM_FIELDS, sourcePath);
  const embeddedId = requireString(row.id, `${sourcePath}.id`);
  if (embeddedId !== itemId) {
    throw new Error(`${sourcePath}.id: expected ${JSON.stringify(itemId)}`);
  }

  requireBoolean(row.backpackCanDiscard, `${sourcePath}.backpackCanDiscard`);
  requireRecord(row.decoDesc, `${sourcePath}.decoDesc`);
  requireRecord(row.desc, `${sourcePath}.desc`);
  // 武器用 -1 表示不可堆叠/无背包上限；公共 ItemTable 读取不能继承装备样本的非负假设。
  requireInteger(row.maxBackpackStackCount, `${sourcePath}.maxBackpackStackCount`);
  requireInteger(row.maxStackCount, `${sourcePath}.maxStackCount`);
  requireString(row.modelKey, `${sourcePath}.modelKey`);
  requireRecord(row.name, `${sourcePath}.name`);
  validateStringArray(row.noObtainWayConditionId, `${sourcePath}.noObtainWayConditionId`);
  requireRecord(row.noObtainWayHint, `${sourcePath}.noObtainWayHint`);
  validateStringArray(row.noObtainWayId, `${sourcePath}.noObtainWayId`);
  requireBoolean(row.notObtainShow, `${sourcePath}.notObtainShow`);
  requireString(row.notObtainShowTimeId, `${sourcePath}.notObtainShowTimeId`);
  validateStringArray(row.obtainWayIds, `${sourcePath}.obtainWayIds`);
  validateStringArray(row.outcomeItemIds, `${sourcePath}.outcomeItemIds`);
  requireBoolean(row.showAllDepotCount, `${sourcePath}.showAllDepotCount`);
  requireNonNegativeInteger(row.showingType, `${sourcePath}.showingType`);
  requireNumber(row.sortId1, `${sourcePath}.sortId1`);
  requireNumber(row.sortId2, `${sourcePath}.sortId2`);
  requireBoolean(row.valuableDepotRedDot, `${sourcePath}.valuableDepotRedDot`);
  requireNonNegativeInteger(row.valuableTabType, `${sourcePath}.valuableTabType`);

  return {
    sourcePath,
    itemId,
    iconId: requireString(row.iconId, `${sourcePath}.iconId`),
    iconCompositeId: requireString(row.iconCompositeId, `${sourcePath}.iconCompositeId`),
    rarity: requireNonNegativeInteger(row.rarity, `${sourcePath}.rarity`),
    itemType: requireNonNegativeInteger(row.type, `${sourcePath}.type`),
  };
}

function validateStringArray(value: unknown, path: string): void {
  requireArray(value, path).forEach((item, index) => requireString(item, `${path}[${index}]`));
}
