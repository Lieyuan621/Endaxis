import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

export function controlSwitchDiagnosticKey(
  trackIndex: number,
  frame: number,
  kind: 'manual' | 'automatic' | 'skill',
): string {
  return JSON.stringify([trackIndex, frame, kind]);
}

/** 直接读取切换时的诊断，不从结束时标签或当前选中的轨道重算。 */
export function projectControlSwitchWarnings(
  entries: readonly CombatReceiptEntry[],
  tracks: readonly ({ readonly id: string } | null)[],
): ReadonlyMap<string, readonly ('controlSwitchOutUnavailable' | 'controlSwitchInUnavailable')[]> {
  const trackIndices = new Map(
    tracks.flatMap((track, index) => (track === null ? [] : [[track.id, index] as const])),
  );
  const result = new Map<
    string,
    ('controlSwitchOutUnavailable' | 'controlSwitchInUnavailable')[]
  >();
  for (const entry of entries) {
    if (entry.event !== 'ControlSwitchBlockedByTag' || entry.sourceId === undefined) continue;
    const trackIndex = trackIndices.get(entry.sourceId);
    const kind = entry.data?.switchKind;
    const blocker = entry.data?.blocker;
    if (trackIndex === undefined || (kind !== 'manual' && kind !== 'automatic' && kind !== 'skill'))
      continue;
    const reason =
      blocker === 'CantMainCharSwitched'
        ? 'controlSwitchOutUnavailable'
        : blocker === 'CantSwitchToCenter'
          ? 'controlSwitchInUnavailable'
          : undefined;
    if (reason === undefined) continue;
    const key = controlSwitchDiagnosticKey(trackIndex, entry.frame, kind);
    const reasons = result.get(key) ?? [];
    if (!reasons.includes(reason)) reasons.push(reason);
    result.set(key, reasons);
  }
  return result;
}

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
        ? ('skill' as const)
        : entry.event === 'AutomaticControlSwitched'
          ? ('automatic' as const)
          : undefined;
    if (kind === undefined || (kind === 'automatic' && !automaticSwitches)) return [];
    if (entry.sourceId === undefined) return [];
    const trackIndex = tracksById.get(entry.sourceId);
    if (trackIndex === undefined) return [];
    return [{ id: `control-switch:${entry.sequence}`, frame: entry.frame, trackIndex, kind }];
  });
}
