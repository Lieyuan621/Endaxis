import { onScopeDispose, ref } from 'vue';
import type { CountdownTriggerApi, CountdownTriggerStatus } from './desktopApi';
import type { OverlayPlayback } from './playback';

/** 自动识别只驱动 HUD 播放，不接触原始项目或模拟结果。 */
export function useCountdownTrigger(options: {
  source?: CountdownTriggerApi;
  playback: OverlayPlayback;
  canStart: () => boolean;
  startTime: () => number;
  onStarted: () => void;
}) {
  const status = ref<CountdownTriggerStatus | null>(null);
  const source = options.source;
  let disposed = false;
  let acceptsTrigger = false;
  let generation = 0;

  function cancelPendingTrigger() {
    generation++;
    acceptsTrigger = false;
  }

  const api: CountdownTriggerApi | undefined = source && {
    info: () => source.info(),
    selectRegion: () => {
      cancelPendingTrigger();
      return source.selectRegion();
    },
    clear: () => {
      cancelPendingTrigger();
      return source.clear();
    },
    disarm: () => {
      cancelPendingTrigger();
      return source.disarm();
    },
    arm: async () => {
      const current = ++generation;
      acceptsTrigger = options.canStart() && !disposed;
      if (!acceptsTrigger) return source.info();
      try {
        const result = await source.arm();
        if (current === generation && !result.armed) acceptsTrigger = false;
        return result;
      } catch (error) {
        if (current === generation) acceptsTrigger = false;
        throw error;
      }
    },
    onStatus: callback => source.onStatus(callback),
    onTrigger: callback => source.onTrigger(callback),
  };

  const offStatus = source?.onStatus(value => {
    if (!disposed) status.value = value;
  });
  const offTrigger = source?.onTrigger(event => {
    if (
      disposed ||
      !acceptsTrigger ||
      !options.canStart() ||
      !Number.isFinite(event.elapsedSeconds) ||
      event.elapsedSeconds < 0
    )
      return;
    acceptsTrigger = false;
    options.playback.reset();
    // 已见到游戏计时器，不再叠加手动开始前的等待；补偿连续帧确认耗时。
    options.playback.seek(options.startTime() + event.elapsedSeconds);
    if (!options.playback.isFinished.value) options.playback.play();
    options.onStarted();
  });

  void source
    ?.info()
    .then(value => {
      if (!disposed) status.value = value;
    })
    .catch(() => {});

  function stop() {
    cancelPendingTrigger();
    void source?.disarm().catch(() => {});
  }

  onScopeDispose(() => {
    disposed = true;
    offStatus?.();
    offTrigger?.();
    stop();
  });

  return { api, status, stop };
}
