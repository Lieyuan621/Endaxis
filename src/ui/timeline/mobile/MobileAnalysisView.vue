<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import type { ComposeOption } from 'echarts/core';
import type { PieSeriesOption } from 'echarts/charts';
import type { LegendComponentOption, TooltipComponentOption } from 'echarts/components';
import { useAppearance } from '../../appearance/useAppearance';
import { lightenColor } from '../../gameColors';
import type {
  TimelineDamageAnalysis,
  TimelineDamageAnalysisEntry,
} from '../results/timelineDamageAnalysis';
import '../../../utils/echartsSetup';

type ChartOption = ComposeOption<PieSeriesOption | TooltipComponentOption | LegendComponentOption>;

const props = defineProps<{ analysis: TimelineDamageAnalysis }>();
const { t, locale } = useI18n();
const { appearance } = useAppearance();
const analysisRoot = ref<HTMLElement | null>(null);
const chartsReady = ref(false);
let sizeObserver: ResizeObserver | null = null;

function revealChartsWhenSized(): void {
  if (!analysisRoot.value?.clientWidth || !analysisRoot.value.clientHeight) return;
  chartsReady.value = true;
  sizeObserver?.disconnect();
  sizeObserver = null;
}

onMounted(async () => {
  await nextTick();
  revealChartsWhenSized();
  if (!chartsReady.value && typeof ResizeObserver !== 'undefined') {
    sizeObserver = new ResizeObserver(revealChartsWhenSized);
    if (analysisRoot.value) sizeObserver.observe(analysisRoot.value);
  }
});
onUnmounted(() => sizeObserver?.disconnect());

function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 0 }).format(value);
}

function tooltip(params: unknown): HTMLElement {
  const item = (Array.isArray(params) ? params[0] : params) as
    | {
        name?: unknown;
        value?: unknown;
        percent?: unknown;
      }
    | undefined;
  const content = document.createElement('span');
  content.textContent = `${String(item?.name ?? '')}: ${formatNumber(Number(item?.value ?? 0))} (${Number(item?.percent ?? 0).toFixed(1)}%)`;
  return content;
}

function pie(entries: readonly TimelineDamageAnalysisEntry[]): ChartOption {
  const light = appearance.value === 'light';
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: tooltip,
      backgroundColor: light ? '#ffffff' : '#2a2a2a',
      borderColor: light ? '#d8dbe0' : '#444444',
      textStyle: { color: light ? '#1a1b1e' : '#f0f0f0', fontSize: 12 },
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      left: 8,
      right: 8,
      bottom: 0,
      textStyle: { color: light ? '#3a3d44' : '#cccccc', fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['34%', '62%'],
        center: ['50%', '48%'],
        itemStyle: { borderColor: light ? '#ffffff' : '#252528', borderWidth: 2 },
        label: { color: light ? '#3a3d44' : '#cccccc', formatter: '{b}\n{d}%', fontSize: 11 },
        labelLine: { length: 10, length2: 6 },
        data: entries.map(entry => ({
          name: entry.label,
          value: entry.value,
          itemStyle: { color: entry.color ?? '#888888' },
        })),
      },
    ],
  };
}

const operatorChart = computed(() => pie(props.analysis.byOperator));
const elementChart = computed(() => pie(props.analysis.byDamageType));
const contributionChart = computed<ChartOption>(() => {
  const light = appearance.value === 'light';
  const base = pie(props.analysis.byContribution);
  const parts = props.analysis.contributionParts;
  return {
    ...base,
    series: [
      {
        type: 'pie',
        radius: ['0%', '34%'],
        center: ['50%', '48%'],
        itemStyle: { borderColor: light ? '#ffffff' : '#252528', borderWidth: 2 },
        label: {
          position: 'inner',
          formatter: '{d}%',
          fontSize: 10,
          color: light ? '#1a1b1e' : '#ffffff',
        },
        data: props.analysis.byContribution.map(entry => ({
          name: entry.label,
          value: entry.value,
          itemStyle: { color: entry.color ?? '#888888' },
        })),
      },
      {
        type: 'pie',
        radius: ['44%', '66%'],
        center: ['50%', '48%'],
        itemStyle: { borderColor: light ? '#ffffff' : '#252528', borderWidth: 1 },
        label: { color: light ? '#3a3d44' : '#cccccc', formatter: '{b}\n{d}%', fontSize: 10 },
        labelLine: { length: 9, length2: 5 },
        data: parts.map(entry => ({
          name: `${entry.label} · ${entry.kind === 'self' ? t('timeline.analysis.damage') : t('timeline.analysis.buff')}`,
          value: entry.value,
          itemStyle: {
            color:
              entry.kind === 'self'
                ? (entry.color ?? '#888888')
                : lightenColor(entry.color ?? '#888888', 0.45),
          },
        })),
      },
    ],
  };
});
</script>

<template>
  <section ref="analysisRoot" class="analysis-view">
    <header class="analysis-header">
      <h1>{{ t('timeline.analysis.dialogTitle') }}</h1>
    </header>
    <div v-if="analysis.totalDamage > 0" class="analysis-content">
      <div class="metrics">
        <div>
          <span>{{ t('timeline.analysis.totalDamage') }}</span
          ><strong>{{ formatNumber(analysis.totalDamage) }}</strong>
        </div>
        <div>
          <span>{{ t('timeline.analysis.dps') }}</span
          ><strong>{{ formatNumber(analysis.dps) }}</strong>
        </div>
        <div>
          <span>{{ t('timeline.analysis.rotationTime') }}</span
          ><strong>{{ analysis.rotationSeconds.toFixed(1) }}s</strong>
        </div>
      </div>
      <section class="analysis-section">
        <h2>{{ t('timeline.analysis.damageByOperator') }}</h2>
        <VChart v-if="chartsReady" :option="operatorChart" autoresize class="damage-chart" />
      </section>
      <section class="analysis-section">
        <h2>{{ t('timeline.analysis.contributionByOperator') }}</h2>
        <VChart
          v-if="chartsReady"
          :option="contributionChart"
          autoresize
          class="damage-chart contribution-chart"
        />
      </section>
      <section class="analysis-section">
        <h2>{{ t('timeline.analysis.damageByElement') }}</h2>
        <VChart v-if="chartsReady" :option="elementChart" autoresize class="damage-chart" />
      </section>
    </div>
    <div v-else class="empty">{{ t('timeline.analysis.noData') }}</div>
  </section>
</template>

<style scoped>
.analysis-view {
  width: 100%;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: var(--ea-bg);
  color: var(--ea-fg);
}
.analysis-header {
  padding: calc(18px + env(safe-area-inset-top)) 18px 14px;
  border-bottom: 1px solid var(--ea-border-soft);
  background: var(--ea-chrome);
}
h1 {
  margin: 0;
  font-size: 25px;
}
.analysis-content {
  padding-bottom: 24px;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--ea-border-soft);
}
.metrics div {
  min-width: 0;
  padding: 14px 10px;
  border-right: 1px solid var(--ea-border-soft);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.metrics div:last-child {
  border-right: 0;
}
.metrics span {
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.metrics strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
}
.analysis-section {
  padding: 18px;
  border-bottom: 1px solid var(--ea-border-soft);
}
h2 {
  margin: 0 0 8px;
  font-size: 14px;
}
.damage-chart {
  width: 100%;
  height: 300px;
}
.contribution-chart {
  height: 320px;
}
.empty {
  padding: 48px 20px;
  color: var(--ea-fg-muted);
  text-align: center;
}
</style>
