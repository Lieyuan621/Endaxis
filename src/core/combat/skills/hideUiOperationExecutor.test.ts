import { describe, expect, it } from 'vitest';
import { compileActionSequence } from '../../compiler/compileSkill';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { HideUiOperationExecutor } from './hideUiOperationExecutor';
import { UltimatePresentationRuntime } from './ultimatePresentationRuntime';

const step = (onlyBlockInput = false): ResolvedCombatOperationStep => ({
  kind: 'hideUi',
  parameters: { onlyBlockInput },
});

function fixture() {
  const clock = new CombatClock();
  const receipt = new CombatReceiptCollector();
  const runtime = new UltimatePresentationRuntime(clock, receipt);
  const executor = new HideUiOperationExecutor(runtime, 'operator', 'cast', {
    execute: () => false,
    evaluate: () => false,
  });
  return { clock, receipt, runtime, executor };
}

describe('HideUI lifecycle', () => {
  it('公共步骤编译保留分支，不把它转换为时间膨胀', () => {
    const result = compileActionSequence(
      { steps: [{ kind: 'hideUi', parameters: { onlyBlockInput: false } }] },
      1,
    );
    expect(result.steps[0]).toMatchObject(step());
  });

  it('记录实际起止帧和来源，不自行推进时钟', () => {
    const { executor, runtime, receipt, clock } = fixture();
    const action = step();
    executor.execute(action);
    expect(runtime.inUltimateCasting).toBe(true);
    expect(clock.frame).toBe(0);
    clock.advanceFrame();
    executor.end(action);
    expect(runtime.inUltimateCasting).toBe(false);
    expect(receipt.entries.map(entry => [entry.frame, entry.sourceId, entry.data])).toEqual([
      [0, 'operator', { sourceActionId: 'cast', active: true, showUi: false }],
      [1, 'operator', { sourceActionId: 'cast', active: false, showUi: true }],
    ]);
  });

  it('重叠动作保持原生布尔写入，不自行实现引用计数', () => {
    const { executor, runtime } = fixture();
    const first = step();
    const second = step();
    executor.execute(first);
    executor.execute(second);
    executor.end(first);
    expect(runtime.inUltimateCasting).toBe(false);
  });

  it('未支持的遮罩分支不污染状态和回执', () => {
    const { executor, runtime, receipt } = fixture();
    expect(() => executor.execute(step(true))).toThrow('CommonMask');
    expect(() => executor.end(step(true))).toThrow('CommonMask');
    expect(runtime.inUltimateCasting).toBe(false);
    expect(receipt.entries).toEqual([]);
  });
});
