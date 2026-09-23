import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { PROJECT_FPS } from '../../../core/project/schema';
import type { TimelineTimeDilationBand } from '../../../core/projection/timelineDisplayTime';

interface PreviewBandFact {
  readonly band: TimelineTimeDilationBand;
  readonly slot: string;
  readonly priority: number;
  readonly naturalEndFrame: number;
  readonly sequence: number;
}

/** 回执只在模拟发布时解析一次；拖动时不遍历整份战斗日志。 */
export function prepareTimeDilationDragPreview(
  entries: readonly CombatReceiptEntry[],
  bands: readonly TimelineTimeDilationBand[],
  simulationEndFrame: number,
): readonly PreviewBandFact[] {
  const starts = new Map<number, CombatReceiptEntry>();
  const ends = new Map<number, CombatReceiptEntry>();
  const rejected: CombatReceiptEntry[] = [];
  for (const entry of entries) {
    if (
      entry.event !== 'TimeDilationStarted' &&
      entry.event !== 'TimeDilationEnded' &&
      entry.event !== 'TimeDilationRejected'
    )
      continue;
    const id = entry.data?.instanceId;
    if (typeof id !== 'number') continue;
    if (entry.event === 'TimeDilationStarted') starts.set(id, entry);
    else if (entry.event === 'TimeDilationEnded') ends.set(id, entry);
    else rejected.push(entry);
  }
  function readFact(
    start: CombatReceiptEntry | undefined,
    band: TimelineTimeDilationBand,
    end?: CombatReceiptEntry,
  ): PreviewBandFact | null {
    const slot = start?.data?.slot;
    const priority = start?.data?.priority;
    const duration = start?.data?.durationSeconds;
    if (
      typeof slot !== 'string' ||
      typeof priority !== 'number' ||
      !Number.isFinite(priority) ||
      typeof duration !== 'number' ||
      !Number.isFinite(duration)
    ) {
      return null;
    }
    // 被替换的回执只含实际截断帧；恢复其原本寿命，才能预览拖开后的区间。
    // 运行时在 elapsed > duration 的下一帧结束，故正好是 ceil(duration * fps) + 1。
    const naturalEndFrame =
      end?.data?.reason === 'replaced' && duration >= 0
        ? Math.min(band.startFrame + Math.ceil(duration * PROJECT_FPS) + 1, simulationEndFrame)
        : band.endFrame;
    return { band, slot, priority, naturalEndFrame, sequence: start!.sequence };
  }
  const facts = bands.flatMap(band => {
    const fact = readFact(starts.get(band.instanceId), band, ends.get(band.instanceId));
    return fact === null ? [] : [fact];
  });
  for (const entry of rejected) {
    if (entry.data?.kind !== 'global') continue;
    const instanceId = entry.data.instanceId;
    const sourceCastId = entry.data.sourceCastId;
    if (typeof instanceId !== 'number' || typeof sourceCastId !== 'string') continue;
    const duration = entry.data.durationSeconds;
    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0) continue;
    const band: TimelineTimeDilationBand = {
      instanceId,
      kind: 'global',
      startFrame: entry.frame,
      endFrame: Math.min(entry.frame + Math.ceil(duration * PROJECT_FPS) + 1, simulationEndFrame),
      sourceCastId,
    };
    const fact = readFact(entry, band);
    if (fact !== null) facts.push(fact);
  }
  return facts;
}

/** 仅重排被拖动冻屏所在的槽位；最终事实仍由完整模拟确认。 */
export function projectTimeDilationDragPreview(
  bands: readonly TimelineTimeDilationBand[],
  facts: readonly PreviewBandFact[],
  castFrameDeltas: ReadonlyMap<string, number>,
): readonly TimelineTimeDilationBand[] {
  if (castFrameDeltas.size === 0) return bands;
  const movedSlots = new Set(
    facts.flatMap(fact =>
      fact.band.sourceCastId !== undefined && castFrameDeltas.has(fact.band.sourceCastId)
        ? [fact.slot]
        : [],
    ),
  );
  const factById = new Map(facts.map(fact => [fact.band.instanceId, fact]));
  const result: TimelineTimeDilationBand[] = [];
  for (const band of bands) {
    const fact = factById.get(band.instanceId);
    if (fact !== undefined && movedSlots.has(fact.slot)) continue;
    const delta =
      band.sourceCastId === undefined ? 0 : (castFrameDeltas.get(band.sourceCastId) ?? 0);
    result.push(
      delta === 0
        ? band
        : { ...band, startFrame: band.startFrame + delta, endFrame: band.endFrame + delta },
    );
  }
  for (const slot of movedSlots) {
    const candidates = facts
      .filter(fact => fact.slot === slot)
      .map(fact => {
        const delta =
          fact.band.sourceCastId === undefined
            ? 0
            : (castFrameDeltas.get(fact.band.sourceCastId) ?? 0);
        return {
          fact,
          startFrame: fact.band.startFrame + delta,
          endFrame: fact.naturalEndFrame + delta,
        };
      })
      .sort((a, b) => a.startFrame - b.startFrame || a.fact.sequence - b.fact.sequence);
    const accepted: typeof candidates = [];
    let active: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      if (candidate.endFrame <= candidate.startFrame) continue;
      if (active !== null && active.endFrame > candidate.startFrame) {
        if (active.fact.priority > candidate.fact.priority) continue;
        active.endFrame = candidate.startFrame;
      }
      active = candidate;
      accepted.push(candidate);
    }
    for (const candidate of accepted) {
      if (candidate.endFrame <= candidate.startFrame) continue;
      result.push({
        ...candidate.fact.band,
        startFrame: candidate.startFrame,
        endFrame: candidate.endFrame,
      });
    }
  }
  return result.sort((a, b) => a.startFrame - b.startFrame || a.instanceId - b.instanceId);
}
