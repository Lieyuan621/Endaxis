import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { BuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import type { EnemyEffectMarker } from '../../../core/projection/enemyEffectViz';
import { groupEnemyBurstDamageHits } from './enemyBurstDamageGroups';
import { findBuffDamageSegment, groupEnemyBuffDamageHits } from './enemyBuffDamageHits';
import { layoutEnemyStatusRows } from './enemyStatusRows';

/** 共用屏幕入口，不合并战斗身份：每笔回执保留原对象和 sequence。 */
export function layoutEnemyDamageHits(
  entries: readonly CombatReceiptEntry[],
  buffs: readonly BuffTimelineSegment[],
  markers: readonly EnemyEffectMarker[],
  attachmentIds: ReadonlySet<string>,
) {
  const rows = layoutEnemyStatusRows(buffs, markers, attachmentIds);
  const candidates = [
    ...groupEnemyBurstDamageHits(entries).map(group => ({
      group,
      row: rows.attachmentRow,
      standalone: false,
    })),
    ...groupEnemyBuffDamageHits(entries, buffs).map(group => {
      const segment = findBuffDamageSegment(group[0]!, buffs);
      const row = segment === undefined ? undefined : rows.lanes.get(segment);
      // 没有可见持续条的伤害仍有独立入口，不受 Buff 图标和头顶栏开关影响。
      return { group, row: row ?? rows.rowCount, standalone: row === undefined };
    }),
  ];
  const positions = new Map<
    string,
    { group: CombatReceiptEntry[]; row: number; standalone: boolean }
  >();
  for (const { group, row, standalone } of candidates) {
    const first = group[0]!;
    const key = JSON.stringify([first.targetId, first.frame, row]);
    const position = positions.get(key) ?? { group: [], row, standalone };
    position.group.push(...group);
    positions.set(key, position);
  }
  for (const position of positions.values()) {
    position.group.sort((a, b) => a.sequence - b.sequence);
  }
  return [...positions.values()];
}
