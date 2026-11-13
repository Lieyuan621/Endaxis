import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

/** 技能要求切换主控属于战斗机制，不受自动切人偏好控制。 */
export function projectControlSwitchMarkers(
  entries: readonly CombatReceiptEntry[],
  tracks: readonly ({ readonly id: string } | null)[],
  automaticSwitches: boolean,
) {
  const tracksById = new Map(
    tracks.flatMap((track, index) => (track === null ? [] : [[track.id, index] as const])),
  );
  return entries.flatMap(entry => {
    const kind =
      entry.event === 'SkillControlSwitched'
        ? 'skill'
        : entry.event === 'AutomaticControlSwitched'
          ? 'automatic'
          : undefined;
    if (kind === undefined || (kind === 'automatic' && !automaticSwitches)) return [];
    if (entry.sourceId === undefined) return [];
    const trackIndex = tracksById.get(entry.sourceId);
    if (trackIndex === undefined) return [];
    return [{ id: `control-switch:${entry.sequence}`, frame: entry.frame, trackIndex, kind }];
  });
}
