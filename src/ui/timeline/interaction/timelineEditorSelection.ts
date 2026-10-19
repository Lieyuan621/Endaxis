import type { TrackIndex } from '../../../core/project/schema';
import {
  createEmptyTimelineActionSelection,
  selectTimelineAction,
  type TimelineActionSelection,
} from './timelineActionSelection';
import { timelineItemKey, type TimelineItem, type TimelineMarkerKind } from './timelineItems';
export type { TimelineMarkerKind } from './timelineItems';

/** 只有一个编辑选区。轨道是放置上下文，主选对象只决定检查器内容。 */
export interface TimelineEditorSelection {
  readonly activeTrackIndex: TrackIndex;
  readonly items: TimelineActionSelection;
  readonly trackSelected: boolean;
}
export function createTimelineEditorSelection(
  activeTrackIndex: TrackIndex,
  skills: TimelineActionSelection = createEmptyTimelineActionSelection(),
): TimelineEditorSelection {
  return selectTimelineActionsIdentity(
    { activeTrackIndex, items: createEmptyTimelineActionSelection(), trackSelected: false },
    skills,
  );
}
export function selectTimelineTrackIdentity(
  selection: TimelineEditorSelection,
  trackIndex: TrackIndex,
): TimelineEditorSelection {
  return {
    ...clearTimelineEditorSelection(selection),
    activeTrackIndex: trackIndex,
    trackSelected: true,
  };
}
export function selectTimelineActionsIdentity(
  selection: TimelineEditorSelection,
  skills: TimelineActionSelection,
  activeTrackIndex = selection.activeTrackIndex,
): TimelineEditorSelection {
  return {
    activeTrackIndex,
    trackSelected: false,
    items: {
      selectedIds: new Set(
        [...skills.selectedIds].map(id => timelineItemKey({ kind: 'skill', id })),
      ),
      primaryId:
        skills.primaryId === null ? null : timelineItemKey({ kind: 'skill', id: skills.primaryId }),
    },
  };
}
export function selectTimelineMarkerIdentity(
  selection: TimelineEditorSelection,
  kind: TimelineMarkerKind,
  id: string,
): TimelineEditorSelection {
  return {
    ...selection,
    trackSelected: false,
    items: selectTimelineAction(selection.items, timelineItemKey({ kind, id }), false),
  };
}
export function clearTimelineEditorSelection(
  selection: TimelineEditorSelection,
): TimelineEditorSelection {
  return { ...selection, items: createEmptyTimelineActionSelection(), trackSelected: false };
}
export function selectTimelineItem(
  selection: TimelineEditorSelection,
  item: TimelineItem,
  additive = false,
  preserve = false,
): TimelineEditorSelection {
  const items =
    preserve && selection.items.selectedIds.has(item.key)
      ? { ...selection.items, primaryId: item.key }
      : selectTimelineAction(selection.items, item.key, additive && item.multiple);
  return {
    activeTrackIndex: item.trackIndex ?? selection.activeTrackIndex,
    trackSelected: false,
    items,
  };
}
/** 范围选择只包含轨道上的可多选输入，不包含全局边界或模拟投影。 */
export function selectTimelineItemRange(
  items: ReadonlyMap<string, TimelineItem>,
  scope: 'group' | 'track' | 'all',
  anchor?: TimelineItem,
  trackIndex = anchor?.trackIndex,
): TimelineActionSelection {
  const selectedIds = new Set(
    [...items.values()]
      .filter(item => {
        if (!item.multiple || item.trackIndex === undefined) return false;
        if (scope === 'all') return true;
        if (item.trackIndex !== trackIndex) return false;
        return scope === 'track' || item.moveAnchor === anchor?.moveAnchor;
      })
      .map(item => item.key),
  );
  return {
    selectedIds,
    primaryId:
      anchor && selectedIds.has(anchor.key)
        ? anchor.key
        : (selectedIds.values().next().value ?? null),
  };
}

export function selectedTimelineSkills(
  selection: TimelineActionSelection,
  items: ReadonlyMap<string, TimelineItem>,
): TimelineActionSelection {
  const skills = [...selection.selectedIds].flatMap(key => {
    const item = items.get(key);
    return item?.ref.kind === 'skill' ? [item.ref.id] : [];
  });
  const primary = selection.primaryId === null ? undefined : items.get(selection.primaryId);
  return {
    selectedIds: new Set(skills),
    primaryId: primary?.ref.kind === 'skill' ? primary.ref.id : null,
  };
}
export function reconcileTimelineItems(
  selection: TimelineEditorSelection,
  items: ReadonlyMap<string, TimelineItem>,
): TimelineEditorSelection {
  const selectedIds = new Set([...selection.items.selectedIds].filter(key => items.has(key)));
  if (selectedIds.size === selection.items.selectedIds.size) return selection;
  return {
    ...selection,
    items: {
      selectedIds,
      primaryId:
        selection.items.primaryId !== null && selectedIds.has(selection.items.primaryId)
          ? selection.items.primaryId
          : (selectedIds.values().next().value ?? null),
    },
  };
}
