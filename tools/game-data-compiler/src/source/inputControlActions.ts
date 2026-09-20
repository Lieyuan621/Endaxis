import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  parseScalarSource,
  parseStringScalarSource,
  type BlackboardLevelValues,
  type ScalarSource,
  type StringScalarSource,
} from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { gameplayTagId, type GameplayTagId } from './nativeGameplayTags.ts';

export interface ComboCacheActionSource {
  readonly kind: 'comboCache';
  readonly mappings: readonly {
    readonly commandType: string;
    readonly skillId: string;
    readonly cacheEndByAction: boolean;
    readonly cacheTime: ScalarSource;
  }[];
}

const BATTLE_COMMAND_TYPES = [
  'Attack',
  'Dash',
  'Jump',
  'NormalSkill',
  'ComboSkill',
  'UltimateSkill',
] as const;

function parseBattleCommandType(value: unknown, path: string): string {
  if (typeof value === 'number') {
    const index = requireInteger(value, path);
    const command = BATTLE_COMMAND_TYPES[index];
    if (command === undefined) throw new Error(`${path}: unknown BattleCommandType ${index}`);
    return command;
  }
  const command = requireNonEmptyString(value, path);
  if (!(BATTLE_COMMAND_TYPES as readonly string[]).includes(command))
    throw new Error(`${path}: unknown BattleCommandType ${command}`);
  return command;
}

export interface AllowNextSkillActionSource {
  readonly kind: 'allowNextSkill';
  readonly skillIds: readonly string[];
}

export interface MarkCanInterruptActionSource {
  readonly kind: 'markCanInterrupt';
}

/** 把当前技能的本次施放标为可由 Dash 输入打断。 */
export interface MarkCanDashActionSource {
  readonly kind: 'markCanDash';
}

/** 动作寿命内覆盖目标角色允许的连续 Dash 次数；负数在原生运行时表示无限。 */
export interface OverrideMultiDashLimitActionSource {
  readonly kind: 'overrideMultiDashLimit';
  readonly target: TargetReferenceSource;
  readonly dashCount: ScalarSource;
}

/**
 * 动作寿命内阻止移动技能打断当前技能，OnEnd 时移除对应句柄。
 * Endaxis 时间轴直接指定施法时刻，不模拟客户端移动输入与技能打断仲裁。
 */
export interface BlockMoveInterruptSkillActionSource {
  readonly kind: 'blockMoveInterruptSkill';
}

/** 动作寿命内暂停 BattleManager 的自动连携候选计时；Endaxis 由现实时间轴显式放置连携。 */
export interface PauseComboSkillTimeActionSource {
  readonly kind: 'pauseComboSkillTime';
  readonly allCharacters: boolean;
  readonly character: TargetReferenceSource;
}

/** 动作区间内安装、OnEnd 时由 MultiTagHandle 对称移除的实体控制标签。 */
export interface AddEntityControlTagsActionSource {
  readonly kind: 'addEntityControlTags';
  readonly owner: TargetReferenceSource;
  readonly useBlackboard: boolean;
  readonly tagIds: readonly GameplayTagId[];
  readonly tag: StringScalarSource;
}

/** 时间轴直接指定现实施法时刻，不模拟客户端输入缓存；仍保留原生技能路由和窗口证据。 */
export function parseComboCacheActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): ComboCacheActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'mappingDataList',
    ]),
    path,
  );
  return {
    kind: 'comboCache',
    mappings: requireArray(action.mappingDataList, `${path}.mappingDataList`).map((raw, index) => {
      const rowPath = `${path}.mappingDataList[${index}]`;
      const row = requireRecord(raw, rowPath);
      requireExactFields(
        row,
        new Set([
          'cmdType',
          'skillId',
          'cacheEndByAction',
          'clearOffsetTargetSkillIdOnEnd',
          'overrideCacheTime',
          'cacheTime',
        ]),
        rowPath,
      );
      requireBoolean(row.clearOffsetTargetSkillIdOnEnd, `${rowPath}.clearOffsetTargetSkillIdOnEnd`);
      requireBoolean(row.overrideCacheTime, `${rowPath}.overrideCacheTime`);
      return {
        commandType: parseBattleCommandType(row.cmdType, `${rowPath}.cmdType`),
        // 原生 ComboCache 映射允许用空串表示该命令没有直接技能路由；
        // Endaxis 不执行客户端输入缓存，但来源层仍须保留这个占位事实。
        skillId: requireString(row.skillId, `${rowPath}.skillId`),
        cacheEndByAction: requireBoolean(row.cacheEndByAction, `${rowPath}.cacheEndByAction`),
        cacheTime: parseScalarSource(row.cacheTime, `${rowPath}.cacheTime`, inheritedBlackboard),
      };
    }),
  };
}

export function parseAllowNextSkillActionSource(
  value: unknown,
  path: string,
): AllowNextSkillActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'allowedSkillIdList',
    ]),
    path,
  );
  return {
    kind: 'allowNextSkill',
    skillIds: requireArray(action.allowedSkillIdList, `${path}.allowedSkillIdList`).map(
      (id, index) => requireNonEmptyString(id, `${path}.allowedSkillIdList[${index}]`),
    ),
  };
}

/** 标记当前原生技能可被后续输入中断；Endaxis 时间轴不执行客户端施法互斥门禁。 */
export function parseMarkCanInterruptActionSource(
  value: unknown,
  path: string,
): MarkCanInterruptActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
    path,
  );
  return { kind: 'markCanInterrupt' };
}

export function parseMarkCanDashActionSource(
  value: unknown,
  path: string,
): MarkCanDashActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
    path,
  );
  return { kind: 'markCanDash' };
}

export function parseOverrideMultiDashLimitActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): OverrideMultiDashLimitActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'targetSetting',
      'dashCount',
    ]),
    path,
  );
  return {
    kind: 'overrideMultiDashLimit',
    target: parseTargetReferenceSource(action.targetSetting, `${path}.targetSetting`),
    dashCount: parseScalarSource(action.dashCount, `${path}.dashCount`, inheritedBlackboard),
  };
}

export function parseBlockMoveInterruptSkillActionSource(
  value: unknown,
  path: string,
): BlockMoveInterruptSkillActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
    path,
  );
  return { kind: 'blockMoveInterruptSkill' };
}

export function parsePauseComboSkillTimeActionSource(
  value: unknown,
  path: string,
): PauseComboSkillTimeActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'isAll',
      'characterSettings',
    ]),
    path,
  );
  return {
    kind: 'pauseComboSkillTime',
    allCharacters: requireBoolean(action.isAll, `${path}.isAll`),
    character: parseTargetReferenceSource(action.characterSettings, `${path}.characterSettings`),
  };
}

export function parseAddEntityControlTagsActionSource(
  value: unknown,
  path: string,
): AddEntityControlTagsActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'tagOwner',
      'useBlackboard',
      'tags',
      'tag',
    ]),
    path,
  );
  return {
    kind: 'addEntityControlTags',
    owner: parseTargetReferenceSource(action.tagOwner, `${path}.tagOwner`),
    useBlackboard: requireBoolean(action.useBlackboard, `${path}.useBlackboard`),
    tagIds: requireArray(action.tags, `${path}.tags`).map((raw, index) => {
      const tagPath = `${path}.tags[${index}]`;
      const tag = requireRecord(raw, tagPath);
      requireExactFields(tag, new Set(['tagId']), tagPath);
      if (typeof tag.tagId !== 'number') throw new Error(`${tagPath}.tagId: expected number`);
      return gameplayTagId(tag.tagId);
    }),
    tag: parseStringScalarSource(action.tag, `${path}.tag`),
  };
}
