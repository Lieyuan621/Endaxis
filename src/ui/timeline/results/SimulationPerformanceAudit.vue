<script setup lang="ts">
import { computed } from 'vue';
import type { ScenarioSimulationPerformanceSample } from '../../../application/simulation/scenarioSimulationService';
import { summarizeSimulationPerformance } from './simulationPerformanceAudit';

interface AuditLabels {
  readonly title: string;
  readonly latest: string;
  readonly p95: string;
  readonly cacheHit: string;
  readonly cacheLookup: string;
  readonly simulation: string;
  readonly projection: string;
  readonly budget: string;
  readonly noSamples: string;
}

const props = defineProps<{
  samples: readonly ScenarioSimulationPerformanceSample[];
  budgetMs: number;
  labels: AuditLabels;
}>();

const CHART_WIDTH = 360;
const CHART_HEIGHT = 72;
const MAX_VISIBLE_SAMPLES = 30;
const recentSamples = computed(() => props.samples.slice(-MAX_VISIBLE_SAMPLES));
const summary = computed(() => summarizeSimulationPerformance(props.samples, props.budgetMs));
const chartMaximum = computed(() =>
  Math.max(props.budgetMs, ...recentSamples.value.map(sample => sample.totalMs), 1),
);
const budgetY = computed(() => CHART_HEIGHT - (props.budgetMs / chartMaximum.value) * CHART_HEIGHT);
const barWidth = computed(() => CHART_WIDTH / MAX_VISIBLE_SAMPLES - 2);

function barX(index: number): number {
  return (
    (MAX_VISIBLE_SAMPLES - recentSamples.value.length + index) *
      (CHART_WIDTH / MAX_VISIBLE_SAMPLES) +
    1
  );
}

function phaseHeight(durationMs: number): number {
  return Math.max(0, (durationMs / chartMaximum.value) * CHART_HEIGHT);
}

function phaseY(
  sample: ScenarioSimulationPerformanceSample,
  phase: 'lookup' | 'simulation' | 'projection',
): number {
  const phases = [sample.cacheLookupMs, sample.simulationMs, sample.projectionMs];
  const phaseIndex = phase === 'lookup' ? 0 : phase === 'simulation' ? 1 : 2;
  return (
    CHART_HEIGHT -
    phaseHeight(phases.slice(0, phaseIndex + 1).reduce((sum, value) => sum + value, 0))
  );
}

function formatMs(value: number | null): string {
  if (value === null) return '—';
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ms`;
}

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}
</script>

<template>
  <section class="performance-audit" :aria-label="labels.title">
    <header class="performance-audit__header">
      <div class="performance-audit__heading-row">
        <span class="performance-audit__heading-bar" aria-hidden="true"></span>
        <h3>{{ labels.title }}</h3>
        <span class="performance-audit__count">{{ summary.sampleCount }}</span>
      </div>
      <div class="performance-audit__heading-divider" aria-hidden="true"></div>
    </header>

    <dl class="performance-audit__metrics">
      <div>
        <dt>{{ labels.latest }}</dt>
        <dd>{{ formatMs(summary.latestMs) }}</dd>
      </div>
      <div>
        <dt>{{ labels.p95 }}</dt>
        <dd :class="{ 'is-over-budget': (summary.p95Ms ?? 0) > budgetMs }">
          {{ formatMs(summary.p95Ms) }}
        </dd>
      </div>
      <div>
        <dt>{{ labels.cacheHit }}</dt>
        <dd>{{ formatPercent(summary.cacheHitRate) }}</dd>
      </div>
    </dl>

    <div v-if="recentSamples.length > 0" class="performance-audit__chart-section">
      <div class="performance-audit__chart-heading">
        <span>{{ labels.budget }}</span>
        <strong>{{ budgetMs.toFixed(1) }} ms</strong>
      </div>
      <svg
        class="performance-audit__chart"
        :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="`${labels.title}: ${labels.p95} ${formatMs(summary.p95Ms)}`"
      >
        <line
          class="performance-audit__budget-line"
          x1="0"
          :y1="budgetY"
          :x2="CHART_WIDTH"
          :y2="budgetY"
        />
        <g v-for="(sample, index) in recentSamples" :key="index">
          <title>
            {{
              `${formatMs(sample.totalMs)} · ${labels.cacheLookup} ${formatMs(sample.cacheLookupMs)} · ${labels.simulation} ${formatMs(sample.simulationMs)} · ${labels.projection} ${formatMs(sample.projectionMs)}`
            }}
          </title>
          <rect
            class="performance-audit__bar performance-audit__bar--lookup"
            :class="{ 'is-cache-hit': sample.cacheHit }"
            :x="barX(index)"
            :y="phaseY(sample, 'lookup')"
            :width="barWidth"
            :height="Math.max(phaseHeight(sample.cacheLookupMs), 0.7)"
          />
          <rect
            class="performance-audit__bar performance-audit__bar--simulation"
            :x="barX(index)"
            :y="phaseY(sample, 'simulation')"
            :width="barWidth"
            :height="phaseHeight(sample.simulationMs)"
          />
          <rect
            class="performance-audit__bar performance-audit__bar--projection"
            :x="barX(index)"
            :y="phaseY(sample, 'projection')"
            :width="barWidth"
            :height="phaseHeight(sample.projectionMs)"
          />
          <rect
            v-if="sample.outcome !== 'completed'"
            class="performance-audit__bar-error"
            :x="barX(index)"
            :y="Math.max(0, CHART_HEIGHT - phaseHeight(sample.totalMs))"
            :width="barWidth"
            :height="Math.max(phaseHeight(sample.totalMs), 2)"
          />
        </g>
      </svg>
    </div>
    <div v-else class="performance-audit__empty">{{ labels.noSamples }}</div>

    <div class="performance-audit__legend" aria-hidden="true">
      <span><i class="legend-dot legend-dot--lookup"></i>{{ labels.cacheLookup }}</span>
      <span><i class="legend-dot legend-dot--simulation"></i>{{ labels.simulation }}</span>
      <span><i class="legend-dot legend-dot--projection"></i>{{ labels.projection }}</span>
    </div>
  </section>
</template>

<style scoped>
.performance-audit {
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: var(--ea-space-3);
  overflow-y: auto;
  background: var(--ea-workbench-panel);
  color: var(--ea-fg);
  font-size: 13px;
}

.performance-audit__header {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ea-space-1);
}

.performance-audit__heading-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--ea-space-2);
}

.performance-audit__heading-bar {
  width: 4px;
  height: 18px;
  flex: none;
  background: var(--ea-gold);
}

.performance-audit__heading-row h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--ea-fg);
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.performance-audit__heading-divider {
  height: 2px;
  margin-top: 3px;
  background: linear-gradient(90deg, var(--ea-gold), transparent);
  opacity: 0.3;
}

.performance-audit__count {
  margin-left: auto;
  color: var(--ea-fg-muted);
  font-variant-numeric: tabular-nums;
  font-size: 11px;
}

.performance-audit__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin: 14px 0 0;
}

.performance-audit__metrics > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}

.performance-audit__metrics dt {
  color: var(--ea-fg-muted);
  overflow-wrap: anywhere;
}

.performance-audit__metrics dd {
  margin: 0;
  color: var(--ea-fg);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  white-space: nowrap;
}

.performance-audit__metrics dd.is-over-budget {
  color: #ff7875;
}

.performance-audit__chart-section {
  min-width: 0;
  margin-top: 18px;
}

.performance-audit__chart-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--ea-fg-muted);
}

.performance-audit__chart-heading strong {
  color: var(--ea-fg);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  white-space: nowrap;
}

.performance-audit__chart {
  display: block;
  width: 100%;
  height: 72px;
  overflow: hidden;
}

.performance-audit__budget-line {
  stroke: #ff7875;
  stroke-width: 1;
  stroke-dasharray: 3 3;
  vector-effect: non-scaling-stroke;
  opacity: 0.72;
}

.performance-audit__bar--lookup {
  fill: #8c8c8c;
}

.performance-audit__bar--lookup.is-cache-hit {
  fill: #73d13d;
}

.performance-audit__bar--simulation {
  fill: #36cfc9;
}

.performance-audit__bar--projection {
  fill: #ffc53d;
}

.performance-audit__bar-error {
  fill: none;
  stroke: #ff4d4f;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.performance-audit__empty {
  display: grid;
  min-height: 88px;
  place-items: center;
  color: var(--ea-fg-muted);
}

.performance-audit__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 12px;
  color: var(--ea-fg-muted);
}

.performance-audit__legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 1px;
}

.legend-dot--lookup {
  background: #8c8c8c;
}

.legend-dot--simulation {
  background: #36cfc9;
}

.legend-dot--projection {
  background: #ffc53d;
}
</style>
