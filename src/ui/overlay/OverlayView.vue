<script setup lang="ts">
/**
 * 游戏内提示窗口（v3，路由 `/overlay`）。
 *
 * 页面只读编辑器导出的 HUD 快照，不加载项目或重新运行模拟。
 *
 * 桌面模式由 `desktop/preload.cjs` 注入的 `window.endaxisDesktop` 识别：
 * 无边框透明置顶窗口、可拖动、可鼠标穿透（Ctrl+Alt+O）。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import GameOverlayHud from './GameOverlayHud.vue';
import CountdownTriggerSettings from './CountdownTriggerSettings.vue';
import { emptyOverlayPlan } from './plan';
import { buildDemoPlan } from './demoPlan';
import { useOverlayI18n } from './messages';
import { useOverlayPlayback } from './playback';
import { useCountdownTrigger } from './useCountdownTrigger';
import { OVERLAY_LIMITS, useOverlayPreferences, type OverlayPreferences } from './preferences';
import type { OverlayPlan } from './plan';
import { loadOverlaySnapshot, type OverlaySnapshot } from './snapshot';
import { ensureLocaleResources, i18n } from '../../i18n';
import type {} from './desktopApi';

const desktopApi = window.endaxisDesktop;
const isDesktop = Boolean(desktopApi?.isDesktop);
const clickThrough = ref(false);
const clickThroughAvailable = ref(false);
const playbackShortcutsAvailable = ref(true);
const autoTriggerAvailable = ref(false);
let unsubscribeClickThrough: (() => void) | null = null;
let unsubscribePlayback: (() => void) | null = null;

const { t } = useOverlayI18n();
const { preferences, patch, reset: resetPreferences } = useOverlayPreferences();

const settingsOpen = ref(false);
const controlsVisible = ref(true);
let hideTimer: number | null = null;
const feedback = ref('');
let feedbackTimer: number | null = null;

const demoMode = ref(
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo'),
);
const loading = ref(true);
const errorCode = ref<string | null>(null);
const scenarioName = ref('');
const plan = ref<OverlayPlan>(emptyOverlayPlan());
const hudAnchor = ref<HTMLElement | null>(null);
let hudObserver: ResizeObserver | null = null;
let snapshotChannel: BroadcastChannel | null = null;
const pendingExport = ref(false);

const empty = computed(() => !loading.value && !plan.value.hasCasts);
const emptyTitle = computed(() =>
  errorCode.value && errorCode.value !== 'no-project'
    ? t('overlay.loadFailed')
    : t('overlay.emptyTitle'),
);
const hasResourceData = computed(
  () => plan.value.spPoints.length > 0 || Object.keys(plan.value.gaugePoints).length > 0,
);

/** 没有技力/能量曲线时隐藏资源条，避免显示假数据。 */
const effectivePreferences = computed<OverlayPreferences>(() => ({
  ...preferences.value,
  showResources: preferences.value.showResources && hasResourceData.value,
}));

const playback = useOverlayPlayback({
  startTime: () => plan.value.startTime,
  duration: () => plan.value.duration,
  startDelaySeconds: () => preferences.value.startDelaySeconds,
});
const { now, isPlaying, isFinished, waitingRemaining, hasStarted } = playback;
const autoTrigger = useCountdownTrigger({
  source: desktopApi?.countdownTrigger,
  playback,
  canStart: () => !loading.value && plan.value.hasCasts && !isPlaying.value,
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
  autoTrigger.stop();
  playback.reset();
}

function adjustTime(delta: number) {
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

/** 独立数据库只保存展示快照，绝不写回编辑器存档。播放中保留当前版本。 */
let pollHandle: number | null = null;
let snapshotId: string | null = null;
let disposed = false;
let loadGeneration = 0;
let polling = false;

async function acceptSnapshot(snapshot: OverlaySnapshot, generation: number) {
  // 跟随这次导出的语言，仅更新当前窗口，不写回主程序偏好或项目。
  const prepared = await ensureLocaleResources(snapshot.locale);
  if (disposed || generation !== loadGeneration || isPlaying.value) return;
  i18n.global.setLocaleMessage(prepared.locale, prepared.uiMessages);
  i18n.global.locale.value = prepared.locale;
  document.documentElement.lang = prepared.locale;
  playback.pause();
  plan.value = snapshot.plan;
  scenarioName.value = snapshot.scenarioName;
  snapshotId = snapshot.id;
  pendingExport.value = false;
  resetPlayback();
  if (preferences.value.autoStart && snapshot.plan.hasCasts) playback.play();
}

async function loadPlan() {
  const generation = ++loadGeneration;
  playback.pause();
  loading.value = true;
  errorCode.value = null;
  if (demoMode.value) {
    plan.value = buildDemoPlan();
    scenarioName.value = t('overlay.demo');
    loading.value = false;
    resetPlayback();
    if (preferences.value.autoStart) playback.play();
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
  if (demoMode.value || isPlaying.value || loading.value || disposed || polling) return;
  polling = true;
  const generation = loadGeneration;
  try {
    const snapshot = await loadOverlaySnapshot();
    if (disposed || generation !== loadGeneration || isPlaying.value || demoMode.value) return;
    if (!snapshot || snapshot.id === snapshotId) return;
    errorCode.value = null;
    await acceptSnapshot(snapshot, generation);
  } catch {
    /* 读失败保留当前快照，手动重载时展示详细错误。 */
  } finally {
    polling = false;
  }
}

function startDemo() {
  demoMode.value = true;
  errorCode.value = null;
  void loadPlan();
}

watch(isPlaying, playing => {
  if (!playing) void pollSnapshot();
});

/* ── 拖拽（浏览器模式移动 HUD；桌面模式由 -webkit-app-region 移动窗口） ── */

interface DragState {
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  dx: number;
  dy: number;
}

const drag = ref<DragState | null>(null);

function onHudPointerDown(event: PointerEvent) {
  if (isDesktop) return;
  if (event.button !== 0) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('button, input, select, a')) return;
  drag.value = {
    startX: event.clientX,
    startY: event.clientY,
    baseX: preferences.value.offsetX,
    baseY: preferences.value.offsetY,
    dx: 0,
    dy: 0,
  };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  event.preventDefault();
}

function onHudPointerMove(event: PointerEvent) {
  const state = drag.value;
  if (!state) return;
  state.dx = event.clientX - state.startX;
  state.dy = event.clientY - state.startY;
}

function onHudPointerUp(event: PointerEvent) {
  const state = drag.value;
  if (!state) return;
  drag.value = null;
  (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  patch({ offsetX: state.baseX + state.dx, offsetY: state.baseY + state.dy });
}

const hudStyle = computed(() => ({
  left: isDesktop ? '50%' : `calc(50% + ${preferences.value.offsetX + (drag.value?.dx ?? 0)}px)`,
  top: isDesktop ? '40px' : `${preferences.value.offsetY + (drag.value?.dy ?? 0)}px`,
  transform: 'translateX(-50%)',
}));

/* ── 设置 ───────────────────────────────────────────────────────────── */

function patchNumber(key: keyof OverlayPreferences, value: unknown) {
  patch({ [key]: Number(value) } as Partial<OverlayPreferences>);
}

function resetPosition() {
  patch({ offsetX: 0, offsetY: 40 });
}

/* ── 桌面悬浮窗 ─────────────────────────────────────────────────────── */

function syncDesktopWindow() {
  if (!isDesktop || !desktopApi?.resize) return;
  const width = Math.round(preferences.value.width * preferences.value.scale) + 32;
  const bottom = 40 + (hudAnchor.value?.getBoundingClientRect().height ?? 180) + 16;
  const height = Math.ceil(Math.max(bottom, settingsOpen.value ? 420 : 0));
  void desktopApi.resize({ width, height }).catch(error => {
    errorCode.value = error instanceof Error ? error.message : String(error);
  });
}

async function toggleClickThrough() {
  if (!desktopApi?.toggleClickThrough) return;
  clickThrough.value = await desktopApi.toggleClickThrough();
}

function quitDesktop() {
  desktopApi?.quit?.();
}

const desktopHintText = computed(() =>
  !clickThroughAvailable.value
    ? t('overlay.desktopUnavailable')
    : clickThrough.value
      ? t('overlay.desktopLocked')
      : t('overlay.desktopHint'),
);

watch([() => preferences.value.width, () => preferences.value.scale, settingsOpen], async () => {
  await nextTick();
  if (!disposed) syncDesktopWindow();
});
watch(hudAnchor, element => {
  hudObserver?.disconnect();
  if (!element || !isDesktop) return;
  hudObserver = new ResizeObserver(syncDesktopWindow);
  hudObserver.observe(element);
  syncDesktopWindow();
});

/* ── 键盘 / 控件显隐 ────────────────────────────────────────────────── */

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, select, textarea, [contenteditable="true"]')) return;
  // Space 留给已聚焦按钮的原生点击，其余快捷键在点击播放后仍可使用。
  if (event.code === 'Space' && target?.closest('button')) return;
  if (event.repeat && event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') return;
  switch (event.code) {
    case 'Space':
      event.preventDefault();
      togglePlayback();
      break;
    case 'KeyR':
      resetPlayback();
      break;
    case 'KeyS':
      settingsOpen.value = !settingsOpen.value;
      break;
    case 'KeyI':
      patch({ iconMode: preferences.value.iconMode === 'skill' ? 'portrait' : 'skill' });
      break;
    case 'ArrowLeft':
      event.preventDefault();
      if (event.shiftKey) adjustTime(-0.25);
      else playback.step(-2);
      break;
    case 'ArrowRight':
      event.preventDefault();
      if (event.shiftKey) adjustTime(0.25);
      else playback.step(2);
      break;
    case 'KeyH':
      controlsVisible.value = !controlsVisible.value;
      break;
    case 'Escape':
      settingsOpen.value = false;
      break;
    default:
      break;
  }
}

function revealControls() {
  if (clickThrough.value) return;
  controlsVisible.value = true;
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    hideTimer = null;
    if (!settingsOpen.value) controlsVisible.value = false;
  }, 2600);
}

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

function applyBackground(transparent: boolean) {
  const value = transparent ? 'transparent' : '#0b0e14';
  for (const element of backgroundElements) {
    element?.style.setProperty('background', value, 'important');
  }
}

watch(() => preferences.value.transparent, applyBackground, { immediate: true });

onMounted(() => {
  // v3 的启动遮罩由首个编辑器移除；叠加页必须自己清掉，否则一直白屏。
  document.getElementById('boot-loader')?.remove();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('pointermove', revealControls, { passive: true });
  revealControls();
  document.title = `${t('overlay.title')} · Endaxis`;
  if (typeof BroadcastChannel !== 'undefined') {
    snapshotChannel = new BroadcastChannel('endaxis-overlay');
    snapshotChannel.onmessage = event => {
      if (disposed || event.data === snapshotId) return;
      demoMode.value = false;
      pendingExport.value = true;
      void pollSnapshot();
    };
  }

  if (isDesktop) {
    unsubscribeClickThrough =
      desktopApi?.onClickThrough?.(value => {
        clickThrough.value = value;
        if (value) {
          settingsOpen.value = false;
          controlsVisible.value = false;
        }
      }) ?? null;
    unsubscribePlayback =
      desktopApi?.onPlaybackCommand(command => {
        if (loading.value || !plan.value.hasCasts) return;
        if (command === 'toggle') togglePlayback();
        else if (command === 'restart') {
          resetPlayback();
          showFeedback(t('overlay.controls.reset'));
        } else adjustTime(command === 'backward' ? -0.25 : 0.25);
      }) ?? null;
    void desktopApi
      ?.info()
      .then(info => {
        if (disposed) return;
        clickThrough.value = info.clickThrough;
        clickThroughAvailable.value = info.clickThroughAvailable;
        playbackShortcutsAvailable.value = info.playbackShortcutsAvailable;
        autoTriggerAvailable.value = info.countdownTriggerAvailable === true;
      })
      .catch(error => {
        if (!disposed) errorCode.value = error instanceof Error ? error.message : String(error);
      });
    syncDesktopWindow();
  }

  pollHandle = window.setInterval(() => void pollSnapshot(), 1000);
  void loadPlan();
});

onBeforeUnmount(() => {
  disposed = true;
  loadGeneration++;
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('pointermove', revealControls);
  unsubscribeClickThrough?.();
  unsubscribePlayback?.();
  hudObserver?.disconnect();
  snapshotChannel?.close();
  if (hideTimer !== null) window.clearTimeout(hideTimer);
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
  <div
    class="overlay-page"
    :class="{ 'is-transparent': preferences.transparent, 'is-desktop': isDesktop }"
  >
    <div v-if="!preferences.transparent" class="overlay-backdrop" aria-hidden="true"></div>

    <div class="overlay-stage">
      <div
        v-if="!loading && !empty && plan.hasCasts"
        ref="hudAnchor"
        class="overlay-hud-anchor"
        :class="{ 'is-desktop': isDesktop }"
        :style="hudStyle"
        @pointerdown="onHudPointerDown"
        @pointermove="onHudPointerMove"
        @pointerup="onHudPointerUp"
        @pointercancel="onHudPointerUp"
      >
        <div class="overlay-source-label">
          {{ demoMode ? t('overlay.demoBadge') : scenarioName }}
        </div>
        <GameOverlayHud
          :plan="plan"
          :preferences="effectivePreferences"
          :now="now"
          :is-playing="isPlaying"
          :finished="isFinished"
          :waiting-remaining="waitingRemaining"
          :has-started="hasStarted"
          :loading="loading"
          @toggle-play="togglePlayback"
        />
        <div v-if="!isPlaying && now === plan.startTime" class="overlay-ready-hint">
          {{ isDesktop ? desktopHintText : t('overlay.readyHint') }}
        </div>
        <div v-if="feedback" class="overlay-ready-hint" role="status">{{ feedback }}</div>
        <div v-if="pendingExport" class="overlay-ready-hint" role="status">
          {{ t('overlay.pendingExport') }}
        </div>
        <div v-if="autoTriggerStatus?.armed" class="overlay-ready-hint" role="status">
          {{ t(`overlay.auto.phase.${autoTriggerStatus.phase}`) }}
        </div>
      </div>

      <div v-else-if="loading" class="overlay-message">{{ t('overlay.loading') }}</div>

      <div v-else class="overlay-message overlay-message--empty">
        <p class="overlay-message__title">
          {{ emptyTitle }}
        </p>
        <p class="overlay-message__hint">
          {{ errorCode === 'no-project' ? t('overlay.noProject') : t('overlay.emptyHint') }}
        </p>
        <p v-if="errorCode" class="overlay-message__code">{{ errorCode }}</p>
        <div class="overlay-message__actions">
          <button type="button" class="overlay-link" @click="() => loadPlan()">
            {{ t('overlay.controls.reload') }}
          </button>
          <button type="button" class="overlay-link overlay-link--ghost" @click="startDemo">
            {{ t('overlay.demo') }}
          </button>
          <button
            v-if="isDesktop"
            type="button"
            class="overlay-link"
            @click="desktopApi?.openEditor()"
          >
            {{ t('overlay.controls.editor') }}
          </button>
        </div>
      </div>
    </div>

    <div class="overlay-controls" :class="{ 'is-visible': controlsVisible || settingsOpen }">
      <button
        type="button"
        class="overlay-control"
        :disabled="loading || empty"
        :title="isPlaying ? t('overlay.controls.pause') : t('overlay.controls.play')"
        @click="togglePlayback"
      >
        <svg v-if="isPlaying" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" fill="currentColor"></rect>
          <rect x="14" y="5" width="4" height="14" fill="currentColor"></rect>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="M8 5l11 7-11 7z" fill="currentColor"></path>
        </svg>
      </button>
      <button
        type="button"
        class="overlay-control"
        :title="t('overlay.delay')"
        :disabled="loading || empty"
        @click="adjustTime(-0.25)"
      >
        −
      </button>
      <button
        type="button"
        class="overlay-control"
        :title="t('overlay.advance')"
        :disabled="loading || empty"
        @click="adjustTime(0.25)"
      >
        +
      </button>
      <button
        type="button"
        class="overlay-control"
        :title="t('overlay.controls.reset')"
        @click="resetPlayback"
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7"></path>
          <path d="M3 4v5h5"></path>
        </svg>
      </button>
      <button
        type="button"
        class="overlay-control"
        :title="t('overlay.controls.settings')"
        :aria-expanded="settingsOpen"
        @click="settingsOpen = !settingsOpen"
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3.2"></circle>
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
          ></path>
        </svg>
      </button>
      <button
        v-if="isDesktop"
        type="button"
        class="overlay-control"
        :class="{ 'is-active': clickThrough }"
        :disabled="!clickThroughAvailable"
        :title="clickThrough ? t('overlay.controls.unlock') : t('overlay.controls.lock')"
        :aria-pressed="clickThrough"
        @click="toggleClickThrough"
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <rect x="4.5" y="10" width="15" height="10" rx="2"></rect>
          <path v-if="clickThrough" d="M8 10V7.5a4 4 0 0 1 7.5-2"></path>
          <path v-else d="M8 10V7.5a4 4 0 0 1 8 1V10"></path>
        </svg>
      </button>
      <button
        v-if="isDesktop"
        type="button"
        class="overlay-control"
        :title="t('overlay.controls.quit')"
        @click="quitDesktop"
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12"></path>
          <path d="M18 6L6 18"></path>
        </svg>
      </button>
    </div>

    <div v-if="settingsOpen" class="overlay-settings">
      <header class="overlay-settings__head">
        <h2>{{ t('overlay.settings.title') }}</h2>
        <button
          type="button"
          class="overlay-settings__close"
          :aria-label="t('overlay.close')"
          @click="settingsOpen = false"
        >
          ✕
        </button>
      </header>
      <p v-if="scenarioName" class="overlay-settings__scenario">{{ scenarioName }}</p>

      <label class="overlay-field">
        <span>{{ t('overlay.settings.icon') }}</span>
        <span class="overlay-segment">
          <button
            type="button"
            :class="{ 'is-active': preferences.iconMode === 'skill' }"
            @click="patch({ iconMode: 'skill' })"
          >
            {{ t('overlay.settings.iconSkill') }}
          </button>
          <button
            type="button"
            :class="{ 'is-active': preferences.iconMode === 'portrait' }"
            @click="patch({ iconMode: 'portrait' })"
          >
            {{ t('overlay.settings.iconPortrait') }}
          </button>
        </span>
      </label>

      <label class="overlay-field">
        <span>{{ t('overlay.settings.range') }}</span>
        <input
          type="range"
          :min="OVERLAY_LIMITS.secondsAhead.min"
          :max="OVERLAY_LIMITS.secondsAhead.max"
          :value="preferences.secondsAhead"
          @input="patchNumber('secondsAhead', ($event.target as HTMLInputElement).value)"
        />
        <span class="overlay-field__value">{{ preferences.secondsAhead }}s</span>
      </label>

      <label class="overlay-field">
        <span>{{ t('overlay.settings.scale') }}</span>
        <input
          type="range"
          :min="OVERLAY_LIMITS.scale.min"
          :max="OVERLAY_LIMITS.scale.max"
          step="0.05"
          :value="preferences.scale"
          @input="patchNumber('scale', ($event.target as HTMLInputElement).value)"
        />
        <span class="overlay-field__value">{{ preferences.scale.toFixed(2) }}×</span>
      </label>

      <label class="overlay-field">
        <span>{{ t('overlay.settings.width') }}</span>
        <input
          type="range"
          :min="OVERLAY_LIMITS.width.min"
          :max="OVERLAY_LIMITS.width.max"
          step="20"
          :value="preferences.width"
          @input="patchNumber('width', ($event.target as HTMLInputElement).value)"
        />
        <span class="overlay-field__value">{{ preferences.width }}</span>
      </label>

      <label class="overlay-field">
        <span>{{ t('overlay.settings.opacity') }}</span>
        <input
          type="range"
          :min="OVERLAY_LIMITS.hudOpacity.min"
          :max="OVERLAY_LIMITS.hudOpacity.max"
          step="0.02"
          :value="preferences.hudOpacity"
          @input="patchNumber('hudOpacity', ($event.target as HTMLInputElement).value)"
        />
        <span class="overlay-field__value">{{ Math.round(preferences.hudOpacity * 100) }}%</span>
      </label>

      <label class="overlay-field" :title="t('overlay.settings.startDelayHint')">
        <span>{{ t('overlay.settings.startDelay') }}</span>
        <input
          type="range"
          :min="OVERLAY_LIMITS.startDelaySeconds.min"
          :max="OVERLAY_LIMITS.startDelaySeconds.max"
          step="0.1"
          :value="preferences.startDelaySeconds"
          @input="patchNumber('startDelaySeconds', ($event.target as HTMLInputElement).value)"
        />
        <span class="overlay-field__value">{{ preferences.startDelaySeconds.toFixed(1) }}s</span>
      </label>
      <p class="overlay-settings__hint">{{ t('overlay.settings.startDelayHint') }}</p>

      <div class="overlay-settings__toggles">
        <label class="overlay-toggle" :title="t('overlay.settings.showBasicHint')">
          <input
            type="checkbox"
            :checked="preferences.showBasic"
            @change="patch({ showBasic: ($event.target as HTMLInputElement).checked })"
          />
          <span>{{ t('overlay.settings.showBasic') }}</span>
        </label>
        <label class="overlay-toggle">
          <input
            type="checkbox"
            :checked="preferences.showResources"
            @change="patch({ showResources: ($event.target as HTMLInputElement).checked })"
          />
          <span>{{ t('overlay.settings.showResources') }}</span>
        </label>
        <label class="overlay-toggle" :title="t('overlay.settings.transparentHint')">
          <input
            type="checkbox"
            :checked="preferences.transparent"
            @change="patch({ transparent: ($event.target as HTMLInputElement).checked })"
          />
          <span>{{ t('overlay.settings.transparent') }}</span>
        </label>
        <label class="overlay-toggle">
          <input
            type="checkbox"
            :checked="preferences.autoStart"
            @change="patch({ autoStart: ($event.target as HTMLInputElement).checked })"
          />
          <span>{{ t('overlay.settings.autoStart') }}</span>
        </label>
      </div>

      <div class="overlay-settings__actions">
        <button
          v-if="!isDesktop"
          type="button"
          class="overlay-settings__button"
          @click="resetPosition"
        >
          {{ t('overlay.settings.resetPosition') }}
        </button>
        <button type="button" class="overlay-settings__button" @click="() => loadPlan()">
          {{ t('overlay.controls.reload') }}
        </button>
        <button type="button" class="overlay-settings__button" @click="resetPreferences">
          {{ t('overlay.settings.reset') }}
        </button>
        <button
          v-if="demoMode"
          type="button"
          class="overlay-settings__button"
          @click="
            demoMode = false;
            loadPlan();
          "
        >
          {{ t('overlay.returnToProject') }}
        </button>
        <button
          v-if="isDesktop"
          type="button"
          class="overlay-settings__button"
          @click="desktopApi?.openEditor()"
        >
          {{ t('overlay.controls.editor') }}
        </button>
      </div>

      <CountdownTriggerSettings
        v-if="autoTriggerApi && autoTriggerAvailable"
        :api="autoTriggerApi"
        :can-arm="!loading && plan.hasCasts && !isPlaying"
      />
      <p v-else-if="autoTriggerApi" class="overlay-settings__hint">
        {{ t('overlay.auto.restartNeeded') }}
      </p>
      <p class="overlay-settings__hint">{{ t('overlay.settings.hint') }}</p>
      <p class="overlay-settings__hint">
        {{ t(isDesktop ? 'overlay.desktopKeys' : 'overlay.browserKeys') }}
      </p>
      <p v-if="isDesktop && !playbackShortcutsAvailable" class="overlay-settings__hint">
        {{ t('overlay.shortcutsUnavailable') }}
      </p>
      <p class="overlay-settings__hint overlay-settings__hint--warn">
        {{ t('overlay.settings.fullscreenHint') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* 桌面壳复用开发服务；只在 HUD 页隐藏开发浮标，不影响编辑器。 */
:global(body:has(.overlay-page) #__vue-devtools-container__) {
  display: none !important;
}

.overlay-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: 'Segoe UI', 'Inter', system-ui, sans-serif;
}

.overlay-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 400px at 50% -10%, rgba(64, 120, 180, 0.18), transparent 70%),
    linear-gradient(180deg, #0b0e14 0%, #090b10 100%);
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
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.45));
}

.overlay-hud-anchor:active {
  cursor: grabbing;
}

.overlay-source-label {
  margin-bottom: 4px;
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
  max-width: calc(100vw - 32px);
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

.overlay-message {
  position: absolute;
  left: 50%;
  top: 45%;
  transform: translate(-50%, -50%);
  padding: 18px 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(10, 13, 19, 0.72);
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  text-align: center;
  pointer-events: auto;
  backdrop-filter: blur(8px);
}

.overlay-message--empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 460px;
}

.overlay-message__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #f2f5f8;
}

.overlay-message__hint,
.overlay-message__code {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.6);
}

.overlay-message__code {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
}

.overlay-message__actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.overlay-link {
  align-self: center;
  padding: 5px 12px;
  border: 1px solid rgba(255, 209, 102, 0.5);
  border-radius: 6px;
  background: rgba(255, 209, 102, 0.1);
  color: #ffd166;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.overlay-link--ghost {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
}

.overlay-controls {
  position: fixed;
  top: 14px;
  right: 14px;
  display: flex;
  gap: 6px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(10, 13, 19, 0.72);
  backdrop-filter: blur(8px);
  opacity: 0;
  transform: translateY(-6px);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
  pointer-events: none;
  z-index: 20;
}

.overlay-controls.is-visible {
  opacity: 1;
  transform: none;
  pointer-events: auto;
  -webkit-app-region: no-drag;
}

.overlay-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}

.overlay-control:focus-visible,
.overlay-settings button:focus-visible {
  outline: 2px solid rgba(255, 209, 102, 0.75);
  outline-offset: 1px;
}

.overlay-control.is-active {
  background: rgba(255, 209, 102, 0.18);
  color: #ffd166;
}

.overlay-control:disabled {
  opacity: 0.35;
  cursor: default;
}

@media (hover: hover) and (pointer: fine) {
  .overlay-control:hover,
  .overlay-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
}

.overlay-settings {
  /* 浮层的 z-index 不会取消下方 HUD 的原生拖拽命中，须整块显式排除。 */
  -webkit-app-region: no-drag;
  position: fixed;
  top: 8px;
  right: 52px;
  z-index: 21;
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 276px;
  max-height: calc(100vh - 16px);
  overflow-y: auto;
  padding: 11px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(10, 13, 19, 0.94);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  backdrop-filter: blur(10px);
  scrollbar-width: thin;
}

.overlay-settings__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.overlay-settings__head h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.9);
}

.overlay-settings__scenario {
  margin: 0;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.overlay-settings__close {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 12px;
}

.overlay-field {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 7px;
}

.overlay-field > span:first-child {
  color: rgba(255, 255, 255, 0.6);
}

.overlay-field input[type='range'] {
  width: 100%;
  accent-color: #ffd166;
}

.overlay-field__value {
  text-align: right;
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.overlay-segment {
  display: inline-flex;
  grid-column: span 2;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
  overflow: hidden;
}

.overlay-segment button {
  flex: 1;
  padding: 5px 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.overlay-segment button.is-active {
  background: rgba(255, 209, 102, 0.16);
  color: #ffd166;
}

.overlay-settings__toggles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 10px;
}

.overlay-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.overlay-toggle span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overlay-toggle input {
  accent-color: #ffd166;
  margin: 0;
}

.overlay-settings__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.overlay-settings__button {
  padding: 5px 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.78);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.overlay-settings__hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.45);
}
</style>
