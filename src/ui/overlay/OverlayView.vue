<script setup lang="ts">
/**
 * 游戏内提示窗口（v3，路由 `/overlay`）。
 *
 * v3 没有全局 store：页面自己从 IndexedDB 读出浏览器保存的项目，
 * 用 `projectTimelineEditor()` 投影出施放序列，再交给 HUD 播放。
 *
 * 桌面模式由 `desktop/preload.cjs` 注入的 `window.endaxisDesktop` 识别：
 * 无边框透明置顶窗口、可拖动、可鼠标穿透（Ctrl+Alt+O）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import GameOverlayHud from './GameOverlayHud.vue';
import {
  applySimulationResources,
  buildOverlayPlanFromProject,
  emptyOverlayPlan,
} from './projectPlan';
import { buildDemoPlan } from './demoPlan';
import { ensureOverlayMessages } from './messages';
import { useOverlayPlayback } from './playback';
import { OVERLAY_LIMITS, useOverlayPreferences, type OverlayPreferences } from './preferences';
import type { OverlayPlan } from './plan';
import { loadBrowserProject } from '../../data/browserProjectStorage';
import { openProject } from '../../application/openProject';
import { createEditorSimulationService } from '../../application/simulation/editorSimulationService';
import { createProjectGameDataRepository } from '../../data/projectGameDataRepository';
import type { EndaxisProjectDocument, ScenarioDocument } from '../../core/project/schema';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';

interface EndaxisDesktopApi {
  isDesktop?: boolean;
  toggleClickThrough?: () => Promise<boolean>;
  setClickThrough?: (value: boolean) => Promise<boolean>;
  info?: () => Promise<{ clickThrough: boolean; url: string; alwaysOnTop: boolean }>;
  resize?: (size: { width: number; height: number }) => Promise<unknown>;
  quit?: () => void;
  onClickThrough?: (callback: (value: boolean) => void) => () => void;
}

ensureOverlayMessages();

const desktopApi = (window as unknown as { endaxisDesktop?: EndaxisDesktopApi }).endaxisDesktop;
const isDesktop = Boolean(desktopApi?.isDesktop);
const clickThrough = ref(false);
let unsubscribeClickThrough: (() => void) | null = null;

const { t } = useI18n({ useScope: 'global' });
const { preferences, patch, reset: resetPreferences } = useOverlayPreferences();

const settingsOpen = ref(false);
const controlsVisible = ref(true);
let hideTimer: number | null = null;

const demoMode = ref(
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo'),
);
const loading = ref(true);
const simulating = ref(false);
const simulationError = ref<string | null>(null);
const errorCode = ref<string | null>(null);
const scenarioName = ref('');
const plan = ref<OverlayPlan>(emptyOverlayPlan());

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

const playback = useOverlayPlayback({ duration: () => plan.value.duration });
const { now, isPlaying, isFinished } = playback;

/** 编辑器把方案存进 IndexedDB，没有 storage 事件；暂停时轮询做近似实时同步。 */
let pollHandle: number | null = null;
let lastRawProject: string | null = null;
/** 每次重载 +1；模拟返回时用它判断结果是否已经过期。 */
let loadGeneration = 0;

/** 读取项目 → 投影施放序列 → 后台跑模拟补上技力/能量/连携窗口。 */
async function loadPlan(options: { preserveTime?: boolean } = {}) {
  const previousTime = options.preserveTime ? playback.now.value : 0;
  loading.value = true;
  errorCode.value = null;
  if (demoMode.value) {
    plan.value = buildDemoPlan();
    scenarioName.value = '示例轴';
    loading.value = false;
    if (preferences.value.autoStart) playback.play();
    return;
  }
  try {
    const raw = await loadBrowserProject();
    lastRawProject = raw ?? null;
    if (!raw) {
      plan.value = emptyOverlayPlan();
      errorCode.value = 'no-project';
      return;
    }
    const input: unknown = JSON.parse(raw);
    const repository = await createProjectGameDataRepository(input);
    const result = openProject(input, { gameDataRepository: repository }) as
      | { ok: true; project: EndaxisProjectDocument }
      | { ok: false; kind: string };
    if (!result.ok) {
      plan.value = emptyOverlayPlan();
      errorCode.value = `invalid:${result.kind}`;
      return;
    }
    const built = buildOverlayPlanFromProject(result.project, repository);
    plan.value = built.plan;
    scenarioName.value = built.scenarioName;
    loading.value = false;
    if (previousTime > 0 && built.plan.duration > 0) {
      playback.seek(Math.min(previousTime, built.plan.duration));
    }
    if (preferences.value.autoStart && built.plan.hasCasts && playback.now.value === 0) {
      playback.play();
    }
    if (built.scenario && built.plan.hasCasts) {
      const generation = ++loadGeneration;
      void simulateScenario(built.scenario, built.fps, built.plan, repository, generation);
    }
  } catch (error) {
    plan.value = emptyOverlayPlan();
    errorCode.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}

/** 模拟可能耗时几百毫秒；期间 HUD 先显示施放序列，资源条等结果到了再补。 */
async function simulateScenario(
  scenario: ScenarioDocument,
  fps: number,
  basePlan: OverlayPlan,
  repository: GameDataRepository,
  generation: number,
) {
  simulating.value = true;
  simulationError.value = null;
  try {
    const service = createEditorSimulationService(repository);
    const run = await service.simulate(scenario, scenario.battle.durationFrames);
    // 期间用户可能又改了项目并触发重载，旧结果直接丢弃。
    if (generation !== loadGeneration) return;
    plan.value = applySimulationResources(basePlan, run, fps);
  } catch (error) {
    simulationError.value = error instanceof Error ? error.message : String(error);
    console.error('[overlay] simulate failed', simulationError.value);
  } finally {
    simulating.value = false;
  }
}

async function pollProject() {
  if (demoMode.value || isPlaying.value) return;
  try {
    const raw = await loadBrowserProject();
    if (!raw || raw === lastRawProject) return;
    lastRawProject = raw;
    await loadPlan({ preserveTime: true });
  } catch {
    /* 读失败时保持当前画面 */
  }
}

function startDemo() {
  demoMode.value = true;
  errorCode.value = null;
  void loadPlan();
}

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
  left: `calc(50% + ${preferences.value.offsetX + (drag.value?.dx ?? 0)}px)`,
  top: `${preferences.value.offsetY + (drag.value?.dy ?? 0)}px`,
  transform: 'translateX(-50%)',
}));

/* ── 设置 ───────────────────────────────────────────────────────────── */

function patchNumber(key: keyof OverlayPreferences, value: unknown) {
  patch({ [key]: Number(value) } as Partial<OverlayPreferences>);
}

function resetPosition() {
  patch({ offsetX: 0, offsetY: Math.max(24, Math.round(window.innerWidth * 0.04)) });
}

/* ── 桌面悬浮窗 ─────────────────────────────────────────────────────── */

function syncDesktopWindow() {
  if (!isDesktop || !desktopApi?.resize) return;
  const width = Math.round(preferences.value.width * preferences.value.scale) + 32;
  const height = settingsOpen.value ? 420 : 214;
  void desktopApi.resize({ width, height });
}

async function toggleClickThrough() {
  if (!desktopApi?.toggleClickThrough) return;
  clickThrough.value = await desktopApi.toggleClickThrough();
}

function quitDesktop() {
  desktopApi?.quit?.();
}

const desktopHintText = computed(() =>
  clickThrough.value ? t('overlay.desktopLocked') : t('overlay.desktopHint'),
);

watch([() => preferences.value.width, () => preferences.value.scale, settingsOpen], () => {
  syncDesktopWindow();
});

/* ── 键盘 / 控件显隐 ────────────────────────────────────────────────── */

function onKeyDown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT')) return;
  switch (event.code) {
    case 'Space':
      event.preventDefault();
      playback.toggle();
      break;
    case 'KeyR':
      playback.reset();
      break;
    case 'KeyS':
      settingsOpen.value = !settingsOpen.value;
      break;
    case 'KeyI':
      patch({ iconMode: preferences.value.iconMode === 'skill' ? 'portrait' : 'skill' });
      break;
    case 'ArrowLeft':
      event.preventDefault();
      playback.step(-2);
      break;
    case 'ArrowRight':
      event.preventDefault();
      playback.step(2);
      break;
    case 'KeyH':
      controlsVisible.value = !controlsVisible.value;
      break;
    default:
      break;
  }
}

function revealControls() {
  controlsVisible.value = true;
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    hideTimer = null;
    if (!settingsOpen.value) controlsVisible.value = false;
  }, 2600);
}

/* ── 透明背景 ───────────────────────────────────────────────────────── */

function applyBackground(transparent: boolean) {
  const value = transparent ? 'transparent' : '#0b0e14';
  for (const element of [
    document.documentElement,
    document.body,
    document.getElementById('app'),
  ]) {
    element?.style.setProperty('background', value, 'important');
  }
}

watch(() => preferences.value.transparent, applyBackground, { immediate: true });

onMounted(async () => {
  // v3 的启动遮罩由首个编辑器移除；叠加页必须自己清掉，否则一直白屏。
  document.getElementById('boot-loader')?.remove();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('pointermove', revealControls, { passive: true });
  revealControls();
  document.title = `${t('overlay.title')} · Endaxis`;

  if (isDesktop) {
    unsubscribeClickThrough =
      desktopApi?.onClickThrough?.(value => {
        clickThrough.value = value;
        if (value) controlsVisible.value = false;
      }) ?? null;
    try {
      const info = await desktopApi?.info?.();
      if (info) clickThrough.value = Boolean(info.clickThrough);
    } catch {
      /* 桌面能力不可用时按浏览器模式跑 */
    }
    syncDesktopWindow();
  }

  await loadPlan();
  pollHandle = window.setInterval(() => void pollProject(), 5000);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('pointermove', revealControls);
  unsubscribeClickThrough?.();
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  if (pollHandle !== null) window.clearInterval(pollHandle);
});

// 开发期把计划摘要挂到 window，便于浏览器 / CDP 验证（生产构建会被摇掉）。
if (import.meta.env?.DEV) {
  (window as unknown as { __endaxisOverlayDebugNow?: () => unknown }).__endaxisOverlayDebugNow =
    () => ({
      casts: plan.value.casts.length,
      duration: plan.value.duration,
      hasCasts: plan.value.hasCasts,
      spPoints: plan.value.spPoints.length,
      gauges: Object.keys(plan.value.gaugePoints).length,
      comboWindows: Object.keys(plan.value.comboWindows).length,
      times: plan.value.casts.map(cast => [cast.type, cast.start]),
      now: now.value,
      scenarioName: scenarioName.value,
      simulating: simulating.value,
      simulationError: simulationError.value,
    });
}
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
        class="overlay-hud-anchor"
        :class="{ 'is-desktop': isDesktop }"
        :style="hudStyle"
        @pointerdown="onHudPointerDown"
        @pointermove="onHudPointerMove"
        @pointerup="onHudPointerUp"
        @pointercancel="onHudPointerUp"
      >
        <GameOverlayHud
          :plan="plan"
          :preferences="effectivePreferences"
          :now="now"
          :is-playing="isPlaying"
          :finished="isFinished"
          :loading="loading"
          @toggle-play="playback.toggle()"
        />
        <div v-if="!isPlaying && now === 0" class="overlay-ready-hint">
          {{
            simulating
              ? t('overlay.simulating')
              : isDesktop
                ? desktopHintText
                : t('overlay.readyHint')
          }}
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
        </div>
      </div>
    </div>

    <div class="overlay-controls" :class="{ 'is-visible': controlsVisible || settingsOpen }">
      <button
        type="button"
        class="overlay-control"
        :title="isPlaying ? t('overlay.controls.pause') : t('overlay.controls.play')"
        @click="playback.toggle()"
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
        :title="t('overlay.controls.reset')"
        @click="playback.reset()"
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
        <button type="button" class="overlay-settings__button" @click="resetPosition">
          {{ t('overlay.settings.resetPosition') }}
        </button>
        <button type="button" class="overlay-settings__button" @click="() => loadPlan()">
          {{ t('overlay.controls.reload') }}
        </button>
        <button type="button" class="overlay-settings__button" @click="resetPreferences">
          {{ t('overlay.settings.reset') }}
        </button>
      </div>

      <p class="overlay-settings__hint">{{ t('overlay.settings.hint') }}</p>
      <p class="overlay-settings__hint overlay-settings__hint--warn">
        {{ t('overlay.settings.fullscreenHint') }}
      </p>
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

.overlay-hud-anchor.is-desktop {
  -webkit-app-region: drag;
}

.overlay-hud-anchor.is-desktop button,
.overlay-hud-anchor.is-desktop input,
.overlay-hud-anchor.is-desktop .ov-cap {
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

@media (hover: hover) and (pointer: fine) {
  .overlay-control:hover,
  .overlay-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
}

.overlay-settings {
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
