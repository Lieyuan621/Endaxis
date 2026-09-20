import { requireBoolean, requireExactFields, requireRecord } from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';

export interface ChannelingCastingActionSource {
  readonly kind: 'channelingCasting';
  readonly cantSwitchPosition: boolean;
  readonly cantSwitchToCenter: boolean;
  readonly cantCastSkill: boolean;
  readonly duration: ScalarSource;
}

/**
 * 1.4.4 ChannelingCastingAction 只在施术者上持有三类输入限制句柄，并创建同寿命的
 * ChannelingCasting 标记 Buff。它没有目标、子动作、黑板输出或伤害载荷。
 */
export function parseChannelingCastingActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): ChannelingCastingActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'cantSwitchPosition',
      'cantSwitchToCenter',
      'duration',
      'cantCastSkill',
    ]),
    path,
  );
  return {
    kind: 'channelingCasting',
    cantSwitchPosition: requireBoolean(action.cantSwitchPosition, `${path}.cantSwitchPosition`),
    cantSwitchToCenter: requireBoolean(action.cantSwitchToCenter, `${path}.cantSwitchToCenter`),
    duration: parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard),
    cantCastSkill: requireBoolean(action.cantCastSkill, `${path}.cantCastSkill`),
  };
}
