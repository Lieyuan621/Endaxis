import { parseBuffFindSettingsSource, type BuffFindSettingsSource } from './buffFindSettings.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNativeActionPriority,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTagQuerySource, type TagQuerySource } from './tagQuery.ts';

export interface TyphoeaArcheryTargetSelectionActionSource {
  readonly kind: 'typhoeaArcheryTargetSelection';
  readonly markBuffId: string;
  readonly targetCount: ScalarSource;
  readonly fullScreen: boolean;
  readonly lockRegionHalfHeight: ScalarSource;
  readonly lockRegionRatio: ScalarSource;
  readonly maxLockDistanceFromCamera: ScalarSource;
  readonly smartPrioritySelection: {
    readonly strategy: string;
    readonly buffIds: readonly string[];
    readonly tagQuery: TagQuerySource;
    readonly buffFindSettings: BuffFindSettingsSource;
  };
}

/**
 * TyphoeaArcheryTargetSelect registers a persistent BattleManager selection configuration.
 * The generic source layer preserves every gameplay-bearing field; fixed-stump projection is
 * deliberately deferred to the compiler.
 */
export function parseTyphoeaArcheryTargetSelectionActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): TyphoeaArcheryTargetSelectionActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'markBuff',
      'targetNum',
      'fullScreen',
      'lockRegionHalfHeight',
      'lockRegionRatio',
      'maxLockDistanceFromCamera',
      'smartPrioritySelect',
    ]),
    path,
  );
  requireBoolean(action.isEnable, `${path}.isEnable`);
  requireNativeActionPriority(action.priorityLevel, `${path}.priorityLevel`);
  requireInteger(action.priorityOffset, `${path}.priorityOffset`);
  requireInteger(action.serverActionIndex, `${path}.serverActionIndex`);

  const markPath = `${path}.markBuff`;
  const mark = requireRecord(action.markBuff, markPath);
  requireExactFields(
    mark,
    new Set(['buffId', 'assignBlackboard', 'assignItems', 'readIdFromBlackboard', 'buffIdKey']),
    markPath,
  );
  const markBuffId = requireNonEmptyString(mark.buffId, `${markPath}.buffId`);
  if (requireBoolean(mark.assignBlackboard, `${markPath}.assignBlackboard`))
    throw new Error(`${markPath}.assignBlackboard: Typhoea mark assignment is not reproduced`);
  if (requireArray(mark.assignItems, `${markPath}.assignItems`).length !== 0)
    throw new Error(`${markPath}.assignItems: expected empty array`);
  if (requireBoolean(mark.readIdFromBlackboard, `${markPath}.readIdFromBlackboard`))
    throw new Error(`${markPath}.readIdFromBlackboard: dynamic mark Buff is not reproduced`);
  if (requireString(mark.buffIdKey, `${markPath}.buffIdKey`) !== '')
    throw new Error(`${markPath}.buffIdKey: expected empty string`);

  const smartPath = `${path}.smartPrioritySelect`;
  const smart = requireRecord(action.smartPrioritySelect, smartPath);
  requireExactFields(
    smart,
    new Set([
      'smartTargetSelectStrategy',
      'smartTargetBuffIds',
      'smartTargetTagQuery',
      'smartTargetBuffFindSettings',
    ]),
    smartPath,
  );
  const buffIds = requireArray(smart.smartTargetBuffIds, `${smartPath}.smartTargetBuffIds`).map(
    (value, index) => {
      const itemPath = `${smartPath}.smartTargetBuffIds[${index}]`;
      const item = requireRecord(value, itemPath);
      requireExactFields(item, new Set(['buffId']), itemPath);
      return requireNonEmptyString(item.buffId, `${itemPath}.buffId`);
    },
  );

  return {
    kind: 'typhoeaArcheryTargetSelection',
    markBuffId,
    targetCount: parseScalarSource(action.targetNum, `${path}.targetNum`, inheritedBlackboard),
    fullScreen: requireBoolean(action.fullScreen, `${path}.fullScreen`),
    lockRegionHalfHeight: parseScalarSource(
      action.lockRegionHalfHeight,
      `${path}.lockRegionHalfHeight`,
      inheritedBlackboard,
    ),
    lockRegionRatio: parseScalarSource(
      action.lockRegionRatio,
      `${path}.lockRegionRatio`,
      inheritedBlackboard,
    ),
    maxLockDistanceFromCamera: parseScalarSource(
      action.maxLockDistanceFromCamera,
      `${path}.maxLockDistanceFromCamera`,
      inheritedBlackboard,
    ),
    smartPrioritySelection: {
      strategy: requireNonEmptyString(
        smart.smartTargetSelectStrategy,
        `${smartPath}.smartTargetSelectStrategy`,
      ),
      buffIds,
      tagQuery: parseTagQuerySource(smart.smartTargetTagQuery, `${smartPath}.smartTargetTagQuery`),
      buffFindSettings: parseBuffFindSettingsSource(
        smart.smartTargetBuffFindSettings,
        `${smartPath}.smartTargetBuffFindSettings`,
      ),
    },
  };
}
