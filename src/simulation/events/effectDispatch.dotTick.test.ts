import { describe, expect, it } from 'vitest';
import { scheduleDotTicks } from './effectDispatch';
import type { ResolvedDamageOverTimeEffect } from '@/data/types';
import type { SimulationContext } from '@/simulation/engine/SimulationContext';

describe('scheduleDotTicks', () => {
  it('emits DOT_TICK ticks with no skillType but preserves skillId', () => {
    const enqueued: Array<{ type: string; payload: Record<string, unknown> }> = [];
    const ctx = {
      getShiftedTime: (t: number, o: number) => t + o,
      getAction: () => undefined,
      consumedStacksWriteKeys: new Set<string>(),
      queue: {
        enqueue: (e: unknown) =>
          enqueued.push(e as { type: string; payload: Record<string, unknown> }),
        cancel: () => {},
      },
    } as unknown as SimulationContext;

    const r = {
      kind: 'damageOverTime',
      id: 'burn',
      multiplier: 100,
      interval: 1,
      duration: 2,
      element: 'heat',
    } as unknown as ResolvedDamageOverTimeEffect;

    scheduleDotTicks(r, 0, 'track1', ctx, 'action1', 'skill1');

    const ticks = enqueued.filter(e => e.type === 'DOT_TICK');
    expect(ticks.length).toBeGreaterThan(0);
    for (const e of ticks) {
      expect(e.payload.skillType).toBeUndefined();
      expect(e.payload.skillId).toBe('skill1');
      expect(e.payload.actionId).toBe('action1');
    }
  });

  it('splits multiplier detail with a split-mode DoT', () => {
    const enqueued: Array<{ type: string; payload: Record<string, any> }> = [];
    const ctx = {
      getShiftedTime: (t: number, o: number) => t + o,
      getAction: () => undefined,
      getOperatorEffects: () => ({
        getStacks: (key: string) => (key === 'dot-stack' ? 2 : 0),
      }),
      consumedStacksWriteKeys: new Set<string>(),
      queue: {
        enqueue: (e: unknown) => enqueued.push(e as { type: string; payload: Record<string, any> }),
        cancel: () => {},
      },
    } as unknown as SimulationContext;
    const r = {
      kind: 'damageOverTime',
      id: 'scaled-dot',
      multiplier: 120,
      multiplierScaling: {
        additive: [{ key: 'dot-stack', target: 'self', coefficient: 15 }],
      },
      multiplierMode: 'split',
      interval: 1,
      duration: 2,
      element: 'heat',
    } as unknown as ResolvedDamageOverTimeEffect;

    scheduleDotTicks(r, 0, 'track1', ctx);

    const tick = enqueued.find(e => e.type === 'DOT_TICK')!;
    expect(tick.payload.multiplier).toBe(50);
    expect(tick.payload.multiplierDetail).toMatchObject({
      base: 40,
      sources: [{ kind: 'stack', value: 10, stacks: 2, coefficient: 5 }],
    });
  });
});
