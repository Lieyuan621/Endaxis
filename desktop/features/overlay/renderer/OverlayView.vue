<script setup lang="ts">
/** 独立桌面 HUD，只读取编辑器发布的快照。 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { matchFeedbackInput, type FeedbackInput } from './inputFeedback';
import GameOverlayHud from './GameOverlayHud.vue';
import { emptyOverlayPlan, filterCasts } from './plan';
import { buildDemoPlan } from './demoPlan';
import { useOverlayI18n } from './messages';
import { useOverlayPlayback } from './playback';
import { useCountdownTrigger } from './useCountdownTrigger';
import { useOverlayPreferences, type OverlayPreferences } from './preferences';
import type { OverlayPlan } from './plan';
import { loadOverlaySnapshot, type OverlaySnapshot } from './snapshot';
import { desktopI18n, setDesktopLocale } from '../../../i18n';
import type { OverlaySettingsCommand, OverlaySettingsState } from './desktopApi';

const desktopApi = window.endaxisDesktop;
const clickThrough = ref(false);
const playbackShortcutsAvailable = ref(true);
const autoTriggerAvailable = ref(false);
let unsubscribeClickThrough: (() => void) | null = null;
let unsubscribePlayback: (() => void) | null = null;

const { t } = useOverlayI18n();
const { preferences, patch, reset: resetPreferences } = useOverlayPreferences();

const feedback = ref('');
let feedbackTimer: number | null = null;

const demoMode = ref(
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo'),
);
const loading = ref(true);
const errorCode = ref<string | null>(null);
const scenarioName = ref('');
const plan = ref<OverlayPlan>(emptyOverlayPlan());
const viewport = ref({ width: window.innerWidth, height: window.innerHeight });
function onWindowResize() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight };
}

let snapshotChannel: BroadcastChannel | null = null;
const pendingExport = ref(false);

const hasResourceData = computed(
  () => plan.value.spPoints.length > 0 || Object.keys(plan.value.gaugePoints).length > 0,
);

const practiceMode = computed(() => preferences.value.playbackMode === 'practice');
const practiceIndex = ref(0);
const practiceRunning = ref(false);
const practiceCasts = computed(() =>
  filterCasts(plan.value.casts, preferences.value)
    .filter(cast => cast.type !== 'other')
    .sort((a, b) => a.start - b.start || a.trackIndex - b.trackIndex),
);
const displayedPlan = computed(() =>
  practiceMode.value ? { ...plan.value, casts: practiceCasts.value } : plan.value,
);
// 按键练习只使用单行，按当前有效布局适配窗口高度。
const viewportScale = computed(() =>
  Math.max(
    0.5,
    Math.min(
      2.5,
      (viewport.value.height - 10) /
        (128 +
          (!practiceMode.value && preferences.value.layoutMode === 'staggered'
            ? Math.max(0, plan.value.tracks.length - 1) *
              (preferences.value.showStatusEffects ? 96 : 72)
            : 0) +
          (hasResourceData.value ? 26 : 0)),
    ),
  ),
);
/** 没有技力/能量曲线时隐藏资源条，避免显示假数据。 */
const effectivePreferences = computed<OverlayPreferences>(() => ({
  ...preferences.value,
  layoutMode: practiceMode.value ? 'single' : preferences.value.layoutMode,
  scale: viewportScale.value,
  width: Math.max(1, viewport.value.width) / viewportScale.value,
}));

const playback = useOverlayPlayback({
  startTime: () => plan.value.startTime,
  duration: () => plan.value.duration,
  startDelaySeconds: () => preferences.value.startDelaySeconds,
});
const { now, hasStarted } = playback;
// 练习只跳转展示用采样时刻，不启动时间播放。
const displayTime = computed(() =>
  practiceMode.value
    ? (practiceCasts.value[practiceIndex.value]?.start ?? plan.value.duration)
    : now.value,
);
const isPlaying = computed(() =>
  practiceMode.value ? practiceRunning.value : playback.isPlaying.value,
);
const isFinished = computed(() =>
  practiceMode.value
    ? practiceCasts.value.length > 0 && practiceIndex.value >= practiceCasts.value.length
    : playback.isFinished.value,
);
const waitingRemaining = computed(() => (practiceMode.value ? 0 : playback.waitingRemaining.value));
const confirmedInputs = ref(new Set<string>());
const inputFeedbackStatus = ref('off');
let unsubscribeInput: (() => void) | undefined;
let unsubscribeInputStatus: (() => void) | undefined;
let inputEnabledAt = Infinity;
const attackHeld = ref(false);
let lastAttackTime = NaN;
let attackPressedAt = Infinity;
let attackPressConsumed = false;
let attackLastMatchedAt = -Infinity;
const ATTACK_REPEAT_DELAY_MS = 350;
// 短按最多消费一次；长按仍逐帧尝试，但两次成功匹配至少间隔 350ms。
function canMatchAttack() {
  return (
    attackHeld.value &&
    (!attackPressConsumed ||
      (Date.now() - attackPressedAt >= ATTACK_REPEAT_DELAY_MS &&
        Date.now() - attackLastMatchedAt >= ATTACK_REPEAT_DELAY_MS))
  );
}
let practiceFrame: number | null = null;
function practiceInput(event: FeedbackInput) {
  if (!practiceRunning.value) return;
  const next = practiceCasts.value[practiceIndex.value];
  if (!next || !matchFeedbackInput([next], event, next.start, new Set(), 0)) return;
  confirmedInputs.value = new Set([...confirmedInputs.value, next.id]);
  if (event.type === 'attack') {
    attackPressConsumed = true;
    attackLastMatchedAt = Date.now();
  }
  do {
    practiceIndex.value++;
  } while (confirmedInputs.value.has(practiceCasts.value[practiceIndex.value]?.id ?? ''));
  if (practiceIndex.value >= practiceCasts.value.length) practiceRunning.value = false;
}
function tickPractice() {
  practiceFrame = null;
  if (!practiceMode.value || !practiceRunning.value) return;
  if (canMatchAttack()) practiceInput({ type: 'attack', at: Date.now() });
  if (practiceRunning.value) practiceFrame = requestAnimationFrame(tickPractice);
}
watch(practiceRunning, running => {
  if (practiceFrame !== null) cancelAnimationFrame(practiceFrame);
  practiceFrame = running ? requestAnimationFrame(tickPractice) : null;
});
watch(practiceMode, () => resetPlayback());
watch(
  () => [preferences.value.showBasic, preferences.value.showHeavy],
  () => {
    if (!practiceMode.value) return;
    const next = practiceCasts.value.findIndex(cast => !confirmedInputs.value.has(cast.id));
    practiceIndex.value = next < 0 ? practiceCasts.value.length : next;
    if (next < 0) practiceRunning.value = false;
  },
  { flush: 'sync' },
);
function matchAttack(time = now.value) {
  if (practiceMode.value) return;
  if (
    !canMatchAttack() ||
    !isPlaying.value ||
    waitingRemaining.value > 0 ||
    lastAttackTime === now.value
  )
    return;
  lastAttackTime = now.value;
  const matched = matchFeedbackInput(
    plan.value.casts,
    { type: 'attack', at: Date.now() },
    time,
    confirmedInputs.value,
    preferences.value.inputTolerance,
  );
  if (matched) {
    confirmedInputs.value = new Set([...confirmedInputs.value, matched.id]);
    attackPressConsumed = true;
    attackLastMatchedAt = Date.now();
  }
}
watch(now, () => matchAttack(), { flush: 'sync' });
watch([isPlaying, () => waitingRemaining.value > 0], ([playing, waiting]) => {
  const active = Boolean(playing && !waiting);
  inputEnabledAt = active ? Date.now() : Infinity;
});
watch(isPlaying, playing => {
  if (!playing) attackHeld.value = false;
  void desktopApi?.inputFeedback?.setEnabled(playing).catch(() => {
    inputFeedbackStatus.value = 'error';
  });
});
watch(plan, () => {
  confirmedInputs.value = new Set();
  practiceIndex.value = 0;
  practiceRunning.value = false;
});

const autoTrigger = useCountdownTrigger({
  source: desktopApi?.countdownTrigger,
  playback,
  canStart: () => !practiceMode.value && !loading.value && plan.value.hasCasts && !isPlaying.value,
  startTime: () => plan.value.startTime,
  onStarted: () => showFeedback(t('overlay.auto.started')),
});
const autoTriggerStatus = autoTrigger.status;
const autoTriggerApi = autoTrigger.api;

watch(
  () => preferences.value.startDelaySeconds,
  () => {
    if (!hasStarted.value && !isPlaying.value) playback.reset();
  },
);

function showFeedback(message: string) {
  feedback.value = message;
  if (feedbackTimer !== null) window.clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(() => {
    feedback.value = '';
  }, 1800);
}

function togglePlayback() {
  if (loading.value || !plan.value.hasCasts) return;
  if (!isPlaying.value) autoTrigger.stop();
  if (practiceMode.value) {
    if (isFinished.value) {
      practiceIndex.value = 0;
      confirmedInputs.value = new Set();
    }
    practiceRunning.value = !practiceRunning.value;
    return;
  }
  playback.toggle();
  const state =
    waitingRemaining.value > 0
      ? isPlaying.value
        ? 'waiting'
        : 'waitingPaused'
      : isPlaying.value
        ? 'playing'
        : 'paused';
  showFeedback(t(`overlay.playback.${state}`));
}

function resetPlayback() {
  practiceRunning.value = false;
  practiceIndex.value = 0;
  confirmedInputs.value = new Set();
  autoTrigger.stop();
  playback.reset();
}

function adjustPlayback(delta: number) {
  if (practiceMode.value) {
    const next = Math.max(
      0,
      Math.min(practiceCasts.value.length, practiceIndex.value + Math.sign(delta)),
    );
    practiceIndex.value = next;
    // 跳过的步骤视为已消费；回退后的步骤允许重新匹配。
    confirmedInputs.value = new Set(practiceCasts.value.slice(0, next).map(cast => cast.id));
    attackHeld.value = false;
    if (next === practiceCasts.value.length) practiceRunning.value = false;
    return;
  }
  confirmedInputs.value = new Set();
  const wasWaiting = waitingRemaining.value > 0;
  playback.step(delta);
  const key =
    !wasWaiting && delta < 0 && now.value <= plan.value.startTime
      ? 'overlay.atStart'
      : delta > 0 && now.value >= plan.value.duration
        ? 'overlay.atEnd'
        : delta < 0
          ? 'overlay.delayed'
          : 'overlay.advanced';
  showFeedback(t(key));
}

/** 独立数据库只保存展示快照，绝不写回编辑器存档。 */
let pollHandle: number | null = null;
let snapshotId: string | null = null;
let disposed = false;
let loadGeneration = 0;
let polling = false;

async function acceptSnapshot(snapshot: OverlaySnapshot, generation: number) {
  // 跟随这次导出的语言，仅更新当前窗口，不写回主程序偏好或项目。
  if (disposed || generation !== loadGeneration) return;
  setDesktopLocale(snapshot.locale);
  document.title = `${desktopI18n.global.t('overlay.title')} · Endaxis`;
  playback.pause();
  plan.value = snapshot.plan;
  scenarioName.value = snapshot.scenarioName;
  snapshotId = snapshot.id;
  pendingExport.value = false;
  resetPlayback();
}

async function loadPlan() {
  if (!demoMode.value) snapshotChannel?.postMessage('request-refresh');
  const generation = ++loadGeneration;
  playback.pause();
  loading.value = true;
  errorCode.value = null;
  if (demoMode.value) {
    plan.value = buildDemoPlan(t);
    scenarioName.value = t('overlay.demo');
    loading.value = false;
    resetPlayback();
    return;
  }
  try {
    const snapshot = await loadOverlaySnapshot();
    if (disposed || generation !== loadGeneration) return;
    if (!snapshot) {
      plan.value = emptyOverlayPlan();
      scenarioName.value = '';
      snapshotId = null;
      resetPlayback();
      errorCode.value = 'no-project';
      return;
    }
    await acceptSnapshot(snapshot, generation);
  } catch (error) {
    if (disposed || generation !== loadGeneration) return;
    plan.value = emptyOverlayPlan();
    errorCode.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (!disposed && generation === loadGeneration) loading.value = false;
  }
}

async function pollSnapshot() {
  if (demoMode.value || loading.value || disposed || polling) return;
  polling = true;
  const generation = loadGeneration;
  try {
    const snapshot = await loadOverlaySnapshot();
    if (disposed || generation !== loadGeneration || demoMode.value) return;
    if (!snapshot || snapshot.id === snapshotId) return;
    errorCode.value = null;
    await acceptSnapshot(snapshot, generation);
  } catch {
    /* 读失败保留当前快照，手动重载时展示详细错误。 */
  } finally {
    polling = false;
  }
}

watch(isPlaying, playing => {
  if (!playing) void pollSnapshot();
});

const desktopHintText = computed(() =>
  clickThrough.value ? t('overlay.desktopLocked') : t('overlay.desktopHint'),
);

/* ── 键盘 / 控件显隐 ────────────────────────────────────────────────── */

const settingsCommandPending = ref(false);
const settingsCommandError = ref('');
let unsubscribeSettings: (() => void) | undefined;

function publishSettings() {
  if (disposed || !desktopApi?.publishSettings) return;
  const state: OverlaySettingsState = {
    preferences: { ...preferences.value },
    locale: desktopI18n.global.locale.value,
    scenarioName: scenarioName.value,
    loading: loading.value,
    isPlaying: isPlaying.value,
    practiceMode: practiceMode.value,
    canPlay:
      !loading.value && (practiceMode.value ? practiceCasts.value.length > 0 : plan.value.hasCasts),
    canArm: !practiceMode.value && !loading.value && plan.value.hasCasts && !isPlaying.value,
    autoTriggerStatus: autoTriggerStatus.value ? { ...autoTriggerStatus.value } : null,
    autoTriggerAvailable: autoTriggerAvailable.value,
    playbackShortcutsAvailable: playbackShortcutsAvailable.value,
    inputFeedbackStatus: inputFeedbackStatus.value,
    commandPending: settingsCommandPending.value,
    commandError: settingsCommandError.value,
  };
  // IPC payloads must be ordinary objects rather than Vue reactive proxies.
  void Promise.resolve(desktopApi.publishSettings(state)).catch(() => {});
}
async function handleSettingsCommand(command: OverlaySettingsCommand) {
  if (disposed) return;
  if (command.type === 'requestState') {
    publishSettings();
    return;
  }
  if (command.type === 'patch') {
    patch(command.patch);
    publishSettings();
    return;
  }
  if (command.type === 'resetPreferences') {
    resetPreferences();
    publishSettings();
    return;
  }
  if (settingsCommandPending.value) return;
  settingsCommandPending.value = true;
  settingsCommandError.value = '';
  publishSettings();
  try {
    if (command.type === 'reload') {
      demoMode.value = false;
      autoTrigger.stop();
      await loadPlan();
    } else if (command.type === 'countdownSelect') await autoTriggerApi?.selectRegion();
    else if (command.type === 'countdownArm') await autoTriggerApi?.arm();
    else if (command.type === 'countdownClear') await autoTriggerApi?.clear();
    else if (command.type === 'countdownStop') await autoTriggerApi?.disarm();
  } catch (error) {
    if (!disposed)
      settingsCommandError.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (!disposed) {
      settingsCommandPending.value = false;
      publishSettings();
    }
  }
}
watch(
  [
    preferences,
    inputFeedbackStatus,
    scenarioName,
    loading,
    isPlaying,
    () => plan.value.hasCasts,
    autoTriggerStatus,
    autoTriggerAvailable,
    playbackShortcutsAvailable,
    () => desktopI18n.global.locale.value,
  ],
  publishSettings,
);

/* ── 透明背景 ───────────────────────────────────────────────────────── */

const backgroundElements = [
  document.documentElement,
  document.body,
  document.getElementById('app'),
];
const originalBackgrounds = backgroundElements.map(element => ({
  element,
  value: element?.style.getPropertyValue('background') ?? '',
  priority: element?.style.getPropertyPriority('background') ?? '',
}));
const originalTitle = document.title;

for (const element of backgroundElements) {
  element?.style.setProperty('background', 'transparent', 'important');
}

onMounted(() => {
  unsubscribeInputStatus = desktopApi?.inputFeedback?.onStatus(status => {
    inputFeedbackStatus.value = status;
    if (status !== 'listening') attackHeld.value = false;
  });
  unsubscribeInput = desktopApi?.inputFeedback?.onInput(event => {
    if (event.type === 'attack') {
      if (!event.pressed) {
        attackHeld.value = false;
        attackPressedAt = Infinity;
        return;
      }
      if (
        attackHeld.value ||
        !isPlaying.value ||
        waitingRemaining.value > 0 ||
        event.at < inputEnabledAt
      )
        return;
      attackHeld.value = true;
      attackPressedAt = event.at;
      attackPressConsumed = false;
      attackLastMatchedAt = -Infinity;
      lastAttackTime = NaN;
      if (practiceMode.value) practiceInput(event);
      else matchAttack(playback.readTime() - (Date.now() - event.at) / 1000);
      return;
    }
    if (
      !isPlaying.value ||
      waitingRemaining.value > 0 ||
      (event.startedAt ?? event.at) < inputEnabledAt
    )
      return;
    if (practiceMode.value) {
      practiceInput(event);
      return;
    }
    const time = playback.readTime() - (Date.now() - event.at) / 1000;
    const matched = matchFeedbackInput(
      plan.value.casts,
      event,
      time,
      confirmedInputs.value,
      preferences.value.inputTolerance,
    );
    if (matched) confirmedInputs.value = new Set([...confirmedInputs.value, matched.id]);
  });
  window.addEventListener('resize', onWindowResize);
  document.title = `${t('overlay.title')} · Endaxis`;
  if (typeof BroadcastChannel !== 'undefined') {
    snapshotChannel = new BroadcastChannel('endaxis-overlay');
    snapshotChannel.onmessage = event => {
      if (disposed || event.data === snapshotId) return;
      if (event.data === 'editor-ready') {
        snapshotChannel?.postMessage('request-refresh');
        return;
      }
      if (event.data === 'request-refresh') return;
      demoMode.value = false;
      pendingExport.value = true;
      void pollSnapshot();
    };
  }

  if (desktopApi) {
    unsubscribeSettings = desktopApi.onSettingsCommand?.(command => {
      void handleSettingsCommand(command);
    });
    publishSettings();
    unsubscribeClickThrough =
      desktopApi?.onClickThrough?.(value => {
        clickThrough.value = value;
      }) ?? null;
    unsubscribePlayback =
      desktopApi?.onPlaybackCommand(command => {
        if (loading.value || !plan.value.hasCasts) return;
        if (command === 'toggle') togglePlayback();
        else if (command === 'restart') {
          resetPlayback();
          showFeedback(t('overlay.controls.reset'));
        } else adjustPlayback(command === 'backward' ? -0.25 : 0.25);
      }) ?? null;
    void desktopApi
      ?.info()
      .then(info => {
        if (disposed) return;
        clickThrough.value = info.clickThrough;
        playbackShortcutsAvailable.value = info.playbackShortcutsAvailable;
        autoTriggerAvailable.value = info.countdownTriggerAvailable === true;
      })
      .catch(error => {
        if (!disposed) errorCode.value = error instanceof Error ? error.message : String(error);
      });
  }

  pollHandle = window.setInterval(() => void pollSnapshot(), 1000);
  void loadPlan();
});

onBeforeUnmount(() => {
  disposed = true;
  loadGeneration++;
  window.removeEventListener('resize', onWindowResize);
  unsubscribeClickThrough?.();
  unsubscribePlayback?.();
  unsubscribeSettings?.();
  if (practiceFrame !== null) cancelAnimationFrame(practiceFrame);
  unsubscribeInput?.();
  unsubscribeInputStatus?.();
  void desktopApi?.inputFeedback?.setEnabled(false);
  snapshotChannel?.close();
  if (feedbackTimer !== null) window.clearTimeout(feedbackTimer);
  if (pollHandle !== null) window.clearInterval(pollHandle);
  document.title = originalTitle;
  for (const { element, value, priority } of originalBackgrounds) {
    if (value) element?.style.setProperty('background', value, priority);
    else element?.style.removeProperty('background');
  }
});
</script>

<template>
  <div class="overlay-page is-desktop">
    <div class="overlay-stage">
      <div class="overlay-hud-anchor is-desktop">
        <div class="overlay-hud-surface">
          <GameOverlayHud
            :plan="displayedPlan"
            :practice-index="practiceMode ? practiceIndex : undefined"
            :feedback-ids="confirmedInputs"
            :preferences="effectivePreferences"
            :now="displayTime"
            :is-playing="isPlaying"
            :finished="isFinished"
            :waiting-remaining="waitingRemaining"
            :has-started="practiceMode ? practiceIndex > 0 : hasStarted"
            :loading="loading"
            @toggle-play="togglePlayback"
          >
            <template #summary-prefix
              ><span class="overlay-source-label">{{
                demoMode ? t('overlay.demoBadge') : scenarioName
              }}</span></template
            >
          </GameOverlayHud>
        </div>
        <div v-if="!preferences.compactMode" class="overlay-notices">
          <div
            v-if="errorCode && errorCode !== 'no-project'"
            class="overlay-ready-hint"
            role="alert"
          >
            {{ t('overlay.loadFailed') }} · {{ errorCode }}
          </div>
          <div
            v-if="plan.hasCasts && !isPlaying && now === plan.startTime"
            class="overlay-ready-hint"
          >
            {{ desktopHintText }}
          </div>
          <div v-if="feedback" class="overlay-ready-hint" role="status">{{ feedback }}</div>
          <div v-if="pendingExport" class="overlay-ready-hint" role="status">
            {{ t('overlay.pendingExport') }}
          </div>
          <div v-if="autoTriggerStatus?.armed" class="overlay-ready-hint" role="status">
            {{ t(`overlay.auto.phase.${autoTriggerStatus.phase}`) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: 'Segoe UI', 'Inter', system-ui, sans-serif;
}

.overlay-stage {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.overlay-hud-anchor {
  position: absolute;
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  inset: 0;
}

.overlay-hud-anchor:active {
  cursor: grabbing;
}

.overlay-source-label {
  max-width: 180px;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overlay-hud-anchor.is-desktop {
  -webkit-app-region: drag;
}

.overlay-hud-anchor.is-desktop :deep(.ov-hud) {
  width: 100% !important;
  height: 100%;
  box-sizing: border-box;
  border-radius: 0;
  box-shadow: none;
}

.overlay-hud-anchor.is-desktop :deep(button),
.overlay-hud-anchor.is-desktop :deep(input) {
  -webkit-app-region: no-drag;
}

/* 透明窗口里 backdrop-filter 拿不到桌面背景，关掉它，底色交给「不透明度」设置 */
.is-desktop .ov-hud {
  backdrop-filter: none;
}

.overlay-ready-hint {
  margin-top: 6px;
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.55);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}
</style>

<style scoped>
.overlay-hud-surface {
  position: relative;
  height: 100%;
}
.overlay-hud-surface :deep(.ov-belt) {
  flex: 1;
  min-height: 0;
}
.overlay-hud-surface :deep(.ov-summary),
.overlay-hud-surface :deep(.ov-resources) {
  flex-shrink: 0;
}
.overlay-notices {
  position: absolute;
  left: 100px;
  right: 8px;
  bottom: 30px;
  pointer-events: none;
}
</style>
