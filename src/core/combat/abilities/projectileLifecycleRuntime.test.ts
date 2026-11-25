import { describe, expect, it, vi } from 'vitest';
import { ProjectileLifecycleRuntime } from './projectileLifecycleRuntime';
import { AbilityEntityInstanceIdAllocator } from './abilityEntityInstanceIdAllocator';

const ports = () => ({
  resolveTickDeltaSeconds: () => 1 / 30,
  finish: vi.fn(),
  beforeReset: vi.fn(),
});
const schedule = { endFrame: 1, callbacks: [] };

describe('projectile scheduled lifecycle', () => {
  it('zero-frame callbacks run after binding, then retire without inventing a finish callback', () => {
    const runtime = new ProjectileLifecycleRuntime();
    const host = ports();
    const invoke = vi.fn();
    const entity = runtime.launch({
      ...host,
      schedule: {
        endFrame: 0,
        callbacks: [{ event: 'hit', triggerFrames: [0] }],
      },
      recycleDelaySeconds: 0,
      invokeScheduledCallback: invoke,
    });
    expect(invoke).not.toHaveBeenCalled();
    entity.startSchedule();
    entity.startSchedule();
    expect(invoke).toHaveBeenCalledExactlyOnceWith(0);
    expect(runtime.getUnfinishedTargets()).toEqual([]);
    runtime.advanceFrame();
    runtime.advanceFrame();
    expect(host.finish).not.toHaveBeenCalled();
    expect(host.beforeReset).toHaveBeenCalledOnce();
  });

  it('keeps the source during reset notifications and releases it afterward', () => {
    const runtime = new ProjectileLifecycleRuntime();
    const entity = runtime.launch({
      ...ports(),
      schedule,
      recycleDelaySeconds: 0,
      source: { kind: 'operator', operatorId: 'source' },
    });
    const reset = vi.fn(() =>
      expect(runtime.findSource(entity.instanceId)).toEqual({
        kind: 'operator',
        operatorId: 'source',
      }),
    );
    entity.onReset(reset);
    runtime.advanceFrame();
    expect(runtime.getUnfinishedTargets()).toEqual([]);
    expect(reset).not.toHaveBeenCalled();
    runtime.advanceFrame();
    expect(reset).not.toHaveBeenCalled();
    runtime.advanceFrame();
    expect(reset).toHaveBeenCalledOnce();
    expect(runtime.findSource(entity.instanceId)).toBeUndefined();
  });

  it('does not reset a marked instance while its tick is suspended', () => {
    let delta: number | null = 1 / 30;
    const runtime = new ProjectileLifecycleRuntime();
    const host = ports();
    runtime.launch({
      ...host,
      schedule,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => delta,
    });
    runtime.advanceFrame();
    runtime.advanceFrame();
    delta = null;
    runtime.advanceFrame();
    expect(host.beforeReset).not.toHaveBeenCalled();
    delta = 1 / 30;
    runtime.advanceFrame();
    expect(host.beforeReset).toHaveBeenCalledOnce();
  });

  it('does not advance a projectile created during the current lifecycle pass', () => {
    const runtime = new ProjectileLifecycleRuntime();
    const calls: string[] = [];
    runtime.launch({
      ...ports(),
      schedule: {
        endFrame: 1,
        callbacks: [{ event: 'hit', triggerFrames: [1] }],
      },
      recycleDelaySeconds: 0,
      invokeScheduledCallback: () => {
        calls.push('parent');
        runtime.launch({
          ...ports(),
          schedule: {
            endFrame: 1,
            callbacks: [{ event: 'hit', triggerFrames: [1] }],
          },
          recycleDelaySeconds: 0,
          invokeScheduledCallback: () => calls.push('child'),
        });
      },
    });
    runtime.advanceFrame();
    expect(calls).toEqual(['parent']);
    runtime.advanceFrame();
    expect(calls).toEqual(['parent', 'child']);
  });

  it('uses the shared entity allocator and does not recycle identities', () => {
    const allocator = new AbilityEntityInstanceIdAllocator();
    const runtime = new ProjectileLifecycleRuntime(() => allocator.allocate());
    const first = runtime.launch({ ...ports(), schedule, recycleDelaySeconds: 0 });
    const other = allocator.allocate();
    runtime.advanceFrame();
    runtime.advanceFrame();
    runtime.advanceFrame();
    const second = runtime.launch({ ...ports(), schedule, recycleDelaySeconds: 0 });
    expect(new Set([first.instanceId, other, second.instanceId]).size).toBe(3);
  });
});
