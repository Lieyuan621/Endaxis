/**
 * 从战斗事实回执投影技能执行期间已经发生的失败。
 * 本层不读取资源状态；诊断位置与原因完全来自运行时记录的回执。
 */
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { reduceSkillDiagnostics } from './skillDiagnosticReducer';

export const SKILL_EXECUTION_DIAGNOSTIC_REASONS = ['costPaymentRejected'] as const;

/** UI 可按稳定枚举映射本地化文本，核心投影不携带显示文案。 */
export type SkillExecutionDiagnosticReason = (typeof SKILL_EXECUTION_DIAGNOSTIC_REASONS)[number];

/** 一次技能执行位置上，由一个或多个回执事实归约出的诊断。 */
export interface SkillExecutionDiagnostic {
  readonly frame: number;
  readonly sourceId: string;
  readonly skillId: string;
  readonly reasons: readonly SkillExecutionDiagnosticReason[];
  readonly receiptSequences: readonly number[];
}

function readReason(event: string): SkillExecutionDiagnosticReason | undefined {
  if (event === 'SkillCostRejected') return 'costPaymentRejected';
  return undefined;
}

/** 识别技能执行期事实后，交由内部归约器统一定位和合并。 */
export function projectSkillExecutionDiagnostics(
  entries: readonly CombatReceiptEntry[],
): readonly SkillExecutionDiagnostic[] {
  return reduceSkillDiagnostics(entries, readReason);
}
