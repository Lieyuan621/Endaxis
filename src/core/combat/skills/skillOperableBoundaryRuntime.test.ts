import { describe, expect, it } from 'vitest';
import {
  SkillOperableBoundaryRuntime,
  advanceSkillOperableBoundaries,
  beginSkillOperableBoundary,
} from './skillOperableBoundaryRuntime';
import { StateStepper } from '../runtime/stateStepper';

describe('SkillOperableBoundaryRuntime', () => {
  it('在时间膨胀中保存，恢复后可按另一倍率推进，完成登记也一起恢复', () => {
    const runtime = new SkillOperableBoundaryRuntime();
    runtime.begin('cast', 1, 0);
    runtime.advance(0.25, 1);
    const session = new StateStepper(runtime.runtimeState, (step, delta: number) =>
      advanceSkillOperableBoundaries(step.state, delta, 2),
    );
    const saved = session.save();
    expect(session.step(0.75)).toEqual([{ castId: 'cast', durationFrames: 1, reachedAtFrame: 2 }]);
    expect(session.read().pendingByCastId.size).toBe(0);
    session.restore(saved);
    expect(session.step(0.25)).toEqual([]);
    expect(session.read().pendingByCastId.get('cast')!.accumulatedFrames).toBe(0.5);
    session.restore(saved);
    expect(session.step(0.75)).toHaveLength(1);
    expect(() => beginSkillOperableBoundary(session.read(), 'cast', 1, 2)).toThrow('duplicate');
    expect(runtime.runtimeState.pendingByCastId.get('cast')!.accumulatedFrames).toBe(0.25);
  });

  it('scale=1：累计 30 次 1 帧后，在 updateFrame=30 返回一次边界', () => {
    const runtime = new SkillOperableBoundaryRuntime();
    runtime.begin('cast:normal', 30, 0);

    for (let frame = 1; frame <= 29; frame += 1) {
      expect(runtime.advance(1, frame)).toEqual([]);
    }
    expect(runtime.advance(1, 30)).toEqual([
      { castId: 'cast:normal', durationFrames: 30, reachedAtFrame: 30 },
    ]);
    // 到达后移除，不得重复返回。
    expect(runtime.advance(1, 31)).toEqual([]);
    // 稳定 castId 在一次场景内不应重复使用，完成后也不能再次登记。
    expect(() => runtime.begin('cast:normal', 30, 0)).toThrow('duplicate');
  });

  it('scale=0.5：施法者实体减速时需要 60 个实际帧才返回', () => {
    const runtime = new SkillOperableBoundaryRuntime();
    runtime.begin('cast:slowed', 30, 0);

    for (let frame = 1; frame <= 59; frame += 1) {
      expect(runtime.advance(0.5, frame)).toEqual([]);
    }
    expect(runtime.advance(0.5, 60)).toEqual([
      { castId: 'cast:slowed', durationFrames: 30, reachedAtFrame: 60 },
    ]);
  });

  it('全局冻结但施法者被排除：调用方仍按 delta=1 推进，30 帧后返回', () => {
    const runtime = new SkillOperableBoundaryRuntime();
    runtime.begin('cast:excluded', 30, 0);

    for (let frame = 1; frame <= 29; frame += 1) {
      expect(runtime.advance(1, frame)).toEqual([]);
    }
    expect(runtime.advance(1, 30)).toEqual([
      { castId: 'cast:excluded', durationFrames: 30, reachedAtFrame: 30 },
    ]);
  });

  it('0.2 帧增量累计 150 次时不会因浮点误差晚一帧', () => {
    const runtime = new SkillOperableBoundaryRuntime();
    runtime.begin('cast:fractional', 30, 0);

    for (let frame = 1; frame <= 149; frame += 1) {
      expect(runtime.advance(0.2, frame)).toEqual([]);
    }
    expect(runtime.advance(0.2, 150)).toEqual([
      { castId: 'cast:fractional', durationFrames: 30, reachedAtFrame: 150 },
    ]);
  });

  it('与 sequence 是否结束无关，多个 cast 可以重叠跟踪并各自返回一次', () => {
    const runtime = new SkillOperableBoundaryRuntime();
    runtime.begin('cast:short', 10, 0);
    runtime.begin('cast:long', 20, 0);

    for (let frame = 1; frame <= 9; frame += 1) {
      expect(runtime.advance(1, frame)).toEqual([]);
    }
    expect(runtime.advance(1, 10)).toEqual([
      { castId: 'cast:short', durationFrames: 10, reachedAtFrame: 10 },
    ]);
    // 短序列已经到达，但长序列仍继续累计；本模块不关心前者的 sequence 是否自然结束。
    for (let frame = 11; frame <= 19; frame += 1) {
      expect(runtime.advance(1, frame)).toEqual([]);
    }
    expect(runtime.advance(1, 20)).toEqual([
      { castId: 'cast:long', durationFrames: 20, reachedAtFrame: 20 },
    ]);
  });

  it('拒绝非法输入、0 delta 不推进，并拒绝同 castId 重复登记', () => {
    const runtime = new SkillOperableBoundaryRuntime();

    expect(() => runtime.begin('', 30, 0)).toThrow('castId');
    expect(() => runtime.begin('cast:bad', 0, 0)).toThrow('durationFrames');
    expect(() => runtime.begin('cast:bad', Number.NaN, 0)).toThrow('durationFrames');
    expect(() => runtime.begin('cast:bad', 30, 0.5)).toThrow('actualStartFrame');

    runtime.begin('cast:once', 10, 0);
    expect(() => runtime.begin('cast:once', 10, 0)).toThrow('duplicate');

    expect(() => runtime.advance(-1, 1)).toThrow('deltaFrames');
    expect(() => runtime.advance(Number.POSITIVE_INFINITY, 1)).toThrow('deltaFrames');
    expect(() => runtime.advance(1, 1.5)).toThrow('updateFrame');
    expect(runtime.advance(1, -1)).toEqual([]);

    expect(runtime.advance(0, 10)).toEqual([]);
    expect(runtime.advance(1, 1)).toEqual([]);
  });

  it('tracks an operable boundary across preparation-time frames', () => {
    const runtime = new SkillOperableBoundaryRuntime();
    runtime.begin('cast:prep', 2, -3);

    expect(runtime.advance(1, -3)).toEqual([]);
    expect(runtime.advance(1, -2)).toEqual([]);
    expect(runtime.advance(1, -1)).toEqual([
      { castId: 'cast:prep', durationFrames: 2, reachedAtFrame: -1 },
    ]);
  });

  it('does not consume a full local frame on the same actual frame that starts the cast', () => {
    const runtime = new SkillOperableBoundaryRuntime();
    runtime.begin('cast:later', 2, 10);

    expect(runtime.advance(1, 10)).toEqual([]);
    expect(runtime.advance(1, 11)).toEqual([]);
    expect(runtime.advance(1, 12)).toEqual([
      { castId: 'cast:later', durationFrames: 2, reachedAtFrame: 12 },
    ]);
  });
});
