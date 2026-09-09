<script setup>
import { EaButton } from '@/design-system';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore.js';

const store = useTimelineStore();
const { t } = useI18n({ useScope: 'global' });

const hasOperatorTracks = computed(() => store.teamTracksInfo.some(track => track.id));
</script>

<template>
  <div class="timeline-display-menu">
    <EaButton
      type="button"
      class="timeline-display-guide"
      :class="{ 'is-active': store.showCursorGuide }"
      :pressed="store.showCursorGuide"
      @click="store.toggleCursorGuide"
    >
      <svg
        class="timeline-display-guide__icon"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v18M3 12h18" />
        <path d="M7 6H5v2M17 6h2v2M7 18H5v-2M17 18h2v-2" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
      <span class="timeline-display-guide__content">
        <strong>{{ t('timeline.header.cursorGuide') }}</strong>
        <small>Ctrl + G</small>
      </span>
      <svg
        class="timeline-display-guide__check"
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" rx="2" />
        <polyline v-if="store.showCursorGuide" points="3,8 6.5,11.5 13,4.5" stroke-width="2" />
      </svg>
    </EaButton>

    <div class="timeline-display-scroll">
      <section class="timeline-display-section">
        <h4 class="timeline-display-section__title">
          {{ t('timeline.header.sectionViewBehavior') }}
        </h4>
        <div class="header-more-mode-row">
          <span>{{ t('timeline.header.buffLayout') }}</span>
          <div class="header-more-segment" role="group">
            <EaButton
              type="button"
              :class="{ 'is-active': store.buffLayoutMode === 'compact' }"
              :pressed="store.buffLayoutMode === 'compact'"
              @click="store.setBuffLayoutMode('compact')"
            >
              {{ t('timelineGrid.toolbar.buffLayoutCompact') }}
            </EaButton>
            <EaButton
              type="button"
              :class="{ 'is-active': store.buffLayoutMode === 'loose' }"
              :pressed="store.buffLayoutMode === 'loose'"
              @click="store.setBuffLayoutMode('loose')"
            >
              {{ t('timelineGrid.toolbar.buffLayoutLoose') }}
            </EaButton>
          </div>
        </div>
      </section>

      <section class="timeline-display-section">
        <h4 class="timeline-display-section__title">
          {{ t('timeline.header.sectionViewLayers') }}
        </h4>
        <div class="header-more-checklist header-more-checklist--grid">
          <EaButton
            v-for="layerId in store.TIMELINE_VIEW_LAYER_IDS"
            :key="layerId"
            type="button"
            class="header-more-check-row header-more-check-row--compact"
            @click="store.toggleTimelineViewLayer(layerId)"
          >
            <svg
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="none"
              stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <rect x="1" y="1" width="14" height="14" rx="2" />
              <polyline
                v-if="store.isTimelineViewLayerVisible(layerId)"
                points="3,8 6.5,11.5 13,4.5"
                stroke-width="2"
              />
            </svg>
            <span>{{ t(`timeline.header.viewLayers.${layerId}`) }}</span>
          </EaButton>
        </div>
      </section>

      <section class="timeline-display-section timeline-display-section--follow">
        <h4 class="timeline-display-section__title">
          {{ t('timeline.header.sectionViewOperators') }}
        </h4>
        <div v-if="hasOperatorTracks" class="header-more-checklist header-more-checklist--grid">
          <template v-for="(track, index) in store.teamTracksInfo" :key="index">
            <EaButton
              v-if="track.id"
              type="button"
              class="header-more-check-row header-more-check-row--compact"
              @click="store.toggleOperatorEffectsVisible(index)"
            >
              <svg
                viewBox="0 0 16 16"
                width="12"
                height="12"
                fill="none"
                :stroke="store.getCharacterElementColor(track.id)"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <rect x="1" y="1" width="14" height="14" rx="2" />
                <polyline
                  v-if="store.operatorEffectsVisible[index]"
                  points="3,8 6.5,11.5 13,4.5"
                  stroke-width="2"
                />
              </svg>
              <span>{{ track.name }}</span>
            </EaButton>
          </template>
        </div>
        <p v-else class="timeline-display-empty">
          {{ t('timeline.header.hideEffectsEmpty') }}
        </p>
      </section>

      <section class="timeline-display-section">
        <h4 class="timeline-display-section__title">
          {{ t('timeline.header.sectionDurationBarColor') }}
        </h4>

        <div class="header-more-checklist">
          <EaButton
            type="button"
            class="header-more-check-row"
            @click="store.toggleColoredDurationBars()"
          >
            <svg
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="none"
              stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <rect x="1" y="1" width="14" height="14" rx="2" />
              <polyline
                v-if="store.durationBarColor.enabled"
                points="3,8 6.5,11.5 13,4.5"
                stroke-width="2"
              />
            </svg>
            <span>{{ t('timeline.header.coloredDurationBarsEnable') }}</span>
          </EaButton>
        </div>

        <div v-if="store.durationBarColor.enabled" class="timeline-display-color-controls">
          <label class="timeline-display-tune-row">
            <span class="timeline-display-tune-row__label">
              {{ t('timeline.header.durationBarSaturation') }}
              <em>{{ store.durationBarColor.saturation }}%</em>
            </span>
            <div class="ea-range-row">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                class="ea-range"
                :value="store.durationBarColor.saturation"
                @input="store.setDurationBarColorSaturation(Number($event.target.value))"
              />
            </div>
          </label>

          <label class="timeline-display-tune-row">
            <span class="timeline-display-tune-row__label">
              {{ t('timeline.header.durationBarLightness') }}
              <em>{{ store.durationBarColor.lightness }}%</em>
            </span>
            <div class="ea-range-row">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                class="ea-range"
                :value="store.durationBarColor.lightness"
                @input="store.setDurationBarColorLightness(Number($event.target.value))"
              />
            </div>
          </label>

          <h4 class="timeline-display-section__title">
            {{ t('timeline.header.durationBarColorSources') }}
          </h4>
          <div class="header-more-checklist header-more-checklist--grid">
            <EaButton
              v-for="sourceId in store.DURATION_BAR_COLOR_SOURCE_IDS"
              :key="sourceId"
              type="button"
              class="header-more-check-row header-more-check-row--compact"
              @click="store.toggleDurationBarColorSource(sourceId)"
            >
              <svg
                viewBox="0 0 16 16"
                width="12"
                height="12"
                fill="none"
                stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <rect x="1" y="1" width="14" height="14" rx="2" />
                <polyline
                  v-if="store.durationBarColor.sources[sourceId]"
                  points="3,8 6.5,11.5 13,4.5"
                  stroke-width="2"
                />
              </svg>
              <span>{{ t(`timeline.header.durationBarColorSource.${sourceId}`) }}</span>
            </EaButton>
          </div>

          <h4 class="timeline-display-section__title">
            {{ t('timeline.header.durationBarColorSurfaces') }}
          </h4>
          <div class="header-more-checklist header-more-checklist--grid">
            <EaButton
              v-for="surfaceId in store.DURATION_BAR_COLOR_SURFACE_IDS"
              :key="surfaceId"
              type="button"
              class="header-more-check-row header-more-check-row--compact"
              @click="store.toggleDurationBarColorSurface(surfaceId)"
            >
              <svg
                viewBox="0 0 16 16"
                width="12"
                height="12"
                fill="none"
                stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <rect x="1" y="1" width="14" height="14" rx="2" />
                <polyline
                  v-if="store.durationBarColor.surfaces[surfaceId]"
                  points="3,8 6.5,11.5 13,4.5"
                  stroke-width="2"
                />
              </svg>
              <span>{{ t(`timeline.header.durationBarColorSurface.${surfaceId}`) }}</span>
            </EaButton>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.timeline-display-menu {
  display: flex;
  flex-direction: column;
  max-height: min(760px, calc(100vh - 96px));
}

.timeline-display-guide {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  margin: 0 4px 10px 0;
  padding: 8px 10px;
  border: 1px solid var(--ea-border);
  border-radius: 4px;
  background: var(--ea-fill-soft);
  color: var(--ea-fg-secondary);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.timeline-display-guide:hover {
  border-color: var(--ea-border-strong);
  background: var(--ea-hover-fill);
  color: var(--ea-fg);
}

.timeline-display-guide__icon {
  flex-shrink: 0;
  color: var(--ea-fg-muted);
}

.timeline-display-guide:hover .timeline-display-guide__icon,
.timeline-display-guide.is-active .timeline-display-guide__icon {
  color: var(--ea-gold);
}

.timeline-display-guide__content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.timeline-display-guide__content strong {
  font-size: 12px;
  font-weight: 700;
}

.timeline-display-guide__content small {
  color: var(--ea-fg-faint);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.timeline-display-guide__check {
  flex-shrink: 0;
  color: color-mix(in srgb, var(--ea-gold) 85%, transparent);
}

.timeline-display-scroll {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
}

.timeline-display-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timeline-display-section + .timeline-display-section {
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
}

.timeline-display-section + .timeline-display-section--follow {
  margin-top: 8px;
  padding-top: 0;
  border-top: none;
}

.timeline-display-section__title {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 11px;
  font-weight: 600;
}

.timeline-display-color-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 2px;
}

.timeline-display-tune-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 2px 2px 4px;
  color: var(--ea-fg-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: default;
}

.timeline-display-tune-row__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.timeline-display-tune-row__label em {
  color: color-mix(in srgb, var(--ea-gold) 85%, transparent);
  font-style: normal;
  font-variant-numeric: tabular-nums;
}

.timeline-display-color-controls .timeline-display-section__title {
  margin-top: 2px;
}

.timeline-display-empty {
  margin: 0;
  padding: 8px;
  color: var(--ea-fg-faint);
  font-size: 12px;
}
</style>
