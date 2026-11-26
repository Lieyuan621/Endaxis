import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';

export function availablePickups(entries: Iterable<CombatReceiptEntry>, frame: number) {
  const active = new Map<string, { owner: string; group: string; pickupFrame: number }>();
  for (const entry of entries) {
    if (entry.frame > frame) break;
    if (!entry.targetId) continue;
    if (entry.event === 'AbilityEntityFinished' || entry.event === 'PickupClosed')
      active.delete(entry.targetId);
    if (entry.event === 'PickupOpened' && entry.sourceId && typeof entry.data?.group === 'string')
      active.set(entry.targetId, {
        owner: entry.sourceId,
        group: entry.data.group,
        pickupFrame: entry.frame,
      });
  }
  return active;
}
