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
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import { isUnattributedDamageReceipt } from '../../../core/projection/hitEffectProjection';

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
  // 状态和爆发已经承接的回执不再重复显示，其余缺少命中身份的伤害以 sequence 寻址。
  const represented = new Set(
    candidates.flatMap(candidate => candidate.group.map(hit => hit.sequence)),
  );
  const origins = new CombatObjectOrigins(entries);
  for (const entry of entries) {
    if (!represented.has(entry.sequence) && isUnattributedDamageReceipt(entry, origins)) {
      candidates.push({ group: [entry], row: rows.rowCount, standalone: true });
    }
  }
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

/** 将详情命中归属映射到总览的紧凑状态行；没有可见承接段的命中放在敌人条下沿。 */
export function layoutEnemyOverviewDamageHits(
  entries: readonly CombatReceiptEntry[],
  segments: readonly (BuffTimelineSegment & { lane: number })[],
  attachmentIds: ReadonlySet<string>,
  damageBuffs: readonly BuffTimelineSegment[],
  displayOwners: ReturnType<typeof projectBuffDamageDisplayOwners>,
  attachmentRow?: number,
) {
  const layout = layoutEnemyStatusRows(segments, [], attachmentIds);
  const compactRows = new Map(segments.map(segment => [layout.lanes.get(segment)!, segment.lane]));
  if (attachmentRow !== undefined) compactRows.set(layout.attachmentRow, attachmentRow);
  const fallbackRow = -1;
  const positioned = layoutEnemyDamageHits(
    entries,
    segments,
    [],
    attachmentIds,
    damageBuffs,
    displayOwners,
  ).map(hit => ({
    ...hit,
    row: hit.standalone ? fallbackRow : (compactRows.get(hit.row) ?? fallbackRow),
  }));
  const represented = new Set(positioned.flatMap(hit => hit.group.map(entry => entry.sequence)));
  for (const entry of entries) {
    if (entry.event === 'DamageApplied' && !represented.has(entry.sequence))
      positioned.push({ group: [entry], row: fallbackRow, standalone: true });
  }
  const merged = new Map<string, (typeof positioned)[number]>();
  for (const hit of positioned) {
    const first = hit.group[0]!;
    const key = JSON.stringify([first.targetId, first.frame, hit.row]);
    const existing = merged.get(key);
    if (existing) existing.group.push(...hit.group);
    else merged.set(key, { ...hit, group: [...hit.group] });
  }
  for (const hit of merged.values()) hit.group.sort((a, b) => a.sequence - b.sequence);
  return [...merged.values()];
}
