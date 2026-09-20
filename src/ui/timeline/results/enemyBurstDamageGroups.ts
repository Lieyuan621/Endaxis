import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

/** 同一敌人、同一显示帧共享入口；各笔伤害仍保留独立回执及顺序。 */
export function groupEnemyBurstDamageHits(entries: readonly CombatReceiptEntry[]) {
  const groups = new Map<string, CombatReceiptEntry[]>();
  for (const entry of entries) {
    if (entry.event !== 'DamageApplied' || typeof entry.data?.spellBurstType !== 'string') continue;
    const key = JSON.stringify([entry.targetId, entry.frame]);
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function selectEnemyBurstDamageEntries(
  entries: readonly CombatReceiptEntry[],
  sequence: number | null,
) {
  return (
    groupEnemyBurstDamageHits(entries).find(group =>
      group.some(entry => entry.sequence === sequence),
    ) ?? []
  );
}
