import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectComboWindowDiagnostics } from './comboWindowDiagnostics';

describe('projectComboWindowDiagnostics', () => {
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
