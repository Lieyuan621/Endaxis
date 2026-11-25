import { expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { projectHideUiPlacementIntervals, snapSkillPlacementDelta } from './hideUiPlacement';

const event = (frame: number, active: boolean, sourceActionId = 'cast'): CombatReceiptEntry => ({
  sequence: frame,
  frame,
  time: frame / 30,
  event: 'UltimatePresentationChanged',
  sourceId: 'operator',
  data: { active, sourceActionId: 'skill-definition', sourceCastId: sourceActionId },
});

it('uses HideUI state changes and snaps to the first input frame after OnEnd', () => {
  const intervals = projectHideUiPlacementIntervals([event(10, true), event(20, false)]);
  expect(intervals).toEqual([{ startFrame: 10, endFrame: 21 }]);
  expect(snapSkillPlacementDelta([9], 0, intervals)).toBe(0);
  expect(snapSkillPlacementDelta([10], 0, intervals)).toBe(11);
  expect(snapSkillPlacementDelta([20], 0, intervals)).toBe(1);
  expect(snapSkillPlacementDelta([21], 0, intervals)).toBe(0);
});

it('preserves group spacing, skips consecutive intervals and respects movement bounds', () => {
  const intervals = [
    { startFrame: 10, endFrame: 21 },
    { startFrame: 21, endFrame: 31 },
  ];
  expect(snapSkillPlacementDelta([0, 15], 0, intervals)).toBe(31);
  expect(snapSkillPlacementDelta([15], 0, intervals, 15)).toBeNull();
  expect(snapSkillPlacementDelta([], 12, intervals)).toBe(12);
});

it('ignores the moved source and follows direct boolean writes rather than reference counting', () => {
  const entries = [
    event(1, true, 'first'),
    event(5, true, 'second'),
    event(10, false, 'first'),
    event(20, false, 'second'),
  ];
  expect(projectHideUiPlacementIntervals(entries)).toEqual([{ startFrame: 1, endFrame: 11 }]);
  expect(projectHideUiPlacementIntervals(entries, new Set(['first']))).toEqual([
    { startFrame: 5, endFrame: 21 },
  ]);
  expect(projectHideUiPlacementIntervals(entries, new Set(['first', 'second']))).toEqual([]);
});

it('does not invent a natural end for an interval still active at the simulation boundary', () => {
  expect(projectHideUiPlacementIntervals([event(5, true)])).toEqual([
    { startFrame: 5, endFrame: Infinity },
  ]);
  expect(snapSkillPlacementDelta([10], 0, [{ startFrame: 5, endFrame: Infinity }])).toBeNull();
});
