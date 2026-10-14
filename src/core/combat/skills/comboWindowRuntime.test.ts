import { describe, expect, it } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { ComboWindowRuntime } from './comboWindowRuntime';
import { projectComboWindowTimelineViz } from '../../projection/comboWindowTimelineViz';

const TEST_WINDOW_FRAMES = 150;

function advance(clock: CombatClock, runtime: ComboWindowRuntime, frames: number): void {
  for (let index = 0; index < frames; index += 1) {
    clock.advanceFrame();
    runtime.advanceFrame();
  }
}

describe('ComboWindowRuntime', () => {
  it('强制越序施放保留诊断并消费自身候选，不消费队首干员', () => {
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(new CombatClock(), receipt, 5);
    const first = runtime.open('first', 'combo');
    const own = runtime.open('second', 'combo', { stacks: 3 });
    expect(runtime.tryConsume('second', 'combo')).toBe(false);
    const result = runtime.consume(
      'second',
      'combo',
      selected => {
        expect(runtime.hasPending('second')).toBe(true);
        return selected;
      },
      undefined,
      1,
      'cast:second',
      true,
    );
    expect(result).toEqual({
      consumed: true,
      window: own,
      reason: 'releaseOrderMismatch',
      expected: first,
    });
    expect(runtime.hasPending('second')).toBe(false);
    expect(runtime.first).toBe(first);
    expect(receipt.entries.filter(entry => entry.event === 'ComboWindowConsumed')).toMatchObject([
      { sourceId: 'second', data: { windowSequence: own.sequence } },
    ]);
  });

  it('QTE 同步重入消费后，不复活外层持有的旧候选', () => {
    const runtime = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector(), 5);
    runtime.open('rossi', 'combo');
    const record = runtime.runtimeState.records.get('rossi');
    const registration = runtime.registerRingQte('rossi', 0, 30);
    let callbacks = 0;
    runtime.bindRingQte(registration, () => {
      callbacks++;
      expect(runtime.tryConsume('rossi', 'combo')).toBe(true);
    });
    expect(runtime.consume('rossi', 'combo', result => result)).toEqual({
      consumed: false,
      reason: 'windowMissing',
    });
    expect(callbacks).toBe(1);
    expect(record?.candidates).toEqual([]);
    runtime.open('other', 'combo');
    runtime.open('rossi', 'combo');
    expect(runtime.runtimeState.records.get('rossi')).toBe(record);
    expect(runtime.first?.operatorId).toBe('other');
  });

  it('每个 QTE 监听器读取前一个回调修改后的候选计时', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt, 5);
    runtime.open('rossi', 'combo');
    const first = runtime.registerRingQte('rossi', 15, 15);
    runtime.registerRingQte('rossi', 15, 15);
    runtime.bindRingQte(first, () => {
      runtime.open('rossi', 'combo');
    });
    advance(clock, runtime, 15);
    expect(runtime.tryConsume('rossi', 'combo')).toBe(true);
    expect(
      receipt.entries
        .filter(entry => entry.event === 'ComboRingQtePressed')
        .map(entry => entry.data?.succeeded),
    ).toEqual([true, false]);
  });

  it('在 QTE 回调后选择候选，施放返回后才清除候选', () => {
    const runtime = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector(), 5);
    runtime.open('rossi', 'combo', { value: 1 });
    const registration = runtime.registerRingQte('rossi', 0, 30);
    runtime.bindRingQte(registration, () => {
      expect(runtime.hasPending('rossi')).toBe(true);
      runtime.open('rossi', 'combo', { value: 2 });
    });

    const result = runtime.consume('rossi', 'combo', selected => {
      expect(runtime.hasPending('rossi')).toBe(true);
      expect(selected.consumed && selected.window.blackboard.value).toBe(2);
      return 'cast returned';
    });
    expect(result).toBe('cast returned');
    expect(runtime.hasPending('rossi')).toBe(false);
  });
  it('全局慢速期间按缩放时间消耗连携窗口，零倍率不消耗', () => {
    const clock = new CombatClock();
    const runtime = new ComboWindowRuntime(clock, new CombatReceiptCollector(), 5);
    runtime.open('operator', 'combo');
    for (let i = 0; i < TEST_WINDOW_FRAMES; i++) runtime.advance(0);
    expect(runtime.consume('operator', 'combo', result => result).consumed).toBe(true);
    runtime.open('operator', 'combo');
    for (let i = 0; i < TEST_WINDOW_FRAMES; i++) runtime.advance(1 / 60);
    expect(runtime.consume('operator', 'combo', result => result).consumed).toBe(true);
    runtime.open('operator', 'combo');
    for (let i = 0; i < TEST_WINDOW_FRAMES * 2 + 1; i++) runtime.advance(1 / 60);
    expect(runtime.consume('operator', 'combo', result => result).consumed).toBe(false);
  });
  it('projects the actual perfect interval through pauses and consumption', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt, 5);
    runtime.open('operator', 'combo');
    runtime.registerRingQte('operator', 15, 15);
    advance(clock, runtime, 15);
    runtime.setGloballyPaused(true);
    advance(clock, runtime, 20);
    runtime.setGloballyPaused(false);
    advance(clock, runtime, 15);
    expect(
      runtime.consume('operator', 'combo', result => result, undefined, 1, 'cast').consumed,
    ).toBe(true);
    expect(
      receipt.entries.some(
        entry =>
          entry.event === 'ComboRingQtePressed' &&
          entry.data?.skillCastId === 1 &&
          entry.data?.succeeded === true,
      ),
    ).toBe(true);
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
    const runtime = new ComboWindowRuntime(clock, receipt, 5);
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
    const window = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector(), 5);
    const pending = {
      skillSlotKey: 'comboSkill',
      inputTarget: { kind: 'enemy' as const },
      triggerTarget: { kind: 'operator' as const, operatorId: 'ally' },
      assignPairs: { count: 2 },
      event: { event: 'addedBuff', payload: { buff: { onBuffFinished() {} } } },
    };
    window.open('owner', 'comboSkill', {}, pending);
    pending.assignPairs.count = 9;
    const saved = structuredClone(window.runtimeState);
    expect(saved.records.get('owner')!.candidates[0]!.nativeCondition).toEqual({
      skillSlotKey: 'comboSkill',
      inputTarget: { kind: 'enemy' },
      triggerTarget: { kind: 'operator', operatorId: 'ally' },
      assignPairs: { count: 2 },
    });
    expect(window.consume('owner', 'comboSkill', result => result, 'comboSkill').consumed).toBe(
      true,
    );
  });
  it('replays independent QTE branches with pause state and candidate order preserved', () => {
    const clock = new CombatClock();
    const original = new ComboWindowRuntime(clock, new CombatReceiptCollector(), 5, [
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
        5,
        ['rossi', 'perlica'],
        structuredClone(checkpoint),
      );
      advance(branchClock, runtime, frames);
      expect(runtime.first?.operatorId).toBe('rossi');
      expect(runtime.pending.find(window => window.operatorId === 'perlica')?.remainingFrames).toBe(
        TEST_WINDOW_FRAMES,
      );
      expect(
        runtime.consume('rossi', 'comboSkillStage2', result => result, undefined, 7).consumed,
      ).toBe(true);
      runtime.open('rossi', 'comboSkill');
      return { state: runtime.runtimeState, receipts: receipt.entries };
    };

    const early = branch(1);
    const success = branch(3);
    expect(
      early.receipts.find(entry => entry.event === 'ComboRingQtePressed')?.data?.succeeded,
    ).toBe(false);
    expect(
      success.receipts.find(entry => entry.event === 'ComboRingQtePressed')?.data?.succeeded,
    ).toBe(true);
    expect(branch(3)).toEqual(success);
    expect(success.state.nextSequence).toBe(3);
    expect(checkpoint).toEqual(original.runtimeState);
    expect(checkpoint.records.size).toBe(2);
  });

  it('uses the configured lifetime and preserves the expiry boundary', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt, 7);

    const window = runtime.open('rossi', 'comboSkillStage2');
    expect(window.remainingFrames).toBe(210);

    advance(clock, runtime, 209);
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
    const runtime = new ComboWindowRuntime(clock, receipt, 5);

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
    const runtime = new ComboWindowRuntime(clock, receipt, 5, ['perlica', 'rossi']);

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
    const runtime = new ComboWindowRuntime(clock, receipt, 5);

    runtime.open('perlica', 'comboSkill');
    runtime.open('perlica', 'comboSkill');

    expect(runtime.pending).toHaveLength(2);
    expect(runtime.tryConsume('perlica', 'comboSkill')).toBe(true);
    expect(runtime.pending).toHaveLength(0);
  });

  it('only consumes the queue head with the matching operator and stage', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt, 5);

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
    const runtime = new ComboWindowRuntime(clock, receipt, 5);
    runtime.open('rossi', 'comboSkillStage2');
    runtime.registerRingQte('rossi', 15, 15);
    advance(clock, runtime, elapsedFrames);

    expect(
      runtime.consume('rossi', 'comboSkillStage2', result => result, undefined, 42, 'cast:stage2')
        .consumed,
    ).toBe(true);
    expect(
      receipt.entries.some(
        entry =>
          entry.event === 'ComboRingQtePressed' &&
          entry.data?.skillCastId === 42 &&
          entry.data?.succeeded === true,
      ),
    ).toBe(succeeded);
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
    const runtime = new ComboWindowRuntime(clock, receipt, 5);
    runtime.open('rossi', 'comboSkillStage2');
    runtime.registerRingQte('rossi', 15, 15);
    advance(clock, runtime, 10);
    runtime.setOperatorPaused('rossi', true);
    advance(clock, runtime, 30);
    runtime.setOperatorPaused('rossi', false);
    advance(clock, runtime, 5);

    runtime.consume('rossi', 'comboSkillStage2', result => result, undefined, 42);
    expect(
      receipt.entries.some(
        entry =>
          entry.event === 'ComboRingQtePressed' &&
          entry.data?.skillCastId === 42 &&
          entry.data?.succeeded === true,
      ),
    ).toBe(true);
  });

  it('checks each QTE independently and stops listening after its own success', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = new ComboWindowRuntime(clock, receipt, 5);
    runtime.open('rossi', 'comboSkillStage2');
    const first = runtime.registerRingQte('rossi', 15, 15);
    const second = runtime.registerRingQte('rossi', 40, 10);
    advance(clock, runtime, 15);

    runtime.consume('rossi', 'comboSkillStage2', result => result, undefined, 42);
    expect(
      receipt.entries.some(
        entry =>
          entry.event === 'ComboRingQtePressed' &&
          entry.data?.skillCastId === 42 &&
          entry.data?.succeeded === true,
      ),
    ).toBe(true);
    expect(
      receipt.entries
        .filter(entry => entry.event === 'ComboRingQtePressed')
        .map(entry => [entry.data?.sequence, entry.data?.succeeded]),
    ).toEqual([
      [first, true],
      [second, false],
    ]);

    // 新候选回到同一剩余时间，已成功的动作也不能再次触发。
    runtime.open('rossi', 'comboSkillStage2');
    advance(clock, runtime, 15);
    runtime.consume('rossi', 'comboSkillStage2', result => result, undefined, 43);
    expect(
      receipt.entries.some(
        entry =>
          entry.event === 'ComboRingQtePressed' &&
          entry.data?.skillCastId === 43 &&
          entry.data?.succeeded === true,
      ),
    ).toBe(false);
    expect(
      receipt.entries
        .filter(entry => entry.event === 'ComboRingQtePressed')
        .map(entry => entry.data?.sequence),
    ).toEqual([first, second, second]);
  });
});
