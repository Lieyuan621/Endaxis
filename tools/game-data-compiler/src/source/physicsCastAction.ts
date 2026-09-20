import {
  nativeActionName,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

const PHYSICS_CAST_FIELDS = new Set([
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
  'succeedActions',
  'failActions',
  'hitPositionTargetGroupKey',
  'hitDistanceBlackboardKey',
  'pointDirType',
  'sourceSettings',
  'targetSettings',
  'sourceForwardData',
  'sourceToTargetData',
  'layerMask',
  'maxDistance',
  'queryTriggerInteraction',
  'sphereRadius',
  'needTick',
  'tickInterval',
  'stopTickWhenHit',
]);

export interface PhysicsCastActionSource {
  readonly hitPositionTargetGroupKey: string;
  readonly hitDistanceBlackboardKey: string;
  readonly pointDirectionType: string;
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly maxDistance: ScalarSource;
  readonly queryTriggerInteraction: string;
  readonly sphereRadius: ScalarSource;
  readonly needTick: boolean;
  readonly tickIntervalSeconds: number;
  readonly stopTickWhenHit: boolean;
}

/** 严格保存 PhysicsCast 的战斗可见协议；几何/VFX 子结构当前只校验版本化容器形状。 */
export function parsePhysicsCastActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): PhysicsCastActionSource {
  const action = requireRecord(value, path);
  if (nativeActionName(requireString(action.$type, `${path}.$type`)) !== 'PhysicsCastAction') {
    throw new Error(`${path}: expected PhysicsCastAction`);
  }
  requireExactFields(action, PHYSICS_CAST_FIELDS, path);

  const sourceForward = requireRecord(action.sourceForwardData, `${path}.sourceForwardData`);
  requireExactFields(
    sourceForward,
    new Set([
      'mountPoint',
      'offsetForwardDirectionType',
      'startPosOffset',
      'directionSubType',
      'rayLocalRotationEuler',
    ]),
    `${path}.sourceForwardData`,
  );
  requireString(sourceForward.mountPoint, `${path}.sourceForwardData.mountPoint`);
  requireString(
    sourceForward.offsetForwardDirectionType,
    `${path}.sourceForwardData.offsetForwardDirectionType`,
  );
  requireRecord(sourceForward.startPosOffset, `${path}.sourceForwardData.startPosOffset`);
  requireString(sourceForward.directionSubType, `${path}.sourceForwardData.directionSubType`);
  requireRecord(
    sourceForward.rayLocalRotationEuler,
    `${path}.sourceForwardData.rayLocalRotationEuler`,
  );

  const sourceToTarget = requireRecord(action.sourceToTargetData, `${path}.sourceToTargetData`);
  requireExactFields(
    sourceToTarget,
    new Set([
      'sourceMountPoint',
      'offsetForwardDirectionType',
      'startPosOffset',
      'targetMountPoint',
      'endPosOffset',
      'rayLocalRotationEuler',
    ]),
    `${path}.sourceToTargetData`,
  );
  requireString(sourceToTarget.sourceMountPoint, `${path}.sourceToTargetData.sourceMountPoint`);
  requireString(
    sourceToTarget.offsetForwardDirectionType,
    `${path}.sourceToTargetData.offsetForwardDirectionType`,
  );
  requireRecord(sourceToTarget.startPosOffset, `${path}.sourceToTargetData.startPosOffset`);
  requireString(sourceToTarget.targetMountPoint, `${path}.sourceToTargetData.targetMountPoint`);
  requireRecord(sourceToTarget.endPosOffset, `${path}.sourceToTargetData.endPosOffset`);
  requireRecord(
    sourceToTarget.rayLocalRotationEuler,
    `${path}.sourceToTargetData.rayLocalRotationEuler`,
  );
  requireRecord(action.layerMask, `${path}.layerMask`);

  return {
    hitPositionTargetGroupKey: requireNonEmptyString(
      action.hitPositionTargetGroupKey,
      `${path}.hitPositionTargetGroupKey`,
    ),
    hitDistanceBlackboardKey: requireString(
      action.hitDistanceBlackboardKey,
      `${path}.hitDistanceBlackboardKey`,
    ),
    pointDirectionType: requireNonEmptyString(action.pointDirType, `${path}.pointDirType`),
    source: parseTargetReferenceSource(action.sourceSettings, `${path}.sourceSettings`),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    maxDistance: parseScalarSource(action.maxDistance, `${path}.maxDistance`, inheritedBlackboard),
    queryTriggerInteraction: requireNonEmptyString(
      action.queryTriggerInteraction,
      `${path}.queryTriggerInteraction`,
    ),
    sphereRadius: parseScalarSource(
      action.sphereRadius,
      `${path}.sphereRadius`,
      inheritedBlackboard,
    ),
    needTick: requireBoolean(action.needTick, `${path}.needTick`),
    tickIntervalSeconds: requireNumber(action.tickInterval, `${path}.tickInterval`),
    stopTickWhenHit: requireBoolean(action.stopTickWhenHit, `${path}.stopTickWhenHit`),
  };
}
