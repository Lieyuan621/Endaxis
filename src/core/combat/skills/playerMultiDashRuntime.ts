/**
 * PlayerController 的全队连续闪避窗口。
 *
 * 计数与距上次闪避的时间属于玩家控制器，切换干员不会重置；具体干员的 AbilitySystem
 * 只提供当前连续闪避上限覆盖。该运行时每帧只能推进一次。
 */
import type { PlayerMultiDashState } from '../state/environmentState';
import type { DashTimingProgram } from './operatorCenterStateRuntime';

const DEFAULT_MULTI_DASH_LIMIT = 2;

export class PlayerMultiDashRuntime {
  constructor(
    private readonly timing?: Pick<
      DashTimingProgram,
      'dashInputCooldownFrames' | 'dashSecondDashIntervalFrames'
    >,
  ) {
    if (timing !== undefined)
      for (const [name, frames] of Object.entries(timing))
        if (!Number.isFinite(frames) || frames < 0)
          throw new RangeError(`${name} must be non-negative`);
  }

  /** 实际执行输入后更新全队唯一的连续闪避串；非法输入也照常进入模拟。 */
  recordDash(state: PlayerMultiDashState): void {
    const inputBoundary = this.#inputBoundary();
    if (state.framesSinceLastDash === null || state.framesSinceLastDash >= inputBoundary) {
      state.count = 1;
    } else {
      state.count += 1;
    }
    state.framesSinceLastDash = 0;
  }

  /** PlayerController 的时间只乘全局倍率，不读取当前干员的局部倍率。 */
  advanceFrame(state: PlayerMultiDashState, globalDeltaFrames: number): void {
    if (!Number.isFinite(globalDeltaFrames) || globalDeltaFrames < 0)
      throw new RangeError('multi-dash globalDeltaFrames must be non-negative');
    if (state.framesSinceLastDash !== null) {
      state.framesSinceLastDash += globalDeltaFrames;
    }
  }

  /** 上限来自本次输入干员的 AbilitySystem；计数与时间始终来自共享玩家状态。 */
  inspect(state: Readonly<PlayerMultiDashState>, limitOverride: number | null) {
    const limit = limitOverride ?? DEFAULT_MULTI_DASH_LIMIT;
    const startsNewDashChain =
      state.framesSinceLastDash === null || state.framesSinceLastDash >= this.#inputBoundary();
    const repeatDashTooEarly =
      !startsNewDashChain && state.framesSinceLastDash! < this.#secondDashBoundary();
    const multiDashLimitReached = !startsNewDashChain && state.count >= limit;
    return {
      canStartMultiDash:
        this.timing === undefined ? null : !repeatDashTooEarly && !multiDashLimitReached,
      repeatDashTooEarly: this.timing === undefined ? null : repeatDashTooEarly,
      multiDashLimitReached: this.timing === undefined ? null : multiDashLimitReached,
      multiDashCount: state.count,
      multiDashLimit: limit,
    } as const;
  }

  #inputBoundary(): number {
    return Math.max(0, (this.timing?.dashInputCooldownFrames ?? 0) - 1);
  }

  #secondDashBoundary(): number {
    return Math.max(0, (this.timing?.dashSecondDashIntervalFrames ?? 0) - 1);
  }
}
