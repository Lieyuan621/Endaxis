import { describe, it, expect } from 'vitest';
import { scheduleDotTicks } from '@/simulation/events/effectDispatch';
import type { ResolvedDamageOverTimeEffect } from '@/data/types';
import type { SimulationContext } from '@/simulation/engine/SimulationContext';

// A DoT effect may opt into a skillType so its ticks are treated as that skill's damage
// (inheriting skill-type-scoped modifiers + the link bonus). Omitted = skill-type-agnostic ticks.
function captureTicks(dot: ResolvedDamageOverTimeEffect) {
  const events: any[] = [];
  const ctx = {
    getShiftedTime: (t: number, o: number) => t + o,
    getAction: () => undefined,
    consumedStacksWriteKeys: new Set<string>(),
    queue: { enqueue: (e: any) => events.push(e), cancel: () => {} },
  } as unknown as SimulationContext;
  scheduleDotTicks(dot, 0, 'A', ctx, 'act1', 'src-skill');
  return events.filter(e => e.type === 'DOT_TICK');
}

const baseDot = {
  kind: 'damageOverTime',
  id: 'dot',
  element: 'cryo',
  multiplier: 100,
  interval: 1,
  duration: 2,
} as unknown as ResolvedDamageOverTimeEffect;

describe('damageOverTime opt-in skillType propagates to ticks', () => {
  it('tags ticks with the effect skillType when set (so link + skill-scoped buffs apply)', () => {
    const ticks = captureTicks({ ...baseDot, skillType: 'ultimate' });
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.every(t => t.payload.skillType === 'ultimate')).toBe(true);
  });

  it('leaves ticks skill-type-agnostic when skillType is omitted (default)', () => {
    const ticks = captureTicks(baseDot);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.every(t => t.payload.skillType === undefined)).toBe(true);
  });
});
