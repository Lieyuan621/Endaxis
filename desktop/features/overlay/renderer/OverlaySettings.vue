<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import CountdownTriggerSettings from './CountdownTriggerSettings.vue';
import { useOverlayI18n } from './messages';
import { OVERLAY_LIMITS, type OverlayPreferences } from './preferences';
import { desktopI18n, setDesktopLocale } from '../../../i18n';
import type { OverlaySettingsCommand, OverlaySettingsState } from './desktopApi';

const api = window.endaxisOverlaySettings;
const { t } = useOverlayI18n();
const state = ref<OverlaySettingsState | null>(null);
const error = ref('');
const preferences = computed(() => state.value!.preferences);
let unsubscribe: (() => void) | undefined;
let disposed = false;
let receivedState = false;
function acceptState(next: OverlaySettingsState | null) {
  if (disposed) return;
  receivedState = true;
  state.value = next;
  // HUD 重载会主动使缓存失效；等待新状态，不能让迟到的 getState 恢复旧值。
  if (!next) return;
  setDesktopLocale(next.locale);
  document.title = desktopI18n.global.t('overlay.settings.title');
}
function send(command: Exclude<OverlaySettingsCommand, { type: 'requestState' }>) {
  error.value = '';
  void api?.command(command).catch(caught => {
    if (!disposed) error.value = caught instanceof Error ? caught.message : String(caught);
  });
}
function patch(value: Partial<OverlayPreferences>) {
  send({ type: 'patch', patch: value });
}
function patchNumber(key: keyof OverlayPreferences, value: unknown) {
  if (value === '' || !Number.isFinite(Number(value))) return;
  patch({ [key]: Number(value) });
}
function close() {
  void api?.close();
}
function onKeyDown(event: KeyboardEvent) {
  if (event.code === 'Escape') close();
}
onMounted(() => {
  unsubscribe = api?.onState(acceptState);
  void api
    ?.getState()
    .then(next => {
      if (next && !receivedState) acceptState(next);
    })
    .catch(caught => {
      if (!disposed) error.value = caught instanceof Error ? caught.message : String(caught);
    });
  window.addEventListener('keydown', onKeyDown);
});
onBeforeUnmount(() => {
  disposed = true;
  unsubscribe?.();
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <main v-if="state" class="overlay-settings">
    <section class="settings-section">
      <h2>{{ t('overlay.settings.groups.playback') }}</h2>
      <label class="overlay-field">
        <span>{{ t('overlay.settings.playbackMode') }}</span>
        <span class="overlay-segment">
          <button
            type="button"
            :class="{ 'is-active': preferences.playbackMode === 'timed' }"
            @click="patch({ playbackMode: 'timed' })"
          >
            {{ t('overlay.settings.timedMode') }}
          </button>
          <button
            type="button"
            :class="{ 'is-active': preferences.playbackMode === 'practice' }"
            @click="patch({ playbackMode: 'practice' })"
          >
            {{ t('overlay.settings.practiceMode') }}
          </button>
        </span>
      </label>
      <label class="overlay-field" :title="t('overlay.settings.startDelayHint')">
        <span>{{ t('overlay.settings.startDelay') }}</span>
        <input
          type="range"
          :min="OVERLAY_LIMITS.startDelaySeconds.min"
          :max="OVERLAY_LIMITS.startDelaySeconds.max"
          step="0.1"
          :value="preferences.startDelaySeconds"
          :disabled="preferences.playbackMode === 'practice'"
          @input="patchNumber('startDelaySeconds', ($event.target as HTMLInputElement).value)"
        />
        <span class="overlay-field__value">{{ preferences.startDelaySeconds.toFixed(1) }}s</span>
      </label>
      <label class="overlay-field">
        <span>{{ t('overlay.settings.inputTolerance') }}</span>
        <input
          type="range"
          :min="OVERLAY_LIMITS.inputTolerance.min"
          :max="OVERLAY_LIMITS.inputTolerance.max"
          step="0.05"
          :value="preferences.inputTolerance"
          :disabled="preferences.playbackMode === 'practice'"
          @input="patchNumber('inputTolerance', ($event.target as HTMLInputElement).value)"
        />
        <span class="overlay-field__value">±{{ preferences.inputTolerance.toFixed(2) }}s</span>
      </label>
    </section>
    <section class="settings-section">
      <h2>{{ t('overlay.settings.groups.appearance') }}</h2>
      <label class="overlay-field">
        <span>{{ t('overlay.settings.bottomLabel') }}</span>
        <span class="overlay-segment">
          <button
            v-for="mode in ['action', 'keyboard', 'gamepad'] as const"
            :key="mode"
            type="button"
            :class="{ 'is-active': preferences.labelMode === mode }"
            @click="patch({ labelMode: mode })"
          >
            {{ t(`overlay.settings.labelMode.${mode}`) }}
          </button>
        </span>
      </label>
      <label class="overlay-field">
        <span>{{ t('overlay.settings.layout') }}</span>
        <span class="overlay-segment">
          <button
            type="button"
            :class="{
              'is-active':
                preferences.playbackMode === 'practice' || preferences.layoutMode === 'single',
            }"
            :disabled="preferences.playbackMode === 'practice'"
            @click="patch({ layoutMode: 'single' })"
          >
            {{ t('overlay.settings.singleRow') }}
          </button>
          <button
            type="button"
            :class="{
              'is-active':
                preferences.playbackMode !== 'practice' && preferences.layoutMode === 'staggered',
            }"
            :disabled="preferences.playbackMode === 'practice'"
            @click="patch({ layoutMode: 'staggered' })"
          >
            {{ t('overlay.settings.staggeredRows') }}
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
          :disabled="preferences.playbackMode === 'practice'"
          @input="patchNumber('secondsAhead', ($event.target as HTMLInputElement).value)"
        />
        <span class="overlay-field__value">{{ preferences.secondsAhead }}s</span>
      </label>
      <label class="overlay-field">
        <span>{{ t('overlay.settings.compactMode') }}</span>
        <input
          type="checkbox"
          :checked="preferences.compactMode"
          @change="patch({ compactMode: ($event.target as HTMLInputElement).checked })"
        />
      </label>
      <label class="overlay-field">
        <span>{{ t('overlay.settings.opacity') }}</span>
        <input
          type="range"
          :min="OVERLAY_LIMITS.hudOpacity.min"
          :max="OVERLAY_LIMITS.hudOpacity.max"
          step="0.02"
          :value="preferences.hudOpacity"
          :disabled="preferences.compactMode"
          @input="patchNumber('hudOpacity', ($event.target as HTMLInputElement).value)"
        />
        <span class="overlay-field__value">{{ Math.round(preferences.hudOpacity * 100) }}%</span>
      </label>
    </section>
    <section class="settings-section">
      <h2>{{ t('overlay.settings.groups.content') }}</h2>
      <div class="overlay-settings__toggles">
        <label class="overlay-toggle">
          <input
            type="checkbox"
            :checked="preferences.showStatusEffects"
            @change="patch({ showStatusEffects: ($event.target as HTMLInputElement).checked })"
          />
          <span>{{ t('overlay.settings.showStatusEffects') }}</span>
        </label>
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
            :checked="preferences.showHeavy"
            @change="patch({ showHeavy: ($event.target as HTMLInputElement).checked })"
          />
          <span>{{ t('overlay.settings.showHeavy') }}</span>
        </label>
      </div>
    </section>
    <details class="settings-help">
      <summary>{{ t('overlay.settings.groups.help') }}</summary>
      <p class="overlay-settings__hint">{{ t('overlay.input.hint') }}</p>
      <p class="overlay-settings__hint">{{ t('overlay.practice.hint') }}</p>
      <p class="overlay-settings__hint">{{ t('overlay.desktopKeys') }}</p>
      <p class="overlay-settings__hint">{{ t('overlay.settings.fullscreenHint') }}</p>
    </details>
    <details v-if="state.autoTriggerAvailable" class="settings-help">
      <summary>{{ t('overlay.settings.groups.advanced') }}</summary>
      <CountdownTriggerSettings
        :status="state.autoTriggerStatus"
        :can-arm="state.canArm"
        :busy="state.commandPending"
        @command="send"
      />
    </details>
    <p v-if="error || state.commandError" class="overlay-settings__error" role="alert">
      {{ error || state.commandError }}
    </p>
    <p v-if="!state.playbackShortcutsAvailable" class="overlay-settings__hint">
      {{ t('overlay.shortcutsUnavailable') }}
    </p>
  </main>
  <main v-else class="overlay-settings">
    <p role="status">{{ t('overlay.settings.waitingForHud') }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
  </main>
</template>

<style scoped>
.overlay-settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 18px 22px;
  background: #10151d;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
}

.settings-section {
  display: grid;
  gap: 12px;
}
.settings-section + .settings-section {
  border-top: 1px solid #ffffff18;
  padding-top: 16px;
}
.settings-section h2 {
  margin: 0 0 2px;
  font-size: 13px;
  color: #e8e9eb;
}
.settings-help {
  border-top: 1px solid #ffffff18;
  padding-top: 12px;
}
.settings-help summary {
  cursor: pointer;
  color: #aeb5be;
}
.settings-help p {
  margin-top: 8px;
}
.overlay-field {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 7px;
}

.overlay-field > span:first-child {
  color: rgba(255, 255, 255, 0.6);
}

.overlay-field input[type='checkbox'] {
  justify-self: start;
  accent-color: #ffd166;
}
button:disabled,
input:disabled {
  opacity: 0.4;
  cursor: default;
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

.overlay-settings__hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.45);
}

.overlay-settings__error {
  color: #ffb4a8;
}
button:focus-visible {
  outline: 2px solid #ffd166;
  outline-offset: 2px;
}
</style>
