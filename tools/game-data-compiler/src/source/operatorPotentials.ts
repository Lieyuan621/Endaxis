import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';

const POTENTIAL_LIST_FIELDS = new Set(['firstItemId', 'potentialUnlockBundle']);
const POTENTIAL_UNLOCK_FIELDS = new Set([
  'itemCnts',
  'itemIds',
  'level',
  'name',
  'potentialEffectId',
  'unlockCardTopicItem',
  'unlockCharPictureItemList',
]);

/** CharacterPotentialTable 中一档潜能解锁与效果包引用。 */
export interface OperatorPotentialUnlockSource {
  readonly sourcePath: string;
  readonly level: number;
  readonly effectId: string;
}

/** CharacterPotentialTable 的严格来源事实；消耗品与展示字段只校验原生形状。 */
export interface OperatorPotentialSource {
  readonly sourcePath: string;
  readonly characterId: string;
  readonly firstItemId: string;
  readonly unlocks: readonly OperatorPotentialUnlockSource[];
}

export function parseOperatorPotentialSource(
  value: unknown,
  characterId: string,
  sourceName = 'CharacterPotentialTable',
): OperatorPotentialSource {
  const table = requireRecord(value, sourceName);
  const sourcePath = `${sourceName}.${characterId}`;
  const row = requireRecord(table[characterId], sourcePath);
  requireExactFields(row, POTENTIAL_LIST_FIELDS, sourcePath);
  const seenLevels = new Set<number>();
  const unlocks = requireArray(
    row.potentialUnlockBundle,
    `${sourcePath}.potentialUnlockBundle`,
  ).map((rawUnlock, index) => {
    const unlockPath = `${sourcePath}.potentialUnlockBundle[${index}]`;
    const unlock = requireRecord(rawUnlock, unlockPath);
    requireExactFields(unlock, POTENTIAL_UNLOCK_FIELDS, unlockPath);
    const level = requireNonNegativeInteger(unlock.level, `${unlockPath}.level`);
    if (level === 0) throw new Error(`${unlockPath}.level: expected a positive integer`);
    if (seenLevels.has(level)) {
      throw new Error(`${unlockPath}.level: duplicate potential level ${level}`);
    }
    seenLevels.add(level);
    validateParallelCosts(unlock.itemIds, unlock.itemCnts, unlockPath);
    validateI18nText(unlock.name, `${unlockPath}.name`);
    requireString(unlock.unlockCardTopicItem, `${unlockPath}.unlockCardTopicItem`);
    requireArray(
      unlock.unlockCharPictureItemList,
      `${unlockPath}.unlockCharPictureItemList`,
    ).forEach((item, itemIndex) =>
      requireString(item, `${unlockPath}.unlockCharPictureItemList[${itemIndex}]`),
    );
    return {
      sourcePath: unlockPath,
      level,
      effectId: requireNonEmptyString(unlock.potentialEffectId, `${unlockPath}.potentialEffectId`),
    };
  });
  if (unlocks.length === 0) {
    throw new Error(`${sourcePath}.potentialUnlockBundle: expected entries`);
  }
  return {
    sourcePath,
    characterId,
    firstItemId: requireString(row.firstItemId, `${sourcePath}.firstItemId`),
    unlocks,
  };
}

function validateParallelCosts(itemIdsValue: unknown, itemCntsValue: unknown, path: string): void {
  const itemIds = requireArray(itemIdsValue, `${path}.itemIds`);
  const itemCounts = requireArray(itemCntsValue, `${path}.itemCnts`);
  if (itemIds.length !== itemCounts.length) {
    throw new Error(`${path}: itemIds and itemCnts length mismatch`);
  }
  itemIds.forEach((item, index) => requireString(item, `${path}.itemIds[${index}]`));
  itemCounts.forEach((item, index) =>
    requireNonNegativeInteger(item, `${path}.itemCnts[${index}]`),
  );
}

function validateI18nText(value: unknown, path: string): void {
  const text = requireRecord(value, path);
  requireExactFields(text, new Set(['id', 'text']), path);
  requireNumber(text.id, `${path}.id`);
  requireString(text.text, `${path}.text`);
}
