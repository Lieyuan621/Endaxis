import {
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNativeActionPriority,
  requireNamedOrInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { parseScalarSource, type ScalarSource } from './scalar.ts';
import { parseTimeDilationCurveKeys } from './timeDilationActions.ts';
import type { BlackboardLevelValues } from './scalar.ts';
import { gameplayTagId, type GameplayTagId } from './nativeGameplayTags.ts';
import { parseFiniteRangedShape } from './auraActions.ts';
import {
  readRootMotionDirectionType,
  readRotateDirectionType,
  readSelfRotateType,
  readMountPoint,
} from './spatialEnums.ts';

function parseIgnoredCollisionLayer(value: unknown, path: string): void {
  const layer = requireRecord(value, path);
  requireExactFields(layer, new Set('m_Mask' in layer ? ['m_Mask'] : []), path);
  if ('m_Mask' in layer) requireInteger(layer.m_Mask, `${path}.m_Mask`);
}

export interface AdditionalBattleShapeActionSource {
  readonly kind: 'additionalBattleShape';
  readonly target: TargetReferenceSource;
  readonly spatialBlackboardKeys: readonly string[];
  readonly releaseByAction: boolean;
  readonly durationSeconds: number;
  readonly followTargetPosition: boolean;
  readonly followTargetRotation: boolean;
}

export interface DynamicBattleShapeActionSource {
  readonly kind: 'dynamicBattleShape';
  readonly shapeType: string | number;
  readonly durationSeconds: number;
  readonly intervalSeconds: number;
}

export interface EnableMoveColliderActionSource {
  readonly kind: 'enableMoveCollider';
  readonly mountPoint: string;
}

/** 原生动作启用挂点下非 trigger 的 Unity Collider，结束时关闭；不修改伤害或资源。 */
export function parseEnableMoveColliderActionSource(
  value: unknown,
  path: string,
): EnableMoveColliderActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'mountPoint',
    ]),
    path,
  );
  return {
    kind: 'enableMoveCollider',
    mountPoint: readMountPoint(action.mountPoint, `${path}.mountPoint`),
  };
}

/** 闪避等状态按固定间隔刷新角色自身的战斗碰撞形状。 */
export function parseDynamicBattleShapeActionSource(
  value: unknown,
  path: string,
): DynamicBattleShapeActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'shapeType',
      'duration',
      'interval',
    ]),
    path,
  );
  const durationSeconds = requireNumber(action.duration, `${path}.duration`);
  const intervalSeconds = requireNumber(action.interval, `${path}.interval`);
  if (durationSeconds < 0 || intervalSeconds <= 0)
    throw new Error(`${path}: expected non-negative duration and positive interval`);
  return {
    kind: 'dynamicBattleShape',
    shapeType: requireNamedOrInteger(action.shapeType, `${path}.shapeType`),
    durationSeconds,
    intervalSeconds,
  };
}

/**
 * 原生动作向目标 AdditionalBattleShapeComponent 注册额外战斗碰撞形状。
 * 来源层完整保留目标、动态形状键和寿命；固定木桩投影是否省略由编译层决定。
 */
export function parseAdditionalBattleShapeActionSource(
  value: unknown,
  path: string,
): AdditionalBattleShapeActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'targetSettings',
      'shapeData',
      'releaseByAction',
      'duration',
      'followTargetPosition',
      'followTargetRotation',
    ]),
    path,
  );
  requireBoolean(action.isEnable, `${path}.isEnable`);
  requireNativeActionPriority(action.priorityLevel, `${path}.priorityLevel`);
  requireInteger(action.priorityOffset, `${path}.priorityOffset`);
  requireInteger(action.serverActionIndex, `${path}.serverActionIndex`);
  const durationSeconds = requireNumber(action.duration, `${path}.duration`);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    throw new Error(`${path}.duration: expected finite non-negative number`);
  }
  return {
    kind: 'additionalBattleShape',
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    spatialBlackboardKeys: parseFiniteRangedShape(action.shapeData, `${path}.shapeData`),
    releaseByAction: requireBoolean(action.releaseByAction, `${path}.releaseByAction`),
    durationSeconds,
    followTargetPosition: requireBoolean(
      action.followTargetPosition,
      `${path}.followTargetPosition`,
    ),
    followTargetRotation: requireBoolean(
      action.followTargetRotation,
      `${path}.followTargetRotation`,
    ),
  };
}

export interface SelfRotateActionSource {
  readonly kind: 'selfRotate';
  readonly rotateType: string;
  readonly target: TargetReferenceSource;
  readonly rootMotion: boolean;
  readonly immediateRotate: boolean;
}

export interface TeleportActionSource {
  readonly kind: 'teleport';
  readonly target: TargetReferenceSource;
  readonly radius: ScalarSource;
}

export interface DisableRootMotionActionSource {
  readonly kind: 'disableRootMotion';
}

export interface TeleportPositionSelectionActionSource {
  readonly kind: 'teleportPositionSelection';
  readonly target: TargetReferenceSource;
  readonly teleportType: 'FixedDistance' | 'Ranged';
  readonly excludeCurrentPosition: boolean;
  readonly distance: ScalarSource;
  readonly useAddScoreToPreviousSide: boolean;
  readonly forwardDistance: ScalarSource;
  readonly outputContextKey: string;
}

export interface ReceiveMoveInputActionSource {
  readonly kind: 'receiveMoveInput';
  readonly duration: ScalarSource;
  readonly inputDirection: string;
}

export interface MoveToActionSource {
  readonly kind: 'moveTo';
  readonly moveType: string;
  readonly totalTime: ScalarSource;
  readonly target: TargetReferenceSource;
  readonly updateMoveTarget: boolean;
  readonly directionType: string;
  readonly speedType: string;
}

export interface CustomRootMotionActionSource {
  readonly kind: 'customRootMotion';
  readonly target: TargetReferenceSource;
  readonly animationKey: string;
  readonly rootMotionCurveMask: string | number;
  readonly updateDirection: boolean;
  readonly startOffsetFrame: number;
}

export interface SnapToTargetWithRangeActionSource {
  readonly kind: 'snapToTargetWithRange';
  readonly target: TargetReferenceSource;
  readonly radius: ScalarSource;
  readonly moveType: string;
  readonly needRotate: boolean;
  readonly totalTime: number;
}

export interface SaveTargetDistanceActionSource {
  readonly kind: 'saveTargetDistance';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly outputKey: string;
}

export interface BoneAttachActionSource {
  readonly kind: 'boneAttach';
  readonly target: TargetReferenceSource;
  readonly anchorSlot: string;
  readonly subSlot: string;
  readonly isAddRotation: boolean;
  readonly rotateAnchor: 'Owner' | 'Target' | 'AnchorSlot' | 'SubSlot';
  readonly rotateAngles: readonly [number, number, number];
  readonly isLerp: boolean;
  readonly lerpTimeSeconds: number;
  readonly alwaysFollowRotation: boolean;
}

export interface SkillAiMoveActionSource {
  readonly kind: 'skillAiMove';
  readonly moveTargetType: 'EnemyCenter' | 'SelectTarget' | 'TargetInOutRange';
  readonly radius: number;
  readonly target: TargetReferenceSource;
  readonly minRange: number;
  readonly maxRange: number;
  readonly moveOuterDistance: number;
  readonly moveInnerDistance: number;
  readonly skillRadius: number;
  readonly otherTargetMinDistance: number;
  readonly mainCharacterLineBlockHalfAngle: number;
  readonly targetRefreshInterval: number;
  readonly marker: { readonly invert: boolean; readonly tagId: GameplayTagId };
}

/**
 * 方向在 Endaxis 的零距离、全实例、唯一木桩模型中不改变目标集合或伤害数值，但仍严格读取
 * 原生载荷；若未来接入方向条件，必须在投影层重新评估这项省略，不能从来源层删除证据。
 */
export function parseSelfRotateActionSource(value: unknown, path: string): SelfRotateActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'rotateType',
      'useAdvancedDirectionSetting',
      'targetSettings',
      'advancedDirectionSettings',
      'rootMotion',
      'rootMotionAnimKey',
      'rootMotionStartFrame',
      'isRootMotionScale',
      'rootMotionDirectionType',
      'immediateRotate',
      'overrideRotateRate',
      'rotateRate',
      'rotateDirType',
      'ignoreImmobilized',
    ]),
    path,
  );
  requireRecord(action.advancedDirectionSettings, `${path}.advancedDirectionSettings`);
  requireBoolean(action.useAdvancedDirectionSetting, `${path}.useAdvancedDirectionSetting`);
  requireString(action.rootMotionAnimKey, `${path}.rootMotionAnimKey`);
  requireNumber(action.rootMotionStartFrame, `${path}.rootMotionStartFrame`);
  requireBoolean(action.isRootMotionScale, `${path}.isRootMotionScale`);
  readRootMotionDirectionType(action.rootMotionDirectionType, `${path}.rootMotionDirectionType`);
  requireBoolean(action.overrideRotateRate, `${path}.overrideRotateRate`);
  requireNumber(action.rotateRate, `${path}.rotateRate`);
  readRotateDirectionType(action.rotateDirType, `${path}.rotateDirType`);
  requireBoolean(action.ignoreImmobilized, `${path}.ignoreImmobilized`);
  return {
    kind: 'selfRotate',
    rotateType: readSelfRotateType(action.rotateType, `${path}.rotateType`),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    rootMotion: requireBoolean(action.rootMotion, `${path}.rootMotion`),
    immediateRotate: requireBoolean(action.immediateRotate, `${path}.immediateRotate`),
  };
}

export function parseTeleportActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): TeleportActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'teleportTo',
      'radius',
      'allowCheckMainCharPosToDestPathAvailable',
      'throughWall',
      'clampDirToXZ',
      'checkMaxDistance',
      'maxDistance',
      'ignoreNavmeshLink',
      'snapToFloor',
    ]),
    path,
  );
  requireBoolean(
    action.allowCheckMainCharPosToDestPathAvailable,
    `${path}.allowCheckMainCharPosToDestPathAvailable`,
  );
  requireBoolean(action.throughWall, `${path}.throughWall`);
  requireBoolean(action.clampDirToXZ, `${path}.clampDirToXZ`);
  requireBoolean(action.checkMaxDistance, `${path}.checkMaxDistance`);
  requireNumber(action.maxDistance, `${path}.maxDistance`);
  requireBoolean(action.ignoreNavmeshLink, `${path}.ignoreNavmeshLink`);
  requireBoolean(action.snapToFloor, `${path}.snapToFloor`);
  return {
    kind: 'teleport',
    target: parseTargetReferenceSource(action.teleportTo, `${path}.teleportTo`),
    radius: parseScalarSource(action.radius, `${path}.radius`, inheritedBlackboard),
  };
}

/**
 * 原生动作仅在执行期添加禁止根运动的标签，并在 OnEnd 释放句柄。Data 没有额外载荷；
 * 来源层仍严格校验公共动作字段，避免把未来新增字段的变体静默当成相同动作。
 */
export function parseDisableRootMotionActionSource(
  value: unknown,
  path: string,
): DisableRootMotionActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
    path,
  );
  return { kind: 'disableRootMotion' };
}

/**
 * 原生动作根据目标和选点策略计算 NavMesh 位置，并把位置写入 contextKey。这里完整保留两种
 * 策略的输入；固定木桩投影只能在该上下文后续仅供空间动作消费时省略，不能伪造选点结果。
 */
export function parseTeleportPositionSelectionActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): TeleportPositionSelectionActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'targetSettings',
      'teleportType',
      'fixDistanceData',
      'rangedData',
      'contextKey',
    ]),
    path,
  );
  const fixDistance = requireRecord(action.fixDistanceData, `${path}.fixDistanceData`);
  requireExactFields(
    fixDistance,
    new Set(['excludeCurrentPos', 'distance', 'useAddScoreToPrevSide']),
    `${path}.fixDistanceData`,
  );
  const ranged = requireRecord(action.rangedData, `${path}.rangedData`);
  requireExactFields(ranged, new Set(['forwardDistance']), `${path}.rangedData`);
  const teleportType = requireNonEmptyString(action.teleportType, `${path}.teleportType`);
  if (teleportType !== 'FixedDistance' && teleportType !== 'Ranged')
    throw new Error(
      `${path}.teleportType: unsupported teleport position selection ${JSON.stringify(teleportType)}`,
    );
  return {
    kind: 'teleportPositionSelection',
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    teleportType,
    excludeCurrentPosition: requireBoolean(
      fixDistance.excludeCurrentPos,
      `${path}.fixDistanceData.excludeCurrentPos`,
    ),
    distance: parseScalarSource(
      fixDistance.distance,
      `${path}.fixDistanceData.distance`,
      inheritedBlackboard,
    ),
    useAddScoreToPreviousSide: requireBoolean(
      fixDistance.useAddScoreToPrevSide,
      `${path}.fixDistanceData.useAddScoreToPrevSide`,
    ),
    forwardDistance: parseScalarSource(
      ranged.forwardDistance,
      `${path}.rangedData.forwardDistance`,
      inheritedBlackboard,
    ),
    outputContextKey: requireNonEmptyString(action.contextKey, `${path}.contextKey`),
  };
}

export function parseReceiveMoveInputActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): ReceiveMoveInputActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'duration',
      'inputDirection',
      'speedType',
      'speed',
      'speedCurve',
      'speedScale',
      'faceToMoveDir',
      'overrideRotateSpeed',
      'disableCliffCheck',
      'rotateSpeed',
      'recoverWhenLanding',
      ...('combineRootMotion' in action ||
      'inputAlongRMScale' in action ||
      'rootMotionScale' in action
        ? ['combineRootMotion', 'inputAlongRMScale', 'rootMotionScale']
        : []),
      'useTeammateParam',
      'teammateParam',
    ]),
    path,
  );
  parseScalarSource(action.speed, `${path}.speed`, inheritedBlackboard);
  parseScalarSource(action.speedScale, `${path}.speedScale`, inheritedBlackboard);
  parseScalarSource(action.rotateSpeed, `${path}.rotateSpeed`, inheritedBlackboard);
  parseTimeDilationCurveKeys(action.speedCurve, `${path}.speedCurve`, true);
  requireNonEmptyString(action.speedType, `${path}.speedType`);
  requireBoolean(action.faceToMoveDir, `${path}.faceToMoveDir`);
  requireBoolean(action.overrideRotateSpeed, `${path}.overrideRotateSpeed`);
  requireBoolean(action.disableCliffCheck, `${path}.disableCliffCheck`);
  requireBoolean(action.recoverWhenLanding, `${path}.recoverWhenLanding`);
  // 新版将这三个参数交给 ManualMoveInSkillParam；只混合输入位移与根运动，不改技能调度。
  if ('combineRootMotion' in action) {
    requireBoolean(action.combineRootMotion, `${path}.combineRootMotion`);
    parseScalarSource(action.inputAlongRMScale, `${path}.inputAlongRMScale`, inheritedBlackboard);
    parseScalarSource(action.rootMotionScale, `${path}.rootMotionScale`, inheritedBlackboard);
  }
  requireBoolean(action.useTeammateParam, `${path}.useTeammateParam`);
  const teammate = requireRecord(action.teammateParam, `${path}.teammateParam`);
  requireExactFields(
    teammate,
    new Set([
      'inputDirection',
      'speedType',
      'speed',
      'speedCurve',
      'speedScale',
      'faceToMoveDir',
      'overrideRotateSpeed',
      'rotateSpeed',
      'disableDynamicPush',
    ]),
    `${path}.teammateParam`,
  );
  requireNonEmptyString(teammate.inputDirection, `${path}.teammateParam.inputDirection`);
  requireNonEmptyString(teammate.speedType, `${path}.teammateParam.speedType`);
  parseScalarSource(teammate.speed, `${path}.teammateParam.speed`, inheritedBlackboard);
  parseTimeDilationCurveKeys(teammate.speedCurve, `${path}.teammateParam.speedCurve`, true);
  parseScalarSource(teammate.speedScale, `${path}.teammateParam.speedScale`, inheritedBlackboard);
  requireBoolean(teammate.faceToMoveDir, `${path}.teammateParam.faceToMoveDir`);
  requireBoolean(teammate.overrideRotateSpeed, `${path}.teammateParam.overrideRotateSpeed`);
  parseScalarSource(teammate.rotateSpeed, `${path}.teammateParam.rotateSpeed`, inheritedBlackboard);
  requireBoolean(teammate.disableDynamicPush, `${path}.teammateParam.disableDynamicPush`);
  return {
    kind: 'receiveMoveInput',
    duration: parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard),
    inputDirection: requireNonEmptyString(action.inputDirection, `${path}.inputDirection`),
  };
}

/**
 * MoveToAction 的原生完成时机仍受 IFix 保护；这里只严格保存完整空间载荷，并交由固定零距离
 * 投影判断是否可省略。不能据此把动作解释为同步瞬移。
 */
export function parseMoveToActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): MoveToActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'moveType',
      'totalTime',
      ...('manualTick' in action ? ['manualTick'] : []),
      'updateMoveTarget',
      ...('updateLatestMainCharacter' in action ? ['updateLatestMainCharacter'] : []),
      'directionType',
      'target',
      'fixAngle',
      'fixDirectionType',
      'fixPosAngle',
      'fixPosLength',
      'blockRadius',
      'enableMaxDistanceCheckWhenMoveBack',
      'maxDistanceWhenMoveBack',
      'useExtraBlockRadiusForInt',
      'extraRadiusForInt',
      'counterClockwise',
      'faceToMoveDir',
      ...('dontClampFaceToMoveDirToXZ' in action ? ['dontClampFaceToMoveDirToXZ'] : []),
      'overrideRotateRate',
      'rotateRate',
      'speedType',
      'speed',
      'speedCurve',
      'rootMotionAnimKey',
      'startOffsetFrame',
      'autoScaled',
      'rootMotionScale',
      'dontClampDirToXZ',
      'enableXAxisMove',
      'xAxisSpeed',
      'enableYAxisMove',
      'yAxisSpeed',
      'limitMoveDirRotateSpeed',
      'moveDirYRotateSpeed',
      'disableReachAutoEnd',
      'ignoreNavmesh',
      'ignoreAllCollision',
      'ignoreCollisionLayer',
      'stopByCliff',
      'overrideStepOffset',
      'stepOffset',
    ]),
    path,
  );
  parseNumberVector3(action.fixAngle, `${path}.fixAngle`);
  // 新版只增加移动请求更新、追踪目标与朝向开关，由 MoveToAction 读取。
  // 不改变伤害目标或外层调度。旧数据可缺省，显式字段仍严格校验，不向运行时添加空间参数。
  for (const key of ['manualTick', 'updateLatestMainCharacter', 'dontClampFaceToMoveDirToXZ']) {
    if (key in action) requireBoolean(action[key], `${path}.${key}`);
  }
  parseScalarVector3(action.fixPosAngle, `${path}.fixPosAngle`, inheritedBlackboard);
  for (const key of [
    'fixPosLength',
    'blockRadius',
    'maxDistanceWhenMoveBack',
    'extraRadiusForInt',
    'rotateRate',
    'speed',
    'rootMotionScale',
  ] as const)
    parseScalarSource(action[key], `${path}.${key}`, inheritedBlackboard);
  parseTimeDilationCurveKeys(action.speedCurve, `${path}.speedCurve`, true);
  parseMoveSubSpeed(action.xAxisSpeed, `${path}.xAxisSpeed`, inheritedBlackboard);
  parseMoveSubSpeed(action.yAxisSpeed, `${path}.yAxisSpeed`, inheritedBlackboard);
  for (const key of [
    'updateMoveTarget',
    'enableMaxDistanceCheckWhenMoveBack',
    'useExtraBlockRadiusForInt',
    'counterClockwise',
    'faceToMoveDir',
    'overrideRotateRate',
    'autoScaled',
    'dontClampDirToXZ',
    'enableXAxisMove',
    'enableYAxisMove',
    'limitMoveDirRotateSpeed',
    'disableReachAutoEnd',
    'ignoreNavmesh',
    'ignoreAllCollision',
    'stopByCliff',
    'overrideStepOffset',
  ] as const)
    requireBoolean(action[key], `${path}.${key}`);
  requireNonEmptyString(action.fixDirectionType, `${path}.fixDirectionType`);
  requireString(action.rootMotionAnimKey, `${path}.rootMotionAnimKey`);
  requireInteger(action.startOffsetFrame, `${path}.startOffsetFrame`);
  requireNumber(action.moveDirYRotateSpeed, `${path}.moveDirYRotateSpeed`);
  requireNumber(action.stepOffset, `${path}.stepOffset`);
  parseIgnoredCollisionLayer(action.ignoreCollisionLayer, `${path}.ignoreCollisionLayer`);
  return {
    kind: 'moveTo',
    moveType: requireNonEmptyString(action.moveType, `${path}.moveType`),
    totalTime: parseScalarSource(action.totalTime, `${path}.totalTime`, inheritedBlackboard),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    updateMoveTarget: requireBoolean(action.updateMoveTarget, `${path}.updateMoveTarget`),
    directionType: requireNonEmptyString(action.directionType, `${path}.directionType`),
    speedType: requireNonEmptyString(action.speedType, `${path}.speedType`),
  };
}

/**
 * CustomRootMotionAction 的原生 executeReturnType 为 CustomReturnType；动作在自己的时间线区间内
 * 创建、更新并在 OnEnd 释放 MoveRequestHandle。来源层保存完整移动载荷，固定零距离投影只能在
 * 后续战斗动作不读取空间结果时省略，不能把它解释为同步瞬移或无条件成功。
 */
export function parseCustomRootMotionActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): CustomRootMotionActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'moveTo',
      'animKey',
      ...('manualTick' in action ? ['manualTick'] : []),
      'rootMotionCurveMask',
      'scaleX',
      'scaleY',
      'enableScaleZWithDistanceCurve',
      'distance2ScaleZ',
      'scaleZ',
      'blockRadius',
      'useExtraBlockRadiusForInt',
      'extraRadiusForInt',
      'enableMaxDistanceCheckWhenMoveBack',
      'maxDistanceWhenMoveBack',
      'updateDir',
      'startOffsetFrame',
      'playbackSpeed',
      'stopByCliff',
      'ignoreAllCollision',
      'ignoreCollisionLayer',
    ]),
    path,
  );
  // manualTick 进入原生 MoveRequest；只影响已省略的位移更新，不代表技能时间轴手动推进。
  if ('manualTick' in action) requireBoolean(action.manualTick, `${path}.manualTick`);
  for (const key of [
    'scaleX',
    'scaleY',
    'scaleZ',
    'blockRadius',
    'extraRadiusForInt',
    'maxDistanceWhenMoveBack',
    'playbackSpeed',
  ] as const)
    parseScalarSource(action[key], `${path}.${key}`, inheritedBlackboard);
  parseTimeDilationCurveKeys(action.distance2ScaleZ, `${path}.distance2ScaleZ`);
  for (const key of [
    'enableScaleZWithDistanceCurve',
    'useExtraBlockRadiusForInt',
    'enableMaxDistanceCheckWhenMoveBack',
    'updateDir',
    'stopByCliff',
    'ignoreAllCollision',
  ] as const)
    requireBoolean(action[key], `${path}.${key}`);
  parseIgnoredCollisionLayer(action.ignoreCollisionLayer, `${path}.ignoreCollisionLayer`);
  return {
    kind: 'customRootMotion',
    target: parseTargetReferenceSource(action.moveTo, `${path}.moveTo`),
    animationKey: requireString(action.animKey, `${path}.animKey`),
    rootMotionCurveMask: requireNamedOrInteger(
      action.rootMotionCurveMask,
      `${path}.rootMotionCurveMask`,
    ),
    updateDirection: requireBoolean(action.updateDir, `${path}.updateDir`),
    startOffsetFrame: requireInteger(action.startOffsetFrame, `${path}.startOffsetFrame`),
  };
}

/**
 * 原生动作建立一段贴近目标的移动请求；它不携带战斗载荷。固定零距离投影可以在后继链不读取
 * 空间结果时省略它，但来源层仍校验完整曲线、根运动和移动优先级字段，避免把未知变体静默吞掉。
 */
export function parseSnapToTargetWithRangeActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): SnapToTargetWithRangeActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'moveTo',
      'fixPositionWhenStart',
      'radius',
      'moveType',
      'needRotate',
      'useFixSpeed',
      'speed',
      'fixedSpeedCurveKey',
      'speedCurve',
      'positionCurve',
      'totalTime',
      'rootMotionAnimKey',
      'rootMotionMaxDistance',
      'chargePriority',
    ]),
    path,
  );
  requireBoolean(action.fixPositionWhenStart, `${path}.fixPositionWhenStart`);
  requireBoolean(action.useFixSpeed, `${path}.useFixSpeed`);
  parseScalarSource(action.speed, `${path}.speed`, inheritedBlackboard);
  requireString(action.fixedSpeedCurveKey, `${path}.fixedSpeedCurveKey`);
  parseTimeDilationCurveKeys(action.speedCurve, `${path}.speedCurve`, true);
  parseTimeDilationCurveKeys(action.positionCurve, `${path}.positionCurve`, true);
  requireString(action.rootMotionAnimKey, `${path}.rootMotionAnimKey`);
  requireNumber(action.rootMotionMaxDistance, `${path}.rootMotionMaxDistance`);
  requireNonEmptyString(action.chargePriority, `${path}.chargePriority`);
  return {
    kind: 'snapToTargetWithRange',
    target: parseTargetReferenceSource(action.moveTo, `${path}.moveTo`),
    radius: parseScalarSource(action.radius, `${path}.radius`, inheritedBlackboard),
    moveType: requireNonEmptyString(action.moveType, `${path}.moveType`),
    needRotate: requireBoolean(action.needRotate, `${path}.needRotate`),
    totalTime: requireNumber(action.totalTime, `${path}.totalTime`),
  };
}

/**
 * 原生动作测量两个 battle-root 的三维距离并写入动作黑板。来源层保留真实端点，只有投影层
 * 才能依据 Endaxis 固定零距离模型把结果改写为 0。
 */
export function parseSaveTargetDistanceActionSource(
  value: unknown,
  path: string,
): SaveTargetDistanceActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'source',
      'target',
      'bbKey',
    ]),
    path,
  );
  return {
    kind: 'saveTargetDistance',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    outputKey: requireNonEmptyString(action.bbKey, `${path}.bbKey`),
  };
}

/**
 * BoneAttachAction 会暂时接管目标移动、添加 BeCaught/Undeadable 并限制地图传送；
 * 来源层完整保留挂点与插值载荷，固定木桩投影只能在目标身份已证明时省略。
 */
export function parseBoneAttachActionSource(value: unknown, path: string): BoneAttachActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'targetSettings',
      'anchorSlot',
      'subSlot',
      'isAddRotation',
      'rotateAnchor',
      'rotateAngles',
      'isLerp',
      'lerpTime',
      'alwaysFollowRotation',
    ]),
    path,
  );
  requireBoolean(action.isEnable, `${path}.isEnable`);
  requireNativeActionPriority(action.priorityLevel, `${path}.priorityLevel`);
  requireInteger(action.priorityOffset, `${path}.priorityOffset`);
  requireInteger(action.serverActionIndex, `${path}.serverActionIndex`);
  const rotateAnchor = requireNonEmptyString(action.rotateAnchor, `${path}.rotateAnchor`);
  if (!['Owner', 'Target', 'AnchorSlot', 'SubSlot'].includes(rotateAnchor))
    throw new Error(`${path}.rotateAnchor: unsupported value ${rotateAnchor}`);
  const rotateAngles = parseNumberVector3(action.rotateAngles, `${path}.rotateAngles`);
  const lerpTimeSeconds = requireNumber(action.lerpTime, `${path}.lerpTime`);
  if (!Number.isFinite(lerpTimeSeconds) || lerpTimeSeconds < 0)
    throw new Error(`${path}.lerpTime: expected finite non-negative number`);
  return {
    kind: 'boneAttach',
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    anchorSlot: requireNonEmptyString(action.anchorSlot, `${path}.anchorSlot`),
    subSlot: requireNonEmptyString(action.subSlot, `${path}.subSlot`),
    isAddRotation: requireBoolean(action.isAddRotation, `${path}.isAddRotation`),
    rotateAnchor: rotateAnchor as BoneAttachActionSource['rotateAnchor'],
    rotateAngles: [rotateAngles.x, rotateAngles.y, rotateAngles.z],
    isLerp: requireBoolean(action.isLerp, `${path}.isLerp`),
    lerpTimeSeconds,
    alwaysFollowRotation: requireBoolean(
      action.alwaysFollowRotation,
      `${path}.alwaysFollowRotation`,
    ),
  };
}

export function parseSkillAiMoveActionSource(
  value: unknown,
  path: string,
): SkillAiMoveActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'skillMoveTargetType',
      'radius',
      'targetSettings',
      'minRange',
      'maxRange',
      'moveOuterDist',
      'moveInnerDist',
      'skillRadius',
      'otherTargetMinDist',
      'mainCharLineBlockHalfAngle',
      'targetRefreshInterval',
      'markerInfo',
    ]),
    path,
  );
  const moveTargetType = requireNonEmptyString(
    action.skillMoveTargetType,
    `${path}.skillMoveTargetType`,
  );
  if (!['EnemyCenter', 'SelectTarget', 'TargetInOutRange'].includes(moveTargetType)) {
    throw new Error(
      `${path}.skillMoveTargetType: unsupported value ${JSON.stringify(moveTargetType)}`,
    );
  }
  const markerInfo = requireRecord(action.markerInfo, `${path}.markerInfo`);
  requireExactFields(markerInfo, new Set(['invert', 'marker']), `${path}.markerInfo`);
  const marker = requireRecord(markerInfo.marker, `${path}.markerInfo.marker`);
  requireExactFields(marker, new Set(['tagId']), `${path}.markerInfo.marker`);
  if (typeof marker.tagId !== 'number') {
    throw new Error(`${path}.markerInfo.marker.tagId: expected number`);
  }
  return {
    kind: 'skillAiMove',
    moveTargetType: moveTargetType as SkillAiMoveActionSource['moveTargetType'],
    radius: requireNumber(action.radius, `${path}.radius`),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    minRange: requireNumber(action.minRange, `${path}.minRange`),
    maxRange: requireNumber(action.maxRange, `${path}.maxRange`),
    moveOuterDistance: requireNumber(action.moveOuterDist, `${path}.moveOuterDist`),
    moveInnerDistance: requireNumber(action.moveInnerDist, `${path}.moveInnerDist`),
    skillRadius: requireNumber(action.skillRadius, `${path}.skillRadius`),
    otherTargetMinDistance: requireNumber(action.otherTargetMinDist, `${path}.otherTargetMinDist`),
    mainCharacterLineBlockHalfAngle: requireNumber(
      action.mainCharLineBlockHalfAngle,
      `${path}.mainCharLineBlockHalfAngle`,
    ),
    targetRefreshInterval: requireNumber(
      action.targetRefreshInterval,
      `${path}.targetRefreshInterval`,
    ),
    marker: {
      invert: requireBoolean(markerInfo.invert, `${path}.markerInfo.invert`),
      tagId: gameplayTagId(marker.tagId),
    },
  };
}

function parseNumberVector3(value: unknown, path: string) {
  const vector = requireRecord(value, path);
  requireExactFields(vector, new Set(['x', 'y', 'z']), path);
  return {
    x: requireNumber(vector.x, `${path}.x`),
    y: requireNumber(vector.y, `${path}.y`),
    z: requireNumber(vector.z, `${path}.z`),
  };
}

function parseScalarVector3(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
) {
  const vector = requireRecord(value, path);
  requireExactFields(vector, new Set(['x', 'y', 'z']), path);
  for (const key of ['x', 'y', 'z'] as const)
    parseScalarSource(vector[key], `${path}.${key}`, inheritedBlackboard);
}

function parseMoveSubSpeed(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
) {
  const speed = requireRecord(value, path);
  requireExactFields(
    speed,
    new Set(['speedType', 'fixedSpeed', 'speedCurve', 'rootMotionAnimKey', 'rootMotionScale']),
    path,
  );
  requireNonEmptyString(speed.speedType, `${path}.speedType`);
  parseScalarSource(speed.fixedSpeed, `${path}.fixedSpeed`, inheritedBlackboard);
  parseTimeDilationCurveKeys(speed.speedCurve, `${path}.speedCurve`, true);
  requireString(speed.rootMotionAnimKey, `${path}.rootMotionAnimKey`);
  parseScalarSource(speed.rootMotionScale, `${path}.rootMotionScale`, inheritedBlackboard);
}
