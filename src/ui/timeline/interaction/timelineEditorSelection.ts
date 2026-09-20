import type { TrackIndex } from '../../../core/project/schema';
import {
  createEmptyTimelineActionSelection,
  type TimelineActionSelection,
} from './timelineActionSelection';

export type TimelineMarkerKind =
  | 'cycleBoundary'
  | 'controlSwitch'
  | 'externalEvent'
  | 'dodge'
  | 'simulationStart'
  | 'simulationEnd';

export type TimelinePrimarySelection =
  | { readonly kind: 'track'; readonly trackIndex: TrackIndex }
  | { readonly kind: 'actions' }
  | {
      readonly kind: 'marker';
      readonly markerKind: TimelineMarkerKind;
      readonly id: string;
    };

/**
 * 时间轴唯一的选择状态。
 *
 * `activeTrackIndex` 是技能库和放置上下文，即使点击空白清除 Inspector 选区也不会丢失；
 * `primary` 则是互斥的可视选择身份。动作保留自己的多选集合，但只在 primary=actions 时生效；
 * 清空临时选区后回到活动轨道，让技能库的放置目标仍然可见。
 */
export interface TimelineEditorSelection {
  readonly activeTrackIndex: TrackIndex;
  readonly actions: TimelineActionSelection;
  readonly primary: TimelinePrimarySelection;
}

export function createTimelineEditorSelection(
  activeTrackIndex: TrackIndex,
  actions: TimelineActionSelection = createEmptyTimelineActionSelection(),
): TimelineEditorSelection {
  return {
    activeTrackIndex,
    actions,
    primary:
      actions.selectedIds.size > 0
        ? { kind: 'actions' }
        : { kind: 'track', trackIndex: activeTrackIndex },
  };
}

export function selectTimelineTrackIdentity(
  _selection: TimelineEditorSelection,
  trackIndex: TrackIndex,
): TimelineEditorSelection {
  return {
    activeTrackIndex: trackIndex,
    actions: createEmptyTimelineActionSelection(),
    primary: { kind: 'track', trackIndex },
  };
}

export function selectTimelineActionsIdentity(
  selection: TimelineEditorSelection,
  actions: TimelineActionSelection,
  activeTrackIndex: TrackIndex = selection.activeTrackIndex,
): TimelineEditorSelection {
  return {
    activeTrackIndex,
    actions,
    primary:
      actions.selectedIds.size > 0
        ? { kind: 'actions' }
        : { kind: 'track', trackIndex: activeTrackIndex },
  };
}

export function selectTimelineMarkerIdentity(
  selection: TimelineEditorSelection,
  markerKind: TimelineMarkerKind,
  id: string,
): TimelineEditorSelection {
  return {
    activeTrackIndex: selection.activeTrackIndex,
    actions: createEmptyTimelineActionSelection(),
    primary: { kind: 'marker', markerKind, id },
  };
}

export function clearTimelineEditorSelection(
  selection: TimelineEditorSelection,
): TimelineEditorSelection {
  return {
    activeTrackIndex: selection.activeTrackIndex,
    actions: createEmptyTimelineActionSelection(),
    primary: { kind: 'track', trackIndex: selection.activeTrackIndex },
  };
}
