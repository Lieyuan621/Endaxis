import type { SourceSlot } from '@/simulation/engine/types';

// ─── FIFO source queue helpers ──────────────────────────────────────────────
// Retain a per-source breakdown while stacks accumulate from multiple appliers
// (capped, oldest trimmed first) so the consumed stacks can be attributed for LMDI.

/** Push stacks to a FIFO source queue, capping total at maxStacks by trimming oldest first. */
export function pushSourceQueue(
  queue: SourceSlot[],
  sourceId: string,
  count: number,
  maxStacks: number,
): void {
  const last = queue[queue.length - 1];
  if (last && last.sourceId === sourceId) {
    last.count += count;
  } else {
    queue.push({ sourceId, count });
  }
  let total = queue.reduce((s, slot) => s + slot.count, 0);
  while (total > maxStacks && queue.length > 0) {
    const oldest = queue[0];
    if (!oldest) break;
    const excess = total - maxStacks;
    if (oldest.count <= excess) {
      total -= oldest.count;
      queue.shift();
    } else {
      oldest.count -= excess;
      total = maxStacks;
    }
  }
}

/** Flatten a source queue into a sourceId → stacks map. */
export function consumeSourceQueue(queue: SourceSlot[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const slot of queue) {
    result[slot.sourceId] = (result[slot.sourceId] ?? 0) + slot.count;
  }
  return result;
}
