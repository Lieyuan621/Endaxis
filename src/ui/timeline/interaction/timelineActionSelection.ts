/**
 * 管理时间轴动作的临时选择集合，并把批量删除作为一次编辑会话提交。
 * 选择状态只属于当前 UI 会话，不得写入存档、快照或导出数据。
 */
import type { ScenarioEditingSession } from '../../../application/editor/scenarioEditorSession';
import type { ScenarioDocument } from '../../../core/project/schema';
import { removeSkillCasts } from './timelineDocumentCommands';

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

export function reconcileTimelineActionSelection(
  selection: TimelineActionSelection,
  scenario: ScenarioDocument,
): TimelineActionSelection {
  const existingIds = new Set(
    scenario.tracks.flatMap(track => track?.skillCasts.map(cast => cast.id) ?? []),
  );
  const selectedIds = new Set([...selection.selectedIds].filter(id => existingIds.has(id)));
  if (selectedIds.size === selection.selectedIds.size) return selection;
  const primaryId =
    selection.primaryId !== null && selectedIds.has(selection.primaryId)
      ? selection.primaryId
      : (selectedIds.values().next().value ?? null);
  return { selectedIds, primaryId };
}

export function deleteSelectedTimelineActions(
  session: ScenarioEditingSession,
  selection: TimelineActionSelection,
): boolean {
  return session.commit('removeSkillCasts', scenario =>
    removeSkillCasts(scenario, selection.selectedIds),
  );
}
