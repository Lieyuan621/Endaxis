<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import type { ComposeOption } from 'echarts/core';
import type { PieSeriesOption } from 'echarts/charts';
import type { LegendComponentOption, TooltipComponentOption } from 'echarts/components';
import '@/utils/echartsSetup';
import { useDamageAnalysis } from '@/composables/useDamageAnalysis';
import { useAppearance } from '@/composables/useAppearance';
import { useTimelineStore } from '@/stores/timelineStore';
import { lightenColor } from '@/utils/theme';

type ChartOption = ComposeOption<PieSeriesOption | TooltipComponentOption | LegendComponentOption>;
type PieDatum = {
  name: string;
  value: number;
  itemStyle: { color: string };
};

const { t, locale } = useI18n({ useScope: 'global' });
const { analysis } = useDamageAnalysis();
const { appearance } = useAppearance();
const store = useTimelineStore();
const analysisRoot = ref<HTMLElement | null>(null);
const chartsReady = ref(false);
let sizeObserver: ResizeObserver | null = null;
let fallbackFrame: number | null = null;

function revealChartsWhenSized(): void {
  const root = analysisRoot.value;
  if (!root || root.clientWidth <= 0 || root.clientHeight <= 0) return;
  chartsReady.value = true;
  sizeObserver?.disconnect();
  sizeObserver = null;
}

onMounted(async () => {
  await nextTick();
  revealChartsWhenSized();
  if (chartsReady.value) return;
  if (typeof ResizeObserver !== 'undefined') {
    sizeObserver = new ResizeObserver(revealChartsWhenSized);
    if (analysisRoot.value) sizeObserver.observe(analysisRoot.value);
  } else {
    fallbackFrame = window.requestAnimationFrame(revealChartsWhenSized);
  }
});

onUnmounted(() => {
  sizeObserver?.disconnect();
  if (fallbackFrame != null) window.cancelAnimationFrame(fallbackFrame);
});

function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale.value).format(Math.round(value || 0));
}

function createPieOption(data: PieDatum[]): ChartOption {
  const isLight = appearance.value === 'light';
  const textColor = isLight ? '#3a3d44' : '#cccccc';

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: isLight ? '#ffffff' : '#2a2a2a',
      borderColor: isLight ? '#d8dbe0' : '#444444',
      textStyle: { color: isLight ? '#1a1b1e' : '#f0f0f0', fontSize: 12 },
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      left: 8,
      right: 8,
      bottom: 0,
      inactiveColor: isLight ? '#9aa3b0' : '#565d66',
      textStyle: { color: textColor, fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['34%', '62%'],
        center: ['50%', '43%'],
        itemStyle: {
          borderColor: isLight ? '#ffffff' : '#252528',
          borderWidth: 2,
        },
        label: {
          color: textColor,
          formatter: '{b}\n{d}%',
          fontSize: 11,
        },
        labelLine: { length: 10, length2: 6 },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.45)',
          },
        },
        data,
      },
    ],
  };
}

const operatorChartOption = computed<ChartOption>(() =>
  createPieOption(analysis.value.operatorChartData),
);
const elementChartOption = computed<ChartOption>(() =>
  createPieOption(analysis.value.elementChartData),
);

const contributionChartOption = computed<ChartOption>(() => {
  const isLight = appearance.value === 'light';
  const data = analysis.value.contributionData;
  const innerData = data.map(item => ({
    name: item.name,
    value: item.total,
    itemStyle: { color: item.color },
  }));
  const outerData: PieDatum[] = [];

  for (const item of data) {
    if (item.damage > 0) {
      outerData.push({
        name: `${item.name} ${t('timeline.analysis.damage')}`,
        value: item.damage,
        itemStyle: { color: item.color },
      });
    }
    if (item.buff > 0) {
      outerData.push({
        name: `${item.name} ${t('timeline.analysis.buff')}`,
        value: item.buff,
        itemStyle: { color: lightenColor(item.color, 0.45) },
      });
    }
  }

  const textColor = isLight ? '#3a3d44' : '#cccccc';
  const sliceBorder = isLight ? '#ffffff' : '#252528';

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {d}%',
      backgroundColor: isLight ? '#ffffff' : '#2a2a2a',
      borderColor: isLight ? '#d8dbe0' : '#444444',
      textStyle: { color: isLight ? '#1a1b1e' : '#f0f0f0', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['0%', '34%'],
        center: ['50%', '48%'],
        itemStyle: { borderColor: sliceBorder, borderWidth: 2 },
        label: {
          color: isLight ? '#1a1b1e' : '#ffffff',
          formatter: '{d}%',
          fontSize: 10,
          position: 'inner',
        },
        data: innerData,
      },
      {
        type: 'pie',
        radius: ['44%', '66%'],
        center: ['50%', '48%'],
        itemStyle: { borderColor: sliceBorder, borderWidth: 1 },
        label: { color: textColor, formatter: '{b}\n{d}%', fontSize: 10 },
        labelLine: { length: 9, length2: 5 },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.45)',
          },
        },
        data: outerData,
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

    <div v-if="analysis.hasData" class="analysis-content">
      <div class="metrics">
        <div>
          <span>{{ t('timeline.analysis.totalDamage') }}</span>
          <strong>{{ formatNumber(analysis.totalDamage) }}</strong>
        </div>
        <div>
          <span>{{ t('timeline.analysis.dps') }}</span>
          <strong>{{ formatNumber(analysis.dps) }}</strong>
        </div>
        <div>
          <span>{{ t('timeline.analysis.rotationTime') }}</span>
          <strong>{{ analysis.rotationTime.toFixed(1) }}s</strong>
        </div>
      </div>

      <section class="analysis-section">
        <h2>{{ t('timeline.analysis.damageByOperator') }}</h2>
        <VChart v-if="chartsReady" :option="operatorChartOption" autoresize class="damage-chart" />
      </section>

      <section class="analysis-section">
        <div class="section-heading">
          <h2>{{ t('timeline.analysis.contributionByOperator') }}</h2>
          <div class="mode-switch" role="group">
            <button
              type="button"
              :class="{ active: store.lmdiAttributionMode === 'applier' }"
              @click="store.lmdiAttributionMode = 'applier'"
            >
              {{ t('timeline.analysis.lmdiModeApplier') }}
            </button>
            <button
              type="button"
              :class="{ active: store.lmdiAttributionMode === 'stacks' }"
              @click="store.lmdiAttributionMode = 'stacks'"
            >
              {{ t('timeline.analysis.lmdiModeStacks') }}
            </button>
          </div>
        </div>
        <VChart
          v-if="chartsReady"
          :option="contributionChartOption"
          autoresize
          class="damage-chart contribution-chart"
        />
      </section>

      <section class="analysis-section">
        <h2>{{ t('timeline.analysis.damageByElement') }}</h2>
        <VChart v-if="chartsReady" :option="elementChartOption" autoresize class="damage-chart" />
      </section>
    </div>

    <div v-else class="empty">{{ t('timeline.analysis.noData') }}</div>
  </section>
</template>

<style scoped>
.analysis-view {
  width: 100%;
  min-width: 0;
  height: 100%;
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
  letter-spacing: 0;
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

.section-heading {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading h2 {
  margin: 0;
}

.mode-switch {
  height: 30px;
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(2, auto);
  border: 1px solid var(--ea-border);
}

.mode-switch button {
  min-width: 58px;
  padding: 0 8px;
  border: 0;
  border-right: 1px solid var(--ea-border);
  background: transparent;
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.mode-switch button:last-child {
  border-right: 0;
}

.mode-switch button.active {
  background: var(--ea-gold);
  color: #171717;
  font-weight: 800;
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
