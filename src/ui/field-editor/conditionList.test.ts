import { expect, it } from 'vitest';
import type { CombatCondition } from '../../../packages/game-data-contract/src/conditions';
import { appendCondition, moveCondition, removeCondition } from './conditionList';

it('appends only an explicitly chosen boolean and never changes existing nested expressions', () => {
  const expression = Object.freeze({
    kind: 'not' as const,
    condition: Object.freeze({ kind: 'constant' as const, value: true }),
  });
  const original = Object.freeze([expression]);
  const next = appendCondition(original, false);
  expect(next).toEqual([expression, { kind: 'constant', value: false }]);
  expect(next[0]).toBe(expression);
  expect(original).toHaveLength(1);
  for (const invalid of [undefined, null, 0, '', 'false'])
    expect(() => appendCondition(original, invalid as unknown as boolean)).toThrow('explicit');
});

it('only explicitly reorders selected slots, retaining duplicates and source reference identities', () => {
  const source = Object.freeze({ kind: 'conditionNode' as const, nodeId: 'shared' });
  const effect = Object.freeze({
    kind: 'probability' as const,
    probability: Object.freeze({ kind: 'constant' as const, value: 0.5 }),
  });
  const original: readonly CombatCondition[] = Object.freeze([source, effect, source]);
  const moved = moveCondition(original, 1, 0);
  expect(moved).toEqual([effect, source, source]);
  expect(moved[0]).toBe(effect);
  expect(moved[1]).toBe(source);
  expect(moved[2]).toBe(source);
  const removed = removeCondition(moved, 1);
  expect(removed).toEqual([effect, source]);
  expect(removed[1]).toBe(source);
  expect(original).toEqual([source, effect, source]);
  expect(moveCondition(original, 0, 0)).toBe(original);
  expect(removeCondition([source], 0)).toEqual([]);
});

it('rejects nonexistent and fractional indexes without modifying the source list', () => {
  const original = Object.freeze([{ kind: 'constant' as const, value: false }]);
  for (const index of [-1, 1, 0.5, NaN]) {
    expect(() => removeCondition(original, index)).toThrow('index');
    expect(() => moveCondition(original, index, 0)).toThrow('index');
    expect(() => moveCondition(original, 0, index)).toThrow('index');
  }
  expect(original).toEqual([{ kind: 'constant', value: false }]);
});
