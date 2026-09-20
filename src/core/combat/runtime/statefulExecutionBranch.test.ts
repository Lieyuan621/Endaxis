/**
 * 在一个明确完整的小型数据根上串联生产中的 Buff 周期触发、Ability 事件、投射物和随机算法。
 * 用于验证分支恢复的跨模块因果关系；不冒充技能、Buff 容器和整场装配的完整迁移验收。
 */
import { expect, it } from 'vitest';
import {
  advanceProjectileLifetimes,
  launchProjectile,
  registerProjectileReset,
} from '../abilities/projectileLifecycleExecution';
import { advanceBuffTriggers } from '../buffs/buffLifecycleExecution';
import {
  dispatchAbilityEvent,
  registerAbilityEvent,
  unregisterAbilityEvent,
} from '../events/abilityEventExecution';
import { takeSimulationRandomSample, type SimulationRandomMode } from '../random/simulationRandom';
import { createSimulationRandomState } from '../state/environmentState';
import { createAbilityEventState } from '../state/foundationState';
import { createBuffTriggerState, createProjectileLifecycleState } from '../state/instanceState';
import { StateStepper, type StateStep } from './stateStepper';

const DELTA = 1 / 30;

function initialState(mode: SimulationRandomMode) {
  return {
    frame: -1,
    nextEntityId: 1,
    mode,
    enabled: false,
    subscription: null as number | null,
    trigger: createBuffTriggerState(),
    events: createAbilityEventState<'buffTrigger'>(),
    projectiles: createProjectileLifecycleState(),
    random: createSimulationRandomState(),
    damage: [] as { frame: number; instanceId: number; sample: number }[],
    reset: [] as number[],
  };
}

type BranchState = ReturnType<typeof initialState>;
type BranchInput = 'start' | 'stop' | 'advance';

function executeFrame(step: StateStep<BranchState>, input: BranchInput): void {
  const state = step.state;
  state.frame++;
  advanceProjectileLifetimes(state.projectiles, {
    resolveTickDeltaSeconds: () => DELTA,
    finish: instanceId => {
      state.damage.push({
        frame: state.frame,
        instanceId,
        sample: takeSimulationRandomSample(
          state.random,
          { mode: state.mode, globalSeed: 123 },
          'critical',
        ),
      });
    },
    beforeReset: () => {},
    resolveResetHandler: instanceId => () => {
      state.reset.push(instanceId);
    },
    released: () => {},
  });
  if (state.enabled) {
    advanceBuffTriggers(state.trigger, DELTA, {
      isEnabled: () => state.enabled,
      trigger: () =>
        dispatchAbilityEvent(state.events, 'buffTrigger', {
          resolveHandler: () => () => {
            const id = state.nextEntityId++;
            launchProjectile(state.projectiles, id, {
              finishDelaySeconds: { reachAfterTicks: 2, maxDurationSeconds: 10 },
              recycleDelaySeconds: 0,
            });
            registerProjectileReset(state.projectiles, id, id);
          },
        }),
    });
  }
  // 输入发生在本帧组件和 Buff 推进之后，不能把未来输入预先混入当前状态。
  if (input === 'start') {
    state.enabled = true;
    state.trigger = { intervalSeconds: 2 * DELTA, remainingSeconds: 2 * DELTA, remainingCount: 2 };
    state.subscription = registerAbilityEvent(state.events, 'buffTrigger', 'action', 1, 10);
  } else if (input === 'stop') {
    state.enabled = false;
    if (state.subscription !== null)
      unregisterAbilityEvent(state.events, 'buffTrigger', 'action', state.subscription);
    state.subscription = null;
  }
}

function runToEnd(
  runtime: StateStepper<BranchState, BranchInput, void>,
  next: BranchInput,
): BranchState {
  runtime.step(next);
  for (let frame = 4; frame <= 10; frame++) runtime.step('advance');
  return runtime.read();
}

it.each(['expected', 'sampled'] as const)(
  '%s：Buff 触发后的在途投射物、事件与随机位置在兄弟分支中完整恢复',
  mode => {
    const runtime = new StateStepper(initialState(mode), executeFrame);
    runtime.step('start');
    runtime.step('advance');
    runtime.step('advance');
    expect(runtime.read().projectiles.instances.size).toBe(1);
    const base = runtime.save();

    const resultA = runToEnd(runtime, 'advance');
    const branchA = runtime.save();
    runtime.restore(base);
    const resultB = runToEnd(runtime, 'stop');
    const branchB = runtime.save();
    expect(resultA.damage.map(hit => hit.frame)).toEqual([4, 6]);
    expect(resultB.damage.map(hit => hit.frame)).toEqual([4]);
    expect(resultB.damage[0]).toEqual(resultA.damage[0]);
    expect(resultA.reset).toEqual([1, 2]);
    expect(resultB.reset).toEqual([1]);

    for (let attempt = 0; attempt < 3; attempt++) {
      runtime.restore(branchA);
      expect(runtime.read()).toEqual(resultA);
      runtime.restore(branchB);
      expect(runtime.read()).toEqual(resultB);
      runtime.restore(base);
      expect(runToEnd(runtime, 'advance')).toEqual(resultA);
    }

    const fromStart = new StateStepper(initialState(mode), executeFrame);
    fromStart.step('start');
    fromStart.step('advance');
    fromStart.step('advance');
    expect(runToEnd(fromStart, 'stop')).toEqual(resultB);
  },
);

it('补触发期间关闭宿主会停止后续触发，恢复后仍可完整重跑', () => {
  const runtime = new StateStepper(
    {
      enabled: true,
      calls: 0,
      trigger: { intervalSeconds: 1, remainingSeconds: 0, remainingCount: 5 },
    },
    (step, disable: boolean) => {
      const state = step.state;
      advanceBuffTriggers(state.trigger, 3, {
        isEnabled: () => state.enabled,
        trigger: () => {
          state.calls++;
          if (disable) state.enabled = false;
        },
      });
    },
  );
  const base = runtime.save();
  runtime.step(true);
  expect(runtime.read().calls).toBe(1);
  runtime.restore(base);
  runtime.step(false);
  expect(runtime.read().calls).toBe(4);
});
