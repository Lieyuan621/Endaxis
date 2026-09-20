/** 验证逐项输入在分支恢复后继续执行，回执编号和载荷属于当前分支。 */
import { expect, it } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import type { ScheduledSkillInput } from '../state/environmentState';
import { processCombatSkillInput } from './combatInputExecution';

it('同一切面可以提交不同的后续输入，不保留另一分支的输入或回执', () => {
  let receipt = new CombatReceiptCollector();
  const step = (input: ScheduledSkillInput) =>
    processCombatSkillInput(input, 30, (_operator, skill) => skill !== 'rejected', receipt);
  expect(step({ frame: 30, operatorId: 'operator', skillId: 'first' })).toBe(true);
  const saved = receipt.history.snapshot();
  expect(step({ frame: 30, operatorId: 'operator', skillId: 'rejected' })).toBe(false);
  receipt = new CombatReceiptCollector(saved);
  expect(step({ frame: 30, operatorId: 'operator', skillId: 'other' })).toBe(true);
  const entries = receipt.entries;
  expect(entries.map(entry => entry.sequence)).toEqual([0, 1]);
  expect(entries.map(entry => entry.data!.skillId)).toEqual(['first', 'other']);
  expect(entries[1]!.time).toBe(1);
  expect(saved.length).toBe(1);
});

it('修改提交时的载荷不会改写已经记录的事实', () => {
  const receipt = new CombatReceiptCollector();
  const data = { value: 1 };
  receipt.record({ frame: 0, time: 0, event: 'test', data });
  data.value = 2;
  expect(receipt.entries[0]!.data).toEqual({ value: 1 });
});
