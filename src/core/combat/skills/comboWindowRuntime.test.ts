import { describe, expect, it } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { COMBO_WINDOW_DURATION_FRAMES, ComboWindowRuntime } from './comboWindowRuntime';
import { projectComboWindowTimelineViz } from '../../projection/comboWindowTimelineViz';

function advance(clock: CombatClock, runtime: ComboWindowRuntime, frames: number): void {
  for (let index = 0; index < frames; index += 1) {
    clock.advanceFrame();
    runtime.advanceFrame();
  }
}

describe('ComboWindowRuntime', () => {
  it('全局慢速期间按缩放时间消耗连携窗口，零倍率不消耗', () => {
    const clock = new CombatClock();
    const runtime = new ComboWindowRuntime(clock, new CombatReceiptCollector());
    runtime.open('operator', 'combo');
    for (let i = 0; i < COMBO_WINDOW_DURATION_FRAMES; i++) runtime.advance(0);
    expect(runtime.consume('operator', 'combo').consumed).toBe(true);
    runtime.open('operator', 'combo');
    for (let i = 0; i < COMBO_WINDOW_DURATION_FRAMES; i++) runtime.advance(1 / 60);
    expect(runtime.consume('operator', 'combo').consumed).toBe(true);
    runtime.open('operator', 'combo');
    for (let i = 0; i < COMBO_WINDOW_DURATION_FRAMES * 2 + 1; i++) runtime.advance(1 / 60);
    expect(runtime.consume('operator', 'combo').consumed).toBe(false);
  });
  it('projects the actual perfect interval through pauses and consumption', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt);
    runtime.open('operator', 'combo');
    runtime.registerRingQte('operator', 15, 15);
    advance(clock, runtime, 15);
    runtime.setGloballyPaused(true);
    advance(clock, runtime, 20);
    runtime.setGloballyPaused(false);
    advance(clock, runtime, 15);
    expect(runtime.consume('operator', 'combo', undefined, 1, 'cast').consumed).toBe(true);
    expect(runtime.wasRingQteSuccessful(1)).toBe(true);
    expect(
      projectComboWindowTimelineViz(receipt.entries, 60).map(segment => [
        segment.startFrame,
        segment.endFrame,
        segment.perfectTiming ?? false,
      ]),
    ).toEqual([
      [0, 15, false],
      [15, 50, true],
    ]);
  });

  it('closes perfect display on the first invalid frame and on unregister', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt);
    runtime.open('operator', 'combo');
    runtime.registerRingQte('operator', 15, 15);
    advance(clock, runtime, 31);
    const next = runtime.registerRingQte('operator', 0, 15);
    advance(clock, runtime, 4);
    runtime.unregisterRingQte(next);
    expect(
      projectComboWindowTimelineViz(receipt.entries, 40)
        .filter(segment => segment.perfectTiming)
        .map(segment => [segment.startFrame, segment.endFrame]),
    ).toEqual([
      [15, 31],
      [31, 35],
    ]);
  });

  it('待释放窗口只保存施放参数，不捕获触发事件中的活动 Buff 或回调', () => {
    const window = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector());
    const pending = {
      skillGroupKey: 'comboSkill',
      inputTarget: { kind: 'enemy' as const },
      triggerTarget: { kind: 'operator' as const, operatorId: 'ally' },
      assignPairs: { count: 2 },
      event: { event: 'addedBuff', payload: { buff: { onBuffFinished() {} } } },
    };
    window.open('owner', 'comboSkill', {}, pending);
    pending.assignPairs.count = 9;
    const saved = structuredClone(window.runtimeState);
    expect(saved.records.get('owner')!.candidates[0]!.nativeCondition).toEqual({
      skillGroupKey: 'comboSkill',
      inputTarget: { kind: 'enemy' },
      triggerTarget: { kind: 'operator', operatorId: 'ally' },
      assignPairs: { count: 2 },
    });
    expect(window.consume('owner', 'comboSkill', 'comboSkill').consumed).toBe(true);
  });
  it('replays independent QTE branches with pause state and candidate order preserved', () => {
    const clock = new CombatClock();
    const original = new ComboWindowRuntime(clock, new CombatReceiptCollector(), [
      'rossi',
      'perlica',
    ]);
    original.open('perlica', 'comboSkill');
    original.open('rossi', 'comboSkillStage2');
    original.registerRingQte('rossi', 2, 2);
    original.setOperatorPaused('perlica', true);
    const checkpoint = structuredClone(original.runtimeState);

    const branch = (frames: number) => {
      const branchClock = new CombatClock();
      const receipt = new CombatReceiptCollector();
      const runtime = new ComboWindowRuntime(
        branchClock,
        receipt,
        ['rossi', 'perlica'],
        structuredClone(checkpoint),
      );
      advance(branchClock, runtime, frames);
      expect(runtime.first?.operatorId).toBe('rossi');
      expect(runtime.pending.find(window => window.operatorId === 'perlica')?.remainingFrames).toBe(
        COMBO_WINDOW_DURATION_FRAMES,
      );
      expect(runtime.consume('rossi', 'comboSkillStage2', undefined, 7).consumed).toBe(true);
      runtime.open('rossi', 'comboSkill');
      return { state: runtime.runtimeState, receipts: receipt.entries };
    };

    const early = branch(1);
    const success = branch(3);
    expect(early.state.successfulRingQteSkillCastIds.has(7)).toBe(false);
    expect(success.state.successfulRingQteSkillCastIds.has(7)).toBe(true);
    expect(branch(3)).toEqual(success);
    expect(success.state.nextSequence).toBe(3);
    expect(checkpoint).toEqual(original.runtimeState);
    expect(checkpoint.successfulRingQteSkillCastIds.size).toBe(0);
    expect(checkpoint.records.size).toBe(2);
  });

  it('uses the fixed five-second lifetime', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt);

    const window = runtime.open('rossi', 'comboSkillStage2');
    expect(COMBO_WINDOW_DURATION_FRAMES).toBe(150);
    expect(window.remainingFrames).toBe(150);

    advance(clock, runtime, 149);
    expect(runtime.first).toBe(window);
    advance(clock, runtime, 1);
    expect(window.remainingFrames).toBe(0);
    expect(runtime.first).toBe(window);
    advance(clock, runtime, 1);
    expect(runtime.first).toBeUndefined();
    expect(receipt.entries.map(entry => entry.event)).toEqual([
      'ComboWindowOpened',
      'ComboWindowExpired',
    ]);
  });

  it('freezes remaining time while globally or individually paused', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt);

    const perlica = runtime.open('perlica', 'comboSkill');
    const rossi = runtime.open('rossi', 'comboSkill');
    runtime.setOperatorPaused('perlica', true);
    advance(clock, runtime, 10);
    expect(perlica.remainingFrames).toBe(150);
    expect(rossi.remainingFrames).toBe(140);

    runtime.setGloballyPaused(true);
    advance(clock, runtime, 10);
    expect(perlica.remainingFrames).toBe(150);
    expect(rossi.remainingFrames).toBe(140);
  });

  it('orders same-frame records by configured track order', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt, ['perlica', 'rossi']);

    runtime.open('rossi', 'comboSkill');
    runtime.open('perlica', 'comboSkill');

    expect(runtime.first?.operatorId).toBe('perlica');
    expect(runtime.tryConsume('rossi', 'comboSkill')).toBe(false);
    expect(runtime.tryConsume('perlica', 'comboSkill')).toBe(true);
    expect(runtime.first?.operatorId).toBe('rossi');
  });

  it('clears every candidate recorded for the consumed operator', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt);

    runtime.open('perlica', 'comboSkill');
    runtime.open('perlica', 'comboSkill');

    expect(runtime.pending).toHaveLength(2);
    expect(runtime.tryConsume('perlica', 'comboSkill')).toBe(true);
    expect(runtime.pending).toHaveLength(0);
  });

  it('only consumes the queue head with the matching operator and stage', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt);

    runtime.open('perlica', 'comboSkill');
    runtime.open('rossi', 'comboSkillStage2');

    expect(runtime.tryConsume('rossi', 'comboSkillStage2')).toBe(false);
    expect(runtime.tryConsume('perlica', 'battleSkill')).toBe(false);
    expect(runtime.tryConsume('perlica', 'comboSkill')).toBe(true);
    expect(runtime.tryConsume('rossi', 'comboSkillStage2')).toBe(true);
    expect(runtime.pending).toHaveLength(0);
  });

  it.each([
    [14, false],
    [15, true],
    [30, true],
    [31, false],
  ] as const)('uses the native inclusive QTE interval at frame %s', (elapsedFrames, succeeded) => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt);
    runtime.open('rossi', 'comboSkillStage2');
    runtime.registerRingQte('rossi', 15, 15);
    advance(clock, runtime, elapsedFrames);

    expect(
      runtime.consume('rossi', 'comboSkillStage2', undefined, 42, 'cast:stage2').consumed,
    ).toBe(true);
    expect(runtime.wasRingQteSuccessful(42)).toBe(succeeded);
    expect(
      receipt.entries.findLast(entry => entry.event === 'ComboRingQtePressed')?.data,
    ).toMatchObject({
      elapsedFrames,
      succeeded,
      skillCastId: 42,
      sourceActionId: 'cast:stage2',
    });
  });

  it('freezes the QTE clock with the underlying combo remaining time', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt);
    runtime.open('rossi', 'comboSkillStage2');
    runtime.registerRingQte('rossi', 15, 15);
    advance(clock, runtime, 10);
    runtime.setOperatorPaused('rossi', true);
    advance(clock, runtime, 30);
    runtime.setOperatorPaused('rossi', false);
    advance(clock, runtime, 5);

    runtime.consume('rossi', 'comboSkillStage2', undefined, 42);
    expect(runtime.wasRingQteSuccessful(42)).toBe(true);
  });
});
