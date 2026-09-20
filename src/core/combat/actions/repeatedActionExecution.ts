/**
 * 重复动作的无状态执行算法。保留 float32 运算、各动作启动语义及严格大于的目标间隔判定。
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
  state.skipInitialTick = parameters.nativeTickInterval === undefined;
  state.timerSeconds = 0;
  state.scanCount = 0;
  state.targetTriggerCount = 0;
  state.lastTargetTriggerSeconds = 0;
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
  const tickInterval = parameters.nativeTickInterval;
  if (tickInterval !== undefined) {
    state.timerSeconds = Math.fround(state.timerSeconds + Math.fround(deltaTime));
    const executeEachFrame =
      tickInterval.executeEachFrame ||
      Math.fround(tickInterval.intervalSeconds) < Math.fround(0.0329900011);
    if (
      executeEachFrame ||
      state.timerSeconds >= Math.fround(state.scanCount * tickInterval.intervalSeconds)
    ) {
      scanRepeatedAction(state, parameters, executeBody);
    }
    return;
  }
  const channeling = parameters.nativeChanneling;
  if (channeling === undefined) {
    executeBody();
    return;
  }
  state.timerSeconds = Math.fround(state.timerSeconds + Math.fround(deltaTime));
  if (
    channeling.executeEachFrame ||
    state.timerSeconds >= Math.fround(state.scanCount * channeling.triggerIntervalSeconds)
  ) {
    scanRepeatedAction(state, parameters, executeBody);
  }
}

export function resetRepeatedAction(state: RepeatedActionState): void {
  state.skipInitialTick = false;
  state.timerSeconds = 0;
  state.scanCount = 0;
  state.targetTriggerCount = 0;
  state.lastTargetTriggerSeconds = 0;
}

function scanRepeatedAction(
  state: RepeatedActionState,
  parameters: RepeatedActionParameters,
  executeBody: () => void,
): void {
  if (parameters.nativeTickInterval !== undefined) {
    state.scanCount += 1;
    executeBody();
    return;
  }
  const channeling = parameters.nativeChanneling;
  if (channeling === undefined) {
    executeBody();
    return;
  }
  state.scanCount += 1;
  if (channeling.maxCountPerTarget >= 0 && state.targetTriggerCount >= channeling.maxCountPerTarget)
    return;
  if (
    state.targetTriggerCount > 0 &&
    !(
      Math.fround(state.timerSeconds - state.lastTargetTriggerSeconds) >
      channeling.targetTriggerIntervalSeconds
    )
  )
    return;
  executeBody();
  state.targetTriggerCount += 1;
  state.lastTargetTriggerSeconds = state.timerSeconds;
}
