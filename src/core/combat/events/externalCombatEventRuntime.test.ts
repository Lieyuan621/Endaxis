import { describe, expect, it, vi } from 'vitest';
import { CombatClock } from '../time/combatClock';
import { ExternalCombatEventRuntime } from './externalCombatEventRuntime';

describe('ExternalCombatEventRuntime', () => {
  it('恢复游标后只处理尚未发生的连携冷却控制', () => {
    const events = [0, 2].map(frame => ({
      frame,
      targetOperatorIds: ['operator'],
      event: { kind: 'comboCooldownControl' as const, mode: 'ready' as const },
    }));
    const clock = new CombatClock();
    const controlComboCooldown = vi.fn();
    const original = new ExternalCombatEventRuntime({ clock, events, controlComboCooldown });
    original.applyCurrentFrame();
    clock.advanceFrame();
    const saved = structuredClone({ clock: clock.runtimeState, events: original.runtimeState });

    const restoredClock = new CombatClock(saved.clock);
    const restoredControl = vi.fn();
    const restored = new ExternalCombatEventRuntime({
      clock: restoredClock,
      events,
      restoredState: saved.events,
      controlComboCooldown: restoredControl,
    });
    restored.applyCurrentFrame();
    restoredClock.advanceFrame();
    restored.applyCurrentFrame();

    expect(restoredControl).toHaveBeenCalledExactlyOnceWith('operator', 'ready');
    clock.advanceFrame();
    original.applyCurrentFrame();
    expect(restored.runtimeState).toEqual(original.runtimeState);
  });

  it('允许替换未来输入，但拒绝把不同的已消费前缀绑定到保存游标', () => {
    const clock = new CombatClock();
    const consumed = {
      frame: 0,
      targetOperatorIds: ['operator'],
      event: { kind: 'comboCooldownControl' as const, mode: 'cooldown' as const },
    };
    const original = new ExternalCombatEventRuntime({
      clock,
      events: [consumed, { ...consumed, frame: 4 }],
      controlComboCooldown: vi.fn(),
    });
    original.applyCurrentFrame();
    const saved = structuredClone(original.runtimeState);

    expect(
      () =>
        new ExternalCombatEventRuntime({
          clock,
          events: [consumed],
          restoredState: structuredClone(saved),
        }),
    ).not.toThrow();
    expect(
      () =>
        new ExternalCombatEventRuntime({
          clock,
          events: [{ ...consumed, event: { ...consumed.event, mode: 'ready' } }],
          restoredState: structuredClone(saved),
        }),
    ).toThrow('external event prefix does not match program');
  });

  it('按逻辑帧顺序处理输入', () => {
    expect(
      () =>
        new ExternalCombatEventRuntime({
          clock: new CombatClock(),
          events: [
            {
              frame: 2,
              targetOperatorIds: ['operator'],
              event: { kind: 'comboCooldownControl', mode: 'ready' },
            },
            {
              frame: 1,
              targetOperatorIds: ['operator'],
              event: { kind: 'comboCooldownControl', mode: 'cooldown' },
            },
          ],
        }),
    ).toThrow('scheduled external event inputs must be ordered by frame');
  });
});
