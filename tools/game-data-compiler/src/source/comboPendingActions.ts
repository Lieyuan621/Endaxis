import { requireArray, requireBoolean, requireExactFields, requireRecord } from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface ComboPendingActionSource {
  readonly kind: 'comboPending';
  readonly owner: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly trigger: TargetReferenceSource;
  readonly needTrigger: boolean;
  readonly assignmentCount: number;
}

/**
 * 原生动作只向 BattleManager 提交连携候选。来源层保留三个目标与黑板载荷边界；
 * 当前仅允许空 assignItems，避免把会进入后续连携施法黑板的数据静默丢掉。
 */
export function parseComboPendingActionSource(
  value: unknown,
  path: string,
): ComboPendingActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'owner',
      'target',
      'needTrigger',
      'trigger',
      'assignItems',
    ]),
    path,
  );
  const assignItems = requireArray(action.assignItems, `${path}.assignItems`);
  if (assignItems.length !== 0) {
    throw new Error(`${path}.assignItems: combo Pending blackboard assignments are unsupported`);
  }
  return {
    kind: 'comboPending',
    owner: parseTargetReferenceSource(action.owner, `${path}.owner`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    trigger: parseTargetReferenceSource(action.trigger, `${path}.trigger`),
    needTrigger: requireBoolean(action.needTrigger, `${path}.needTrigger`),
    assignmentCount: 0,
  };
}
