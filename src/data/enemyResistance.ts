import type { DamageElement } from './types';

export const DAMAGE_ELEMENTS: DamageElement[] = ['physical', 'heat', 'cryo', 'electric', 'nature'];

export type EnemyResistance = Record<DamageElement, number>;

export function createDefaultEnemyResistance(): EnemyResistance {
  return {
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 0,
    nature: 0,
  };
}

export function normalizeEnemyResistance(value: unknown): EnemyResistance {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const defaults = createDefaultEnemyResistance();
  const out = { ...defaults };

  for (const element of DAMAGE_ELEMENTS) {
    const num = Number(source[element]);
    out[element] = Number.isFinite(num) ? Math.max(0, num) : defaults[element];
  }

  return out;
}