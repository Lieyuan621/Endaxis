import type { CombatStepParameters } from '../../../../packages/game-data-contract/src/actions';
import type { RuntimeTargetRef, RuntimeTargetGroup } from '../../game-data/logicalAbilityEntity';
import type { ChannelingActionState } from '../state/actionState';

type Parameters = NonNullable<CombatStepParameters['repeatEachTick']['nativeChanneling']>;

export function endChanneling(state: ChannelingActionState): void {
  state.timerSeconds = 0;
  state.scanCount = 0;
  state.inputTarget = null;
  state.targets.clear();
}

export function tickChanneling(
  state: ChannelingActionState,
  parameters: Parameters,
  frame: number,
  delta: number,
  query: () => RuntimeTargetGroup,
  execute: (target: RuntimeTargetRef) => void,
): void {
  state.timerSeconds = Math.fround(state.timerSeconds + Math.fround(delta));
  if (parameters.catchUpMissedTicks) {
    // 原生 V2 把小于 0.03299 秒的周期改为逐帧，避免补轮次循环无法前进。
    if (
      !parameters.executeEachFrame &&
      Math.fround(parameters.triggerIntervalSeconds) >= Math.fround(0.03299)
    ) {
      let logicalTime = Math.fround(
        Math.fround(state.scanCount) * Math.fround(parameters.triggerIntervalSeconds),
      );
      while (state.timerSeconds >= logicalTime) {
        scanChannelingTargets(state, parameters, logicalTime, query, execute);
        logicalTime = Math.fround(
          Math.fround(state.scanCount) * Math.fround(parameters.triggerIntervalSeconds),
        );
      }
      return;
    }
    const previousFrame = state.checkFrame;
    state.checkFrame = frame;
    if (previousFrame === frame) return;
    const count = previousFrame < 0 ? 1 : frame - previousFrame;
    if (count <= 0) return;
    const interval = Math.fround(Math.fround(delta) / count);
    // 每目标间隔按各轮逻辑时间判断，不能让补出的所有轮次共用 Tick 末尾时间。
    for (let remaining = count - 1; remaining >= 0; remaining--) {
      const logicalTime = Math.fround(
        state.timerSeconds - Math.fround(Math.fround(remaining) * interval),
      );
      scanChannelingTargets(state, parameters, logicalTime, query, execute);
    }
    return;
  }
  const previousFrame = state.checkFrame;
  state.checkFrame = frame;
  if (
    !(parameters.executeEachFrame && previousFrame !== frame) &&
    state.timerSeconds <
      Math.fround(Math.fround(state.scanCount) * Math.fround(parameters.triggerIntervalSeconds))
  )
    return;
  scanChannelingTargets(state, parameters, state.timerSeconds, query, execute);
}

function scanChannelingTargets(
  state: ChannelingActionState,
  parameters: Parameters,
  logicalTime: number,
  query: () => RuntimeTargetGroup,
  execute: (target: RuntimeTargetRef) => void,
): void {
  state.scanCount++;
  for (const target of query()) {
    // 空间点没有原生 AbilitySystem 或 IHittableObject 身份。
    if (target.kind === 'spatialPoint') continue;
    const key =
      target.kind === 'operator'
        ? `operator:${target.operatorId}`
        : target.kind === 'abilityEntity'
          ? `abilityEntity:${target.instanceId}`
          : 'enemy';
    const record = state.targets.get(key) ?? { count: 0, lastTriggerTime: 0 };
    if (parameters.maxCountPerTarget >= 0 && record.count >= parameters.maxCountPerTarget) continue;
    if (
      record.count > 0 &&
      !(
        Math.fround(logicalTime - record.lastTriggerTime) >
        Math.fround(parameters.targetTriggerIntervalSeconds)
      )
    )
      continue;
    execute(target);
    state.targets.set(key, { count: record.count + 1, lastTriggerTime: logicalTime });
  }
}
