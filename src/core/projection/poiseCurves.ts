/**
 * 把失衡日志整理成曲线：敌人初始失衡值 + 每次失衡变化 = 一条折线。
 * 曲线只能来自日志记录的事实；日志和曲线对不上就报错。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import { projectPoiseChangePoints, type PoiseChangePoint } from './poiseChangePoints';
import type { ResourceCurvePoint } from './resourceCurves';

/** 单场战斗中敌人的失衡曲线。 */
export interface PoiseCurve {
  readonly resource: 'poise';
  readonly maxValue: number;
  readonly points: readonly ResourceCurvePoint[];
}

/** 敌人处于失衡标签中的事实区间；只用于复刻资源监控器的条纹背景。 */
export interface PoiseBrokenSegment {
  readonly startFrame: number;
  readonly endFrame: number;
}

/** 失衡值向上越过节点后，在旧版资源监控器中显示的节点条纹区间。 */
export interface PoiseKnotSegment {
  readonly startFrame: number;
  readonly endFrame: number;
}

/** 曲线初始失衡；调用方必须传和这次模拟完全一致的敌人数值。 */
export interface PoiseCurveInitial {
  readonly poise: number;
  readonly maxPoise: number;
}

/** 失衡恢复完成后，运行时记下的一条"失衡回到多少"的记录。 */
export interface PoiseRecoveredPoint {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly poise: number;
}

/** 曲线消费的两种失衡事实；按回执顺序交错出现。 */
export type PoiseCurveChange = PoiseChangePoint | PoiseRecoveredPoint;

function appendAppliedPoint(points: ResourceCurvePoint[], change: PoiseChangePoint): void {
  if (change.currentPoise !== change.previousPoise + change.actualDelta) {
    throw new Error(
      `poise curve is discontinuous at receipt ${change.sequence}: expected ${change.previousPoise + change.actualDelta}, received ${change.currentPoise}`,
    );
  }
  points.push({
    frame: change.frame,
    time: change.time,
    sequence: change.sequence,
    value: change.currentPoise,
  });
}

function appendRecoveredPoint(
  points: ResourceCurvePoint[],
  change: PoiseRecoveredPoint,
  maxPoise: number,
): void {
  // 运行时恢复完成时始终把失衡重置为最大值，因此恢复事实必须与最大值一致。
  if (change.poise !== maxPoise) {
    throw new Error(
      `poise recovery at receipt ${change.sequence} restored to ${change.poise}, expected ${maxPoise}`,
    );
  }
  points.push({
    frame: change.frame,
    time: change.time,
    sequence: change.sequence,
    value: change.poise,
  });
}

/** 从初始失衡按事实顺序投影失衡曲线；被取消或免疫拦截的结算仍保留其事实点。 */
export function projectPoiseCurve(
  initial: PoiseCurveInitial,
  changes: readonly PoiseChangePoint[],
  initialFrame = 0,
): PoiseCurve {
  return projectPoiseCurvePoints(initial, changes, initialFrame);
}

/** 从回执直接投影失衡曲线，并在应用结算与恢复之间保持严格连续。 */
export function projectPoiseCurveFromReceipt(
  initial: PoiseCurveInitial,
  entries: readonly CombatReceiptEntry[],
  initialFrame = 0,
): PoiseCurve {
  const changes: PoiseCurveChange[] = [
    ...projectPoiseChangePoints(entries),
    ...projectPoiseRecoveredPoints(entries),
  ];
  changes.sort((left, right) => left.sequence - right.sequence);
  return projectPoiseCurvePoints(initial, changes, initialFrame);
}

/**
 * 节点阈值是已损失失衡值的比例；只用实际失衡结算判断向上跨越。
 * 这里复刻旧版监控器的条纹时段，不将其当作原生节点 Buff 或运行时状态。
 */
export function projectPoiseKnotSegments(
  entries: readonly CombatReceiptEntry[],
  maxPoise: number,
  knotThresholds: readonly number[],
  durationFrames: number,
  endFrame: number,
): readonly PoiseKnotSegment[] {
  if (maxPoise <= 0 || durationFrames <= 0 || knotThresholds.length === 0) return [];
  return projectPoiseChangePoints(entries).flatMap(change => {
    if (change.frame > endFrame || change.actualDelta >= 0 || change.brokePoise) return [];
    const crossed = knotThresholds.some(threshold => {
      const remainingPoise = maxPoise * (1 - threshold);
      return change.previousPoise > remainingPoise && change.currentPoise <= remainingPoise;
    });
    return crossed
      ? [{ startFrame: change.frame, endFrame: Math.min(endFrame, change.frame + durationFrames) }]
      : [];
  });
}

function projectPoiseCurvePoints(
  initial: PoiseCurveInitial,
  changes: readonly PoiseCurveChange[],
  initialFrame = 0,
): PoiseCurve {
  const points: ResourceCurvePoint[] = [
    { frame: initialFrame, time: initialFrame / 30, sequence: null, value: initial.poise },
  ];
  let currentValue = initial.poise;
  for (const change of changes) {
    if ('actualDelta' in change) {
      if (change.previousPoise !== currentValue) {
        throw new Error(
          `poise curve is discontinuous at receipt ${change.sequence}: expected previousPoise ${currentValue}, received ${change.previousPoise}`,
        );
      }
      appendAppliedPoint(points, change);
      currentValue = change.currentPoise;
      continue;
    }
    appendRecoveredPoint(points, change, initial.maxPoise);
    currentValue = change.poise;
  }
  return {
    resource: 'poise',
    maxValue: initial.maxPoise,
    points,
  };
}

function requireNumber(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): number {
  const value = data[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no finite ${key}`);
  }
  return value;
}

/** 提取 `PoiseRecovered` 恢复事实；运行时在恢复完成时写入当前失衡值。 */
export function projectPoiseRecoveredPoints(
  entries: readonly CombatReceiptEntry[],
): readonly PoiseRecoveredPoint[] {
  const points: PoiseRecoveredPoint[] = [];
  for (const entry of entries) {
    if (entry.event !== 'PoiseRecovered') continue;
    if (entry.data === undefined) {
      throw new Error(`receipt ${entry.sequence} 'PoiseRecovered' has no data`);
    }
    points.push({
      frame: entry.frame,
      time: entry.time,
      sequence: entry.sequence,
      poise: requireNumber(entry, entry.data, 'poise'),
    });
  }
  return points;
}

function optionalBoolean(
  data: Readonly<Record<string, CombatReceiptValue>> | undefined,
  key: string,
): boolean | undefined {
  const value = data?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * 旧版的失衡条纹从破韧持续到失衡标签结束。新版不从曲线形状反推状态，
 * 只消费运行时已经记录的 `brokePoise` / `hasPoiseBrokenTag` 事实。
 */
export function projectPoiseBrokenSegments(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
): readonly PoiseBrokenSegment[] {
  if (!Number.isInteger(endFrame) || endFrame < 0) {
    throw new RangeError('poise broken segment endFrame must be a non-negative integer');
  }
  const segments: PoiseBrokenSegment[] = [];
  let startFrame: number | null = null;

  for (const entry of entries) {
    if (entry.frame > endFrame) break;
    if (entry.event === 'PoiseApplied') {
      if (
        startFrame === null &&
        optionalBoolean(entry.data, 'brokePoise') === true &&
        optionalBoolean(entry.data, 'hasPoiseBrokenTag') === true
      ) {
        startFrame = entry.frame;
      }
      continue;
    }
    const endsBrokenTag =
      (entry.event === 'PoiseRecovered' || entry.event === 'PoiseBrokenTagEnded') &&
      optionalBoolean(entry.data, 'hasPoiseBrokenTag') === false;
    if (!endsBrokenTag || startFrame === null) continue;
    segments.push({ startFrame, endFrame: entry.frame });
    startFrame = null;
  }

  if (startFrame !== null) segments.push({ startFrame, endFrame });
  return segments;
}
