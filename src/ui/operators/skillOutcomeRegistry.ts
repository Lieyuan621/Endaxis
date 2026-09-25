/** 专属结果投影在此登记，时间轴组件不包含干员身份与原生技能分支。 */
import { projectPurrchenaGiftResults } from './purrchenaGiftResults';
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';
export interface OperatorSkillOutcome {
  readonly operatorId: string;
  readonly castId: string;
  readonly frame: number;
  readonly receiptSequence: number;
  readonly iconPath: string;
  readonly nameKey: string;
  readonly titleKey: string;
  /** 区分结果种类的角标，不表示层数。 */
  readonly badge: number;
}

export function projectOperatorSkillOutcomes(entries: readonly CombatReceiptEntry[]) {
  return projectPurrchenaGiftResults(entries);
}
