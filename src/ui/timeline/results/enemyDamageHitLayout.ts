import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import {
  projectBuffIconTimelineMetadata,
  type BuffTimelineSegment,
} from '../../../core/projection/buffTimelineViz';
import {
  projectBuffDamageDisplayOwners,
  type EnemyEffectMarker,
} from '../../../core/projection/enemyEffectViz';
import { groupEnemyBurstDamageHits } from './enemyBurstDamageGroups';
import { findBuffDamageSegment, groupEnemyBuffDamageHits } from './enemyBuffDamageHits';
import { layoutEnemyStatusRows } from './enemyStatusRows';

/** 共用屏幕入口，不合并战斗身份：每笔回执保留原对象和 sequence。 */
export function layoutEnemyDamageHits(
  entries: readonly CombatReceiptEntry[],
  buffs: readonly BuffTimelineSegment[],
  markers: readonly EnemyEffectMarker[],
  attachmentIds: ReadonlySet<string>,
  damageBuffs: readonly BuffTimelineSegment[] = projectBuffIconTimelineMetadata(
    entries,
    entries.reduce((maximum, entry) => Math.max(maximum, entry.frame), 0),
  ),
  displayOwners = projectBuffDamageDisplayOwners(entries, damageBuffs),
  entities: readonly { startFrame: number; endFrame: number }[] = [],
) {
  const rows = layoutEnemyStatusRows(buffs, markers, attachmentIds, entities);
  const candidates = [
    ...groupEnemyBurstDamageHits(entries).map(group => ({
      group,
      row: rows.attachmentRow,
      standalone: false,
    })),
    ...groupEnemyBuffDamageHits(entries, damageBuffs, displayOwners).map(group => {
      const entry = group[0]!;
      const owner = displayOwners[entry.sequence];
      // 锚点是展示段的身份，不伪造回执中的 buffId / buffInstanceId 来寻找轨道。
      const containsOwner = (buff: BuffTimelineSegment): boolean =>
        owner !== undefined &&
        buff.targetId === owner.targetId &&
        buff.instanceId === owner.instanceId &&
        buff.buffId === owner.buffId &&
        buff.startFrame <= owner.startFrame &&
        buff.endFrame >= owner.endFrame;
      const displaySegment =
        owner === undefined
          ? findBuffDamageSegment(entry, buffs)
          : buffs.find(
              buff =>
                containsOwner(buff) ||
                ('windows' in buff &&
                  Array.isArray(buff.windows) &&
                  (buff.windows as readonly BuffTimelineSegment[]).some(containsOwner)),
            );
      const row = displaySegment === undefined ? undefined : rows.lanes.get(displaySegment);
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
