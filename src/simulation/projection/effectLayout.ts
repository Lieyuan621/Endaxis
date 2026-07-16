// ─── Shared effect layout engine ─────────────────────────────────────────────
//
// Used by both operator effect tracks and enemy status tracks.
// Each track provides its own group enum and segment type; this module handles
// the generic sub-row assignment, compaction, and positioning.

export const ROW_HEIGHT = 24;

/** Minimum fields the layout engine needs from a segment. */
interface EffectSegmentBase {
  typeKey: string;
  group: number;
  start: number;
  end: number;
  /** Optional affinity key — segments with the same stat reuse the same sub-row when possible. */
  stat?: string;
}

export interface EffectLayout<S extends EffectSegmentBase> {
  positionedSegments: (S & { subRow: number; y: number })[];
  totalHeight: number;
  groupHeights: number[];
}

/** Build a byTypeKey index from a flat segment array. */
export function buildByTypeKey<S extends { typeKey: string }>(segments: S[]): Map<string, S[]> {
  const map = new Map<string, S[]>();
  for (const seg of segments) {
    const list = map.get(seg.typeKey) ?? [];
    list.push(seg);
    map.set(seg.typeKey, list);
  }
  return map;
}

/**
 * Generic layout engine: assigns sub-rows to each typeKey within its group,
 * computes heights and offsets, and returns positioned segments.
 *
 * @param byTypeKey          Grouped segments map
 * @param groupCount         Number of groups in the enum
 * @param statAffinityGroup  Group index where same-stat slot affinity applies (-1 = none)
 */
export function layoutEffects<S extends EffectSegmentBase>(
  byTypeKey: Map<string, S[]>,
  groupCount: number,
  statAffinityGroup = -1,
): EffectLayout<S> {
  // 1. Collect info per type key
  interface TypeKeyInfo {
    typeKey: string;
    group: number;
    firstStart: number;
    lastEnd: number;
    stat?: string;
    segments: S[];
  }
  interface SubRowSlot {
    index: number;
    freedAt: number;
    stat?: string;
  }

  const typeKeyInfos = new Map<string, TypeKeyInfo>();
  for (const [typeKey, segments] of byTypeKey) {
    if (segments.length === 0) continue;
    const first = segments[0];
    if (!first) continue;
    let firstStart = Infinity,
      lastEnd = -Infinity;
    for (const s of segments) {
      if (s.start < firstStart) firstStart = s.start;
      if (s.end > lastEnd) lastEnd = s.end;
    }
    typeKeyInfos.set(typeKey, {
      typeKey,
      group: first.group,
      firstStart,
      lastEnd,
      stat: first.stat,
      segments,
    });
  }

  // 2. Group by enum value
  const groups: TypeKeyInfo[][] = Array.from({ length: groupCount }, (): TypeKeyInfo[] => []);
  for (const info of typeKeyInfos.values()) {
    const group = groups[info.group];
    if (group) group.push(info);
  }

  // 3. Sort each group by first appearance
  for (const group of groups) group.sort((a, b) => a.firstStart - b.firstStart);

  // 4. Assign sub-rows with slot compaction (+ optional stat affinity)
  const subRowAssignments = new Map<string, number>();
  for (let g = 0; g < groupCount; g++) {
    const slots: SubRowSlot[] = [];
    for (const info of groups[g] ?? []) {
      let assignedIndex = -1;
      const freedSlots = slots.filter(s => s.freedAt <= info.firstStart);

      if (freedSlots.length > 0) {
        // Same-stat affinity: prefer reusing the slot that had the same stat
        if (g === statAffinityGroup && info.stat) {
          const sameStatSlot = freedSlots.find(s => s.stat === info.stat);
          if (sameStatSlot) {
            assignedIndex = sameStatSlot.index;
            sameStatSlot.freedAt = info.lastEnd;
            sameStatSlot.stat = info.stat;
          }
        }
        if (assignedIndex === -1) {
          let best = freedSlots[0];
          if (!best) continue;
          for (let i = 1; i < freedSlots.length; i++) {
            const candidate = freedSlots[i];
            if (candidate && candidate.index < best.index) best = candidate;
          }
          assignedIndex = best.index;
          best.freedAt = info.lastEnd;
          best.stat = info.stat;
        }
      }

      if (assignedIndex === -1) {
        assignedIndex = slots.length;
        slots.push({ index: assignedIndex, freedAt: info.lastEnd, stat: info.stat });
      }
      subRowAssignments.set(info.typeKey, assignedIndex);
    }
  }

  // 5. Group heights
  const groupHeights = Array.from({ length: groupCount }, () => 0);
  for (let g = 0; g < groupCount; g++) {
    const group = groups[g] ?? [];
    if (group.length === 0) continue;
    let maxSubRow = 0;
    for (const info of group) {
      const sr = subRowAssignments.get(info.typeKey)!;
      if (sr > maxSubRow) maxSubRow = sr;
    }
    groupHeights[g] = (maxSubRow + 1) * ROW_HEIGHT;
  }

  // 6. Cumulative group y offsets
  const groupOffsets = Array.from({ length: groupCount }, () => 0);
  for (let g = 1; g < groupCount; g++) {
    groupOffsets[g] = (groupOffsets[g - 1] ?? 0) + (groupHeights[g - 1] ?? 0);
  }

  // 7. Position every segment
  const positionedSegments: (S & { subRow: number; y: number })[] = [];
  for (const [typeKey, segments] of byTypeKey) {
    const info = typeKeyInfos.get(typeKey);
    if (!info) continue;
    const subRow = subRowAssignments.get(typeKey)!;
    const y = (groupOffsets[info.group] ?? 0) + subRow * ROW_HEIGHT;
    for (const seg of segments) positionedSegments.push({ ...seg, subRow, y });
  }

  const totalHeight = (groupOffsets[groupCount - 1] ?? 0) + (groupHeights[groupCount - 1] ?? 0);
  return { positionedSegments, totalHeight, groupHeights };
}
