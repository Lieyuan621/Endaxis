import { describe, expect, it } from 'vitest';
import { resolveDurationBarColor } from './sourceGroupBarColors';
import { FALLBACK_EFFECT_COLOR } from '@/utils/theme';
import type { Effect } from '@/data/types';

function statusEffect(partial: Partial<Effect> & { id?: string; name?: string }): Effect {
  return {
    kind: 'status',
    target: { scope: 'self' },
    ...partial,
  } as Effect;
}

describe('resolveDurationBarColor', () => {
  it('uses neutral fallback when coloring is disabled', () => {
    const effect = statusEffect({
      id: 'atk_up',
      sourceGroup: 'weapon',
      stat: { atkPercent: 0.1 },
    });
    const anomaly = { kind: 'infliction', element: 'heat' } as Effect;
    const colored = resolveDurationBarColor({
      effect,
      enabled: true,
      saturation: 50,
      sources: { weapon: true },
    });
    const plain = resolveDurationBarColor({ effect, enabled: false });
    const plainAnomaly = resolveDurationBarColor({ effect: anomaly, enabled: false });
    expect(plain.toLowerCase()).toBe(FALLBACK_EFFECT_COLOR.toLowerCase());
    expect(plainAnomaly.toLowerCase()).toBe(FALLBACK_EFFECT_COLOR.toLowerCase());
    expect(plain).not.toBe(colored);
  });

  it('keeps weapon and gearSet bars distinct when those sources are on', () => {
    const weaponA = resolveDurationBarColor({
      effect: statusEffect({ id: 'w_a', sourceGroup: 'weapon' }),
      enabled: true,
      saturation: 50,
      sources: { weapon: true },
    });
    const weaponB = resolveDurationBarColor({
      effect: statusEffect({ id: 'w_b', sourceGroup: 'weapon' }),
      enabled: true,
      saturation: 50,
      sources: { weapon: true },
    });
    const gear = resolveDurationBarColor({
      effect: statusEffect({ id: 'g_a', sourceGroup: 'gearSet' }),
      enabled: true,
      saturation: 50,
      sources: { gearSet: true },
    });

    expect(weaponA).not.toBe(weaponB);
    expect(weaponA.toLowerCase()).not.toBe(FALLBACK_EFFECT_COLOR.toLowerCase());
    expect(gear.toLowerCase()).not.toBe(FALLBACK_EFFECT_COLOR.toLowerCase());
    expect(gear).not.toBe(weaponA);
    expect(
      resolveDurationBarColor({
        effect: statusEffect({ id: 'w_a', sourceGroup: 'weapon' }),
        enabled: true,
        saturation: 50,
        sources: { weapon: true },
      }),
    ).toBe(weaponA);
  });

  it('respects per-source toggles, saturation, and lightness', () => {
    const effect = statusEffect({ id: 'w_sat', sourceGroup: 'weapon' });
    const high = resolveDurationBarColor({
      effect,
      enabled: true,
      saturation: 100,
      lightness: 100,
      sources: { weapon: true },
    });
    const lowSat = resolveDurationBarColor({
      effect,
      enabled: true,
      saturation: 20,
      lightness: 100,
      sources: { weapon: true },
    });
    const lowLit = resolveDurationBarColor({
      effect,
      enabled: true,
      saturation: 100,
      lightness: 40,
      sources: { weapon: true },
    });
    const offSource = resolveDurationBarColor({
      effect,
      enabled: true,
      saturation: 100,
      lightness: 100,
      sources: { weapon: false },
    });
    expect(high).not.toBe(lowSat);
    expect(high).not.toBe(lowLit);
    expect(offSource).not.toBe(high);
  });

  it('tints anomaly type colors when anomaly source is on', () => {
    const effect = {
      kind: 'infliction',
      element: 'heat',
    } as Effect;
    const on = resolveDurationBarColor({
      effect,
      enabled: true,
      saturation: 50,
      lightness: 90,
      sources: { anomaly: true, weapon: false, gearSet: false, operator: false },
    });
    const off = resolveDurationBarColor({
      effect,
      enabled: true,
      saturation: 50,
      lightness: 90,
      sources: { anomaly: false, weapon: false, gearSet: false, operator: false },
    });
    expect(off.toLowerCase()).toBe(FALLBACK_EFFECT_COLOR.toLowerCase());
    expect(on.toLowerCase()).not.toBe(FALLBACK_EFFECT_COLOR.toLowerCase());
    expect(on).not.toBe(off);
  });

  it('does not apply operator dyeing to weapon/gear when those sources are off', () => {
    const effect = statusEffect({ id: 'w_plain', sourceGroup: 'weapon' });
    const typeColor = resolveDurationBarColor({
      effect,
      enabled: true,
      sources: { weapon: false, operator: false },
    });
    const weaponOffOperatorOn = resolveDurationBarColor({
      effect,
      enabled: true,
      saturation: 50,
      lightness: 90,
      sources: { weapon: false, gearSet: false, operator: true, anomaly: true },
    });
    expect(weaponOffOperatorOn).toBe(typeColor);
  });
});
