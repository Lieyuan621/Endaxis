/**
 * 全部运行时系统共享的确定性时间来源。
 * 调用方以整数帧推进，不能混入墙上时钟或自行维护另一套秒制时间。
 */
export const COMBAT_FRAMES_PER_SECOND = 30 as const;
export const COMBAT_FRAME_INTERVAL = 1 / COMBAT_FRAMES_PER_SECOND;
import type { CombatClockState } from '../state/environmentState';

/** 只在开始推进前设置准备期起点，保持原有起点检查。 */
export function initializeCombatFrame(state: CombatClockState, frame: number): void {
  if (!Number.isInteger(frame) || frame > 0) {
    throw new RangeError('initial combat frame must be a non-positive integer');
  }
  if (state.frame !== 0) throw new Error('combat clock has already started');
  state.frame = frame;
}

export function advanceCombatFrame(state: CombatClockState): void {
  state.frame += 1;
}

/** 一次模拟的可推进帧时钟；同一实例不得被多个模拟共享。 */
export class CombatClock {
  constructor(readonly runtimeState: CombatClockState = { frame: 0 }) {}

  /** 仅供一次战斗装配在任何运行时开始前设置准备期起点。 */
  initializeFrame(frame: number): void {
    initializeCombatFrame(this.runtimeState, frame);
  }

  get frame(): number {
    return this.runtimeState.frame;
  }

  get time(): number {
    return this.runtimeState.frame / COMBAT_FRAMES_PER_SECOND;
  }

  advanceFrame(): void {
    advanceCombatFrame(this.runtimeState);
  }
}
