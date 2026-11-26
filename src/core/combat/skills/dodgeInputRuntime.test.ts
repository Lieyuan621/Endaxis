import { describe, expect, it, vi } from 'vitest';
import { createDodgeInputState, type ScheduledDodgeInput } from '../state/environmentState';
import { DodgeInputRuntime } from './dodgeInputRuntime';

const dash = (frame: number, dodgeId: string): ScheduledDodgeInput => ({
  kind: 'dash',
  frame,
  dodgeId,
  operatorId: 'op',
  direction: 'forward',
});

describe('DodgeInputRuntime', () => {
  it('允许准备区输入，按声明顺序执行同帧 Dash 与成功事实', () => {
    const state = createDodgeInputState();
    const events: string[] = [];
    const runtime = new DodgeInputRuntime({
      clock: { frame: -12 },
      inputs: [
        dash(-12, 'prep'),
        { kind: 'perfectDodgeSuccess', frame: -12, dodgeId: 'prep', operatorId: 'op' },
      ],
      executeDash: input => events.push('dash:' + input.dodgeId),
      declarePerfectDodgeSuccess: input => events.push('success:' + input.dodgeId),
    });
    runtime.applyCurrentFrame(state);
    expect(events).toEqual(['dash:prep', 'success:prep']);
    expect(state.declaredSuccessIds.has('prep')).toBe(true);
  });

  it('恢复后不重放过去输入，算法可以推进不同分支的数据', () => {
    const clock = { frame: 10 };
    const executeDash = vi.fn();
    const state = createDodgeInputState();
    const options = {
      clock,
      inputs: [dash(10, 'd1'), dash(21, 'd2')],
      executeDash,
      declarePerfectDodgeSuccess: vi.fn(),
    };
    const runtime = new DodgeInputRuntime(options);
    runtime.applyCurrentFrame(state);
    const branch = structuredClone(state);
    const restored = new DodgeInputRuntime({ ...options, inputBoundary: clock.frame + 1 });
    clock.frame = 20;
    restored.applyCurrentFrame(branch);
    expect(executeDash).toHaveBeenCalledTimes(1);
    clock.frame = 21;
    restored.applyCurrentFrame(branch);
    expect(executeDash).toHaveBeenCalledTimes(2);
    expect([...state.executedDashIds]).toEqual(['d1']);
    expect([...branch.executedDashIds]).toEqual(['d1', 'd2']);
  });

  it('逐帧输入及恢复后都不能重复消费同一声明', () => {
    const state = createDodgeInputState();
    const executeDash = vi.fn();
    const declarePerfectDodgeSuccess = vi.fn();
    const options = { clock: { frame: 1 }, inputs: [], executeDash, declarePerfectDodgeSuccess };
    const runtime = new DodgeInputRuntime(options);
    const success: ScheduledDodgeInput = {
      kind: 'perfectDodgeSuccess',
      frame: 1,
      dodgeId: 'd1',
      operatorId: 'op',
    };
    runtime.applyInput(state, dash(1, 'd1'));
    runtime.applyInput(state, success);
    const branch = structuredClone(state);
    const restored = new DodgeInputRuntime(options);
    expect(() => restored.applyInput(branch, dash(1, 'd1'))).toThrow('duplicate dash');
    expect(() => restored.applyInput(branch, success)).toThrow('duplicate perfectDodgeSuccess');
    expect(executeDash).toHaveBeenCalledOnce();
    expect(declarePerfectDodgeSuccess).toHaveBeenCalledOnce();
  });
});
