import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { TrackDocument } from '../../../core/project/schema';
import { findAdjacentOccupiedTrack } from './timelineTrackSelection';

function occupiedTrack(trackId: string): TrackDocument {
  return {
    id: trackId,
    operator: {
      operatorSlug: 'perlica',
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: {},
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
}

describe('findAdjacentOccupiedTrack', () => {
  it('skips empty tracks and wraps in both directions', () => {
    const scenario = createEmptyScenario('scenario:tracks', '轨道切换');
    scenario.tracks[0] = occupiedTrack('track:0');
    scenario.tracks[2] = occupiedTrack('track:2');

    expect(findAdjacentOccupiedTrack(scenario.tracks, 0, 1)).toBe(2);
    expect(findAdjacentOccupiedTrack(scenario.tracks, 2, 1)).toBe(0);
    expect(findAdjacentOccupiedTrack(scenario.tracks, 0, -1)).toBe(2);
  });

  it('keeps the only occupied track selected and reports an all-empty team', () => {
    const scenario = createEmptyScenario('scenario:tracks', '轨道切换');
    scenario.tracks[1] = occupiedTrack('track:1');

    expect(findAdjacentOccupiedTrack(scenario.tracks, 1, 1)).toBe(1);
    scenario.tracks[1] = null;
    expect(findAdjacentOccupiedTrack(scenario.tracks, 1, 1)).toBeNull();
  });
});
