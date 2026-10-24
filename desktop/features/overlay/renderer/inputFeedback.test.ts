import { expect, it } from 'vitest';
import { matchFeedbackInput } from './inputFeedback';
import type { OverlayCast } from './plan';
const cast = (
  id: string,
  start: number,
  type: OverlayCast['type'],
  trackIndex: number,
): OverlayCast => ({
  id,
  start,
  end: start,
  type,
  trackIndex,
  trackId: String(trackIndex),
  operatorSlug: '',
  operatorName: '',
  avatar: '',
  portrait: '',
  skillIcon: '',
  name: '',
  element: 'physical',
  spCost: null,
  gaugeCost: 0,
  segments: 1,
});
it('consumes the combo queue one press at a time and ignores expired entries', () => {
  const casts = [
    cast('old', 9, 'comboSkill', 0),
    cast('first', 10, 'comboSkill', 1),
    cast('second', 10.1, 'comboSkill', 0),
  ];
  const input = { type: 'comboSkill' as const, at: 0 };
  const consumed = new Set<string>();
  expect(matchFeedbackInput(casts, input, 10.1, consumed)?.id).toBe('first');
  consumed.add('first');
  expect(matchFeedbackInput(casts, input, 10.1, consumed)?.id).toBe('second');
  consumed.add('second');
  expect(matchFeedbackInput(casts, input, 10.1, consumed)).toBeUndefined();
});
it('requires the correct operation and operator slot within the timing window', () => {
  const casts = [
    cast('skill', 10, 'battleSkill', 0),
    cast('ult', 10, 'ultimate', 1),
    cast('switch', 10, 'switch', 2),
  ];
  const consumed = new Set<string>();
  expect(
    matchFeedbackInput(casts, { type: 'battleSkill', trackIndex: 1, at: 0 }, 10, consumed),
  ).toBeUndefined();
  expect(
    matchFeedbackInput(casts, { type: 'ultimate', trackIndex: 1, at: 0 }, 10.251, consumed),
  ).toBeUndefined();
  expect(
    matchFeedbackInput(casts, { type: 'switch', trackIndex: 2, at: 0 }, 9.75, consumed)?.id,
  ).toBe('switch');
});

it('matches held attacks in order once each and respects the configured tolerance', () => {
  const casts = [
    cast('a1', 10, 'basicAttack', 0),
    { ...cast('heavy', 10.1, 'basicAttack', 0), heavyAttack: true },
    cast('dive', 10.2, 'dive', 1),
    cast('finisher', 10.3, 'finisher', 1),
  ];
  const consumed = new Set<string>();
  const input = { type: 'attack' as const, at: 0 };
  expect(matchFeedbackInput(casts, input, 9.8, consumed, 0.1)).toBeUndefined();
  for (const expected of ['a1', 'heavy', 'dive', 'finisher']) {
    const result = matchFeedbackInput(casts, input, 10, consumed, 0.5);
    expect(result?.id).toBe(expected);
    consumed.add(result!.id);
  }
  expect(matchFeedbackInput(casts, input, 10, consumed, 0.5)).toBeUndefined();
});
