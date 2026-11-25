import { expect, it, vi } from 'vitest';
import { ProjectileLifecycleRuntime } from './projectileLifecycleRuntime';

it('runs scheduled instances without movement and preserves explicit destruction semantics', () => {
  const runtime = new ProjectileLifecycleRuntime();
  const calls: number[] = [];
  const finish = vi.fn();
  const reset = vi.fn();
  const entity = runtime.launch({
    schedule: {
      endFrame: 9,
      callbacks: [
        { event: 'hit', triggerFrames: [0, 3, 9] },
        { event: 'finish', triggerFrames: [9] },
      ],
    },
    recycleDelaySeconds: 0,
    resolveTickDeltaSeconds: () => 1 / 30,
    invokeScheduledCallback: index => (index === 1 ? finish() : calls.push(index)),
    beforeReset: reset,
  });
  entity.startSchedule();
  expect(calls).toEqual([0]);
  for (let frame = 0; frame < 3; frame++) runtime.advanceFrame();
  expect(calls).toEqual([0, 0]);
  runtime.finishByAction(entity.target);
  for (let frame = 0; frame < 12; frame++) runtime.advanceFrame();
  expect(calls).toEqual([0, 0]);
  expect(finish).not.toHaveBeenCalled();
  expect(reset).toHaveBeenCalledOnce();
});

it('restores the logical schedule cursor independently of the original instance', () => {
  const runtime = new ProjectileLifecycleRuntime();
  const first = vi.fn();
  const later = vi.fn();
  const ports = { resolveTickDeltaSeconds: () => 1 / 30, beforeReset: vi.fn() };
  const entity = runtime.launch({
    ...ports,
    invokeScheduledCallback: first,
    recycleDelaySeconds: 0,
    schedule: {
      endFrame: 3,
      callbacks: [{ event: 'hit', triggerFrames: [0, 3] }],
    },
  });
  entity.startSchedule();
  runtime.advanceFrame();
  const restored = new ProjectileLifecycleRuntime(() => 2, {
    state: structuredClone(runtime.runtimeState),
    resolveHost: () => ({ ...ports, invokeScheduledCallback: later }),
  });
  restored.advanceFrame();
  restored.advanceFrame();
  expect(first).toHaveBeenCalledTimes(1);
  expect(later).toHaveBeenCalledTimes(1);
});
