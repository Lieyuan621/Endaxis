<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore';
import { GLOBAL_CONFIG_PRESETS, getGlobalConfigPreset } from '@/data/globalConfig';

const store = useTimelineStore();
const { t } = useI18n({ useScope: 'global' });

const selectedPresetId = computed({
  get: () => store.globalConfig?.presetId ?? null,
  set: value => store.setGlobalConfigPresetId(value || null),
});

const selectedPreset = computed(() => getGlobalConfigPreset(selectedPresetId.value));

const headerTitle = computed(() => selectedPreset.value?.name || t('globalConfig.presetNone'));

function selectPreset(id) {
  selectedPresetId.value = id || null;
}
</script>

<template>
  <div class="global-config-presets">
    <div class="panel-header">
      <div class="panel-title" :class="{ 'is-active': !!selectedPreset }">{{ headerTitle }}</div>
    </div>

    <div class="preset-grid" role="radiogroup" :aria-label="t('globalConfig.title')">
      <button
        type="button"
        class="preset-tile"
        :class="{ 'is-selected': !selectedPresetId }"
        :aria-pressed="!selectedPresetId"
        @click="selectPreset(null)"
      >
        <span class="preset-tile-name">{{ t('globalConfig.presetNone') }}</span>
      </button>

      <button
        v-for="preset in GLOBAL_CONFIG_PRESETS"
        :key="preset.id"
        type="button"
        class="preset-tile"
        :class="{ 'is-selected': selectedPresetId === preset.id }"
        :aria-pressed="selectedPresetId === preset.id"
        :title="preset.description || preset.name"
        @click="selectPreset(preset.id)"
      >
        <span class="preset-tile-name">{{ preset.name }}</span>
        <span v-if="preset.description" class="preset-tile-desc">{{ preset.description }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.global-config-presets {
  height: 100%;
  overflow: auto;
  padding: 14px 16px 20px;
  box-sizing: border-box;
  color: var(--ea-fg, rgba(255, 255, 255, 0.86));
  background: var(--ea-workbench-panel, #232326);
}

.panel-header {
  margin-bottom: 14px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ea-fg-secondary, rgba(255, 255, 255, 0.78));
}

.panel-title.is-active {
  color: var(--ea-gold, #ffe08a);
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 10px;
  max-width: 720px;
}

.preset-tile {
  aspect-ratio: 1;
  min-height: 108px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border-strong, rgba(255, 255, 255, 0.14));
  background: var(--ea-keycap-bg, #2a2a2c);
  color: inherit;
  cursor: pointer;
  text-align: center;
}

.preset-tile:hover {
  border-color: var(--ea-border-strong, rgba(255, 255, 255, 0.28));
  background: var(--ea-fill-strong, #303034);
}

.preset-tile.is-selected {
  border-color: color-mix(in srgb, var(--ea-gold, #ffe08a) 55%, transparent);
  background: color-mix(in srgb, var(--ea-gold, #ffe08a) 12%, var(--ea-keycap-bg, #333338));
}

.preset-tile-name {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ea-fg, rgba(255, 255, 255, 0.9));
}

.preset-tile.is-selected .preset-tile-name {
  color: var(--ea-gold, #ffe08a);
}

.preset-tile-desc {
  font-size: 11px;
  line-height: 1.3;
  color: var(--ea-fg-muted, rgba(255, 255, 255, 0.48));
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:global(html[data-theme='light'] .global-config-presets .preset-tile) {
  background: #ffffff;
  border-color: var(--ea-border-strong);
  box-shadow: 0 1px 2px var(--ea-shadow);
}
:global(html[data-theme='light'] .global-config-presets .preset-tile:hover) {
  background: var(--ea-surface-soft);
}
:global(html[data-theme='light'] .global-config-presets .preset-tile.is-selected) {
  background: color-mix(in srgb, var(--ea-gold) 14%, #ffffff);
  border-color: color-mix(in srgb, var(--ea-gold) 55%, transparent);
}
</style>
