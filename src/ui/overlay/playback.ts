/**
 * 叠加提示条的播放时钟。
 *
 * 用 `performance.now()` 推算当前时间，而不是累加 rAF 的时间差：
 * 标签页被游戏挡住/切到后台时 rAF 会停，累加会越来越慢；用绝对时间推算，
 * 回到前台时进度会直接对齐到真实时间，这正是提示工具需要的行为。
 */

import { onScopeDispose, ref, type Ref } from 'vue';

export interface OverlayPlayback {
  now: Ref<number>;
  isPlaying: Ref<boolean>;
  speed: Ref<number>;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  step: (delta: number) => void;
  reset: () => void;
  /** 是否已经播到结尾。 */
  isFinished: Ref<boolean>;
}

export interface OverlayPlaybackOptions {
  /** 计划总时长；返回 0 表示空计划。 */
  duration: () => number;
  /** 自动播放。 */
  autoStart?: boolean;
  initialSpeed?: number;
}

export function useOverlayPlayback(options: OverlayPlaybackOptions): OverlayPlayback {
  const now = ref(0);
  const isPlaying = ref(false);
  const isFinished = ref(false);
  const speed = ref(options.initialSpeed ?? 1);

  let frameId: number | null = null;
  /** 开始播放时的基准：`originMs` 时刻对应 `baseSeconds`。 */
  let originMs = 0;
  let baseSeconds = 0;

  const duration = () => Math.max(0, Number(options.duration()) || 0);

  function cancelFrame() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function tick() {
    if (!isPlaying.value) return;
    const target = baseSeconds + ((performance.now() - originMs) / 1000) * speed.value;
    const limit = duration();
    if (limit > 0 && target >= limit) {
      now.value = limit;
      isFinished.value = true;
      isPlaying.value = false;
      frameId = null;
      return;
    }
    now.value = target;
    frameId = requestAnimationFrame(tick);
  }

  function play() {
    if (isPlaying.value) return;
    const limit = duration();
    if (limit <= 0) return;
    if (now.value >= limit - 1e-6) now.value = 0;
    isFinished.value = false;
    baseSeconds = now.value;
    originMs = performance.now();
    isPlaying.value = true;
    cancelFrame();
    frameId = requestAnimationFrame(tick);
  }

  function pause() {
    if (!isPlaying.value) return;
    cancelFrame();
    isPlaying.value = false;
    baseSeconds = now.value;
  }

  function toggle() {
    if (isPlaying.value) pause();
    else play();
  }

  function seek(time: number) {
    const limit = duration();
    const clamped = Math.min(Math.max(0, Number(time) || 0), limit > 0 ? limit : Number.MAX_VALUE);
    now.value = clamped;
    isFinished.value = limit > 0 && clamped >= limit - 1e-6;
    if (isPlaying.value) {
      baseSeconds = clamped;
      originMs = performance.now();
    }
  }

  function step(delta: number) {
    seek(now.value + delta);
  }

  function reset() {
    const wasPlaying = isPlaying.value;
    cancelFrame();
    isPlaying.value = false;
    now.value = 0;
    baseSeconds = 0;
    isFinished.value = false;
    if (wasPlaying) play();
  }

  onScopeDispose(() => {
    cancelFrame();
    isPlaying.value = false;
  });

  if (options.autoStart) {
    // 数据可能还没加载完（duration 为 0），交给调用方在数据就绪后调用 play()。
    isPlaying.value = false;
  }

  return { now, isPlaying, speed, play, pause, toggle, seek, step, reset, isFinished };
}
