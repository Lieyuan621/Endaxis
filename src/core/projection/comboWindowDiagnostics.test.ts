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
});
