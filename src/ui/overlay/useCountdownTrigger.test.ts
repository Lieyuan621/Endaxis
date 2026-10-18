import { afterEach, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import type { CountdownTriggerApi, CountdownTriggerStatus } from './desktopApi';
import { useOverlayPlayback } from './playback';
import { useCountdownTrigger } from './useCountdownTrigger';

afterEach(() => {
  vi.unstubAllGlobals();
});

function fixture(end = 20) {
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const ready: CountdownTriggerStatus = { phase: 'ready', configured: true, armed: false };
  let onTrigger!: (event: { elapsedSeconds: number }) => void;
  let onStatus!: (status: CountdownTriggerStatus) => void;
  const unsubscribe = vi.fn();
  const source: CountdownTriggerApi = {
    info: vi.fn(async () => ready),
    selectRegion: vi.fn(async () => ready),
    arm: vi.fn(async () => ({ ...ready, phase: 'watching' as const, armed: true })),
    disarm: vi.fn(async () => ready),
    clear: vi.fn(async () => ({ ...ready, phase: 'unconfigured' as const, configured: false })),
    onStatus: callback => {
      onStatus = callback;
      return unsubscribe;
    },
    onTrigger: callback => {
      onTrigger = callback;
      return unsubscribe;
    },
  };
  const scope = effectScope();
  const onStarted = vi.fn();
  const state = scope.run(() => {
    const playback = useOverlayPlayback({
      startTime: () => -3,
      duration: () => end,
      startDelaySeconds: () => 2,
    });
    const trigger = useCountdownTrigger({
      source,
      playback,
      startTime: () => -3,
      canStart: () => !playback.isPlaying.value,
      onStarted,
    });
    return { playback, trigger };
  })!;
  return {
    ...state,
    source,
    ready,
    onStarted,
    unsubscribe,
    fire: (seconds = 0.2) => onTrigger({ elapsedSeconds: seconds }),
    status: (value: CountdownTriggerStatus) => onStatus(value),
    stop: () => scope.stop(),
  };
}

it('requires explicit arming, skips only the added delay, compensates confirmation time and triggers once', async () => {
  const f = fixture();
  try {
    f.fire();
    expect(f.playback.isPlaying.value).toBe(false);
    await f.trigger.api!.arm();
    f.fire();
    expect(f.playback.now.value).toBe(-2.8);
    expect(f.playback.waitingRemaining.value).toBe(0);
    expect(f.playback.isPlaying.value).toBe(true);
    f.playback.pause();
    f.fire();
    expect(f.playback.isPlaying.value).toBe(false);
    expect(f.onStarted).toHaveBeenCalledTimes(1);
  } finally {
    f.stop();
  }
});

it('manual cancellation ignores a queued trigger and a late arming response', async () => {
  const f = fixture();
  try {
    let resolve!: (value: CountdownTriggerStatus) => void;
    vi.mocked(f.source.arm).mockImplementation(
      () =>
        new Promise(complete => {
          resolve = complete;
        }),
    );
    const pending = f.trigger.api!.arm();
    f.trigger.stop();
    resolve({ ...f.ready, armed: true });
    await pending;
    f.status({ ...f.ready, armed: true });
    f.fire();
    expect(f.playback.isPlaying.value).toBe(false);
    expect(f.onStarted).not.toHaveBeenCalled();
    expect(f.source.disarm).toHaveBeenCalled();
  } finally {
    f.stop();
  }
});

it('invalid or unarmed events cannot start playback, and scope disposal unsubscribes and disarms', async () => {
  const f = fixture();
  await f.trigger.api!.arm();
  f.fire(Number.NaN);
  f.fire(-1);
  expect(f.onStarted).not.toHaveBeenCalled();
  f.stop();
  f.fire();
  expect(f.playback.isPlaying.value).toBe(false);
  expect(f.unsubscribe).toHaveBeenCalledTimes(2);
  expect(f.source.disarm).toHaveBeenCalled();
});

it('does not replay a short rotation when confirmation already passed its end', async () => {
  const f = fixture(-2.9);
  try {
    await f.trigger.api!.arm();
    f.fire(0.2);
    expect(f.playback.now.value).toBe(-2.9);
    expect(f.playback.isFinished.value).toBe(true);
    expect(f.playback.isPlaying.value).toBe(false);
    expect(f.playback.waitingRemaining.value).toBe(0);
  } finally {
    f.stop();
  }
});
