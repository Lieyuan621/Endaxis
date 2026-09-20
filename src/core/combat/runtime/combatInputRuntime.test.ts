import { describe, expect, it, vi } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import {
  createCombatInputExecution,
  type TryStartCombatSkill,
} from '../skills/combatInputExecution';
import { SkillInputGroupTiming } from '../skills/skillInputGroupTiming';
import { type ScheduledSkillInput } from '../state/environmentState';
import { CombatClock } from '../time/combatClock';
import type { CombatInputRuntimeOptions } from './combatInputRuntime';
import { CombatInputRuntime } from './combatInputRuntime';

function createRuntime(
  options: Pick<
    CombatInputRuntimeOptions,
    'clock' | 'inputs' | 'skillInputGroups' | 'continuationPlan' | 'restoredState'
  > & {
    readonly receipt: CombatReceiptCollector;
    readonly tryStartSkill: TryStartCombatSkill;
  },
) {
  return new CombatInputRuntime({
    ...options,
    execution: createCombatInputExecution(options.tryStartSkill, options.receipt),
  });
}

describe('CombatInputRuntime', () => {
  it('绑定保存游标后不重放固定输入，并继续递归接续与持久组', () => {
    const inputs: ScheduledSkillInput[] = [
      { frame: 0, operatorId: 'one', skillId: 'a', castId: 'a', declarationOrder: 0 },
      { frame: 0, operatorId: 'one', skillId: 'b', castId: 'b', declarationOrder: 1 },
      { frame: 0, operatorId: 'one', skillId: 'c', castId: 'c', declarationOrder: 2 },
      { frame: 0, operatorId: 'two', skillId: 'x', castId: 'x', declarationOrder: 3 },
      { frame: 0, operatorId: 'two', skillId: 'y', castId: 'y', declarationOrder: 4 },
      { frame: 0, operatorId: 'two', skillId: 'z', castId: 'z', declarationOrder: 5 },
    ];
    const create = (
      clock: CombatClock,
      receipt: CombatReceiptCollector,
      restoredState?: ConstructorParameters<typeof CombatInputRuntime>[0]['restoredState'],
    ) =>
      createRuntime({
        clock,
        receipt,
        inputs,
        tryStartSkill: () => true,
        skillInputGroups: {
          groups: [{ anchorCastId: 'a', castIds: ['a', 'b', 'c'] }],
          canContinue: previous => clock.frame >= previous.frame + 2,
        },
        continuationPlan: {
          castIds: ['x', 'y', 'z'],
          canContinue: (_input, previous) => clock.frame >= previous.frame + 3,
        },
        ...(restoredState === undefined ? {} : { restoredState }),
      });
    const originalClock = new CombatClock();
    const originalReceipt = new CombatReceiptCollector();
    const original = create(originalClock, originalReceipt);
    original.applyCurrentFrame();
    originalClock.advanceFrame();
    original.applyCurrentFrame();
    const saved = structuredClone({
      clock: originalClock.runtimeState,
      input: original.runtimeState,
    });
    const savedHistory = originalReceipt.history.snapshot();

    for (let frame = 2; frame <= 6; frame += 1) {
      originalClock.advanceFrame();
      original.applyCurrentFrame();
    }
    const restoredClock = new CombatClock(saved.clock);
    const restoredReceipt = new CombatReceiptCollector(savedHistory);
    const restored = create(restoredClock, restoredReceipt, saved.input);
    expect(restored.runtimeState).toBe(saved.input);
    for (let frame = 2; frame <= 6; frame += 1) {
      restoredClock.advanceFrame();
      restored.applyCurrentFrame();
    }

    expect(restored.runtimeState).toEqual(original.runtimeState);
    expect(restoredReceipt.entries).toEqual(originalReceipt.entries);
    expect(
      restoredReceipt.entries
        .filter(entry => entry.event === 'SkillInputProcessed')
        .map(entry => [entry.data?.castId, entry.frame]),
    ).toEqual([
      ['a', 0],
      ['x', 0],
      ['b', 2],
      ['y', 3],
      ['c', 4],
      ['z', 6],
    ]);
  });

  it('preserves same-frame input order and records acceptance', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const tryStartSkill = vi.fn(
      (_operatorId: string, skillId: string, castId?: string) =>
        skillId === 'first' && castId === 'cast:first',
    );
    const runtime = createRuntime({
      clock,
      receipt,
      tryStartSkill,
      inputs: [
        { frame: 0, operatorId: 'operator', skillId: 'first', castId: 'cast:first' },
        { frame: 0, operatorId: 'operator', skillId: 'second', castId: 'cast:second' },
      ],
    });

    runtime.applyCurrentFrame();

    expect(tryStartSkill.mock.calls).toEqual([
      ['operator', 'first', 'cast:first'],
      ['operator', 'second', 'cast:second'],
    ]);
    expect(receipt.entries.map(entry => entry.data?.accepted)).toEqual([true, false]);
    expect(receipt.entries.map(entry => entry.data?.castId)).toEqual(['cast:first', 'cast:second']);
  });

  it('rejects out-of-order schedules instead of silently sorting them', () => {
    expect(() =>
      createRuntime({
        clock: new CombatClock(),
        receipt: new CombatReceiptCollector(),
        tryStartSkill: () => true,
        inputs: [
          { frame: 2, operatorId: 'operator', skillId: 'later' },
          { frame: 1, operatorId: 'operator', skillId: 'earlier' },
        ],
      }),
    ).toThrow('scheduled skill inputs must be ordered by frame');
  });

  const chain = (firstFrame = 0): ScheduledSkillInput[] => [
    { frame: firstFrame, operatorId: 'operator', skillId: 'first', castId: 'a' },
    { frame: firstFrame + 1, operatorId: 'operator', skillId: 'second', castId: 'b' },
    { frame: firstFrame + 2, operatorId: 'operator', skillId: 'third', castId: 'c' },
  ];

  it.each([['a'], ['a', 'a'], ['a', 'missing']])(
    'rejects invalid continuation IDs %j',
    (...castIds) => {
      expect(() =>
        createRuntime({
          clock: new CombatClock(),
          receipt: new CombatReceiptCollector(),
          inputs: chain(),
          tryStartSkill: () => true,
          continuationPlan: { castIds, canContinue: () => true },
        }),
      ).toThrow(/continuation plan/);
    },
  );

  it('rejects ambiguous cast IDs and different operators', () => {
    for (const inputs of [
      [...chain(), { ...chain()[2]!, castId: 'b' }],
      chain().map(input => (input.castId === 'b' ? { ...input, operatorId: 'other' } : input)),
    ]) {
      expect(() =>
        createRuntime({
          clock: new CombatClock(),
          receipt: new CombatReceiptCollector(),
          inputs,
          tryStartSkill: () => true,
          continuationPlan: { castIds: ['a', 'b'], canContinue: () => true },
        }),
      ).toThrow(/continuation plan/);
    }
  });

  it.each([0, -5])(
    'waits for readiness after anchored frame %i and processes at most one continuation per frame',
    firstFrame => {
      const clock = new CombatClock();
      clock.initializeFrame(firstFrame);
      const receipt = new CombatReceiptCollector();
      const canContinue = vi.fn(
        (input: ScheduledSkillInput, previous: ScheduledSkillInput) =>
          input.frame - previous.frame >= 3,
      );
      const inputs = chain(firstFrame);
      const runtime = createRuntime({
        clock,
        receipt,
        inputs,
        tryStartSkill: () => true,
        continuationPlan: { castIds: ['a', 'b', 'c'], canContinue },
      });
      runtime.applyCurrentFrame();
      runtime.applyCurrentFrame();
      expect(canContinue).not.toHaveBeenCalled();
      for (let frame = 1; frame <= 6; frame += 1) {
        clock.advanceFrame();
        runtime.applyCurrentFrame();
        runtime.applyCurrentFrame();
      }
      expect(
        receipt.entries.map(entry => [entry.data?.castId, entry.data?.scheduledActualFrame]),
      ).toEqual([
        ['a', firstFrame],
        ['b', firstFrame + 3],
        ['c', firstFrame + 6],
      ]);
      expect(inputs).toEqual(chain(firstFrame));
      expect(canContinue.mock.calls.find(([input]) => input.castId === 'c')?.[1].frame).toBe(
        firstFrame + 3,
      );
    },
  );

  it('preserves fixed input order and frames while delaying continuations', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = createRuntime({
      clock,
      receipt,
      tryStartSkill: () => true,
      inputs: [
        chain()[0]!,
        chain()[1]!,
        { frame: 1, operatorId: 'other', skillId: 'other1', castId: 'x' },
        { frame: 1, operatorId: 'other', skillId: 'other2', castId: 'y' },
        chain()[2]!,
      ],
      continuationPlan: { castIds: ['a', 'b', 'c'], canContinue: () => true },
    });
    runtime.applyCurrentFrame();
    clock.advanceFrame();
    runtime.applyCurrentFrame();
    runtime.applyCurrentFrame();
    clock.advanceFrame();
    runtime.applyCurrentFrame();
    expect(
      receipt.entries.map(entry => [entry.data?.castId, entry.data?.scheduledActualFrame]),
    ).toEqual([
      ['a', 0],
      ['x', 1],
      ['y', 1],
      ['b', 1],
      ['c', 2],
    ]);
  });

  it('stops at another authored input on the same operator', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = createRuntime({
      clock,
      receipt,
      tryStartSkill: () => true,
      inputs: [
        chain()[0]!,
        chain()[1]!,
        { frame: 1, operatorId: 'operator', skillId: 'authored', castId: 'x' },
        chain()[2]!,
      ],
      continuationPlan: { castIds: ['a', 'b', 'c'], canContinue: () => true },
    });
    runtime.applyCurrentFrame();
    for (let frame = 1; frame <= 4; frame += 1) {
      clock.advanceFrame();
      runtime.applyCurrentFrame();
    }
    expect(receipt.entries.map(entry => entry.data?.castId)).toEqual(['a', 'x']);
  });

  it('keeps compact planning through failed inputs and an intervening authored cast', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = createRuntime({
      clock,
      receipt,
      tryStartSkill: () => false,
      inputs: [
        chain()[0]!,
        chain()[1]!,
        { frame: 1, operatorId: 'operator', skillId: 'authored', castId: 'x' },
        chain()[2]!,
      ],
      continuationPlan: {
        castIds: ['a', 'b', 'c'],
        ignoreInputFailures: true,
        canContinue: () => true,
      },
    });
    runtime.applyCurrentFrame();
    for (let frame = 1; frame <= 3; frame += 1) {
      clock.advanceFrame();
      runtime.applyCurrentFrame();
    }
    expect(receipt.entries.map(entry => [entry.data?.castId, entry.data?.accepted])).toEqual([
      ['a', false],
      ['x', false],
      ['b', false],
      ['c', false],
    ]);
  });

  it.each(['a', 'b'])('stops when chain input %s fails', failedCastId => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = createRuntime({
      clock,
      receipt,
      inputs: chain(),
      tryStartSkill: (_operator, _skill, castId) => castId !== failedCastId,
      continuationPlan: { castIds: ['a', 'b', 'c'], canContinue: () => true },
    });
    runtime.applyCurrentFrame();
    for (let frame = 1; frame <= 4; frame += 1) {
      clock.advanceFrame();
      runtime.applyCurrentFrame();
    }
    expect(receipt.entries.map(entry => entry.data?.castId)).toEqual(
      failedCastId === 'a' ? ['a'] : ['a', 'b'],
    );
    expect(receipt.entries.at(-1)?.data?.accepted).toBe(false);
  });
});

describe('持久连续组输入', () => {
  function fixture(
    inputs: readonly ScheduledSkillInput[],
    groups: readonly (readonly string[])[],
    rejected?: string,
  ) {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = createRuntime({
      clock,
      receipt,
      inputs,
      tryStartSkill: (_operatorId, _skillId, castId) => castId !== rejected,
      skillInputGroups: {
        groups: groups.map(castIds => ({ anchorCastId: castIds[0]!, castIds })),
        canContinue: previous => clock.frame >= previous.frame + 2,
      },
    });
    const advance = (frames: number) => {
      runtime.applyCurrentFrame();
      for (let index = 0; index < frames; index += 1) {
        clock.advanceFrame();
        runtime.applyCurrentFrame();
        runtime.applyCurrentFrame();
      }
    };
    return { receipt, advance };
  }
  const input = (castId: string, operatorId: string, declarationOrder: number, frame = 0) => ({
    castId,
    operatorId,
    skillId: castId,
    declarationOrder,
    frame,
  });
  const processed = (receipt: CombatReceiptCollector) =>
    receipt.entries
      .filter(entry => entry.event === 'SkillInputProcessed')
      .map(entry => [entry.data?.castId, entry.frame]);

  it('不同轨道的多个组独立推进，并按原声明顺序与同帧固定输入合并', () => {
    const { receipt, advance } = fixture(
      [
        input('a', 'one', 0),
        input('b', 'one', 1),
        input('c', 'one', 2),
        input('x', 'two', 3),
        input('y', 'two', 4),
        input('fixed', 'three', 5, 2),
      ],
      [
        ['a', 'b', 'c'],
        ['x', 'y'],
      ],
    );
    advance(4);
    expect(processed(receipt)).toEqual([
      ['a', 0],
      ['x', 0],
      ['b', 2],
      ['y', 2],
      ['fixed', 2],
      ['c', 4],
    ]);
  });

  it.each([true, false])('同帧固定输入声明在后段之前：%s，中断后停止旧组', fixedFirst => {
    const { receipt, advance } = fixture(
      [
        input('a', 'one', 0),
        input('b', 'one', fixedFirst ? 2 : 1),
        input('c', 'one', 3),
        input('fixed', 'one', fixedFirst ? 1 : 2, 2),
      ],
      [['a', 'b', 'c']],
    );
    advance(6);
    expect(processed(receipt)).toEqual(
      fixedFirst
        ? [
            ['a', 0],
            ['fixed', 2],
          ]
        : [
            ['a', 0],
            ['b', 2],
            ['fixed', 2],
          ],
    );
    expect(receipt.entries.find(entry => entry.event === 'SkillInputGroupBlocked')?.data).toEqual({
      anchorCastId: 'a',
      castId: fixedFirst ? 'b' : 'c',
      previousCastId: fixedFirst ? 'a' : 'b',
      reason: 'interruptedByFixedInput',
      interruptingCastId: 'fixed',
    });
  });

  it('同轨下一组保持自己的固定锚点，旧组阻断不影响新组后段', () => {
    const { receipt, advance } = fixture(
      [
        input('a', 'one', 0),
        input('b', 'one', 1),
        input('x', 'one', 2, 1),
        input('y', 'one', 3, 1),
      ],
      [
        ['a', 'b'],
        ['x', 'y'],
      ],
    );
    advance(5);
    expect(processed(receipt)).toEqual([
      ['a', 0],
      ['x', 1],
      ['y', 3],
    ]);
  });

  it.each(['a', 'b'])('成员 %s 被拒绝后仅阻断未启动后缀，不伪造输入或开始事实', rejected => {
    const { receipt, advance } = fixture(
      [input('a', 'one', 0), input('b', 'one', 1), input('c', 'one', 2)],
      [['a', 'b', 'c']],
      rejected,
    );
    advance(6);
    expect(processed(receipt)).toEqual(
      rejected === 'a'
        ? [['a', 0]]
        : [
            ['a', 0],
            ['b', 2],
          ],
    );
    expect(
      receipt.entries.find(entry => entry.event === 'SkillInputGroupBlocked')?.data,
    ).toMatchObject({
      previousCastId: rejected,
      castId: rejected === 'a' ? 'b' : 'c',
      reason: 'inputRejected',
    });
  });

  it('被拒绝的固定输入没有中断前段，不能阻断连续组', () => {
    const { receipt, advance } = fixture(
      [input('a', 'one', 0), input('b', 'one', 2), input('fixed', 'one', 1, 2)],
      [['a', 'b']],
      'fixed',
    );
    advance(4);
    expect(processed(receipt)).toEqual([
      ['a', 0],
      ['fixed', 2],
      ['b', 2],
    ]);
    expect(receipt.entries.some(entry => entry.event === 'SkillInputGroupBlocked')).toBe(false);
  });

  it('前段已自然结束也不能跨过同轨后来的固定操作补放旧组', () => {
    const { receipt, advance } = fixture(
      [input('a', 'one', 0), input('b', 'one', 2), input('fixed', 'one', 1, 2)],
      [['a', 'b']],
    );
    advance(1);
    receipt.record({ frame: 1, time: 1 / 30, event: 'SkillEnded', data: { castId: 'a' } });
    advance(4);
    expect(receipt.entries.some(entry => entry.event === 'SkillInterrupted')).toBe(false);
    expect(processed(receipt)).toEqual([
      ['a', 0],
      ['fixed', 2],
    ]);
    expect(
      receipt.entries.find(entry => entry.event === 'SkillInputGroupBlocked')?.data?.reason,
    ).toBe('interruptedByFixedInput');
  });

  it.each([true, false])('临时紧凑规划的后段 accepted=%s 时才接管已启动的持久组', accepted => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const runtime = createRuntime({
      clock,
      receipt,
      inputs: [
        input('x', 'one', 0),
        input('a', 'one', 1, 1),
        input('b', 'one', 2, 1),
        input('y', 'one', 3, 10),
      ],
      tryStartSkill: (_operatorId, _skillId, castId) => castId !== 'y' || accepted,
      skillInputGroups: {
        groups: [{ anchorCastId: 'a', castIds: ['a', 'b'] }],
        canContinue: () => false,
      },
      continuationPlan: {
        castIds: ['x', 'y'],
        ignoreInputFailures: true,
        canContinue: () => clock.frame >= 2,
      },
    });
    runtime.applyCurrentFrame();
    for (let i = 0; i < 3; i += 1) {
      clock.advanceFrame();
      runtime.applyCurrentFrame();
    }
    expect(processed(receipt)).toEqual([
      ['x', 0],
      ['a', 1],
      ['y', 2],
    ]);
    expect(receipt.entries.filter(entry => entry.event === 'SkillInputGroupBlocked')).toHaveLength(
      accepted ? 1 : 0,
    );
  });

  it('模拟截断保留未解析后段，不尝试它的占位帧', () => {
    const { receipt, advance } = fixture(
      [input('a', 'one', 0), input('b', 'one', 1), input('c', 'one', 2)],
      [['a', 'b', 'c']],
    );
    advance(1);
    expect(processed(receipt)).toEqual([['a', 0]]);
    expect(receipt.entries.some(entry => entry.event === 'SkillInputGroupBlocked')).toBe(false);
  });

  it('边界索引忽略自然结束，等到块边界之后的输入帧；零宽也不在同帧接续', () => {
    const receipt = new CombatReceiptCollector();
    const timing = new SkillInputGroupTiming(receipt.history, value =>
      value.skillId === 'zero' ? 0 : 2,
    );
    const previous = input('a', 'one', 0);
    receipt.record({ frame: 1, time: 1 / 30, event: 'SkillEnded', data: { castId: 'a' } });
    expect(timing.canContinue(previous, 2)).toBe(false);
    receipt.record({
      frame: 4,
      time: 4 / 30,
      event: 'SkillOperableBoundaryReached',
      data: { castId: 'a' },
    });
    expect(timing.canContinue(previous, 4)).toBe(false);
    expect(timing.canContinue(previous, 5)).toBe(true);
    expect(timing.canContinue({ ...previous, skillId: 'zero' }, 0)).toBe(false);
    expect(timing.canContinue({ ...previous, skillId: 'zero' }, 1)).toBe(true);
    receipt.record({
      frame: 7,
      time: 7 / 30,
      event: 'SkillSwitchedToBuff',
      data: { castId: 'instant' },
    });
    expect(timing.canContinue({ ...previous, castId: 'instant' }, 7)).toBe(false);
    expect(timing.canContinue({ ...previous, castId: 'instant' }, 8)).toBe(true);
  });
});
