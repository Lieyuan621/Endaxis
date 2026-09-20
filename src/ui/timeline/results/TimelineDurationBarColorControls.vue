<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { EaButton } from '../../../design-system/index';
import { useDurationBarColor } from './durationBarColorContext';
import { DURATION_COLOR_SOURCES, DURATION_COLOR_SURFACES } from './durationBarColor';

const { t } = useI18n({ useScope: 'global' });
const prefs = useDurationBarColor();
function tune(field: 'saturation' | 'lightness', event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value)) prefs.value[field] = Math.max(0, Math.min(100, value));
}
</script>

<template>
  <section class="timeline-display-section duration-color-section">
    <h4 class="timeline-display-section__title">
      {{ t('timeline.header.sectionDurationBarColor') }}
    </h4>
    <div class="header-more-checklist">
      <EaButton
        variant="ghost"
        size="sm"
        type="button"
        class="header-more-check-row"
        :aria-pressed="prefs.enabled"
        @click="prefs.enabled = !prefs.enabled"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <rect x="1" y="1" width="14" height="14" rx="2" />
          <polyline v-if="prefs.enabled" points="3,8 6.5,11.5 13,4.5" />
        </svg>
        <span>{{ t('timeline.header.coloredDurationBarsEnable') }}</span>
      </EaButton>
    </div>
    <div v-if="prefs.enabled" class="timeline-display-color-controls">
      <label
        v-for="field in ['saturation', 'lightness'] as const"
        :key="field"
        class="timeline-display-tune-row"
      >
        <span class="timeline-display-tune-row__label"
          >{{
            t(
              field === 'saturation'
                ? 'timeline.header.durationBarSaturation'
                : 'timeline.header.durationBarLightness',
            )
          }}<em>{{ prefs[field] }}%</em></span
        >
        <div class="ea-range-row">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            class="ea-range"
            :value="prefs[field]"
            @input="tune(field, $event)"
          />
        </div>
      </label>
      <h4 class="timeline-display-section__title">
        {{ t('timeline.header.durationBarColorSources') }}
      </h4>
      <div class="header-more-checklist header-more-checklist--grid">
        <EaButton
          variant="ghost"
          size="sm"
          v-for="source in DURATION_COLOR_SOURCES"
          :key="source"
          type="button"
          class="header-more-check-row header-more-check-row--compact"
          :aria-pressed="prefs.sources[source]"
          @click="prefs.sources[source] = !prefs.sources[source]"
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <rect x="1" y="1" width="14" height="14" rx="2" />
            <polyline v-if="prefs.sources[source]" points="3,8 6.5,11.5 13,4.5" />
          </svg>
          <span>{{ t(`timeline.header.durationBarColorSource.${source}`) }}</span>
        </EaButton>
      </div>
      <h4 class="timeline-display-section__title">
        {{ t('timeline.header.durationBarColorSurfaces') }}
      </h4>
      <div class="header-more-checklist header-more-checklist--grid">
        <EaButton
          variant="ghost"
          size="sm"
          v-for="surface in DURATION_COLOR_SURFACES"
          :key="surface"
          type="button"
          class="header-more-check-row header-more-check-row--compact"
          :aria-pressed="prefs.surfaces[surface]"
          @click="prefs.surfaces[surface] = !prefs.surfaces[surface]"
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <rect x="1" y="1" width="14" height="14" rx="2" />
            <polyline v-if="prefs.surfaces[surface]" points="3,8 6.5,11.5 13,4.5" />
          </svg>
          <span>{{ t(`timeline.header.durationBarColorSurface.${surface}`) }}</span>
        </EaButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.duration-color-section,
.timeline-display-color-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.duration-color-section {
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}
.timeline-display-section__title {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.header-more-check-row svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  fill: none;
  stroke: color-mix(in srgb, var(--ea-gold) 85%, transparent);
  stroke-width: 1.5;
}
.header-more-check-row polyline {
  stroke-width: 2;
}
.timeline-display-tune-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0 6px;
}
.timeline-display-tune-row__label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ea-fg-secondary);
}
.timeline-display-tune-row em {
  font-style: normal;
  color: var(--ea-fg-muted);
  font-variant-numeric: tabular-nums;
}
</style>
