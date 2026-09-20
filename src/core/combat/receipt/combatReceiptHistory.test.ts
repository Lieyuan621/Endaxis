import { expect, it } from 'vitest';
import { CombatReceiptCollector } from './combatReceipt';
import { restoreCombatReceiptView } from './combatReceiptHistory';
import { exportCombatReceiptJsonLines } from './combatReceiptExport';

it('freezes direct bonus results and includes them in the common export', () => {
  const collector = new CombatReceiptCollector();
  const item = {
    kind: 'damageScale' as const,
    buffId: 'bonus',
    sourceId: 'ally',
    side: 'attacker' as const,
    zone: 'normal' as const,
    addition: 0.2,
  };
  collector.record({ event: 'DamageApplied', frame: 0, time: 0, appliedDamageModifiers: [item] });
  item.addition = 0.9;
  const saved = collector.history.snapshot();
  expect(saved.get(0)?.appliedDamageModifiers?.[0]).toMatchObject({ addition: 0.2 });
  expect(Object.isFrozen(saved.get(0)?.appliedDamageModifiers?.[0])).toBe(true);
  const exported = [...exportCombatReceiptJsonLines(saved, 0)].map(line => JSON.parse(line));
  expect(exported[1].appliedDamageModifiers[0].addition).toBe(0.2);
});

it('写入冻结事实，父分支继续追加不改变固定视图，分叉共享前缀但不共享后缀', () => {
  const parent = new CombatReceiptCollector();
  const data = { value: 1 };
  parent.record({ event: 'first', frame: 0, time: 0, data });
  const saved = parent.history.snapshot();
  data.value = 9;
  expect(saved.get(0)!.data!.value).toBe(1);
  expect(Reflect.set(saved.get(0)!.data!, 'value', 8)).toBe(false);
  expect(Reflect.set(saved.get(0)!, 'event', 'changed')).toBe(false);
  const a = new CombatReceiptCollector(saved),
    b = new CombatReceiptCollector(saved);
  parent.record({ event: 'parent', frame: 1, time: 1 / 30 });
  a.record({ event: 'a', frame: 1, time: 1 / 30 });
  b.record({ event: 'b', frame: 1, time: 1 / 30 });
  expect(saved.length).toBe(1);
  expect(a.entries[0]).toBe(saved.get(0));
  expect(b.entries[0]).toBe(saved.get(0));
  expect([a.entries[1]!.event, b.entries[1]!.event, parent.entries[1]!.event]).toEqual([
    'a',
    'b',
    'parent',
  ]);
  expect(a.entries[1]!.sequence).toBe(b.entries[1]!.sequence);
  expect(saved.toArray()).toBe(saved.toArray());
});

it('跨封存段和未满尾部增量读取，不漏同帧事实，空筛选仍推进且拒绝其他分支游标', () => {
  const receipt = new CombatReceiptCollector();
  let cursor = receipt.history.cursor();
  for (let index = 0; index < 530; index += 1)
    receipt.record({ frame: 0, time: 0, event: index % 2 === 0 ? 'even' : 'odd' });
  const empty = receipt.history.readSince(cursor, new Set(['missing']));
  expect(empty.entries).toEqual([]);
  expect(empty.cursor.nextSequence).toBe(530);
  const all = receipt.history.readSince(cursor);
  expect(all.entries.map(entry => entry.sequence)).toEqual(
    Array.from({ length: 530 }, (_, i) => i),
  );
  cursor = all.cursor;
  const saved = receipt.history.snapshot();
  receipt.record({ frame: 0, time: 0, event: 'after' });
  const next = receipt.history.readSince(cursor);
  expect(next.entries.map(entry => entry.sequence)).toEqual([530]);
  expect([...saved.entries(254, 258)].map(entry => entry.sequence)).toEqual([254, 255, 256, 257]);
  expect(() => new CombatReceiptCollector(saved).history.readSince(cursor)).toThrow(
    'another history branch',
  );
  expect(() => receipt.history.readSince({ ...cursor, nextSequence: 0 })).toThrow(
    'another history branch',
  );
  expect(() => [...saved.entries(0, 531)]).toThrow('within this history');
});

it('从纯数据边界重建固定历史并拒绝序号缺口', () => {
  const entry = { sequence: 0, frame: 3, time: 0.1, event: 'fact', data: { value: 7 } };
  const view = restoreCombatReceiptView([entry]);
  expect(view.get(0)).toEqual(entry);
  expect(view.toArray()).toBe(view.toArray());
  expect(Object.isFrozen(view.get(0))).toBe(true);
  expect(() => restoreCombatReceiptView([{ ...entry, sequence: 1 }])).toThrow(
    'expected sequence 0',
  );
});
