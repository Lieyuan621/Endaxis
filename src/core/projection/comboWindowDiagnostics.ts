/**
 * 把连携技开始时记录的窗口失败事实归约为技能块诊断。
 * 窗口顺序和阶段由运行时账本决定，投影层不重新模拟连携队列。
 */
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import type { ComboWindowConsumeFailure } from '../combat/skills/comboWindowRuntime';
import { reduceSkillDiagnostics } from './skillDiagnosticReducer';

export type ComboWindowDiagnosticReason = ComboWindowConsumeFailure;

export interface ComboWindowDiagnostic {
  readonly frame: number;
  readonly sourceId: string;
  readonly skillId: string;
  readonly reasons: readonly ComboWindowDiagnosticReason[];
  readonly receiptSequences: readonly number[];
}

function readReason(entry: CombatReceiptEntry): ComboWindowDiagnosticReason | undefined {
  if (entry.event !== 'ComboWindowUnavailableAtStart') return undefined;
  const reason = entry.data?.reason;
  if (
    reason === 'windowMissing' ||
    reason === 'releaseOrderMismatch' ||
    reason === 'skillStageMismatch'
  ) {
    return reason;
  }
  throw new Error(`receipt ${entry.sequence} has invalid combo-window failure reason`);
}

export function projectComboWindowDiagnostics(
  entries: readonly CombatReceiptEntry[],
): readonly ComboWindowDiagnostic[] {
  return reduceSkillDiagnostics(entries, (_event, entry) => readReason(entry));
}
