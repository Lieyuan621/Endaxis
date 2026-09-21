/**
 * 同一次命中的失衡计算、事件修正和状态写入边界。
 * 调用方应在生命伤害之后按证据调用，并提供同一伤害包对应的来源和目标修正器。
 */
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatClock } from '../time/combatClock';
import type { CombatVitals } from '../resources/combatVitals';

export const POISE_DAMAGE_EVENTS = [
  'beforeOutputPoiseDamage',
  'beforeTakePoiseDamage',
  'takePoiseDamage',
  'poiseZero',
  'poiseKnotBreak',
] as const;
/** 失衡伤害计算中向来源方和目标方发布的事件。 */
export type PoiseDamageEvent = (typeof POISE_DAMAGE_EVENTS)[number];

/** 事件监听者可以共同修改的失衡倍率和免疫规则。 */
export interface PoiseDamageModifier {
  readonly sourceId: string;
  readonly targetId: string;
  finalDelta: number;
  actualDelta: number;
  readonly ignorePoiseImmune: boolean;
  cancelled: boolean;
}

/** 纯失衡公式所需的基础值、倍率和目标状态。 */
export interface CalculatePoiseDamageInput {
  readonly calculationValue: number;
  readonly outputMultiplier: number;
  readonly takenMultiplier: number;
}

/** 计算并写入一次失衡伤害所需的完整运行时端口。 */
export interface ExecutePoiseDamageInput extends CalculatePoiseDamageInput {
  readonly sourceId: string;
  readonly targetId: string;
  readonly target: CombatVitals;
  readonly ignorePoiseImmune?: boolean;
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly emitSourceEvent: (event: PoiseDamageEvent, modifier: PoiseDamageModifier) => void;
  readonly emitTargetEvent: (event: PoiseDamageEvent, modifier: PoiseDamageModifier) => void;
  /** 原生系统状态在 OnPoiseZero 的普通监听者之前生效。 */
  readonly beforePoiseZero?: (modifier: PoiseDamageModifier) => void;
}

/** 一次失衡执行得到的最终变化量和目标状态。 */
export interface PoiseDamageExecutionResult {
  readonly calculatedDamage: number;
  readonly requestedDelta: number;
  readonly actualDelta: number;
  readonly cancelled: boolean;
  readonly brokePoise: boolean;
  readonly previousPoise: number;
  readonly currentPoise: number;
}

/** 事件监听器修改最终变化量前使用的、已还原的失衡公式。 */
export function calculatePoiseDamage(input: CalculatePoiseDamageInput): number {
  return input.calculationValue * input.outputMultiplier * input.takenMultiplier;
}

/** 按已还原的来源方与目标方事件顺序应用一个失衡单元。 */
export function executePoiseDamage(input: ExecutePoiseDamageInput): PoiseDamageExecutionResult {
  const calculatedDamage = calculatePoiseDamage(input);
  const modifier: PoiseDamageModifier = {
    sourceId: input.sourceId,
    targetId: input.targetId,
    finalDelta: -calculatedDamage,
    actualDelta: 0,
    ignorePoiseImmune: input.ignorePoiseImmune ?? false,
    cancelled: false,
  };

  if (Math.abs(modifier.finalDelta) <= 0.00001) {
    return unchangedPoise(calculatedDamage, input.target, modifier.finalDelta);
  }

  input.emitSourceEvent('beforeOutputPoiseDamage', modifier);
  input.emitTargetEvent('beforeTakePoiseDamage', modifier);

  const previousPoise = input.target.poise;
  const cancelledByImmunity =
    modifier.finalDelta < 0 && input.target.poiseImmune && !modifier.ignorePoiseImmune;
  modifier.cancelled = cancelledByImmunity;
  let brokePoise = false;
  if (!modifier.cancelled && input.target.hasPoise) {
    const previousKnotCount = input.target.brokenPoiseKnotCount;
    modifier.actualDelta = input.target.applyPoiseDelta(modifier.finalDelta);
    const currentKnotCount = input.target.brokenPoiseKnotCount;
    if (currentKnotCount > previousKnotCount) {
      // 原生先遍历阈值更新索引，再统一通知一次；跨多个节点不能重复开窗。
      input.receipt.record({
        frame: input.clock.frame,
        time: input.clock.time,
        event: 'PoiseKnotBroken',
        sourceId: input.sourceId,
        targetId: input.targetId,
        data: { previousKnotCount, currentKnotCount },
      });
      input.emitTargetEvent('poiseKnotBreak', modifier);
    }
    if (modifier.finalDelta < 0) input.emitTargetEvent('takePoiseDamage', modifier);
    brokePoise = input.target.beginPoiseBreakIfZero();
    if (brokePoise) {
      input.beforePoiseZero?.(modifier);
      input.emitTargetEvent('poiseZero', modifier);
    }
  }

  input.receipt.record({
    frame: input.clock.frame,
    time: input.clock.time,
    event: 'PoiseApplied',
    sourceId: input.sourceId,
    targetId: input.targetId,
    data: {
      calculationValue: input.calculationValue,
      calculatedDamage,
      requestedDelta: modifier.finalDelta,
      actualDelta: modifier.actualDelta,
      previousPoise,
      currentPoise: input.target.poise,
      cancelled: modifier.cancelled,
      cancelledByImmunity,
      poiseImmune: input.target.poiseImmune,
      ignorePoiseImmune: modifier.ignorePoiseImmune,
      brokePoise,
      inPoiseRecovery: input.target.inPoiseRecovery,
      hasPoiseBrokenTag: input.target.hasPoiseBrokenTag,
    },
  });

  return {
    calculatedDamage,
    requestedDelta: modifier.finalDelta,
    actualDelta: modifier.actualDelta,
    cancelled: modifier.cancelled,
    brokePoise,
    previousPoise,
    currentPoise: input.target.poise,
  };
}

function unchangedPoise(
  calculatedDamage: number,
  target: CombatVitals,
  requestedDelta: number,
): PoiseDamageExecutionResult {
  return {
    calculatedDamage,
    requestedDelta,
    actualDelta: 0,
    cancelled: false,
    brokePoise: false,
    previousPoise: target.poise,
    currentPoise: target.poise,
  };
}
