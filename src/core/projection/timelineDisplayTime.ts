import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';

/** 仅供块体显示裁切。自然结束不等于展示边界；中断也不取消独立效果。 */
export function projectSkillCastInterruptionFrames(
  entries: readonly CombatReceiptEntry[],
): ReadonlyMap<string, number> {
  const starts = projectSkillCastActualStartFrames(entries);
  const ends = new Map<string, number>();
  for (const entry of entries) {
    if (entry.event !== 'SkillInterrupted') continue;
    const castId = entry.data?.castId;
    if (typeof castId !== 'string' || !starts.has(castId) || ends.has(castId)) continue;
    if (entry.frame < starts.get(castId)!)
      throw new Error(`cast '${castId}' interrupted before start`);
    ends.set(castId, entry.frame);
  }
  return ends;
}

export interface TimelineTimeDilationBand {
  readonly instanceId: number;
  readonly kind: 'global' | 'entity';
  readonly startFrame: number;
  readonly endFrame: number;
  readonly targetId?: string;
  readonly sourceCastId?: string;
}

export interface TimelineCastTimeDilationSegment {
  readonly offsetFrames: number;
  readonly durationFrames: number;
}

/**
 * 把来源于某次施法的实际时间膨胀区间裁剪到该技能块，并转换为相对块起点的实际帧。
 * 多个生命周期实例保持为多个区间，不能合并成从技能起点开始的定义时长预览。
 */
export function projectCastTimeDilationSegments(
  bands: readonly TimelineTimeDilationBand[],
  castId: string,
  castStartFrame: number,
  castDurationFrames: number,
): readonly TimelineCastTimeDilationSegment[] {
  if (castDurationFrames <= 0) return [];
  const castEndFrame = castStartFrame + castDurationFrames;
  return Object.freeze(
    bands.flatMap(band => {
      if (band.kind !== 'global' || band.sourceCastId !== castId) return [];
      const startFrame = Math.max(castStartFrame, band.startFrame);
      const endFrame = Math.min(castEndFrame, band.endFrame);
      if (endFrame <= startFrame) return [];
      return [
        Object.freeze({
          offsetFrames: startFrame - castStartFrame,
          durationFrames: endFrame - startFrame,
        }),
      ];
    }),
  );
}

/** 技能实际开始帧以运行时回执为准；被拒绝的放置输入不会伪造开始事实。 */
export function projectSkillCastActualStartFrames(
  entries: readonly CombatReceiptEntry[],
): ReadonlyMap<string, number> {
  const result = new Map<string, number>();
  for (const entry of entries) {
    if (entry.event !== 'SkillStarted') continue;
    const castId = entry.data?.castId;
    if (typeof castId !== 'string' || result.has(castId)) continue;
    result.set(castId, entry.frame);
  }
  return result;
}

/**
 * 根据技能开始回执和决定技能块结束时间的 SkillOperableBoundaryReached 回执计算块宽。
 * 若模拟只记录了开始、尚未记录到块的结束，则不返回该技能的时长；
 * UI 暂用技能定义中的时长，并将右侧画成虚线，表示实际结束时间尚未算出。
 */
export function projectSkillCastActualDurationFrames(
  entries: readonly CombatReceiptEntry[],
): ReadonlyMap<string, number> {
  const starts = projectSkillCastActualStartFrames(entries);
  const result = new Map<string, number>();
  for (const entry of entries) {
    if (entry.event !== 'SkillOperableBoundaryReached') continue;
    const castId = entry.data?.castId;
    if (typeof castId !== 'string') {
      throw new Error(`skill operable boundary receipt ${entry.sequence} has invalid castId`);
    }
    if (result.has(castId)) {
      throw new Error(`skill cast '${castId}' reached its operable boundary more than once`);
    }
    const startFrame = starts.get(castId);
    if (startFrame === undefined) {
      throw new Error(`skill cast '${castId}' reached its operable boundary without starting`);
    }
    const elapsedFrames = entry.frame - startFrame;
    if (elapsedFrames < 0) {
      throw new Error(`skill cast '${castId}' has a negative actual duration`);
    }
    // 此事实产生于本帧技能更新阶段；本帧玩家输入已经消费完毕。
    // 块体覆盖到下一输入边界，不能把帧末事实画成该帧开始而留下 1f 缝隙。
    result.set(castId, elapsedFrames + 1);
  }
  return result;
}

/**
 * 把需要在整条时间轴上表达的时间实例配对为实际帧区间。
 * 只有全局实例影响时间轴整体观感，才进入特殊显示和交互。终结技时间膨胀
 * 由运行时记录为 global/ultimate，因此也会保留。实体实例仍参与模拟，但不在轴上装饰。
 */
export function projectTimelineTimeDilationBands(
  entries: readonly CombatReceiptEntry[],
  simulationEndFrame: number,
): readonly TimelineTimeDilationBand[] {
  if (!Number.isFinite(simulationEndFrame) || simulationEndFrame < 0) {
    throw new RangeError('simulation end frame must be a non-negative finite number');
  }
  const active = new Map<number, Omit<TimelineTimeDilationBand, 'endFrame'>>();
  const bands: TimelineTimeDilationBand[] = [];
  for (const entry of entries) {
    if (entry.event === 'TimeDilationStarted') {
      const instance = readTimeDilationInstance(entry);
      if (active.has(instance.instanceId)) {
        throw new Error(`time dilation instance ${instance.instanceId} started more than once`);
      }
      active.set(instance.instanceId, {
        ...instance,
        startFrame: entry.frame,
        ...(entry.targetId === undefined ? {} : { targetId: entry.targetId }),
      });
      continue;
    }
    if (entry.event !== 'TimeDilationEnded') continue;
    const instanceId = requireInstanceId(entry);
    const started = active.get(instanceId);
    if (started === undefined) {
      throw new Error(`time dilation instance ${instanceId} ended without a start receipt`);
    }
    active.delete(instanceId);
    if (entry.frame > started.startFrame) bands.push({ ...started, endFrame: entry.frame });
  }
  for (const started of active.values()) {
    if (simulationEndFrame > started.startFrame) {
      bands.push({ ...started, endFrame: simulationEndFrame });
    }
  }
  return Object.freeze(
    bands
      .filter(band => band.kind === 'global')
      .sort(
        (left, right) => left.startFrame - right.startFrame || left.instanceId - right.instanceId,
      )
      .map(band => Object.freeze(band)),
  );
}

function readTimeDilationInstance(
  entry: CombatReceiptEntry,
): Pick<TimelineTimeDilationBand, 'instanceId' | 'kind' | 'sourceCastId'> {
  const instanceId = requireInstanceId(entry);
  const kind = entry.data?.kind;
  if (kind !== 'global' && kind !== 'entity') {
    throw new Error(`time dilation receipt ${entry.sequence} has invalid kind`);
  }
  const sourceCastId = entry.data?.sourceCastId;
  if (sourceCastId !== undefined && typeof sourceCastId !== 'string') {
    throw new Error(`time dilation receipt ${entry.sequence} has invalid sourceCastId`);
  }
  return {
    instanceId,
    kind,
    ...(sourceCastId === undefined ? {} : { sourceCastId }),
  };
}

function requireInstanceId(entry: CombatReceiptEntry): number {
  const instanceId = entry.data?.instanceId;
  if (!Number.isSafeInteger(instanceId) || (instanceId as number) <= 0) {
    throw new Error(`time dilation receipt ${entry.sequence} has invalid instanceId`);
  }
  return instanceId as number;
}
