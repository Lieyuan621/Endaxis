import {
  nativeActionName,
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

const RAY_CAST_EFFECT_FIELDS = new Set([
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
  'targetGroupKey',
  'saveAllHitTargets',
  'hitPosGroupKey',
  'moveType',
  'targetSettings',
  'sourceSettings',
  'rayEffect',
  'rayHitEffect',
  'hitEffectDirectionType',
  'hitEffectLayers',
  'hitLoopSoundEvent',
  'hitEndSoundEvent',
  'sourcePosType',
  'startPosMountPoint',
  'startPosOffset',
  'raycastDataList',
  'mountPointRayData',
  'curveRayData',
  'pointToPointRayData',
  'useFaction',
  'autoSetTargetFaction',
  'containsUnMarkable',
  'factionTarget',
  'targetFactionType',
  'touchingLayers',
  'rayMaxLength',
  'rayRadius',
  'useRealHitLength',
  'useLastHitForEffect',
]);

/**
 * RayCastEffectAction is not merely presentation: its two TargetHandles are
 * registered in the action blackboard under targetGroupKey/hitPosGroupKey.
 * Geometry and VFX payloads remain opaque source facts until a projection has
 * proved that its scenario can collapse the query.
 */
export interface RayCastTargetGroupActionSource {
  readonly kind: 'rayCastTargetGroup';
  readonly targetGroupKey: string;
  readonly hitPosGroupKey: string;
  readonly saveAllHitTargets: boolean;
  readonly moveType: string;
  readonly target: TargetReferenceSource;
  readonly source: TargetReferenceSource;
  readonly useFaction: boolean;
  readonly autoSetTargetFaction: boolean;
  readonly containsUnMarkable: boolean;
  readonly factionTarget: string;
  readonly targetFactionType: number;
  readonly rayMaxLength: number;
  readonly rayRadius: number;
  readonly useRealHitLength: boolean;
  readonly useLastHitForEffect: boolean;
  readonly raycastSegmentCount: number;
}

export function parseRayCastTargetGroupActionSource(
  value: unknown,
  path: string,
): RayCastTargetGroupActionSource {
  const action = requireRecord(value, path);
  if (nativeActionName(requireString(action.$type, `${path}.$type`)) !== 'RayCastEffectAction') {
    throw new Error(`${path}: expected RayCastEffectAction`);
  }
  requireExactFields(action, RAY_CAST_EFFECT_FIELDS, path);

  // These fields do not enter the combat IR, but validating their container
  // shape prevents a changed export schema from being silently accepted.
  requireRecord(action.rayEffect, `${path}.rayEffect`);
  requireRecord(action.rayHitEffect, `${path}.rayHitEffect`);
  requireRecord(action.hitEffectLayers, `${path}.hitEffectLayers`);
  requireRecord(action.hitLoopSoundEvent, `${path}.hitLoopSoundEvent`);
  requireRecord(action.hitEndSoundEvent, `${path}.hitEndSoundEvent`);
  requireRecord(action.startPosOffset, `${path}.startPosOffset`);
  requireRecord(action.mountPointRayData, `${path}.mountPointRayData`);
  requireRecord(action.curveRayData, `${path}.curveRayData`);
  requireRecord(action.pointToPointRayData, `${path}.pointToPointRayData`);
  requireRecord(action.touchingLayers, `${path}.touchingLayers`);

  return {
    kind: 'rayCastTargetGroup',
    targetGroupKey: requireNonEmptyString(action.targetGroupKey, `${path}.targetGroupKey`),
    hitPosGroupKey: requireNonEmptyString(action.hitPosGroupKey, `${path}.hitPosGroupKey`),
    saveAllHitTargets: requireBoolean(action.saveAllHitTargets, `${path}.saveAllHitTargets`),
    moveType: requireNonEmptyString(action.moveType, `${path}.moveType`),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    source: parseTargetReferenceSource(action.sourceSettings, `${path}.sourceSettings`),
    useFaction: requireBoolean(action.useFaction, `${path}.useFaction`),
    autoSetTargetFaction: requireBoolean(
      action.autoSetTargetFaction,
      `${path}.autoSetTargetFaction`,
    ),
    containsUnMarkable: requireBoolean(action.containsUnMarkable, `${path}.containsUnMarkable`),
    factionTarget: requireNonEmptyString(action.factionTarget, `${path}.factionTarget`),
    targetFactionType: requireNumber(action.targetFactionType, `${path}.targetFactionType`),
    rayMaxLength: requireNumber(action.rayMaxLength, `${path}.rayMaxLength`),
    rayRadius: requireNumber(action.rayRadius, `${path}.rayRadius`),
    useRealHitLength: requireBoolean(action.useRealHitLength, `${path}.useRealHitLength`),
    useLastHitForEffect: requireBoolean(action.useLastHitForEffect, `${path}.useLastHitForEffect`),
    raycastSegmentCount: requireArray(action.raycastDataList, `${path}.raycastDataList`).length,
  };
}
