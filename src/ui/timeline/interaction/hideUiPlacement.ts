import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

export interface HideUiPlacementInterval {
  readonly startFrame: number;
  /** 第一帧可以再次提交输入的位置。输入阶段先于 HideUI 的结束更新。 */
  readonly endFrame: number;
}

export function filterHideUiPlacementReceipts(
  entries: readonly CombatReceiptEntry[],
  compatibleCastIds: ReadonlySet<string>,
  inheritedFrame = -Infinity,
): readonly CombatReceiptEntry[] {
  return entries.filter(
    entry =>
      entry.event === 'UltimatePresentationChanged' &&
      (typeof entry.data?.sourceCastId !== 'string' ||
        compatibleCastIds.has(entry.data.sourceCastId) ||
        entry.frame < inheritedFrame),
  );
}

export function projectHideUiPlacementIntervals(
  entries: readonly CombatReceiptEntry[],
  excludedCastIds: ReadonlySet<string> = new Set(),
): readonly HideUiPlacementInterval[] {
  let startFrame: number | undefined;
  const result: HideUiPlacementInterval[] = [];
  for (const entry of entries) {
    if (entry.event !== 'UltimatePresentationChanged') continue;
    const source = entry.data?.sourceCastId;
    if (typeof source === 'string' && excludedCastIds.has(source)) continue;
    if (entry.data?.active === true) startFrame ??= entry.frame;
    else if (entry.data?.active === false && startFrame !== undefined) {
      result.push({ startFrame, endFrame: entry.frame + 1 });
      startFrame = undefined;
    }
  }
  // 尚未观测到结束时禁止吸附穿过，不把模拟终止线误当作隐藏结束。
  if (startFrame !== undefined) result.push({ startFrame, endFrame: Infinity });
  return result;
}

/** 整体右移至所有技能起点均不落在隐藏区间，保持组内相对位置；标记不单独参与判定。 */
export function snapSkillPlacementDelta(
  starts: readonly number[],
  requestedDelta: number,
  intervals: readonly HideUiPlacementInterval[],
  maximumDelta = Infinity,
): number | null {
  let delta = requestedDelta;
  for (;;) {
    let next = delta;
    for (const start of starts)
      for (const interval of intervals)
        if (start + delta >= interval.startFrame && start + delta < interval.endFrame)
          next = Math.max(next, interval.endFrame - start);
    if (!Number.isFinite(next) || next > maximumDelta) return null;
    if (next === delta) return delta;
    delta = next;
  }
}
