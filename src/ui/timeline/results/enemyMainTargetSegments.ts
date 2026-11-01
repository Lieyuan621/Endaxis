import {
  selectMainEnemyTarget,
  type EnemyTargetSelection,
} from '../../../core/combat/enemies/enemyTargetSelection';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

/** 用实际生命周期回执和运行时相同的选目标规则投影主目标区间。 */
export function projectEnemyMainTargetSegments(
  entries: readonly CombatReceiptEntry[],
  selection: EnemyTargetSelection,
  startFrame: number,
  endFrame: number,
) {
  const events = entries
    .filter(entry => entry.event === 'EnemyLifecycleChanged')
    .sort((a, b) => a.frame - b.frame || a.sequence - b.sequence);
  const boundaries = [
    ...new Set([
      startFrame,
      endFrame,
      ...events.map(entry => entry.frame),
      ...selection.switches.map(marker => marker.frame),
    ]),
  ]
    .filter(frame => frame >= startFrame && frame <= endFrame)
    .sort((a, b) => a - b);
  const present = new Set<string>();
  const segments: { start: number; end: number; targetId: string | undefined }[] = [];
  let cursor = 0;
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i]!;
    const end = boundaries[i + 1]!;
    while (cursor < events.length && events[cursor]!.frame <= start) {
      const event = events[cursor++]!;
      if (event.targetId !== undefined) {
        if (event.data?.current === 'present') present.add(event.targetId);
        else present.delete(event.targetId);
      }
    }
    const targetId = selectMainEnemyTarget(selection, start, id => present.has(id));
    const previous = segments.at(-1);
    if (previous && previous.targetId === targetId) previous.end = end;
    else segments.push({ start, end, targetId });
  }
  return segments;
}
