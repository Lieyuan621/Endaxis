import { describe, expect, it } from 'vitest';
import {
  TimeDilationPrograms,
  TimeDilationRuntime,
  advanceTimeDilation,
} from './timeDilationRuntime';
import { StateStepper } from '../runtime/stateStepper';

const LOW = 10;
const HIGH = 20;

function createRuntime() {
  return new TimeDilationRuntime({});
}

describe('TimeDilationRuntime', () => {
  it('曲线留在程序中，保存的膨胀状态可以独立继续推进和到期', () => {
    const curve = (progress: number) => 0.5 + progress * 0.5;
    const runtime = new TimeDilationRuntime({
      entityLifetimeUsesGlobalScaleBySlot: new Map([['local', true]]),
    });
    runtime.startGlobal({ durationSeconds: 0.1, slot: 'global', priority: LOW, curve });
    runtime.startEntity({
      entityId: 'caster',
      durationSeconds: 0.2,
      slot: 'local',
      priority: LOW,
      curve,
    });
    runtime.advanceFrame();
    const session = new StateStepper(runtime.runtimeState, (step, frames: number) => {
      const ended: string[] = [];
      for (let index = 0; index < frames; index++) {
        advanceTimeDilation(step.state, [curve], {
          ended: (kind, instance, reason) => ended.push(`${kind}:${instance.id}:${reason}`),
        });
      }
      return ended;
    });
    const saved = session.save();
    const ended = session.step(12);
    const completed = session.read();
    expect(ended).toEqual(['global:1:natural', 'entity:2:natural']);
    for (let index = 0; index < 12; index++) runtime.advanceFrame();
    expect(completed).toEqual(runtime.runtimeState);
    session.restore(saved);
    expect(session.step(1)).toEqual([]);
    expect(session.read().entityInstances).toHaveLength(1);
    session.restore(saved);
    expect(session.step(12)).toEqual(ended);
    expect(session.read()).toEqual(completed);
  });

  it('恢复后沿用同一曲线程序目录且不重放开始事件', () => {
    const curve = (progress: number) => 0.25 + progress * 0.5;
    const original = new TimeDilationRuntime({});
    original.startEntity({
      entityId: 'caster',
      durationSeconds: 1,
      slot: 'local',
      priority: LOW,
      curve,
    });
    original.advanceFrame();
    const restoredState = new StateStepper(original.runtimeState, () => undefined).read();
    const events: string[] = [];

    const restored = new TimeDilationRuntime(
      {},
      { started: () => events.push('started') },
      { state: restoredState, programs: original.programs },
    );

    expect(restored.runtimeState).toBe(restoredState);
    expect(events).toEqual([]);
    restored.advanceFrame();
    original.advanceFrame();
    expect(restored.runtimeState).toEqual(original.runtimeState);
    expect(restored.runtimeState).not.toBe(original.runtimeState);
  });

  it('状态含曲线编号时拒绝使用空程序目录恢复', () => {
    const original = new TimeDilationRuntime({});
    original.startEntity({
      entityId: 'caster',
      durationSeconds: 1,
      slot: 'local',
      priority: LOW,
      curve: () => 0.5,
    });
    const restoredState = new StateStepper(original.runtimeState, () => undefined).read();

    expect(
      () =>
        new TimeDilationRuntime(
          {},
          {},
          { state: restoredState, programs: new TimeDilationPrograms() },
        ),
    ).toThrow("unknown time-dilation curve program '0'");
  });

  it('lets the source ignore a global curve while other operators use it', () => {
    const runtime = createRuntime();
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      curve: progress => 0.01 + progress * 0.99,
      ignoredOperatorIds: ['caster'],
    });

    expect(runtime.currentGlobalScale).toBeCloseTo(0.01);
    expect(runtime.getOperatorScale('caster')).toBe(1);
    expect(runtime.getOperatorScale('other')).toBeCloseTo(0.01);

    runtime.advanceFrame();

    expect(runtime.currentGlobalScale).toBeCloseTo(0.01);
    runtime.advanceFrame();
    expect(runtime.currentGlobalScale).toBeGreaterThan(0.01);
  });

  it('keeps the stronger same-slot instance and replaces a weaker one with higher priority', () => {
    const runtime = createRuntime();
    const first = runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: HIGH,
      constantScale: 0.2,
    });
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      constantScale: 0.1,
    });
    expect(runtime.globalInstances.map(instance => instance.id)).toEqual([first]);

    const replacement = runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: HIGH,
      constantScale: 0.4,
    });
    expect(runtime.globalInstances.map(instance => instance.id)).toEqual([replacement]);
    expect(runtime.currentGlobalScale).toBe(0.4);
  });

  it('reports accepted, replaced and rejected instances with their source', () => {
    const events: string[] = [];
    const runtime = new TimeDilationRuntime(
      {},
      {
        started: (_kind, instance) => events.push(`started:${instance.source?.sourceActionId}`),
        rejected: (_kind, instance) => events.push(`rejected:${instance.source?.sourceActionId}`),
        ended: (_kind, instance, reason) =>
          events.push(`ended:${instance.source?.sourceActionId}:${reason}`),
      },
    );
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      constantScale: 0.5,
      source: { sourceId: 'operator', sourceActionId: 'first' },
    });
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: HIGH,
      constantScale: 0.4,
      source: { sourceId: 'operator', sourceActionId: 'second' },
    });
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      constantScale: 0.3,
      source: { sourceId: 'operator', sourceActionId: 'third' },
    });

    expect(events).toEqual([
      'started:first',
      'ended:first:replaced',
      'started:second',
      'rejected:third',
    ]);
  });

  it('uses the lowest scale across different global slots and keeps registration order on ties', () => {
    const runtime = createRuntime();
    const first = runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      constantScale: 0.3,
      influenceSkillCooldownSeconds: 0.5,
    });
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot2',
      priority: LOW,
      constantScale: 0.3,
    });
    expect(runtime.globalInstances[0]?.id).toBe(first);
    expect(runtime.activeGlobalInfluencesSkillCooldown).toBe(true);
  });

  it('multiplies entity and global scales unless the operator ignores global scale', () => {
    const runtime = createRuntime();
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      constantScale: 0.5,
      ignoredOperatorIds: ['ignored'],
    });
    runtime.startEntity({
      entityId: 'ignored',
      durationSeconds: 1,
      slot: 'Test/TimeSlot2',
      priority: LOW,
      curve: () => 0.4,
    });
    runtime.startEntity({
      entityId: 'other',
      durationSeconds: 1,
      slot: 'Test/TimeSlot2',
      priority: LOW,
      curve: () => 0.4,
    });

    expect(runtime.getOperatorScale('ignored')).toBeCloseTo(0.4);
    expect(runtime.getOperatorScale('other')).toBeCloseTo(0.2);
  });

  it('removes a naturally expired instance on the tick after it crosses duration', () => {
    const runtime = createRuntime();
    runtime.startGlobal({
      durationSeconds: 1 / 30,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      constantScale: 0.1,
    });

    runtime.advanceFrame();
    expect(runtime.globalInstances).toHaveLength(1);
    runtime.advanceFrame();
    expect(runtime.globalInstances).toHaveLength(1);
    runtime.advanceFrame();
    expect(runtime.globalInstances).toHaveLength(0);
  });

  it('accepts a zero-duration entity instance for its native validity window', () => {
    const runtime = createRuntime();
    runtime.startEntity({
      entityId: 'target',
      durationSeconds: 0,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      curve: () => 0,
    });

    expect(runtime.getEntityScale('target')).toBe(0);
    runtime.advanceFrame();
    expect(runtime.entityInstances).toHaveLength(1);
    runtime.advanceFrame();
    expect(runtime.entityInstances).toHaveLength(0);
  });

  it('starts and stops the configured ultimate slot explicitly', () => {
    const runtime = createRuntime();
    const id = runtime.startUltimate(HIGH, 0, ['caster']);

    expect(runtime.currentGlobalScale).toBe(0);
    expect(runtime.getOperatorScale('caster')).toBe(1);
    expect(runtime.getAbilityTickDeltas('caster', 1 / 30)).toEqual({
      defaultDeltaSeconds: 1 / 30,
      globalScaledDeltaSeconds: 0,
      selfScaledDeltaSeconds: 1 / 30,
      globalAndSelfScaledDeltaSeconds: 0,
      skillCooldownDeltaSeconds: 1 / 30,
    });
    expect(runtime.getAbilityTickDeltas('other', 1 / 30)).toEqual({
      defaultDeltaSeconds: 1 / 30,
      globalScaledDeltaSeconds: 0,
      selfScaledDeltaSeconds: 0,
      globalAndSelfScaledDeltaSeconds: 0,
      skillCooldownDeltaSeconds: 1 / 30,
    });

    runtime.stop(id);
    expect(runtime.currentGlobalScale).toBe(1);
  });

  it('resolves default, global, self and cooldown clocks independently', () => {
    const runtime = createRuntime();
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      constantScale: 0.5,
      influenceSkillCooldownSeconds: 0.25,
      ignoredOperatorIds: ['ignored'],
    });
    runtime.startEntity({
      entityId: 'ignored',
      durationSeconds: 1,
      slot: 'Test/TimeSlot2',
      priority: LOW,
      curve: () => 0.4,
    });

    expect(runtime.getAbilityTickDeltas('ignored', 1 / 30)).toEqual({
      defaultDeltaSeconds: 1 / 30,
      globalScaledDeltaSeconds: 1 / 60,
      selfScaledDeltaSeconds: (1 / 30) * 0.4,
      globalAndSelfScaledDeltaSeconds: (1 / 60) * 0.4,
      skillCooldownDeltaSeconds: 1 / 60,
    });
    expect(runtime.getAbilityTickDeltas('other', 1 / 30).defaultDeltaSeconds).toBe(1 / 30);
    // 显式影响冷却窗口结束后，全局膨胀仍存在，但冷却恢复未缩放推进。
    for (let frame = 0; frame < 9; frame++) runtime.advanceFrame();
    expect(runtime.currentGlobalScale).toBe(0.5);
    expect(runtime.getAbilityTickDeltas('ignored', 1 / 30).skillCooldownDeltaSeconds).toBe(1 / 30);
  });

  it('does not slow default or cooldown clocks during ordinary global dilation', () => {
    const runtime = createRuntime();
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      constantScale: 0,
      ignoredOperatorIds: ['caster'],
    });
    for (const operatorId of ['caster', 'other']) {
      const deltas = runtime.getAbilityTickDeltas(operatorId, 1 / 30);
      expect(deltas.defaultDeltaSeconds).toBe(1 / 30);
      expect(deltas.skillCooldownDeltaSeconds).toBe(1 / 30);
      expect(deltas.selfScaledDeltaSeconds).toBe(operatorId === 'caster' ? 1 / 30 : 0);
    }
  });

  it('uses global-scaled lifetime only for configured entity slots', () => {
    const runtime = new TimeDilationRuntime({
      entityLifetimeUsesGlobalScaleBySlot: new Map([['Test/TimeSlot2', true]]),
    });
    runtime.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: LOW,
      constantScale: 0.5,
    });
    runtime.startEntity({
      entityId: 'scaled',
      durationSeconds: 1,
      slot: 'Test/TimeSlot2',
      priority: LOW,
      curve: () => 1,
    });
    runtime.startEntity({
      entityId: 'raw',
      durationSeconds: 1,
      slot: 'Test/TimeSlot3',
      priority: LOW,
      curve: () => 1,
    });

    runtime.advanceFrame();

    expect(
      runtime.entityInstances.find(instance => instance.entityId === 'scaled')?.elapsedSeconds,
    ).toBeCloseTo(1 / 60);
    expect(
      runtime.entityInstances.find(instance => instance.entityId === 'raw')?.elapsedSeconds,
    ).toBeCloseTo(1 / 30);
  });
});
