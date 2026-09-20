import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';

export interface TimelineComboCooldownBand {
  operatorId: string;
  skillId: string;
  startFrame: number;
  endFrame: number;
}

/** Explicit timeline controls have no owning skill block; close using actual runtime edges. */
export function projectTimelineComboCooldowns(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
): TimelineComboCooldownBand[] {
  const open = new Map<string, TimelineComboCooldownBand>();
  const bands: TimelineComboCooldownBand[] = [];
  for (const entry of entries) {
    const skillId = entry.data?.skillId;
    if (typeof skillId !== 'string' || !entry.sourceId) continue;
    const key = `${entry.sourceId}\u0000${skillId}`;
    if (entry.event === 'TimelineComboCooldownControlled') {
      const previous = open.get(key);
      if (previous) bands.push({ ...previous, endFrame: entry.frame });
      open.delete(key);
      if (entry.data?.mode === 'cooldown')
        open.set(key, { operatorId: entry.sourceId, skillId, startFrame: entry.frame, endFrame });
    } else if (
      entry.event === 'SkillCooldownReady' ||
      entry.event === 'SkillCooldownRefunded' ||
      entry.event === 'SkillCooldownReserved' ||
      (entry.event === 'SkillCooldownAdjusted' && entry.data?.ready === true)
    ) {
      const previous = open.get(key);
      if (previous) bands.push({ ...previous, endFrame: entry.frame });
      open.delete(key);
    }
  }
  return [...bands, ...open.values()].filter(band => band.endFrame > band.startFrame);
}
