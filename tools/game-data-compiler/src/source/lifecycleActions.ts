import { requireBoolean, requireExactFields, requireRecord } from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];

export interface FinishOwnerActionSource {
  readonly kind: 'finishOwner';
  readonly owner: TargetReferenceSource;
  readonly skipDieDisplay: boolean;
}

/**
 * 读取 FinishOwnerAction 的目标和表现开关。实体/普通 AbilitySystem 的结束差异由后续投影处理。
 */
export function parseFinishOwnerActionSource(
  value: unknown,
  path: string,
): FinishOwnerActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set([...ACTION_META_FIELDS, 'owner', 'skipDieDisplay']), path);
  return {
    kind: 'finishOwner',
    owner: parseTargetReferenceSource(action.owner, `${path}.owner`),
    skipDieDisplay: requireBoolean(action.skipDieDisplay, `${path}.skipDieDisplay`),
  };
}
