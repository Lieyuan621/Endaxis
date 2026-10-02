import { describe, expect, it } from 'vitest';
import { CombatReceiptCollector, type CombatReceiptEntry } from './combatReceipt';
import { restoreCombatReceiptView } from './combatReceiptHistory';
import { exportCombatReceiptJsonLines } from './combatReceiptExport';

function value(frame: number, value: number, sourceId = 'source', targetId = 'target') {
  return {
    frame,
    time: frame / 30,
    event: 'CharacterPassiveUiValueChanged',
    sourceId,
    targetId,
    data: { value },
  };
}

describe('passive UI receipt compression', () => {
  it('preserves first zero, raw changes, target and source transitions, and unrelated facts', () => {
    const collector = new CombatReceiptCollector();
    const input = [
      value(0, 0),
      value(1, 0),
      { frame: 1, time: 1 / 30, event: 'SpChanged', data: { value: 0 } },
      value(2, 0),
      value(2, 0, 'source', 'other'),
      value(3, 0, 'other-source'),
      value(3, 0),
      value(4, 1.1),
      value(4, 1.2),
      value(5, 1.2),
      value(6, 0),
      value(7, 0),
      value(8, -0),
      value(9, -0),
      value(10, 0),
    ];
    for (const entry of input) collector.record(entry);
    expect(collector.entries).toEqual(
      input
        .filter((_, index) => ![1, 3, 9, 11, 13].includes(index))
        .map((entry, sequence) => ({ ...entry, sequence })),
    );
  });

  it('rebuilds independently from a lossless imported prefix across nested forks and resets', () => {
    const prefix = [value(0, 0), value(1, 2), value(2, 2)].map((entry, sequence) => ({
      ...entry,
      sequence,
    }));
    const saved = restoreCombatReceiptView(structuredClone(prefix));
    const parent = new CombatReceiptCollector(saved);
    const a = new CombatReceiptCollector(saved);
    const b = new CombatReceiptCollector(saved);
    a.record(value(3, 2));
    a.record(value(4, 0));
    const nested = new CombatReceiptCollector(a.history.snapshot());
    nested.record(value(5, 0));
    nested.record(value(6, 3));
    b.record(value(3, 2));
    b.record(value(4, 3, 'other-source'));
    b.record(value(5, 3));
    parent.record(value(3, 2));
    expect(parent.entries).toEqual(prefix);
    expect(a.entries.slice(prefix.length)).toEqual([{ ...value(4, 0), sequence: 3 }]);
    expect(nested.entries.slice(prefix.length)).toEqual([
      { ...value(4, 0), sequence: 3 },
      { ...value(6, 3), sequence: 4 },
    ]);
    expect(b.entries.slice(prefix.length)).toEqual([
      { ...value(4, 3, 'other-source'), sequence: 3 },
      { ...value(5, 3), sequence: 4 },
    ]);
    expect(saved.toArray()).toEqual(prefix);
    const exported = [...exportCombatReceiptJsonLines(nested.history.snapshot(), 6)]
      .slice(1)
      .map(line => JSON.parse(line));
    expect(exported).toEqual(nested.entries);
    const fresh = new CombatReceiptCollector();
    fresh.record(value(0, 0));
    expect(fresh.entries).toEqual([{ ...value(0, 0), sequence: 0 }]);
  });

  it('does not conceal invalid numbers or discard additional provenance', () => {
    const collector = new CombatReceiptCollector();
    const input: Omit<CombatReceiptEntry, 'sequence'>[] = [
      value(0, 1),
      { ...value(1, 1), data: { value: 1, reason: 'new evidence' } },
      value(2, 1),
      { ...value(3, 1), producedBy: { kind: 'receipt', sequence: 0 } },
      value(4, 1),
      value(5, NaN),
      value(6, NaN),
      value(7, Infinity),
      value(8, Infinity),
    ];
    for (const entry of input) collector.record(entry);
    expect(collector.entries).toEqual(input.map((entry, sequence) => ({ ...entry, sequence })));
    expect(() => [...exportCombatReceiptJsonLines(collector.history.snapshot(), 8)]).toThrow(
      'non-finite number',
    );
  });
});
