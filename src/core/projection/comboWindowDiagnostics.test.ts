import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectComboWindowDiagnostics } from './comboWindowDiagnostics';

describe('projectComboWindowDiagnostics', () => {
  it('只隐藏无法模拟触发来源的缺失窗口，不隐藏顺序和阶段错误', () => {
    for (const reason of ['windowMissing', 'releaseOrderMismatch', 'skillStageMismatch']) {
      const entries: CombatReceiptEntry[] = [
        {
          sequence: 1,
          frame: 0,
          time: 0,
          event: 'ComboWindowUnavailableAtStart',
          sourceId: 'operator',
          data: { skillId: 'combo', reason, triggerNotModeled: true },
        },
      ];
      expect(projectComboWindowDiagnostics(entries)).toHaveLength(
        reason === 'windowMissing' ? 0 : 1,
      );
    }
  });
  it('keeps the runtime reason and receipt location', () => {
    const entries: CombatReceiptEntry[] = [
      {
        sequence: 7,
        frame: 90,
        time: 3,
        event: 'ComboWindowUnavailableAtStart',
        sourceId: 'track:1',
        data: { skillId: 'comboSkill', reason: 'releaseOrderMismatch' },
      },
    ];

    expect(projectComboWindowDiagnostics(entries)).toEqual([
      {
        frame: 90,
        sourceId: 'track:1',
        skillId: 'comboSkill',
        reasons: ['releaseOrderMismatch'],
        receiptSequences: [7],
      },
    ]);
  });
});
