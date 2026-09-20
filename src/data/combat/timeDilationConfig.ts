/**
 * 当前游戏数据版本的公共时间膨胀配置。
 * 技能生成时已把版本相关优先级标签降为数值；槽位规则和命名曲线仍在这里统一装配。
 */
import { compileTimeScaleCurve } from '../../core/combat/time/timeScaleCurve';
import type { TimeDilationRuntimeConfig } from '../../core/combat/time/timeDilationRuntime';
import { requireGameplayTag } from './gameplayTagCatalog';
import { HIT_STOP_NAMED_CURVE_DEFINITIONS } from './hitStopCurveCatalog.generated';
import { TIME_DILATION_NAMED_CURVE_DEFINITIONS } from './timeDilationCatalog';
import { TIME_DILATION_SLOT_SPECIAL_CONFIGS } from './timeDilationCatalog';

const curveDefinitions = {
  ...TIME_DILATION_NAMED_CURVE_DEFINITIONS,
  ...HIT_STOP_NAMED_CURVE_DEFINITIONS,
};
if (
  Object.keys(curveDefinitions).length !==
  Object.keys(TIME_DILATION_NAMED_CURVE_DEFINITIONS).length +
    Object.keys(HIT_STOP_NAMED_CURVE_DEFINITIONS).length
) {
  throw new Error('TimeDilationConfig and HitStopConfig curve identities overlap');
}
const namedCurves = new Map(
  Object.entries(curveDefinitions).map(([name, keys]) => [name, compileTimeScaleCurve(keys)]),
);

export const timeDilationRuntimeConfig: TimeDilationRuntimeConfig = Object.freeze({
  entityLifetimeUsesGlobalScaleBySlot: new Map(
    TIME_DILATION_SLOT_SPECIAL_CONFIGS.filter(item => item.influencesDuration).map(item => [
      requireGameplayTag(item.entitySlot),
      true,
    ]),
  ),
  curves: namedCurves,
});
