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
  // TickIntervalAction.ExecuteInternal 主动 OnTick(0)，但不跳过后续普通 Tick。
  // 其他重复动作保留各自启动语义。
  scanRepeatedAction(state, parameters, executeBody);
}

export function tickRepeatedAction(
  state: RepeatedActionState,
  parameters: RepeatedActionParameters,
  deltaTime: number,
  executeBody: () => void,
): void {
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
