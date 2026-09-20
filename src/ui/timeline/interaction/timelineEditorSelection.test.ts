import { describe, expect, it } from 'vitest';
import {
  clearTimelineEditorSelection,
  createTimelineEditorSelection,
  selectTimelineActionsIdentity,
  selectTimelineMarkerIdentity,
  selectTimelineTrackIdentity,
} from './timelineEditorSelection';

describe('timeline editor selection', () => {
  it('keeps the active placement track when the visible selection is cleared', () => {
    const track = selectTimelineTrackIdentity(createTimelineEditorSelection(0), 2);
    const cleared = clearTimelineEditorSelection(track);

    expect(track.primary).toEqual({ kind: 'track', trackIndex: 2 });
    expect(cleared.activeTrackIndex).toBe(2);
    expect(cleared.primary).toEqual({ kind: 'track', trackIndex: 2 });
  });

  it('makes tracks, action sets and marker kinds mutually exclusive', () => {
    const actions = selectTimelineActionsIdentity(createTimelineEditorSelection(0), {
      selectedIds: new Set(['cast:1', 'cast:2']),
      primaryId: 'cast:2',
    });
    const marker = selectTimelineMarkerIdentity(actions, 'controlSwitch', 'switch:1');
    const track = selectTimelineTrackIdentity(marker, 3);

    expect(actions.primary).toEqual({ kind: 'actions' });
    expect(marker.primary).toEqual({
      kind: 'marker',
      markerKind: 'controlSwitch',
      id: 'switch:1',
    });
    expect(marker.actions.selectedIds.size).toBe(0);
    expect(track.primary).toEqual({ kind: 'track', trackIndex: 3 });
  });

  it('returns to the active track when the last selected action is toggled off', () => {
    const current = createTimelineEditorSelection(1, {
      selectedIds: new Set(['cast:1']),
      primaryId: 'cast:1',
    });
    const empty = selectTimelineActionsIdentity(current, {
      selectedIds: new Set(),
      primaryId: null,
    });

    expect(empty.activeTrackIndex).toBe(1);
    expect(empty.primary).toEqual({ kind: 'track', trackIndex: 1 });
  });
});
