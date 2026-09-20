import { requireBoolean, requireExactFields, requireRecord } from './primitives.ts';

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];

export interface BuffTimePauseActionSource {
  readonly kind: 'buffTimePause';
  readonly paused: boolean;
}

/**
 * PauseBuffTime 只切换当前执行 Buff 实例的暂停状态；它没有目标选择或持续时间参数。
 * Buff 暂停计时的宿主约束由投影层验证。
 */
export function parseBuffTimePauseActionSource(
  value: unknown,
  path: string,
): BuffTimePauseActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set([...ACTION_META_FIELDS, 'isPaused']), path);
  return {
    kind: 'buffTimePause',
    paused: requireBoolean(action.isPaused, `${path}.isPaused`),
  };
}
