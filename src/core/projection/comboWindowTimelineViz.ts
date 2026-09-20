/** 把连携窗口生命周期回执投影成轨道持续段；不从技能位置反推窗口。 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';

export type ComboWindowTimelineOutcome = 'consumed' | 'expired' | 'pending';

export interface ComboWindowTimelineSegment {
  readonly sequence: number;
  readonly operatorId: string;
  readonly nextSkillKey: string;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly outcome: ComboWindowTimelineOutcome;
  readonly perfectTiming?: boolean;
}

function requireData(entry: CombatReceiptEntry): Readonly<Record<string, CombatReceiptValue>> {
  if (entry.data === undefined) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no data`);
  }
  return entry.data;
}

function requireString(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): string {
  const value = data[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no ${key}`);
  }
  return value;
}

function requireInteger(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): number {
  const value = data[key];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no non-negative ${key}`);
  }
  return value;
}

/**
 * 消费一个候选时运行时会清空该干员整条候选记录，因此同一干员尚未闭合的其他窗口也在该帧结束。
 * 这是对 `ComboWindowRuntime.consume` 的事实投影，不是 UI 猜测释放顺序。
 */
export function projectComboWindowTimelineViz(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
): readonly ComboWindowTimelineSegment[] {
  if (!Number.isInteger(endFrame) || endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }
  interface ActiveOperatorWindow {
    readonly sequence: number;
    readonly operatorId: string;
    readonly nextSkillKey: string;
    readonly startFrame: number;
    readonly candidateSequences: Set<number>;
  }
  const candidateOwners = new Map<number, string>();
  const activeByOperator = new Map<string, ActiveOperatorWindow>();
  const closed: ComboWindowTimelineSegment[] = [];

  for (const entry of entries) {
    if (
      entry.event !== 'ComboWindowOpened' &&
      entry.event !== 'ComboWindowConsumed' &&
      entry.event !== 'ComboWindowExpired'
    ) {
      continue;
    }
    if (entry.sourceId === undefined || entry.sourceId.length === 0) {
      throw new Error(`receipt ${entry.sequence} '${entry.event}' has no sourceId`);
    }
    const data = requireData(entry);
    const sequence = requireInteger(entry, data, 'windowSequence');

    if (entry.event === 'ComboWindowOpened') {
      const nextSkillKey = requireString(entry, data, 'nextSkillKey');
      const active = activeByOperator.get(entry.sourceId);
      if (active === undefined) {
        activeByOperator.set(entry.sourceId, {
          sequence,
          operatorId: entry.sourceId,
          nextSkillKey,
          startFrame: entry.frame,
          candidateSequences: new Set([sequence]),
        });
      } else {
        active.candidateSequences.add(sequence);
      }
      candidateOwners.set(sequence, entry.sourceId);
      continue;
    }

    if (entry.event === 'ComboWindowConsumed') {
      const active = activeByOperator.get(entry.sourceId);
      if (active !== undefined) {
        activeByOperator.delete(entry.sourceId);
        for (const candidateSequence of active.candidateSequences) {
          candidateOwners.delete(candidateSequence);
        }
        closed.push({
          sequence: active.sequence,
          operatorId: active.operatorId,
          nextSkillKey: active.nextSkillKey,
          startFrame: active.startFrame,
          endFrame: entry.frame,
          outcome: 'consumed',
        });
      }
      continue;
    }

    const operatorId = candidateOwners.get(sequence);
    const active = operatorId === undefined ? undefined : activeByOperator.get(operatorId);
    if (active !== undefined) {
      candidateOwners.delete(sequence);
      active.candidateSequences.delete(sequence);
      if (active.candidateSequences.size > 0) continue;
      activeByOperator.delete(active.operatorId);
      // 运行时在剩余帧从 0 继续减到 -1 时才写移除回执，因此回执帧比窗口的
      // 150 帧可视边界晚一帧。投影使用半开区间，扣掉这个移除帧后才是旧版展示的 5s。
      closed.push({
        sequence: active.sequence,
        operatorId: active.operatorId,
        nextSkillKey: active.nextSkillKey,
        startFrame: active.startFrame,
        endFrame: Math.max(active.startFrame, entry.frame - 1),
        outcome: 'expired',
      });
    }
  }

  const segments: ComboWindowTimelineSegment[] = [
    ...closed,
    ...[...activeByOperator.values()].map(active => ({
      sequence: active.sequence,
      operatorId: active.operatorId,
      nextSkillKey: active.nextSkillKey,
      startFrame: active.startFrame,
      endFrame,
      outcome: 'pending' as const,
    })),
  ].sort((left, right) => left.startFrame - right.startFrame || left.sequence - right.sequence);
  const perfect = new Map<string, { startFrame: number; endFrame: number }[]>();
  const active = new Map<string, number>();
  for (const entry of entries) {
    if (entry.frame > endFrame) break;
    if (entry.event !== 'ComboRingQteActiveChanged' || entry.sourceId === undefined) continue;
    if (entry.data?.active === true) active.set(entry.sourceId, entry.frame);
    else {
      const startFrame = active.get(entry.sourceId);
      if (startFrame === undefined) continue;
      const ranges = perfect.get(entry.sourceId) ?? [];
      ranges.push({ startFrame, endFrame: entry.frame });
      perfect.set(entry.sourceId, ranges);
      active.delete(entry.sourceId);
    }
  }
  for (const [operatorId, startFrame] of active) {
    const ranges = perfect.get(operatorId) ?? [];
    ranges.push({ startFrame, endFrame });
    perfect.set(operatorId, ranges);
  }
  // 仅分割已有连携窗口；精准区间不单独生成轨道，也不跨越消费/到期边界。
  return segments.flatMap(segment => {
    const ranges = (perfect.get(segment.operatorId) ?? []).filter(
      range => range.startFrame < segment.endFrame && range.endFrame > segment.startFrame,
    );
    if (ranges.length === 0) return [segment];
    const boundaries = [
      ...new Set([
        segment.startFrame,
        segment.endFrame,
        ...ranges.flatMap(range => [
          Math.max(segment.startFrame, range.startFrame),
          Math.min(segment.endFrame, range.endFrame),
        ]),
      ]),
    ].sort((a, b) => a - b);
    return boundaries.slice(1).map((end, index) => {
      const start = boundaries[index]!;
      return {
        ...segment,
        startFrame: start,
        endFrame: end,
        ...(ranges.some(range => start >= range.startFrame && end <= range.endFrame)
          ? { perfectTiming: true }
          : {}),
      };
    });
  });
}
