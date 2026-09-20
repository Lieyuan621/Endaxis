import { describe, expect, it } from 'vitest';
import {
  createDefaultTimelineOperatorEffectsVisibility,
  normalizeTimelineOperatorEffectsVisibility,
  toggleTimelineOperatorEffectsVisibility,
} from './timelineOperatorEffectsVisibility';

describe('timeline operator effects visibility', () => {
  it('defaults every track to visible and normalizes partial preferences', () => {
    expect(createDefaultTimelineOperatorEffectsVisibility()).toEqual([true, true, true, true]);
    expect(normalizeTimelineOperatorEffectsVisibility([false, true])).toEqual([
      false,
      true,
      true,
      true,
    ]);
    expect(normalizeTimelineOperatorEffectsVisibility({ 0: false })).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it('toggles one track without mutating the previous preference', () => {
    const original = createDefaultTimelineOperatorEffectsVisibility();
    const updated = toggleTimelineOperatorEffectsVisibility(original, 2);
    expect(updated).toEqual([true, true, false, true]);
    expect(original).toEqual([true, true, true, true]);
  });
});
