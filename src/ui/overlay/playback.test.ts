import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import { useOverlayPlayback } from './playback';

let elapsedMs = 0;
let nextFrame = 0;
let frames: Map<number, FrameRequestCallback>;

beforeEach(() => {
  elapsedMs = 0;
  nextFrame = 0;
  frames = new Map();
  vi.spyOn(performance, 'now').mockImplementation(() => elapsedMs);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function fixture(start = -3, end = 7, delay?: number | (() => number)) {
  const scope = effectScope();
  const playback = scope.run(() =>
    useOverlayPlayback({
      startTime: () => start,
      duration: () => end,
      ...(delay === undefined
        ? {}
        : { startDelaySeconds: typeof delay === 'function' ? delay : () => delay }),
    }),
  )!;
  return { playback, stop: () => scope.stop() };
}

function paintAt(time: number) {
  elapsedMs = time;
  const pending = [...frames];
  frames.clear();
  for (const [, callback] of pending) callback(time);
}

describe('overlay playback', () => {
  it('keeps seek, reset and replay within the negative preparation interval', () => {
    const { playback: p, stop } = fixture(-3, 0);
    try {
      expect(p.now.value).toBe(-3);
      expect(p.waitingRemaining.value).toBe(0);
      p.seek(-2);
      p.play();
      paintAt(500);
      expect(p.now.value).toBe(-1.5);
      p.seek(-10);
      expect(p.now.value).toBe(-3);
      p.seek(10);
      expect([p.now.value, p.isFinished.value, p.isPlaying.value]).toEqual([0, true, false]);
      expect(frames.size).toBe(0);
      p.play();
      expect([p.now.value, p.isFinished.value, p.isPlaying.value]).toEqual([-3, false, true]);
      p.reset();
      paintAt(1500);
      expect([p.now.value, p.isPlaying.value, p.hasStarted.value]).toEqual([-3, false, false]);
      p.pause();
      p.reset();
      expect([p.now.value, p.isFinished.value, p.isPlaying.value]).toEqual([-3, false, false]);
    } finally {
      stop();
    }
  });

  it('settles elapsed background time before pause and step, excluding the paused interval', () => {
    const { playback: p, stop } = fixture();
    try {
      p.play();
      elapsedMs = 1250;
      p.pause();
      expect(p.now.value).toBe(-1.75);
      expect(frames.size).toBe(0);
      elapsedMs = 10000;
      p.toggle();
      paintAt(12000);
      expect(p.now.value).toBe(0.25);
      elapsedMs = 13000;
      p.step(-2);
      expect(p.now.value).toBe(-0.75);
      paintAt(14000);
      expect(p.now.value).toBe(0.25);
    } finally {
      stop();
    }
  });

  it('finishes after background suspension and cancels the active frame on disposal', () => {
    const { playback: p, stop } = fixture();
    p.play();
    paintAt(60000);
    expect([p.now.value, p.isFinished.value, p.isPlaying.value]).toEqual([7, true, false]);
    expect(frames.size).toBe(0);
    p.play();
    elapsedMs = 61000;
    p.pause();
    expect(p.now.value).toBe(-2);
    p.play();
    stop();
    expect(p.isPlaying.value).toBe(false);
    expect(frames.size).toBe(0);
    paintAt(100000);
    expect(p.now.value).toBe(-2);
  });

  it('counts down the configured wait before advancing the original negative preparation interval', () => {
    const { playback: p, stop } = fixture(-3, 7, 2);
    try {
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-3, 2]);
      expect(p.hasStarted.value).toBe(false);
      p.play();
      expect(p.hasStarted.value).toBe(true);
      paintAt(500);
      expect([p.now.value, p.waitingRemaining.value, p.isPlaying.value]).toEqual([-3, 1.5, true]);
      paintAt(2000);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-3, 0]);
      paintAt(2500);
      expect(p.now.value).toBe(-2.5);
    } finally {
      stop();
    }
  });

  it('freezes a partial countdown while paused and consumes crossed wait time on resume', () => {
    const { playback: p, stop } = fixture(-3, 7, 2);
    try {
      p.play();
      elapsedMs = 750;
      p.pause();
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-3, 1.25]);
      expect(p.hasStarted.value).toBe(true);
      expect(frames.size).toBe(0);
      elapsedMs = 10000;
      p.play();
      paintAt(10500);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-3, 0.75]);
      // The next frame arrives after the countdown: its excess time belongs to the axis.
      paintAt(12000);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-2.25, 0]);
    } finally {
      stop();
    }
  });

  it('settles an entire countdown and the axis after background suspension', () => {
    const { playback: p, stop } = fixture(-3, 7, 2);
    try {
      p.play();
      elapsedMs = 3500;
      p.pause();
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-1.5, 0]);
      p.play();
      paintAt(60000);
      expect([p.now.value, p.waitingRemaining.value, p.isFinished.value]).toEqual([7, 0, true]);
      expect(frames.size).toBe(0);
    } finally {
      stop();
    }
  });

  it('restarts the full countdown on reset and replay, reading new settings only on reset', () => {
    let delay = 1;
    const { playback: p, stop } = fixture(0, 2, () => delay);
    try {
      p.play();
      paintAt(500);
      p.reset();
      expect([p.now.value, p.waitingRemaining.value, p.isPlaying.value]).toEqual([0, 1, false]);
      expect(p.hasStarted.value).toBe(false);
      paintAt(1000);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([0, 1]);
      p.play();
      paintAt(1500);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([0, 0.5]);
      paintAt(4000);
      expect([p.now.value, p.isPlaying.value, p.isFinished.value]).toEqual([2, false, true]);
      p.play();
      expect([p.now.value, p.waitingRemaining.value, p.isFinished.value]).toEqual([0, 1, false]);
      p.pause();
      delay = 3;
      expect(p.waitingRemaining.value).toBe(1);
      p.play();
      paintAt(4500);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([0, 0.5]);
      p.pause();
      p.reset();
      expect([p.now.value, p.waitingRemaining.value, p.isPlaying.value]).toEqual([0, 3, false]);
      expect(p.hasStarted.value).toBe(false);
    } finally {
      stop();
    }
  });

  it.each([500, 3500])('resets and pauses a running countdown or axis at %i ms', time => {
    const { playback: p, stop } = fixture(-3, 7, 2);
    try {
      p.play();
      paintAt(time);
      p.reset();
      expect([
        p.now.value,
        p.waitingRemaining.value,
        p.isPlaying.value,
        p.hasStarted.value,
        p.isFinished.value,
      ]).toEqual([-3, 2, false, false, false]);
      expect(frames.size).toBe(0);
      paintAt(60000);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-3, 2]);
    } finally {
      stop();
    }
  });

  it('ends the countdown when seeking and resumes directly from the original axis time', () => {
    const { playback: p, stop } = fixture(-3, 7, 2);
    try {
      p.play();
      elapsedMs = 500;
      p.seek(-2);
      expect([p.now.value, p.waitingRemaining.value, p.isPlaying.value]).toEqual([-2, 0, true]);
      paintAt(1000);
      expect(p.now.value).toBe(-1.5);
      p.pause();
      p.reset();
      p.seek(-2);
      expect([p.now.value, p.waitingRemaining.value, p.isPlaying.value]).toEqual([-2, 0, false]);
      expect(p.hasStarted.value).toBe(true);
      p.play();
      paintAt(1500);
      expect(p.now.value).toBe(-1.5);
    } finally {
      stop();
    }
  });

  it('adjusts remaining wait with step and carries a correction across the countdown boundary', () => {
    const { playback: p, stop } = fixture(-3, 7, 2);
    try {
      p.play();
      elapsedMs = 500;
      p.step(-1);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-3, 2.5]);
      paintAt(1000);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-3, 2]);
      p.step(0.25);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-3, 1.75]);
      p.pause();
      elapsedMs = 10000;
      p.step(0.5);
      expect([p.now.value, p.waitingRemaining.value, p.isPlaying.value]).toEqual([-3, 1.25, false]);
      p.play();
      elapsedMs = 10500;
      p.step(1);
      expect([p.now.value, p.waitingRemaining.value]).toEqual([-2.75, 0]);
      paintAt(11000);
      expect(p.now.value).toBe(-2.25);
    } finally {
      stop();
    }
  });

  it('does not play an empty axis and cancels the frame while disposing during a wait', () => {
    const empty = fixture(0, 0, 2);
    empty.playback.play();
    expect([empty.playback.isPlaying.value, frames.size]).toEqual([false, 0]);
    empty.stop();

    const { playback: p, stop } = fixture(-3, 7, 2);
    p.play();
    elapsedMs = 500;
    stop();
    expect([p.now.value, p.waitingRemaining.value, p.isPlaying.value]).toEqual([-3, 1.5, false]);
    expect(frames.size).toBe(0);
    paintAt(60000);
    expect([p.now.value, p.waitingRemaining.value]).toEqual([-3, 1.5]);
  });
});
