import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import {
  findBuffTimelineSegmentForDamage,
  type BuffTimelineSegment,
} from '../../../core/projection/buffTimelineViz';
import { isBuffDamageReceipt } from '../../../core/projection/enemyEffectViz';

export function groupEnemyBuffDamageHits(entries: readonly CombatReceiptEntry[]) {
  const groups = new Map<string, CombatReceiptEntry[]>();
  for (const entry of entries) {
    if (
      !isBuffDamageReceipt(entry) ||
      entry.targetId !== entry.data!.buffOwnerId ||
      typeof entry.data?.spellBurstType === 'string'
    )
      continue;
    const key = JSON.stringify([
      entry.targetId,
      entry.frame,
      entry.data!.buffOwnerId,
      entry.data!.buffId,
      entry.data!.buffInstanceId,
    ]);
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** 仅使用执行实例的可见段；末帧伤害可归属结束段，叠层边界优先使用新段。 */
export function findBuffDamageSegment<T extends BuffTimelineSegment>(
  entry: CombatReceiptEntry,
  segments: readonly T[],
): T | undefined {
  return findBuffTimelineSegmentForDamage(entry, segments);
}

export function selectEnemyBuffDamageEntries(
  entries: readonly CombatReceiptEntry[],
  sequence: number | null,
) {
  return (
    groupEnemyBuffDamageHits(entries).find(group =>
      group.some(entry => entry.sequence === sequence),
    ) ?? []
  );
}
