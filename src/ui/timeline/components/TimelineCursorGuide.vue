<script setup lang="ts">
import { EaButton, EaPopover } from '@/design-system';

export interface TimelineCursorGaugeRow {
  readonly id: string;
  readonly name: string;
  readonly current: string;
  readonly max: string;
  readonly color: string;
  readonly isFull: boolean;
}

export interface TimelineCursorEnemyEffect {
  readonly buffId: string;
  readonly title: string;
  readonly icon: string | null;
  readonly layers: number;
}

withDefaults(
  defineProps<{
    time: string;
    sp: string | null;
    poise: string | null;
    enemyHealth: string | null;
    gauges: readonly TimelineCursorGaugeRow[];
    enemyEffects: readonly TimelineCursorEnemyEffect[];
    enemyEffectOverflow: number;
    mobile?: boolean;
  }>(),
  { mobile: false },
);
</script>

<template>
  <div class="timeline-cursor-guide-panel" :class="{ 'is-mobile': mobile }">
    <div v-if="mobile" class="guide-summary">
      <span class="guide-time-label">{{ time }}</span>
      <span v-if="sp !== null" class="guide-sp-label"
        >{{ $t('timelineGrid.cursor.sp') }}: {{ sp }}</span
      >
      <span v-if="poise !== null" class="guide-stagger-label"
        >{{ $t('timelineGrid.cursor.stagger') }}: {{ poise }}</span
      >
      <span v-if="enemyHealth !== null" class="guide-enemy-hp-label">HP: {{ enemyHealth }}</span>
    </div>
    <template v-else>
      <div class="guide-time-label">{{ time }}</div>
      <div v-if="sp !== null" class="guide-sp-label">
        {{ $t('timelineGrid.cursor.sp') }}: {{ sp }}
      </div>
      <div v-if="poise !== null" class="guide-stagger-label">
        {{ $t('timelineGrid.cursor.stagger') }}: {{ poise }}
      </div>
    </template>
    <div v-if="gauges.length > 0" class="guide-gauge-panel">
      <div class="guide-gauge-title">{{ $t('timelineGrid.cursor.gauge') }}</div>
      <div class="guide-gauge-grid">
        <div v-for="row in gauges" :key="row.id" class="guide-gauge-grid-row">
          <span
            class="guide-gauge-name"
            :class="{ 'is-full': row.isFull }"
            :style="{ color: row.color, '--row-color': row.color }"
          >
            {{ row.name }}
          </span>
          <span class="guide-gauge-value" :class="{ 'is-full': row.isFull }">
            <span class="guide-gauge-current" :style="{ color: row.color }">{{ row.current }}</span>
            <span class="guide-gauge-sep">/</span>
            <span class="guide-gauge-max">{{ row.max }}</span>
          </span>
        </div>
      </div>
    </div>
    <div v-if="!mobile && enemyHealth !== null" class="guide-enemy-hp-label">
      HP: {{ enemyHealth }}
    </div>
    <div
      v-if="enemyEffects.length > 0 || enemyEffectOverflow > 0"
      class="guide-enemy-effects"
      @mousemove.stop
    >
      <EaPopover
        v-for="effect in mobile ? enemyEffects : []"
        :key="effect.buffId"
        trigger="click"
        placement="top"
        :teleported="true"
        :content="effect.title"
      >
        <template #reference>
          <EaButton class="guide-enemy-effect" :aria-label="effect.title" @pointerdown.stop>
            <img v-if="effect.icon !== null" :src="effect.icon" alt="" />
            <span>{{ effect.layers }}</span>
          </EaButton>
        </template>
      </EaPopover>
      <div
        v-for="effect in mobile ? [] : enemyEffects"
        :key="effect.buffId"
        class="guide-enemy-effect"
        :title="effect.title"
      >
        <img v-if="effect.icon !== null" :src="effect.icon" alt="" />
        <span>{{ effect.layers }}</span>
      </div>
      <span v-if="enemyEffectOverflow > 0" class="guide-enemy-effect-more">
        +{{ enemyEffectOverflow }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.timeline-cursor-guide-panel {
  width: max-content;
}

.guide-time-label,
.guide-sp-label,
.guide-stagger-label,
.guide-enemy-hp-label,
.guide-gauge-panel,
.guide-enemy-effects {
  width: fit-content;
  padding: 3px 6px;
  border: 1px solid var(--ea-border, rgb(255 255 255 / 10%));
  border-radius: 0;
  background: var(--ea-tooltip-bg, rgb(16 16 16 / 84%));
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px var(--ea-shadow, rgb(0 0 0 / 40%));
  white-space: nowrap;
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
}

.guide-time-label {
  color: var(--ea-fg, #fff);
}

.guide-sp-label {
  margin-top: 2px;
  color: var(--ea-gold);
}

.guide-stagger-label {
  margin-top: 2px;
  color: #ff7875;
}

.guide-enemy-hp-label {
  margin-top: 2px;
  color: #ff4d4f;
}

.guide-gauge-panel {
  margin-top: 2px;
}

.guide-enemy-effects {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
  pointer-events: auto;
}

.guide-enemy-effect {
  position: relative;
  width: 19px;
  height: 19px;
  flex: 0 0 19px;
  box-sizing: border-box;
  border: 1px solid var(--ea-keycap-skill-border, #999);
  background: var(--ea-keycap-skill-bg, #333);
}

.guide-enemy-effect img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-enemy-effect span {
  position: absolute;
  right: -2px;
  bottom: -2px;
  padding: 0 2px;
  background: rgb(0 0 0 / 82%);
  color: var(--ea-gold);
  font-size: 8px;
  line-height: 1;
}

.guide-enemy-effect-more {
  color: var(--ea-fg-muted, rgb(255 255 255 / 55%));
  font-size: 10px;
}

.guide-gauge-title {
  margin-bottom: 2px;
  color: #00e5ff;
}

.guide-gauge-grid {
  display: grid;
  grid-template-columns: max-content max-content;
  column-gap: 8px;
  row-gap: 2px;
}

.guide-gauge-grid-row {
  display: contents;
}

.guide-gauge-name {
  max-width: 140px;
  overflow: hidden;
  padding-left: 6px;
  border-left: 2px solid var(--row-color);
  text-overflow: ellipsis;
}

.guide-gauge-value {
  color: var(--ea-fg, rgb(255 255 255 / 92%));
  font-variant-numeric: tabular-nums;
  opacity: 0.95;
}

.guide-gauge-name.is-full,
.guide-gauge-value.is-full .guide-gauge-current {
  text-shadow: 0 0 6px rgb(255 255 255 / 18%);
}

.guide-gauge-sep {
  padding: 0 4px;
  opacity: 0.55;
}

.guide-gauge-max {
  color: rgb(170 170 170 / 92%);
}

.timeline-cursor-guide-panel.is-mobile {
  display: flex;
  width: min(286px, calc(100vw - 66px));
  max-width: calc(100vw - 66px);
  flex-direction: column;
  gap: 5px;
  padding: 6px 27px 6px 7px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-tooltip-bg, rgb(16 16 16 / 92%));
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 4px 14px var(--ea-shadow-strong);
  color: var(--ea-fg);
  font-family: 'Roboto Mono', Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.25;
}

.is-mobile .guide-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px 8px;
}

.is-mobile .guide-time-label,
.is-mobile .guide-sp-label,
.is-mobile .guide-stagger-label,
.is-mobile .guide-enemy-hp-label {
  width: auto;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  font: inherit;
}

.is-mobile .guide-gauge-panel,
.is-mobile .guide-enemy-effects {
  width: 100%;
  margin: 0;
  padding: 5px 0 0;
  box-sizing: border-box;
  border: 0;
  border-top: 1px solid var(--ea-border-soft);
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
}

.is-mobile .guide-gauge-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px 8px;
}

.is-mobile .guide-gauge-grid-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
}

.is-mobile .guide-gauge-name {
  min-width: 0;
  padding-left: 5px;
  white-space: nowrap;
}

.is-mobile .guide-gauge-value {
  flex: 0 0 auto;
  white-space: nowrap;
}

.is-mobile .guide-gauge-sep {
  padding: 0 2px;
}

.is-mobile .guide-enemy-effect {
  width: 22px;
  height: 22px;
  flex-basis: 22px;
}

.is-mobile .guide-enemy-effects {
  flex-wrap: wrap;
  gap: 4px;
}

.is-mobile .guide-enemy-effect.ea-button {
  display: block;
  min-width: 22px;
  padding: 0;
  border: 1px solid var(--ea-keycap-skill-border, #999);
  background: var(--ea-keycap-skill-bg, #333);
  pointer-events: auto;
}
</style>
