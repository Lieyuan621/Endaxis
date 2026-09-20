import {
  parseBlackboardAssignmentsSource,
  type BlackboardAssignmentSource,
} from './assignments.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

const META = ['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex'];

export interface GlobalBuffApplicationEntrySource {
  readonly globalBuffId: string;
  readonly assignBlackboard: boolean;
  readonly assignments: readonly BlackboardAssignmentSource[];
}

export type GlobalBuffActionSource =
  | {
      readonly kind: 'createGlobalBuff';
      readonly globalBuffs: readonly GlobalBuffApplicationEntrySource[];
      readonly count: ScalarSource;
      readonly source: TargetReferenceSource;
      readonly autoFinishByAction: boolean;
    }
  | {
      /** ComboAction 创建公共连击 GlobalBuff；原生动作只写入持续时间和创建次数。 */
      readonly kind: 'createComboGlobalBuff';
      readonly source: TargetReferenceSource;
      readonly duration: ScalarSource;
      readonly count: ScalarSource;
    }
  | {
      readonly kind: 'finishGlobalBuff';
      readonly finishParent: boolean;
      readonly globalBuffIds: readonly string[];
      readonly finishAll: boolean;
      readonly finishCount: ScalarSource;
      readonly isFinishedEarly: boolean;
    };

/**
 * 读取原生 ComboAction。
 *
 * 该动作会创建 `global_buff_combo_trigger`，参与后续战技和终结技伤害计算，不能作为
 * 纯界面动作删除。公共 GlobalBuff 的 ID 来自游戏代码中的 BuffConst，原始载荷只保存
 * 来源、持续时间和创建次数。
 */
export function parseComboGlobalBuffActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): GlobalBuffActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set([...META, 'source', 'duration', 'count']), path);
  return {
    kind: 'createComboGlobalBuff',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    duration: parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard),
    count: parseScalarSource(action.count, `${path}.count`, inheritedBlackboard),
  };
}

export function parseCreateGlobalBuffActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): GlobalBuffActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([...META, 'globalBuffs', 'count', 'globalBuffSource', 'autoFinishByAction']),
    path,
  );
  return {
    kind: 'createGlobalBuff',
    globalBuffs: requireArray(action.globalBuffs, `${path}.globalBuffs`).map((value, index) => {
      const entryPath = `${path}.globalBuffs[${index}]`;
      const entry = requireRecord(value, entryPath);
      requireExactFields(
        entry,
        new Set(['globalBuffId', 'assignBlackboard', 'assignItems']),
        entryPath,
      );
      const id = requireRecord(entry.globalBuffId, `${entryPath}.globalBuffId`);
      requireExactFields(id, new Set(['id']), `${entryPath}.globalBuffId`);
      const assignBlackboard = requireBoolean(
        entry.assignBlackboard,
        `${entryPath}.assignBlackboard`,
      );
      return {
        globalBuffId: requireNonEmptyString(id.id, `${entryPath}.globalBuffId.id`),
        assignBlackboard,
        assignments: parseBlackboardAssignmentsSource(
          entry.assignItems,
          `${entryPath}.assignItems`,
          { enabled: assignBlackboard },
        ),
      };
    }),
    count: parseScalarSource(action.count, `${path}.count`, inheritedBlackboard),
    source: parseTargetReferenceSource(action.globalBuffSource, `${path}.globalBuffSource`),
    autoFinishByAction: requireBoolean(action.autoFinishByAction, `${path}.autoFinishByAction`),
  };
}

export function parseFinishGlobalBuffActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): GlobalBuffActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
      'finishParent',
      'globalBuffIds',
      'finishAll',
      'finishCount',
      'isFinishedEarly',
    ]),
    path,
  );
  return {
    kind: 'finishGlobalBuff',
    finishParent: requireBoolean(action.finishParent, `${path}.finishParent`),
    // 原生字段是 List<GlobalBuffId>，与 CreateGlobalBuff 的 ID 包装使用同一结构。
    // 读取引用不代表允许执行按 ID 结束；该行为仍由公共投影显式阻断。
    globalBuffIds: requireArray(action.globalBuffIds, `${path}.globalBuffIds`).map(
      (value, index) => {
        const entryPath = `${path}.globalBuffIds[${index}]`;
        const id = requireRecord(value, entryPath);
        requireExactFields(id, new Set(['id']), entryPath);
        return requireNonEmptyString(id.id, `${entryPath}.id`);
      },
    ),
    finishAll: requireBoolean(action.finishAll, `${path}.finishAll`),
    finishCount: parseScalarSource(action.finishCount, `${path}.finishCount`, inheritedBlackboard),
    isFinishedEarly: requireBoolean(action.isFinishedEarly, `${path}.isFinishedEarly`),
  };
}
