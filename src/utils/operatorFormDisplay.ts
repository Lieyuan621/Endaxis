import { getOperator } from '@/data';
import { resolveActiveForm } from '@/data/collect';
import { getOperatorFormName } from '@/data/gameText';
import { getTrackInstances, makeSingleOpTeam } from '@/stores/timeline/instanceLookup';
import type { Track } from '@/stores/timeline/types';

/**
 * Resolve the active attribute-derived form key for a timeline track.
 * Returns null when the operator has no forms or instances are incomplete.
 */
export function getTrackOperatorFormKey(track: Track | null | undefined): string | null {
  if (!track?.id || !track.operatorInstanceId) return null;
  const sheet = getOperator(track.id);
  if (!sheet?.forms) return null;

  const inst = getTrackInstances(track);
  if (!inst) return null;

  const team = makeSingleOpTeam(
    track.id,
    track.operatorInstanceId,
    track.weaponInstanceId,
    inst.gearMap,
  );
  return resolveActiveForm(
    inst.opInst,
    inst.wpInst ? [inst.wpInst] : [],
    inst.gearInsts,
    team.slots[0],
    sheet,
  );
}

/**
 * Resolve the active attribute-derived form label for a timeline track.
 * Returns null when the operator has no forms or instances are incomplete.
 */
export function getTrackOperatorFormName(
  track: Track | null | undefined,
  locale?: string | null,
): string | null {
  const key = getTrackOperatorFormKey(track);
  if (!key || !track?.id) return null;
  return getOperatorFormName(track.id, key, locale);
}
