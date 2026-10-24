<script setup lang="ts">
import type { CountdownTriggerStatus, OverlaySettingsCommand } from './desktopApi';
import { useOverlayI18n } from './messages';
defineProps<{ status: CountdownTriggerStatus | null; canArm: boolean; busy: boolean }>();
const emit = defineEmits<{
  command: [command: Exclude<OverlaySettingsCommand, { type: 'requestState' }>];
}>();
const { t } = useOverlayI18n();
</script>

<template>
  <section class="countdown-trigger">
    <h3>{{ t('overlay.auto.title') }}</h3>
    <p>{{ t('overlay.auto.hint') }}</p>
    <img v-if="status?.previewUrl" :src="status.previewUrl" :alt="t('overlay.auto.reference')" />
    <p v-if="status" class="countdown-trigger__status" role="status">
      {{ t(`overlay.auto.phase.${status.phase}`) }}
      <span v-if="status.displayLabel"> · {{ status.displayLabel }}</span>
    </p>
    <div class="countdown-trigger__actions">
      <button
        type="button"
        :disabled="busy || !canArm || status?.armed"
        @click="emit('command', { type: 'countdownSelect' })"
      >
        {{ t('overlay.auto.select') }}
      </button>
      <button
        v-if="!status?.armed"
        type="button"
        :disabled="busy || !canArm || !status?.configured"
        @click="emit('command', { type: 'countdownArm' })"
      >
        {{ t('overlay.auto.arm') }}
      </button>
      <button
        v-else
        type="button"
        :disabled="busy"
        @click="emit('command', { type: 'countdownStop' })"
      >
        {{ t('overlay.auto.stop') }}
      </button>
      <button
        type="button"
        :disabled="busy || !status?.configured || status.armed"
        @click="emit('command', { type: 'countdownClear' })"
      >
        {{ t('overlay.auto.clear') }}
      </button>
    </div>
    <p v-if="!canArm">{{ t('overlay.auto.pauseFirst') }}</p>
    <p>{{ t('overlay.auto.behavior') }}</p>
    <p v-if="status?.error" class="countdown-trigger__error" role="alert">
      {{ status?.error }}
    </p>
  </section>
</template>

<style scoped>
.countdown-trigger {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 3px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.countdown-trigger h3,
.countdown-trigger p {
  margin: 0;
}
.countdown-trigger h3 {
  font-size: 11px;
  font-weight: 600;
}
.countdown-trigger p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  line-height: 1.6;
}
.countdown-trigger img {
  width: 160px;
  height: 60px;
  object-fit: contain;
  background: #090b10;
}
.countdown-trigger__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.countdown-trigger button {
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.04);
  font: inherit;
  cursor: pointer;
}
.countdown-trigger button:disabled {
  opacity: 0.4;
  cursor: default;
}
.countdown-trigger .countdown-trigger__error {
  color: #ff9d9d;
}
</style>
