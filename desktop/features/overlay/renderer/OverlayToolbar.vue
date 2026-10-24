<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useOverlayI18n } from './messages';
import { setDesktopLocale } from '../../../i18n';
import type { OverlaySettingsState } from './desktopApi';
const api = window.endaxisOverlayToolbar;
const state = ref<(OverlaySettingsState & { clickThrough: boolean }) | null>(null);
const { t } = useOverlayI18n();
let disposed = false;
function accept(value: typeof state.value) {
  if (disposed) return;
  state.value = value;
  if (value) setDesktopLocale(value.locale);
}
const unsubscribe = api.onState(accept);
void api.getState().then(accept);
onBeforeUnmount(() => {
  disposed = true;
  unsubscribe();
});
const loading = computed(() => !state.value || state.value.loading);
const empty = computed(
  () => !(state.value?.canPlay ?? state.value?.canArm) && !state.value?.isPlaying,
);
const isPlaying = computed(() => state.value?.isPlaying ?? false);
const clickThrough = computed(() => state.value?.clickThrough ?? false);
const command = api.command;
</script>
<template>
  <div class="overlay-controls">
    <button
      type="button"
      class="overlay-control"
      :disabled="loading || empty"
      :aria-label="isPlaying ? t('overlay.controls.pause') : t('overlay.controls.play')"
      :title="`${isPlaying ? t('overlay.controls.pause') : t('overlay.controls.play')}\nCtrl + Alt + Space`"
      @click="command('toggle')"
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
      :aria-label="t(state?.practiceMode ? 'overlay.previousStep' : 'overlay.delay')"
      :title="`${t(state?.practiceMode ? 'overlay.previousStep' : 'overlay.delay')}\nCtrl + Alt + ←`"
      :disabled="loading || empty"
      @click="command('backward')"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path d="M11 5v14L2 12zm10 0v14l-9-7z" fill="currentColor" />
      </svg>
    </button>
    <button
      type="button"
      class="overlay-control"
      :aria-label="t(state?.practiceMode ? 'overlay.nextStep' : 'overlay.advance')"
      :title="`${t(state?.practiceMode ? 'overlay.nextStep' : 'overlay.advance')}\nCtrl + Alt + →`"
      :disabled="loading || empty"
      @click="command('forward')"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path d="M3 5v14l9-7zm10 0v14l9-7z" fill="currentColor" />
      </svg>
    </button>
    <button
      type="button"
      class="overlay-control"
      :aria-label="t('overlay.controls.reset')"
      :title="`${t('overlay.controls.reset')}\nCtrl + Alt + Home`"
      @click="command('restart')"
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
      @click="command('settings')"
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
      type="button"
      class="overlay-control"
      :class="{ 'is-active': clickThrough }"
      :aria-label="clickThrough ? t('overlay.controls.unlock') : t('overlay.controls.lock')"
      :title="`${clickThrough ? t('overlay.controls.unlock') : t('overlay.controls.lock')}\nCtrl + Alt + O`"
      :aria-pressed="clickThrough"
      @click="command('lock')"
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
      type="button"
      class="overlay-control"
      :title="t('overlay.controls.closeOverlay')"
      @click="command('close')"
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
</template>
<style scoped>
.overlay-controls {
  position: fixed;
  top: 0;
  right: 0;
  display: flex;
  gap: 6px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(10, 13, 19, 0.72);
  backdrop-filter: blur(8px);
  opacity: 1;

  transition:
    opacity 180ms ease,
    transform 180ms ease;
  pointer-events: auto;
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

.overlay-control:focus-visible {
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
</style>

<style>
/* 独立工具条没有编辑区域，开发工具浮标会遮住操作按钮。 */
#__vue-devtools-container__ {
  display: none !important;
}
</style>
