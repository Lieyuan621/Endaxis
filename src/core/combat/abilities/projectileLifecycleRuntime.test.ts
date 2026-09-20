import { describe, expect, it, vi } from 'vitest';
import { ProjectileLifecycleRuntime } from './projectileLifecycleRuntime';
import { AbilityEntityInstanceIdAllocator } from './abilityEntityInstanceIdAllocator';
import { LogicalAbilityEntityRuntime } from './logicalAbilityEntityRuntime';

describe('ProjectileLifecycleRuntime', () => {
  it.each([1, 2, 3])('从寿命阶段 %s 恢复，不重放回调且旧注销不影响新分支', ticks => {
    const oldCalls: string[] = [];
    const original = new ProjectileLifecycleRuntime(() => 10);
    const ref = original.launch({
      finishDelaySeconds: { reachAfterTicks: 2, maxDurationSeconds: 5 },
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 0.1,
      finish: () => oldCalls.push('finish'),
      beforeReset: () => oldCalls.push('beforeReset'),
    });
    const registration = ref.onReset(() => oldCalls.push('reset'));
    for (let i = 0; i < ticks; i++) original.advanceFrame();
    const saved = structuredClone(original.runtimeState);
    const before = structuredClone(saved);
    const calls: string[] = [];
    const allocate = vi.fn(() => 11);
    const restored = new ProjectileLifecycleRuntime(allocate, {
      state: saved,
      resolveHost: id => {
        expect(id).toBe(10);
        return {
          resolveTickDeltaSeconds: () => 0.1,
          finish: () => calls.push('finish'),
          beforeReset: () => calls.push('beforeReset'),
        };
      },
      resolveResetHandler: () => () => calls.push('reset'),
    });
    expect(allocate).not.toHaveBeenCalled();
    expect(saved).toEqual(before);
    expect(calls).toEqual([]);
    registration.dispose();
    const oldBefore = [...oldCalls];
    for (let i = ticks; i < 4; i++) restored.advanceFrame();
    expect(calls).toEqual(
      ticks === 1 ? ['finish', 'beforeReset', 'reset'] : ['beforeReset', 'reset'],
    );
    expect(oldCalls).toEqual(oldBefore);
    expect(restored.activeCount).toBe(0);
    expect(original.activeCount).toBe(1);
  });

  it('can defer restored relation binding until every projectile host exists', () => {
    const original = new ProjectileLifecycleRuntime(() => 10);
    original.launch({
      finishDelaySeconds: 'firstTickReach',
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 0.1,
      finish: () => {},
      beforeReset: () => {},
    });
    const restored = new ProjectileLifecycleRuntime(() => 11, {
      state: structuredClone(original.runtimeState),
    });
    expect(() => restored.advanceFrame()).toThrow('relations have not been bound');
    const calls: string[] = [];
    restored.bindRestoredRelations({
      resolveHost: id => {
        expect(id).toBe(10);
        return {
          resolveTickDeltaSeconds: () => 0.1,
          finish: () => calls.push('finish'),
          beforeReset: () => calls.push('beforeReset'),
        };
      },
      resolveResetHandler: () => () => calls.push('reset'),
    });
    expect(calls).toEqual([]);
    restored.advanceFrame();
    expect(calls).toEqual(['finish']);
    expect(() =>
      restored.bindRestoredRelations({
        resolveHost: () => {
          throw new Error('must not resolve twice');
        },
        resolveResetHandler: () => () => {},
      }),
    ).toThrow('already bound');
  });

  it('可在宿主关系提交前按原编号接回 reset 处理函数', () => {
    const original = new ProjectileLifecycleRuntime(() => 10);
    const reference = original.launch({
      finishDelaySeconds: 'firstTickReach',
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 1,
      finish: () => {},
      beforeReset: () => {},
    });
    const registration = reference.onReset(() => {});
    const restored = new ProjectileLifecycleRuntime(() => 11, {
      state: structuredClone(original.runtimeState),
    });
    const reset = vi.fn();
    restored.bindRestoredResetCallback(10, registration.registrationId, reset);
    restored.bindRestoredRelations({
      resolveHost: () => ({
        resolveTickDeltaSeconds: () => 1,
        finish: () => {},
        beforeReset: () => {},
      }),
    });
    for (let frame = 0; frame < 3; frame++) restored.advanceFrame();
    expect(reset).toHaveBeenCalledOnce();
  });

  it('已回收对象的旧引用不能因外部分配器复用编号而重新绑定', () => {
    const runtime = new ProjectileLifecycleRuntime(() => 1);
    const request = {
      finishDelaySeconds: 'firstTickReach' as const,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 0,
      finish: () => {},
      beforeReset: () => {},
    };
    const old = runtime.launch(request);
    const registration = old.onReset(() => {});
    for (let frame = 0; frame < 3; frame++) runtime.advanceFrame();
    const current = runtime.launch(request);
    let resets = 0;
    current.onReset(() => resets++);
    expect(() => old.onReset(() => {})).toThrow('already reset');
    registration.dispose();
    for (let frame = 0; frame < 3; frame++) runtime.advanceFrame();
    expect(resets).toBe(1);
  });

  it.each([0, 0.001, 0.5])(
    '分段到达按实际Tick推进，delta=%s不改变段数，回收仍分阶段',
    deltaSeconds => {
      const runtime = new ProjectileLifecycleRuntime();
      let delta: number | null = null;
      const calls: string[] = [];
      const entity = runtime.launch({
        finishDelaySeconds: { reachAfterTicks: 2, maxDurationSeconds: 2 },
        recycleDelaySeconds: 0,
        resolveTickDeltaSeconds: () => delta,
        finish: () => calls.push('finish'),
        beforeReset: () => calls.push('beforeReset'),
      });
      entity.onReset(() => calls.push('reset'));
      runtime.advanceFrame();
      delta = deltaSeconds;
      runtime.advanceFrame();
      expect(calls).toEqual([]);
      runtime.advanceFrame();
      expect(calls).toEqual(['finish']);
      runtime.advanceFrame();
      expect(calls).toEqual(['finish']);
      runtime.advanceFrame();
      expect(calls).toEqual(['finish', 'beforeReset', 'reset']);
    },
  );
  it('分段到达前先到持续时间上限时结束', () => {
    const runtime = new ProjectileLifecycleRuntime();
    let finished = false;
    runtime.launch({
      finishDelaySeconds: { reachAfterTicks: 4, maxDurationSeconds: 0.5 },
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 0.5,
      finish: () => {
        finished = true;
      },
      beforeReset: () => {},
    });
    runtime.advanceFrame();
    expect(finished).toBe(true);
  });
  it('首Tick到达以实际准入为准，不把无回调发射压成同步回收', () => {
    const runtime = new ProjectileLifecycleRuntime();
    let delta: number | null = null;
    const calls: string[] = [];
    const projectile = runtime.launch({
      finishDelaySeconds: 'firstTickReach',
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => delta,
      finish: () => calls.push('finish'),
      beforeReset: () => calls.push('beforeReset'),
    });
    projectile.onReset(() => calls.push('reset'));
    runtime.advanceFrame();
    expect(calls).toEqual([]);
    delta = 0;
    runtime.advanceFrame();
    expect(calls).toEqual(['finish']);
    runtime.advanceFrame();
    expect(calls).toEqual(['finish']);
    runtime.advanceFrame();
    expect(calls).toEqual(['finish', 'beforeReset', 'reset']);
    expect(runtime.activeCount).toBe(0);
  });

  it('来源在结束技能与 reset 通知期间可查，实际回收完成后释放', () => {
    const runtime = new ProjectileLifecycleRuntime();
    const source = { kind: 'abilityEntity' as const, instanceId: 99 };
    const seen: unknown[] = [];
    const projectile = runtime.launch({
      source,
      finishDelaySeconds: 1,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 1,
      finish: () => seen.push(runtime.findSource(projectile.target.instanceId)),
      beforeReset: () => seen.push(runtime.findSource(projectile.target.instanceId)),
    });
    projectile.onReset(() => seen.push(runtime.findSource(projectile.target.instanceId)));
    runtime.advanceFrame();
    runtime.advanceFrame();
    expect(runtime.isActive(projectile.target)).toBe(true);
    runtime.advanceFrame();
    expect(seen).toEqual([source, source, source]);
    expect(runtime.isActive(projectile.target)).toBe(false);
    expect(runtime.findSource(projectile.target.instanceId)).toBeUndefined();
  });
  it('与普通能力实体共享全场唯一的实例身份空间', () => {
    const ids = new AbilityEntityInstanceIdAllocator();
    const projectiles = new ProjectileLifecycleRuntime(() => ids.allocate());
    const entities = new LogicalAbilityEntityRuntime({ allocateInstanceId: () => ids.allocate() });
    const projectile = projectiles.launch({
      finishDelaySeconds: 1,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 1,
      finish: () => {},
      beforeReset: () => {},
    });
    const entity = entities.spawn({
      abilityEntityId: 'fixture',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    expect(projectile.target).toEqual({ kind: 'abilityEntity', instanceId: 1 });
    expect(entity).toEqual({ kind: 'abilityEntity', instanceId: 2 });
  });

  it('admits Default-group launches but defers launches made inside the Battle group', () => {
    const runtime = new ProjectileLifecycleRuntime();
    const calls: string[] = [];
    const launch = (name: string) =>
      runtime.launch({
        finishDelaySeconds: 10,
        recycleDelaySeconds: 0,
        resolveTickDeltaSeconds: () => 1,
        finish: () => {},
        beforeReset: () => {},
        abilityRuntime: { advanceFrame: () => calls.push(name) },
      });
    launch('default');
    runtime.beginAbilityFrame();
    launch('battle');
    runtime.advanceAbilityFrame();
    expect(calls).toEqual(['default']);
    runtime.beginAbilityFrame();
    runtime.advanceAbilityFrame();
    expect(calls).toEqual(['default', 'default', 'battle']);
  });

  it('keeps the marked object alive for Battle but never ticks an actually reset host', () => {
    const runtime = new ProjectileLifecycleRuntime();
    const calls: string[] = [];
    runtime.launch({
      finishDelaySeconds: 1,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 1,
      finish: () => calls.push('finish'),
      beforeReset: () => calls.push('end'),
      abilityRuntime: { advanceFrame: () => calls.push('ability') },
    });
    const frame = () => {
      runtime.advanceFrame();
      runtime.beginAbilityFrame();
      runtime.advanceAbilityFrame();
    };
    frame();
    frame();
    frame();
    expect(calls).toEqual(['finish', 'ability', 'ability', 'end']);
  });

  it('does not reuse component tick admission for the separate ability host', () => {
    const runtime = new ProjectileLifecycleRuntime();
    let ticks = 0;
    runtime.launch({
      finishDelaySeconds: 1,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => null,
      finish: () => {},
      beforeReset: () => {},
      abilityRuntime: { advanceFrame: () => ticks++ },
    });
    runtime.advanceFrame();
    runtime.beginAbilityFrame();
    runtime.advanceAbilityFrame();
    expect(ticks).toBe(1);
    expect(() => runtime.advanceAbilityFrame()).toThrow('captured first');
  });
  it('uses native float32 subtraction at the finish boundary', () => {
    const runtime = new ProjectileLifecycleRuntime();
    let finishes = 0;
    runtime.launch({
      finishDelaySeconds: 0.3,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 0.1,
      finish: () => finishes++,
      beforeReset: () => {},
    });
    // Native 0.3f - 0.1f - 0.1f - 0.1f is still positive; double arithmetic is not.
    for (let tick = 0; tick < 3; tick++) runtime.advanceFrame();
    expect(finishes).toBe(0);
    runtime.advanceFrame();
    expect(finishes).toBe(1);
  });

  it('does not expire early using the ready epsilon', () => {
    const runtime = new ProjectileLifecycleRuntime();
    let delta = 0.999999;
    let finishes = 0;
    runtime.launch({
      finishDelaySeconds: 1,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => delta,
      finish: () => finishes++,
      beforeReset: () => {},
    });
    runtime.advanceFrame();
    expect(finishes).toBe(0);
    delta = 0.001;
    runtime.advanceFrame();
    expect(finishes).toBe(1);
  });

  it('keeps its reference through finish and expiry, then cleans up before reset', () => {
    const runtime = new ProjectileLifecycleRuntime();
    const trace: string[] = [];
    const projectile = runtime.launch({
      finishDelaySeconds: 1,
      recycleDelaySeconds: 0.5,
      resolveTickDeltaSeconds: () => 0.5,
      finish: () => trace.push('finish'),
      beforeReset: () => trace.push('end-callback-skill'),
    });
    projectile.onReset(() => trace.push('reset'));
    runtime.advanceFrame();
    expect(trace).toEqual([]);
    runtime.advanceFrame();
    expect(trace).toEqual(['finish']);
    runtime.advanceFrame();
    expect(trace).toEqual(['finish']);
    expect(runtime.activeCount).toBe(1);
    runtime.advanceFrame();
    expect(trace).toEqual(['finish', 'end-callback-skill', 'reset']);
    expect(runtime.activeCount).toBe(0);
    runtime.advanceFrame();
    expect(trace).toHaveLength(3);
    expect(() => projectile.onReset(() => {})).toThrow('already reset');
  });

  it('does not reset on a skipped Tick, even after marking; zero delay still has phases', () => {
    const runtime = new ProjectileLifecycleRuntime();
    let delta: number | null = 1;
    const trace: string[] = [];
    runtime.launch({
      finishDelaySeconds: 1,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => delta,
      finish: () => trace.push('finish'),
      beforeReset: () => trace.push('reset'),
    });
    runtime.advanceFrame();
    delta = 0;
    runtime.advanceFrame();
    expect(trace).toEqual(['finish']);
    delta = null;
    runtime.advanceFrame();
    expect(runtime.activeCount).toBe(1);
    delta = 0;
    runtime.advanceFrame();
    expect(trace).toEqual(['finish', 'reset']);
  });

  it('disposes one registration without releasing the object or the other registration', () => {
    const runtime = new ProjectileLifecycleRuntime();
    let resets = 0;
    const projectile = runtime.launch({
      finishDelaySeconds: 1,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 1,
      finish: () => {},
      beforeReset: () => {},
    });
    const callback = () => resets++;
    const first = projectile.onReset(callback);
    projectile.onReset(callback);
    first.dispose();
    first.dispose();
    expect(runtime.activeCount).toBe(1);
    for (let tick = 0; tick < 3; tick++) runtime.advanceFrame();
    expect(resets).toBe(1);
  });

  it('does not advance a projectile launched by another finish callback in the same pass', () => {
    const runtime = new ProjectileLifecycleRuntime();
    const trace: string[] = [];
    const request = {
      finishDelaySeconds: 1,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 1,
      beforeReset: () => {},
    };
    runtime.launch({
      ...request,
      finish: () => {
        trace.push('parent');
        runtime.launch({ ...request, finish: () => trace.push('child') });
      },
    });
    runtime.advanceFrame();
    expect(trace).toEqual(['parent']);
    runtime.advanceFrame();
    expect(trace).toEqual(['parent', 'child']);
  });
});
