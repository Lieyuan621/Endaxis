/**
 * 重复动作的无状态执行算法。保留 float32 运算及各动作启动语义。
 * 执行动作体的端口只在本次调用内使用；计数赋值与同步动作的先后顺序保持不变。
 */
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { RepeatedActionState } from '../state/actionState';

type RepeatedActionParameters = ResolvedCombatStepForKind<'repeatEachTick'>['parameters'];

export function executeRepeatedAction(
  state: RepeatedActionState,
  parameters: RepeatedActionParameters,
  executeBody: () => void,
): void {
  state.skipInitialTick =
    parameters.nativeTickInterval === undefined && parameters.nativeExecuteInterval === undefined;
  state.timerSeconds = 0;
  state.scanCount = 0;
  state.checkFrame = -1;
  if (parameters.nativeTickIntervalV2) {
    state.skipInitialTick = false;
    return;
  }
  // TickIntervalAction.ExecuteInternal 主动 OnTick(0)，但不跳过后续普通 Tick。
  // 其他重复动作保留各自启动语义。
  scanRepeatedAction(state, parameters, executeBody);
}

export function tickRepeatedAction(
  state: RepeatedActionState,
  parameters: RepeatedActionParameters,
  deltaTime: number,
  executeBody: () => void,
  frame?: number,
): void {
  if (parameters.nativeTickIntervalV2) {
    if (frame === undefined) throw new Error('TickIntervalV2 requires a frame clock');
    tickIntervalV2(state, parameters.nativeTickIntervalV2, deltaTime, frame, executeBody);
    return;
  }
  if (state.skipInitialTick) {
    state.skipInitialTick = false;
    return;
  }
  const tickInterval = parameters.nativeTickInterval ?? parameters.nativeExecuteInterval;
  if (tickInterval !== undefined) {
    state.timerSeconds = Math.fround(state.timerSeconds + Math.fround(deltaTime));
    const executeEachFrame =
      tickInterval.executeEachFrame ||
      (parameters.nativeTickInterval !== undefined &&
        Math.fround(tickInterval.intervalSeconds) < Math.fround(0.0329900011));
    if (
      executeEachFrame ||
      state.timerSeconds >= Math.fround(state.scanCount * tickInterval.intervalSeconds)
    ) {
      scanRepeatedAction(state, parameters, executeBody);
    }
    return;
  }
  executeBody();
}

export function resetRepeatedAction(state: RepeatedActionState): void {
  state.skipInitialTick = false;
  state.timerSeconds = 0;
  state.scanCount = 0;
}

function scanRepeatedAction(
  state: RepeatedActionState,
  parameters: RepeatedActionParameters,
  executeBody: () => void,
): void {
  if (
    parameters.nativeTickInterval !== undefined ||
    parameters.nativeExecuteInterval !== undefined
  ) {
    state.scanCount += 1;
    executeBody();
    return;
  }
  executeBody();
}

function tickIntervalV2(
  state: RepeatedActionState,
  parameters: NonNullable<RepeatedActionParameters['nativeTickIntervalV2']>,
  delta: number,
  frame: number,
  body: () => void,
): void {
  state.timerSeconds = Math.fround(state.timerSeconds + Math.fround(delta));
  const eachFrame =
    parameters.executeEachFrame ||
    Math.fround(parameters.intervalSeconds) < Math.fround(0.0329900011);
  const count = eachFrame ? (state.checkFrame < 0 ? 1 : Math.max(0, frame - state.checkFrame)) : 1;
  state.checkFrame = frame;
  for (let i = 0; i < count; i++) {
    if (parameters.totalTickCount > 0 && state.scanCount >= parameters.totalTickCount) break;
    if (
      !eachFrame &&
      state.timerSeconds < Math.fround(state.scanCount * Math.fround(parameters.intervalSeconds))
    )
      break;
    state.scanCount++;
    body();
  }
}

/** V2 仅在累计时间达到配置时长后补齐，提前结束不自动补齐。 */
export function finishRepeatedAction(
  state: RepeatedActionState,
  parameters: RepeatedActionParameters,
  body: () => void,
): void {
  const tick = parameters.nativeTickIntervalV2;
  if (!tick) return;
  if (
    tick.totalTickCount > 0 &&
    tick.totalDurationSeconds > 0 &&
    state.timerSeconds >= Math.fround(tick.totalDurationSeconds)
  ) {
    while (state.scanCount < tick.totalTickCount) {
      state.scanCount++;
      body();
    }
  }
  resetRepeatedAction(state);
}
