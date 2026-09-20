/** 连续组的选择资格和拖动范围；只整理释放实例，不解释技能的接续边界。 */
import type { ScenarioDocument } from '../../../core/project/schema';
import { getSkillCastPlacementChains } from '../../../core/project/skillCastPlacement';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

/** 输入被处理与技能成功开始分开记录，被拒绝的输入也已有确定的尝试时刻。 */
export function projectSkillCastInputFacts(entries: readonly CombatReceiptEntry[]): {
  readonly frames: ReadonlyMap<string, number>;
  readonly switchedToBuff: ReadonlySet<string>;
} {
  const frames = new Map<string, number>();
  const switchedToBuff = new Set<string>();
  for (const entry of entries) {
    const castId = entry.data?.castId;
    if (typeof castId !== 'string') continue;
    if (entry.event === 'SkillInputProcessed' && !frames.has(castId))
      frames.set(castId, entry.frame);
    if (entry.event === 'SkillSwitchedToBuff') switchedToBuff.add(castId);
  }
  return { frames, switchedToBuff };
}

/** 命中连线也必须核对所属释放，不能把旧固定排列的命中帧套到新组的预计位置。 */
export function projectCompatibleHitFrames(
  hits: readonly { readonly castId?: string; readonly hitId?: string; readonly frame: number }[],
  compatibleCastIds: ReadonlySet<string>,
): ReadonlyMap<string, number> {
  const frames = new Map<string, number>();
  for (const hit of hits) {
    if (
      hit.castId === undefined ||
      !compatibleCastIds.has(hit.castId) ||
      hit.hitId === undefined ||
      frames.has(hit.hitId)
    )
      continue;
    frames.set(hit.hitId, hit.frame);
  }
  return frames;
}

export type SkillCastGroupSelection =
  | { readonly ok: true; readonly castIds: ReadonlySet<string>; readonly alreadyGrouped: boolean }
  | {
      readonly ok: false;
      readonly reason: 'count' | 'mixed' | 'nonAdjacent' | 'locked' | 'partialGroup';
    };

export function resolveSkillCastGroupSelection(
  scenario: ScenarioDocument,
  selectedIds: ReadonlySet<string>,
  startFrames: ReadonlyMap<string, number>,
): SkillCastGroupSelection {
  if (selectedIds.size < 2) return { ok: false, reason: 'count' };
  const tracks = scenario.tracks.filter(track =>
    track?.skillCasts.some(cast => selectedIds.has(cast.id)),
  );
  const track = tracks[0];
  if (tracks.length !== 1 || track === null || track === undefined)
    return { ok: false, reason: 'mixed' };
  const selected = track.skillCasts.filter(cast => selectedIds.has(cast.id));
  if (selected.length !== selectedIds.size) return { ok: false, reason: 'mixed' };
  if (selected.some(cast => cast.presentation?.locked)) return { ok: false, reason: 'locked' };
  const allChains = getSkillCastPlacementChains(track.skillCasts);
  const chains = allChains.filter(chain => chain.casts.some(cast => selectedIds.has(cast.id)));
  if (chains.some(chain => chain.casts.some(cast => !selectedIds.has(cast.id))))
    return { ok: false, reason: 'partialGroup' };
  const ordered = allChains
    .flatMap(chain => chain.casts)
    .sort((a, b) => startFrames.get(a.id)! - startFrames.get(b.id)!);
  const first = ordered.findIndex(cast => selectedIds.has(cast.id));
  if (ordered.slice(first, first + selected.length).some(cast => !selectedIds.has(cast.id)))
    return { ok: false, reason: 'nonAdjacent' };
  return {
    ok: true,
    castIds: new Set(ordered.filter(cast => selectedIds.has(cast.id)).map(cast => cast.id)),
    alreadyGrouped: chains.length === 1,
  };
}

/** 移动任意成员时连同整条链移动；普通点击和删除仍保留成员级选择。 */
export function expandSkillCastGroupSelection(
  scenario: ScenarioDocument,
  selectedIds: ReadonlySet<string>,
): ReadonlySet<string> {
  const expanded = new Set(selectedIds);
  for (const track of scenario.tracks) {
    for (const chain of getSkillCastPlacementChains(track?.skillCasts ?? [])) {
      if (chain.casts.some(cast => selectedIds.has(cast.id)))
        for (const cast of chain.casts) expanded.add(cast.id);
    }
  }
  return expanded;
}

/** 组标记和成员共同使用这个位置；快模拟发布后立即采用新间距，只补尚未发布的整体位移。 */
export function projectMovingSkillCastStartFrames(
  starts: ReadonlyMap<string, number>,
  move: {
    readonly anchorId: string;
    readonly castIds: readonly string[];
    readonly baseStartFrames: ReadonlyMap<string, number>;
    readonly previewActualFrame: number;
  } | null,
): ReadonlyMap<string, number> {
  if (move === null) return starts;
  const anchor = starts.get(move.anchorId) ?? move.baseStartFrames.get(move.anchorId)!;
  const delta = move.previewActualFrame - anchor;
  const result = new Map(starts);
  for (const id of move.castIds) {
    const frame = starts.get(id) ?? move.baseStartFrames.get(id);
    if (frame !== undefined) result.set(id, frame + delta);
  }
  return result;
}

/** 建组、拆组、改成员后，旧固定排轴的同 ID 回执不能充当新连续组的执行事实。 */
export function matchingPublishedSkillCastIds(
  current: ScenarioDocument,
  published: ScenarioDocument | undefined,
): ReadonlySet<string> {
  const ids = new Set<string>();
  if (published === undefined) return ids;
  current.tracks.forEach((track, trackIndex) => {
    const previousChains = new Map(
      getSkillCastPlacementChains(published.tracks[trackIndex]?.skillCasts ?? []).map(
        chain => [chain.anchor.id, chain] as const,
      ),
    );
    for (const chain of getSkillCastPlacementChains(track?.skillCasts ?? [])) {
      const previous = previousChains.get(chain.anchor.id);
      if (
        previous?.casts.length === chain.casts.length &&
        previous.casts.every((cast, index) => cast.id === chain.casts[index]!.id)
      ) {
        chain.casts.forEach(cast => ids.add(cast.id));
      }
    }
  });
  return ids;
}
