import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseScalarSource, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface ClearProjectileActionSource {
  readonly kind: 'clearProjectile';
  readonly clearSource: TargetReferenceSource;
  readonly filterClearRange: boolean;
  readonly rangeCenter: TargetReferenceSource;
  readonly clearRange: ScalarSource;
  readonly filterProjectileId: boolean;
  readonly projectileIds: readonly string[];
  readonly playFinishEffect: boolean;
  readonly finishAction: string;
}

/**
 * 保留 ClearProjectileAction 的完整筛选边界。是否能在固定木桩模型中省略，必须由领域投影
 * 根据投射物生命周期和 finishAction 再判断，来源层不把“清理”猜成纯表现动作。
 */
export function parseClearProjectileActionSource(
  value: unknown,
  path: string,
): ClearProjectileActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'clearSource',
      'filterClearRange',
      'rangeCenter',
      'clearRange',
      'filterProjectileId',
      'projectileIdList',
      'playFinishEffect',
      'finishAction',
    ]),
    path,
  );
  return {
    kind: 'clearProjectile',
    clearSource: parseTargetReferenceSource(action.clearSource, `${path}.clearSource`),
    filterClearRange: requireBoolean(action.filterClearRange, `${path}.filterClearRange`),
    rangeCenter: parseTargetReferenceSource(action.rangeCenter, `${path}.rangeCenter`),
    clearRange: parseScalarSource(action.clearRange, `${path}.clearRange`, {}),
    filterProjectileId: requireBoolean(action.filterProjectileId, `${path}.filterProjectileId`),
    projectileIds: requireArray(action.projectileIdList, `${path}.projectileIdList`).map(
      (projectileId, index) =>
        requireNonEmptyString(projectileId, `${path}.projectileIdList[${index}]`),
    ),
    playFinishEffect: requireBoolean(action.playFinishEffect, `${path}.playFinishEffect`),
    finishAction: requireString(action.finishAction, `${path}.finishAction`),
  };
}
