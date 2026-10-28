import { expect, it } from 'vitest';
import { createProjectileScheduleState } from '../state/projectileScheduleState';
import { advanceProjectileSchedule } from './projectileScheduleExecution';

it('orders repeated and same-frame callbacks and resumes without replay', () => {
  const state = createProjectileScheduleState({
    endFrame: 9,
    callbacks: [
      { event: 'reach', triggerFrames: [0, 3, 9] },
      { event: 'hit', triggerFrames: [3] },
    ],
  });
  const calls: number[] = [];
  advanceProjectileSchedule(
    state,
    0,
    () => true,
    index => calls.push(index),
  );
  advanceProjectileSchedule(
    state,
    3 / 30,
    () => true,
    index => calls.push(index),
  );
  expect(calls).toEqual([0, 0, 1]);
  const restored = structuredClone(state);
  advanceProjectileSchedule(
    restored,
    6 / 30,
    () => true,
    index => calls.push(index),
  );
  expect(calls).toEqual([0, 0, 1, 0]);
});

it('stops the remaining same-frame callbacks when an invocation destroys the instance', () => {
  const state = createProjectileScheduleState({
    endFrame: 3,
    callbacks: [
      { event: 'hit', triggerFrames: [3] },
      { event: 'finish', triggerFrames: [3] },
    ],
  });
  let active = true;
  const calls: number[] = [];
  advanceProjectileSchedule(
    state,
    3 / 30,
    () => active,
    index => {
      calls.push(index);
      active = false;
    },
  );
  expect(calls).toEqual([0]);
});
