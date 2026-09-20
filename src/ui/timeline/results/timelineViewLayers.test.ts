import { describe, expect, it } from 'vitest';
import {
  createDefaultTimelineViewLayers,
  normalizeTimelineViewLayers,
  toggleTimelineViewLayerState,
} from './timelineViewLayers';

describe('timeline view layers', () => {
  it('defaults every implemented layer to visible and preserves forward-compatible settings', () => {
    expect(Object.values(createDefaultTimelineViewLayers()).every(Boolean)).toBe(true);
    expect(normalizeTimelineViewLayers({ hitMarkers: false, unknown: false })).toMatchObject({
      hitMarkers: false,
      upperEffects: true,
      lowerBuffs: true,
      skillErrors: true,
      comboWindows: true,
      effectLinks: true,
    });
  });

  it('toggles immutably', () => {
    const original = createDefaultTimelineViewLayers();
    const updated = toggleTimelineViewLayerState(original, 'gauge');
    expect(updated.gauge).toBe(false);
    expect(original.gauge).toBe(true);
    expect(toggleTimelineViewLayerState(original, 'skillErrors').skillErrors).toBe(false);
  });
});
