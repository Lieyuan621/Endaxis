/**
 * 叠加提示条的播放时钟。
 *
 * 使用 performance.now() 的绝对时间：后台 rAF 暂停后，下一次显示仍与实际经过时间对齐。
 */
import { onScopeDispose, ref, type Ref } from 'vue';

export interface OverlayPlayback {
  now: Ref<number>;
  /** 启动前剩余等待秒数；等待期间 now 保持计划起点。 */
  waitingRemaining: Ref<number>;
  hasStarted: Ref<boolean>;
  isPlaying: Ref<boolean>;
  isFinished: Ref<boolean>;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  step: (delta: number) => void;
  reset: () => void;
}

export interface OverlayPlaybackOptions {
  /** 准备期起点；可以为负数。 */
  startTime: () => number;
  /** 计划结束时间，与起点使用相同的仿真时钟。 */
  duration: () => number;
  /** 每次从头播放前的额外等待，不改变计划本身的准备期。 */
  startDelaySeconds?: () => number;
}

export function useOverlayPlayback(options: OverlayPlaybackOptions): OverlayPlayback {
  const startTime = () => finiteTime(options.startTime());
  const endTime = () => Math.max(startTime(), finiteTime(options.duration()));
  const startDelay = () => Math.max(0, finiteTime(options.startDelaySeconds?.() ?? 0));
  const now = ref(startTime());
  const waitingRemaining = ref(startDelay());
  const hasStarted = ref(false);
  const isPlaying = ref(false);
  const isFinished = ref(false);

  let frameId: number | null = null;
  /** originMs 时刻对应 baseSeconds，暂停和跳转时重设。 */
  let originMs = 0;
  let baseSeconds = now.value;
  let baseWaitingSeconds = waitingRemaining.value;

  function cancelFrame() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function settle() {
    if (!isPlaying.value) return;
    const elapsedSeconds = Math.max(0, (performance.now() - originMs) / 1000);
    waitingRemaining.value = Math.max(0, baseWaitingSeconds - elapsedSeconds);
    const target = baseSeconds + Math.max(0, elapsedSeconds - baseWaitingSeconds);
    const end = endTime();
    now.value = Math.min(end, Math.max(startTime(), target));
    isFinished.value = now.value >= end;
    if (isFinished.value) {
      isPlaying.value = false;
      cancelFrame();
    }
  }

  function tick() {
    frameId = null;
    settle();
    if (isPlaying.value) frameId = requestAnimationFrame(tick);
  }

  function play() {
    if (isPlaying.value) return;
    const start = startTime();
    const end = endTime();
    if (end <= start) return;
    if (now.value >= end) {
      now.value = start;
      waitingRemaining.value = startDelay();
      hasStarted.value = false;
    } else {
      now.value = Math.max(start, now.value);
    }
    isFinished.value = false;
    hasStarted.value = true;
    baseSeconds = now.value;
    baseWaitingSeconds = waitingRemaining.value;
    originMs = performance.now();
    isPlaying.value = true;
    frameId = requestAnimationFrame(tick);
  }

  function pause() {
    settle();
    cancelFrame();
    isPlaying.value = false;
    baseSeconds = now.value;
  }

  function toggle() {
    if (isPlaying.value) pause();
    else play();
  }

  function seek(time: number) {
    const start = startTime();
    const end = endTime();
    now.value = Math.min(end, Math.max(start, finiteTime(time, start)));
    waitingRemaining.value = 0;
    hasStarted.value = true;
    isFinished.value = end > start && now.value >= end;
    if (isFinished.value) {
      isPlaying.value = false;
      cancelFrame();
    } else if (isPlaying.value) {
      baseSeconds = now.value;
      baseWaitingSeconds = 0;
      originMs = performance.now();
    }
  }

  function step(delta: number) {
    settle();
    const correction = finiteTime(delta);
    if (waitingRemaining.value > 0) {
      const nextWait = waitingRemaining.value - correction;
      if (nextWait >= 0) {
        waitingRemaining.value = nextWait;
        if (isPlaying.value) {
          baseSeconds = now.value;
          baseWaitingSeconds = nextWait;
          originMs = performance.now();
        }
      } else {
        seek(now.value - nextWait);
      }
    } else {
      seek(now.value + correction);
    }
  }

  function reset() {
    pause();
    now.value = startTime();
    waitingRemaining.value = startDelay();
    hasStarted.value = false;
    isFinished.value = false;
  }

  onScopeDispose(pause);

  return {
    now,
    waitingRemaining,
    hasStarted,
    isPlaying,
    play,
    pause,
    toggle,
    seek,
    step,
    reset,
    isFinished,
  };
}

function finiteTime(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}
