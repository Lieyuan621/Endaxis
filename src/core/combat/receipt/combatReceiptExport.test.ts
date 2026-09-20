import { describe, expect, it, vi } from 'vitest';
import { CombatReceiptCollector } from './combatReceipt';
import { CombatReceiptView } from './combatReceiptHistory';
import { exportCombatReceiptJsonLines } from './combatReceiptExport';

describe('exportCombatReceiptJsonLines', () => {
  it('按固定视图顺序流式导出元数据和回执，不物化完整数组', () => {
    const receipt = new CombatReceiptCollector();
    receipt.record({ frame: -1, time: -1 / 30, event: 'prepared' });
    receipt.record({ frame: 2, time: 2 / 30, event: 'damage', data: { value: 10 } });
    const history = receipt.history.snapshot();
    const toArray = vi.spyOn(CombatReceiptView.prototype, 'toArray');
    const lines = [...exportCombatReceiptJsonLines(history, 30)];
    expect(toArray).not.toHaveBeenCalled();
    expect(lines.map(line => JSON.parse(line))).toEqual([
      {
        kind: 'endaxis-combat-receipts',
        version: 1,
        endFrame: 30,
        receiptCount: 2,
      },
      history.get(0),
      history.get(1),
    ]);
    expect(lines.every(line => line.endsWith('\n'))).toBe(true);
    toArray.mockRestore();
  });

  it('拒绝会被 JSON 静默改写的非有限数值', () => {
    const receipt = new CombatReceiptCollector();
    receipt.record({ frame: 0, time: 0, event: 'invalid', data: { value: Number.NaN } });
    expect(() => [...exportCombatReceiptJsonLines(receipt.history.snapshot(), 0)]).toThrow(
      "data 'value' has a non-finite number",
    );
  });

  it('拒绝不能由 JSON 整数精确表达的帧范围', () => {
    const receipt = new CombatReceiptCollector();
    receipt.record({ frame: Number.MAX_SAFE_INTEGER + 1, time: 0, event: 'invalid' });
    expect(() => [...exportCombatReceiptJsonLines(receipt.history.snapshot(), 0)]).toThrow(
      'unsafe frame',
    );
    expect(() => [...exportCombatReceiptJsonLines(receipt.history.snapshot(), -1)]).toThrow(
      'non-negative safe integer',
    );
  });
});
