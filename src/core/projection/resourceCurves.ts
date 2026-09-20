/**
 * 将资源初始快照与已解析变化点组合成 UI 可消费的稀疏曲线。
 *
 * 本层不自行解释回执字段，也不计算资源变化；原始回执入口会复用 `projectResourceChangePoints`。
 * 初始点之外只为真实变化回执生成点，因此不会按连续帧展开。同帧事件按输入中的 sequence 顺序保留。
 */
import type { CombatResourceSnapshot } from '../combat/resources/combatResources';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectResourceChangePoints, type ResourceChangePoint } from './resourceChangePoints';

/** 曲线初始点没有回执序号；其余点保留产生该状态的事实序号。 */
export interface ResourceCurvePoint {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number | null;
  readonly value: number;
  /** 每帧自动回复；展示时不再单独标点。 */
  readonly source?: 'autoRecovery';
}

/** 全队共享技力曲线。 */
export interface SharedSpCurve {
  readonly resource: 'sp';
  readonly maxValue: number;
  readonly points: readonly ResourceCurvePoint[];
}

/** 单个干员的终结技能量曲线。 */
export interface OperatorUltimateEnergyCurve {
  readonly resource: 'ultimateEnergy';
  readonly operatorId: string;
  readonly maxValue: number;
  readonly points: readonly ResourceCurvePoint[];
}

/** 一次战斗中共享技力与全队终结技能量的稀疏曲线集合。 */
export interface CombatResourceCurves {
  readonly sp: SharedSpCurve;
  readonly ultimateEnergy: readonly OperatorUltimateEnergyCurve[];
}

function appendPoint(
  points: ResourceCurvePoint[],
  change: ResourceChangePoint,
  currentValue: number,
  label: string,
): number {
  if (change.previousValue !== currentValue) {
    throw new Error(
      `resource curve '${label}' is discontinuous at receipt ${change.sequence}: expected previousValue ${currentValue}, received ${change.previousValue}`,
    );
  }
  points.push({
    frame: change.frame,
    time: change.time,
    sequence: change.sequence,
    value: change.currentValue,
    ...(change.resource === 'sp' && change.source !== undefined ? { source: change.source } : {}),
  });
  return change.currentValue;
}

/**
 * 按变化点原始顺序投影资源曲线。
 * 即使终结技能量变化被规则阻止，变化点仍会保留，从而让 UI 能定位该次已记录事实。
 */
export function projectResourceCurves(
  initial: CombatResourceSnapshot,
  changes: readonly ResourceChangePoint[],
  initialFrame = 0,
): CombatResourceCurves {
  const initialTime = initialFrame / 30;
  const spPoints: ResourceCurvePoint[] = [
    { frame: initialFrame, time: initialTime, sequence: null, value: initial.sp },
  ];
  let currentSp = initial.sp;

  const ultimateByOperator = new Map<
    string,
    { curve: OperatorUltimateEnergyCurve; points: ResourceCurvePoint[]; currentValue: number }
  >();
  for (const operator of initial.squad) {
    if (ultimateByOperator.has(operator.operatorId)) {
      throw new Error(`duplicate operator resource snapshot '${operator.operatorId}'`);
    }
    const points: ResourceCurvePoint[] = [
      { frame: initialFrame, time: initialTime, sequence: null, value: operator.ultimateEnergy },
    ];
    ultimateByOperator.set(operator.operatorId, {
      curve: {
        resource: 'ultimateEnergy',
        operatorId: operator.operatorId,
        maxValue: operator.maxUltimateEnergy,
        points,
      },
      points,
      currentValue: operator.ultimateEnergy,
    });
  }

  let previousSequence = -1;
  let previousFrame = initialFrame;
  for (const change of changes) {
    if (change.sequence <= previousSequence) {
      throw new Error(`resource change sequence ${change.sequence} is not strictly increasing`);
    }
    if (change.frame < previousFrame) {
      throw new Error(`resource change frame ${change.frame} precedes frame ${previousFrame}`);
    }
    previousSequence = change.sequence;
    previousFrame = change.frame;
    if (change.resource === 'sp') {
      currentSp = appendPoint(spPoints, change, currentSp, 'sp');
      continue;
    }
    // 终结技能量只属于已配置干员，接收者不能由事件来源替代。
    const operator = ultimateByOperator.get(change.targetId);
    if (operator === undefined) {
      throw new Error(
        `ultimate-energy change at receipt ${change.sequence} targets unknown operator '${change.targetId}'`,
      );
    }
    operator.currentValue = appendPoint(
      operator.points,
      change,
      operator.currentValue,
      `ultimateEnergy:${change.targetId}`,
    );
  }

  return {
    sp: { resource: 'sp', maxValue: initial.maxSp, points: spPoints },
    ultimateEnergy: [...ultimateByOperator.values()].map(value => value.curve),
  };
}

/** 从原始战斗回执直接生成资源曲线；事件字段解析仍由统一变化点投影负责。 */
export function projectResourceCurvesFromReceipt(
  initial: CombatResourceSnapshot,
  entries: readonly CombatReceiptEntry[],
  initialFrame = 0,
): CombatResourceCurves {
  return projectResourceCurves(initial, projectResourceChangePoints(entries), initialFrame);
}
