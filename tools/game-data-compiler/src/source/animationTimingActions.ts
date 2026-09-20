import { requireExactFields, requireRecord } from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';

/**
 * 动作存续期间持续覆盖角色动画组件的附加时间倍率，并在 OnEnd 时移除句柄。
 * 这不是世界/技能时间膨胀：来源层保留动态黑板引用，投影层再结合完整技能图
 * 判断它是否可能改变动画事件驱动的战斗回调时序。
 */
export interface ContinuousAnimationTimeScaleActionSource {
  readonly kind: 'continuousAnimationTimeScale';
  readonly timeScale: ScalarSource;
}

export function parseContinuousAnimationTimeScaleActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): ContinuousAnimationTimeScaleActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'timeScale',
    ]),
    path,
  );
  return {
    kind: 'continuousAnimationTimeScale',
    timeScale: parseScalarSource(action.timeScale, `${path}.timeScale`, inheritedBlackboard),
  };
}
