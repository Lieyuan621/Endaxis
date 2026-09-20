import { describe, expect, it } from 'vitest';
import { CombatClock } from '../time/combatClock';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { UltimatePresentationRuntime } from './ultimatePresentationRuntime';

describe('UltimatePresentationRuntime state', () => {
  it('恢复演出标记不额外发布回执，重叠开启后关闭仍按直接布尔写入', () => {
    const clock = new CombatClock();
    const original = new UltimatePresentationRuntime(clock, new CombatReceiptCollector());
    original.setActive(true, 'a', 'start');
    original.setActive(true, 'b', 'start');
    const saved = structuredClone(original.runtimeState);
    original.setActive(false, 'b', 'end');
    expect(original.inUltimateCasting).toBe(false);
    const receipt = new CombatReceiptCollector();
    const restored = new UltimatePresentationRuntime(clock, receipt, structuredClone(saved));
    expect(restored.inUltimateCasting).toBe(true);
    expect(receipt.entries).toEqual([]);
    restored.setActive(false, 'b', 'end');
    expect(restored.inUltimateCasting).toBe(false);
    expect(receipt.entries).toHaveLength(1);
    expect(saved.inUltimateCasting).toBe(true);
  });
});
