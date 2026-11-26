import { describe, expect, it, vi } from 'vitest';
import { CombatClock } from '../time/combatClock';
import { ExternalCombatEventRuntime } from './externalCombatEventRuntime';

describe('ExternalCombatEventRuntime', () => {
  it('从完整帧恢复后只处理尚未发生的连携冷却控制', () => {
    const events = [0, 2].map(frame => ({
      frame,
      operatorIds: ['operator'],
      kind: 'comboCooldownControl' as const,
      mode: 'ready' as const,
    }));
    const clock = new CombatClock();
    const controlComboCooldown = vi.fn();
    const original = new ExternalCombatEventRuntime({ clock, events, controlComboCooldown });
    original.applyCurrentFrame();
    clock.advanceFrame();
    const saved = structuredClone(clock.runtimeState);

    const restoredClock = new CombatClock(saved);
    const restoredControl = vi.fn();
    const restored = new ExternalCombatEventRuntime({
      clock: restoredClock,
      events,
      inputBoundary: restoredClock.frame + 1,
      controlComboCooldown: restoredControl,
    });
    restored.applyCurrentFrame();
    restoredClock.advanceFrame();
    restored.applyCurrentFrame();

    expect(restoredControl).toHaveBeenCalledExactlyOnceWith('operator', 'ready');
    clock.advanceFrame();
    original.applyCurrentFrame();
    expect(controlComboCooldown).toHaveBeenCalledTimes(2);
  });

  it('按逻辑帧顺序处理输入', () => {
    expect(
      () =>
        new ExternalCombatEventRuntime({
          clock: new CombatClock(),
          events: [
            {
              frame: 2,
              operatorIds: ['operator'],
              kind: 'comboCooldownControl',
              mode: 'ready',
            },
            {
              frame: 1,
              operatorIds: ['operator'],
              kind: 'comboCooldownControl',
              mode: 'cooldown',
            },
          ],
        }),
    ).toThrow('scheduled external event inputs must be ordered by frame');
  });
});
