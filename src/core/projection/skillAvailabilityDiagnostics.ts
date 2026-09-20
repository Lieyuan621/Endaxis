/**
 * 从战斗事实回执投影技能开始时的可用性诊断。
 * 这里只归拢运行时已经记录的事实，不读取或重算资源、冷却与技能定义。
 */
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { reduceSkillDiagnostics } from './skillDiagnosticReducer';

export const SKILL_AVAILABILITY_DIAGNOSTIC_REASONS = [
  'resourceUnavailable',
  'cooldownUnavailable',
  'skillInputMismatch',
  'skillInputUnknown',
  'skillInterruptUnavailable',
  'skillInterruptUnknown',
  'ultimateInputDuringPresentation',
  'skillCommonTagUnavailable',
  'skillTypeTagUnavailable',
  'attackDuringDashWindow',
] as const;

/** UI 可按稳定枚举映射本地化文本，核心投影不携带显示文案。 */
export type SkillAvailabilityDiagnosticReason =
  (typeof SKILL_AVAILABILITY_DIAGNOSTIC_REASONS)[number];

/** 一次技能开始位置上，由一个或多个回执事实归约出的诊断。 */
export interface SkillAvailabilityDiagnostic {
  readonly frame: number;
  readonly sourceId: string;
  readonly skillId: string;
  readonly reasons: readonly SkillAvailabilityDiagnosticReason[];
  readonly receiptSequences: readonly number[];
  /** 槽位不一致时保留原生实际解析到的具体技能，供感叹号解释而不是只给枚举。 */
  readonly actualSkillId?: string;
  /** 原生操作路由证据不足时的具体边界，不得折叠成普通不可用。 */
  readonly inputResolutionDetail?: string;
  /** 无法提前中断时正在执行的技能。 */
  readonly currentSkillId?: string;
  /** 当时正在执行的轴上释放身份；显示文案不从技能 ID 猜实例。 */
  readonly currentCastId?: string;
  /** 中断判定缺少证据时的具体边界。 */
  readonly interruptionDetail?: string;
}

function readReason(event: string): SkillAvailabilityDiagnosticReason | undefined {
  if (event === 'SkillInputBlockedByDashWindow') return 'attackDuringDashWindow';
  if (event === 'UltimateInputBlockedByPresentation') return 'ultimateInputDuringPresentation';
  if (event === 'SkillInputBlockedByCommonTag') return 'skillCommonTagUnavailable';
  if (event === 'SkillInputBlockedByTypeTag') return 'skillTypeTagUnavailable';
  if (event === 'SkillCostUnavailableAtStart') return 'resourceUnavailable';
  if (event === 'SkillCooldownUnavailableAtStart') return 'cooldownUnavailable';
  if (event === 'SkillInputResolvedToDifferentSkill') return 'skillInputMismatch';
  if (event === 'SkillInputResolutionUnknown') return 'skillInputUnknown';
  if (event === 'SkillInputCannotInterruptCurrentSkill') return 'skillInterruptUnavailable';
  if (event === 'SkillInputInterruptionUnknown') return 'skillInterruptUnknown';
  return undefined;
}

/** 识别开始时可用性事实后，交由内部归约器统一定位和合并。 */
export function projectSkillAvailabilityDiagnostics(
  entries: readonly CombatReceiptEntry[],
): readonly SkillAvailabilityDiagnostic[] {
  return reduceSkillDiagnostics(entries, readReason).map(diagnostic => {
    const related = entries.filter(entry => diagnostic.receiptSequences.includes(entry.sequence));
    const mismatch = related.find(entry => entry.event === 'SkillInputResolvedToDifferentSkill');
    const inputUnknown = related.find(entry => entry.event === 'SkillInputResolutionUnknown');
    const interruptionBlocked = related.find(
      entry => entry.event === 'SkillInputCannotInterruptCurrentSkill',
    );
    const interruptionUnknown = related.find(
      entry => entry.event === 'SkillInputInterruptionUnknown',
    );
    const actualSkillId = mismatch?.data?.actualSkillId;
    const inputResolutionDetail = inputUnknown?.data?.reason;
    const currentSkillId = interruptionBlocked?.data?.currentSkillId;
    const currentCastId = interruptionBlocked?.data?.currentCastId;
    const interruptionDetail = interruptionUnknown?.data?.reason;
    return {
      ...diagnostic,
      ...(typeof actualSkillId === 'string' && actualSkillId.length > 0 ? { actualSkillId } : {}),
      ...(typeof inputResolutionDetail === 'string' && inputResolutionDetail.length > 0
        ? { inputResolutionDetail }
        : {}),
      ...(typeof currentSkillId === 'string' && currentSkillId.length > 0
        ? { currentSkillId }
        : {}),
      ...(typeof currentCastId === 'string' && currentCastId.length > 0 ? { currentCastId } : {}),
      ...(typeof interruptionDetail === 'string' && interruptionDetail.length > 0
        ? { interruptionDetail }
        : {}),
    };
  });
}
