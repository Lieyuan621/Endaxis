/**
 * projection 层内部复用的技能诊断归约器。
 * 事件语义由公开投影决定；本文件只处理定位、归并和事实来源保留。
 */
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';

/** 按技能执行位置归并后的内部结构，公开投影以各自原因类型暴露同形结果。 */
export interface ReducedSkillDiagnostic<Reason extends string> {
  readonly frame: number;
  readonly sourceId: string;
  readonly skillId: string;
  readonly reasons: readonly Reason[];
  readonly receiptSequences: readonly number[];
}

interface MutableSkillDiagnostic<Reason extends string> {
  readonly frame: number;
  readonly sourceId: string;
  readonly skillId: string;
  readonly reasons: Reason[];
  readonly receiptSequences: number[];
}

function readLocation(entry: CombatReceiptEntry): {
  sourceId: string;
  skillId: string;
} {
  if (entry.sourceId === undefined || entry.sourceId.length === 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no sourceId`);
  }
  const skillId = entry.data?.skillId;
  if (typeof skillId !== 'string' || skillId.length === 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no skillId`);
  }
  return { sourceId: entry.sourceId, skillId };
}

/**
 * 保持首个事实的顺序输出。同一位置的重复原因只保留一次，
 * 但保留全部回执序号，便于追查运行时事实。
 */
export function reduceSkillDiagnostics<Reason extends string>(
  entries: readonly CombatReceiptEntry[],
  readReason: (event: string, entry: CombatReceiptEntry) => Reason | undefined,
): readonly ReducedSkillDiagnostic<Reason>[] {
  const diagnostics: MutableSkillDiagnostic<Reason>[] = [];
  const diagnosticsByLocation = new Map<string, MutableSkillDiagnostic<Reason>>();

  for (const entry of entries) {
    const reason = readReason(entry.event, entry);
    if (reason === undefined) continue;

    const { sourceId, skillId } = readLocation(entry);
    const locationKey = JSON.stringify([entry.frame, sourceId, skillId]);
    let diagnostic = diagnosticsByLocation.get(locationKey);
    if (diagnostic === undefined) {
      diagnostic = {
        frame: entry.frame,
        sourceId,
        skillId,
        reasons: [],
        receiptSequences: [],
      };
      diagnosticsByLocation.set(locationKey, diagnostic);
      diagnostics.push(diagnostic);
    }
    if (!diagnostic.reasons.includes(reason)) diagnostic.reasons.push(reason);
    diagnostic.receiptSequences.push(entry.sequence);
  }

  return diagnostics.map(diagnostic => ({
    ...diagnostic,
    reasons: [...diagnostic.reasons],
    receiptSequences: [...diagnostic.receiptSequences],
  }));
}
