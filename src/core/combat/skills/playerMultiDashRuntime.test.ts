import { describe, expect, it } from 'vitest';
import { createPlayerMultiDashState } from '../state/environmentState';
import { PlayerMultiDashRuntime } from './playerMultiDashRuntime';

const timing = { dashInputCooldownFrames: 24, dashSecondDashIntervalFrames: 9 };

describe('PlayerMultiDashRuntime', () => {
  it('按原生内外窗口累计全队连续 Dash，并按本次输入角色读取上限', () => {
    const state = createPlayerMultiDashState();
    const runtime = new PlayerMultiDashRuntime(timing);

    runtime.recordDash(state);
    expect(runtime.inspect(state, null)).toMatchObject({
      repeatDashTooEarly: true,
      multiDashLimitReached: false,
      multiDashCount: 1,
      multiDashLimit: 2,
    });
    for (let frame = 0; frame < 8; frame++) runtime.advanceFrame(state, 1);
    expect(runtime.inspect(state, null).canStartMultiDash).toBe(true);
    runtime.recordDash(state);
    for (let frame = 0; frame < 8; frame++) runtime.advanceFrame(state, 1);
    expect(runtime.inspect(state, null)).toMatchObject({
      canStartMultiDash: false,
      multiDashLimitReached: true,
      multiDashCount: 2,
    });

    // 切换到有无限连续闪避覆盖的角色时，沿用同一份玩家计数而不是重新起串。
    expect(runtime.inspect(state, 0x7fffffff).canStartMultiDash).toBe(true);
    runtime.recordDash(state);
    expect(state.count).toBe(3);
    for (let frame = 0; frame < 23; frame++) runtime.advanceFrame(state, 1);
    runtime.recordDash(state);
    expect(state.count).toBe(1);
  });

  it('恢复后直接绑定同一份共享状态', () => {
    const state = { framesSinceLastDash: 7, count: 2 };
    const restored = new PlayerMultiDashRuntime(timing);

    restored.advanceFrame(state, 1);

    expect(state).toEqual({ framesSinceLastDash: 8, count: 2 });
    expect(restored.inspect(state, 3)).toMatchObject({
      canStartMultiDash: true,
      multiDashCount: 2,
      multiDashLimit: 3,
    });
  });

  it('全局时间缩放会减慢共享连续闪避窗口', () => {
    const state = createPlayerMultiDashState();
    const runtime = new PlayerMultiDashRuntime(timing);
    runtime.recordDash(state);
    runtime.advanceFrame(state, 0);
    expect(state.framesSinceLastDash).toBe(0);
    for (let frame = 0; frame < 15; frame += 1) runtime.advanceFrame(state, 0.5);
    expect(state.framesSinceLastDash).toBe(7.5);
    expect(runtime.inspect(state, null).repeatDashTooEarly).toBe(true);
    runtime.advanceFrame(state, 0.5);
    expect(runtime.inspect(state, null).canStartMultiDash).toBe(true);
  });
});
