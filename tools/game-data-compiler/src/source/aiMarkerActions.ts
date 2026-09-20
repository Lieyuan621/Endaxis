import { requireBoolean, requireExactFields, requireInteger, requireRecord } from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface AiMarkerActionSource {
  readonly kind: 'addAiMarker';
  readonly owner: TargetReferenceSource;
  readonly markerTagId: number;
  readonly removeByAction: boolean;
  readonly duration: ScalarSource;
}

export function parseAiMarkerActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): AiMarkerActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'markerOwner',
      'marker',
      'removeByAction',
      'duration',
    ]),
    path,
  );
  const marker = requireRecord(action.marker, `${path}.marker`);
  requireExactFields(marker, new Set(['tagId']), `${path}.marker`);
  return {
    kind: 'addAiMarker',
    owner: parseTargetReferenceSource(action.markerOwner, `${path}.markerOwner`),
    markerTagId: requireInteger(marker.tagId, `${path}.marker.tagId`),
    removeByAction: requireBoolean(action.removeByAction, `${path}.removeByAction`),
    duration: parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard),
  };
}
