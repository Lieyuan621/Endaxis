/** 编辑器临时选区的集合操作。键可以是时间轴对象引用，也可以是技能专属操作的投影 ID。 */

export interface TimelineActionSelection {
  readonly selectedIds: ReadonlySet<string>;
  readonly primaryId: string | null;
}

export function createEmptyTimelineActionSelection(): TimelineActionSelection {
  return { selectedIds: new Set(), primaryId: null };
}

export function selectTimelineAction(
  selection: TimelineActionSelection,
  skillCastId: string,
  additive: boolean,
): TimelineActionSelection {
  if (!additive) {
    if (selection.selectedIds.size === 1 && selection.selectedIds.has(skillCastId))
      return selection;
    return { selectedIds: new Set([skillCastId]), primaryId: skillCastId };
  }

  const selectedIds = new Set(selection.selectedIds);
  if (selectedIds.delete(skillCastId)) {
    const primaryId =
      selection.primaryId === skillCastId
        ? (selectedIds.values().next().value ?? null)
        : selection.primaryId;
    return { selectedIds, primaryId };
  }
  selectedIds.add(skillCastId);
  return { selectedIds, primaryId: skillCastId };
}
