/**
 * 把固定战斗回执历史按顺序导出为 JSON Lines。
 *
 * 第一行是版本和范围，之后每行一条回执。调用方可以直接把迭代结果写入文件或网络流，
 * 不需要先创建完整数组或了解内存中的分段结构。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from './combatReceipt';
import type { CombatReceiptView } from './combatReceiptHistory';

export interface CombatReceiptExportMetadata {
  readonly kind: 'endaxis-combat-receipts';
  readonly version: 1;
  readonly endFrame: number;
  readonly receiptCount: number;
}

function validateEntry(entry: CombatReceiptEntry, sequence: number): void {
  if (entry.sequence !== sequence) {
    throw new Error(`receipt export expected sequence ${sequence}, received ${entry.sequence}`);
  }
  if (!Number.isSafeInteger(entry.frame)) {
    throw new Error(`receipt ${sequence} has an unsafe frame`);
  }
  if (!Number.isFinite(entry.time)) {
    throw new Error(`receipt ${sequence} has a non-finite time`);
  }
  for (const [key, value] of Object.entries(entry.data ?? {})) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`receipt ${sequence} data '${key}' has a non-finite number`);
    }
    if (!isReceiptValue(value)) {
      throw new Error(`receipt ${sequence} data '${key}' is not a supported value`);
    }
  }
}

function isReceiptValue(value: unknown): value is CombatReceiptValue {
  return (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  );
}

/** 逐行输出稳定纯数据；每个返回片段都以换行结尾，可以直接流式拼接。 */
export function* exportCombatReceiptJsonLines(
  history: CombatReceiptView,
  endFrame: number,
): IterableIterator<string> {
  if (!Number.isSafeInteger(endFrame) || endFrame < 0) {
    throw new RangeError('receipt export endFrame must be a non-negative safe integer');
  }
  const metadata: CombatReceiptExportMetadata = {
    kind: 'endaxis-combat-receipts',
    version: 1,
    endFrame,
    receiptCount: history.length,
  };
  yield `${JSON.stringify(metadata)}\n`;
  let sequence = 0;
  for (const entry of history.entries()) {
    validateEntry(entry, sequence);
    yield `${JSON.stringify(entry)}\n`;
    sequence += 1;
  }
  if (sequence !== history.length) {
    throw new Error(`receipt export expected ${history.length} entries, received ${sequence}`);
  }
}
