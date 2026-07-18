import { describe, expect, it } from 'vitest';
import { pushSourceQueue, consumeSourceQueue } from './sourceQueue';
import type { SourceSlot } from '@/simulation/engine/types';

describe('sourceQueue', () => {
  it('keeps every stack and attributes per source when under the cap', () => {
    const q: SourceSlot[] = [];
    pushSourceQueue(q, 'A', 2, 4);
    pushSourceQueue(q, 'B', 1, 4);
    expect(consumeSourceQueue(q)).toEqual({ A: 2, B: 1 });
  });

  it('trims oldest first when total exceeds the cap (keeps newest stacks)', () => {
    const q: SourceSlot[] = [];
    pushSourceQueue(q, 'A', 2, 4);
    pushSourceQueue(q, 'B', 3, 4); // total 5 > 4 -> drop oldest A by 1
    expect(consumeSourceQueue(q)).toEqual({ A: 1, B: 3 });
  });

  it('merges consecutive stacks from the same source', () => {
    const q: SourceSlot[] = [];
    pushSourceQueue(q, 'A', 1, 10);
    pushSourceQueue(q, 'A', 2, 10);
    expect(q).toHaveLength(1);
    expect(consumeSourceQueue(q)).toEqual({ A: 3 });
  });
});
