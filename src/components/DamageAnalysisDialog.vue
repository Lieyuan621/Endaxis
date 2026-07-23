<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import type { ComposeOption } from 'echarts/core';
import type { PieSeriesOption } from 'echarts/charts';
import type { TooltipComponentOption, LegendComponentOption } from 'echarts/components';
import '@/utils/echartsSetup';
import { useDamageAnalysis } from '@/composables/useDamageAnalysis';
import { lightenColor } from '@/utils/theme';
import { useTimelineStore } from '@/stores/timelineStore';

type ChartOption = ComposeOption<PieSeriesOption | TooltipComponentOption | LegendComponentOption>;

defineProps<{ visible: boolean }>();
const emit = defineEmits<{ 'update:visible': [value: boolean] }>();

const { t } = useI18n();
const { analysis } = useDamageAnalysis();
const store = useTimelineStore();

function onClose(val: boolean) {
  emit('update:visible', val);
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatTime(seconds: number): string {
  const s = seconds.toFixed(2);
  return `${s}s`;
}

const tooltipStyle = {
  backgroundColor: '#2a2a2a',
  borderColor: '#444',
  textStyle: { color: '#f0f0f0', fontSize: 13 },
};

const operatorChartOption = computed<ChartOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
    ...tooltipStyle,
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
    inactiveColor: '#565d66',
    textStyle: { color: '#ccc', fontSize: 12 },
  },
  series: [
    {
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['40%', '50%'],
      itemStyle: { borderColor: '#252528', borderWidth: 2 },
      label: { color: '#ccc', formatter: '{b}\n{d}%', fontSize: 12 },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
      },
      data: analysis.value.operatorChartData,
    },
  ],
}));

const contributionChartOption = computed<ChartOption>(() => {
  const data = analysis.value.contributionData;

  // Inner ring: operator totals
  const innerData = data.map(d => ({
    name: d.name,
    value: d.total,
    itemStyle: { color: d.color },
  }));

  // Outer ring: damage/buff split per operator
  const outerData: Array<{ name: string; value: number; itemStyle: { color: string } }> = [];
  for (const d of data) {
    if (d.damage > 0) {
      outerData.push({
        name: `${d.name} ${t('timeline.analysis.damage')}`,
        value: d.damage,
        itemStyle: { color: d.color },
      });
    }
    if (d.buff > 0) {
      outerData.push({
        name: `${d.name} ${t('timeline.analysis.buff')}`,
        value: d.buff,
        itemStyle: { color: lightenColor(d.color, 0.45) },
      });
    }
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {d}%',
      ...tooltipStyle,
    },
    series: [
      {
        type: 'pie',
        radius: ['0%', '38%'],
        center: ['50%', '50%'],
        itemStyle: { borderColor: '#252528', borderWidth: 2 },
        label: { color: '#fff', formatter: '{d}%', fontSize: 11, position: 'inner' },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
        },
        data: innerData,
      },
      {
        type: 'pie',
        radius: ['48%', '68%'],
        center: ['50%', '50%'],
        itemStyle: { borderColor: '#252528', borderWidth: 1 },
        label: { color: '#ccc', formatter: '{b}\n{d}%', fontSize: 11 },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
        },
        data: outerData,
      },
    ],
  };
});

const elementChartOption = computed<ChartOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
    ...tooltipStyle,
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
    inactiveColor: '#565d66',
    textStyle: { color: '#ccc', fontSize: 12 },
  },
  series: [
    {
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['40%', '50%'],
      label: { color: '#ccc', formatter: '{b}\n{d}%', fontSize: 12 },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
      },
      data: analysis.value.elementChartData,
    },
  ],
}));
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="onClose"
    width="90vw"
    top="3vh"
    :append-to-body="true"
    class="damage-analysis-dialog"
    :destroy-on-close="true"
  >
    <template #header>
      <span class="analysis-title">{{ t('timeline.analysis.dialogTitle') }}</span>
    </template>

    <div class="analysis-content">
      <div class="warning-banner">
        <span class="warning-text">{{ t('timeline.analysis.warning') }}</span>
      </div>

      <div v-if="!analysis.hasData" class="empty-state">
        <p>{{ t('timeline.analysis.noData') }}</p>
      </div>

      <template v-else>
        <div class="charts-row">
          <div class="chart-card">
            <h3 class="chart-title">{{ t('timeline.analysis.damageByOperator') }}</h3>
            <VChart :option="operatorChartOption" autoresize class="chart" />
          </div>
          <div class="chart-card">
            <div class="chart-title-row">
              <h3 class="chart-title">{{ t('timeline.analysis.contributionByOperator') }}</h3>
              <div class="lmdi-mode-toggle">
                <el-tooltip
                  :content="t('timeline.analysis.lmdiModeApplierTip')"
                  placement="top"
                  :show-after="300"
                >
                  <button
                    class="lmdi-mode-btn"
                    :class="{ active: store.lmdiAttributionMode === 'applier' }"
                    @click="store.lmdiAttributionMode = 'applier'"
                  >
                    {{ t('timeline.analysis.lmdiModeApplier') }}
                  </button>
                </el-tooltip>
                <el-tooltip
                  :content="t('timeline.analysis.lmdiModeStacksTip')"
                  placement="top"
                  :show-after="300"
                >
                  <button
                    class="lmdi-mode-btn"
                    :class="{ active: store.lmdiAttributionMode === 'stacks' }"
                    @click="store.lmdiAttributionMode = 'stacks'"
                  >
                    {{ t('timeline.analysis.lmdiModeStacks') }}
                  </button>
                </el-tooltip>
              </div>
            </div>
            <VChart :option="contributionChartOption" autoresize class="chart" />
          </div>
          <div class="chart-card">
            <h3 class="chart-title">{{ t('timeline.analysis.damageByElement') }}</h3>
            <VChart :option="elementChartOption" autoresize class="chart" />
          </div>
        </div>

        <div class="summary-row">
          <div class="summary-item">
            <span class="summary-label">{{ t('timeline.analysis.totalDamage') }}</span>
            <span class="summary-value">{{ formatNumber(analysis.totalDamage) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('timeline.analysis.rotationTime') }}</span>
            <span class="summary-value">{{ formatTime(analysis.rotationTime) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('timeline.analysis.dps') }}</span>
            <span class="summary-value">{{ formatNumber(analysis.dps) }}</span>
          </div>
        </div>
      </template>

      <div class="faq-section">
        <div class="faq-header">
          <h3 class="faq-title">{{ t('timeline.analysis.faqTitle') }}</h3>
        </div>
        <el-collapse class="faq-collapse">
          <el-collapse-item :title="t('timeline.analysis.faq1Q')" name="1">
            <p class="faq-answer">{{ t('timeline.analysis.faq1A') }}</p>
          </el-collapse-item>
          <el-collapse-item :title="t('timeline.analysis.faq2Q')" name="2">
            <p class="faq-answer">{{ t('timeline.analysis.faq2A') }}</p>
          </el-collapse-item>
          <el-collapse-item :title="t('timeline.analysis.faq3Q')" name="3">
            <p class="faq-answer">{{ t('timeline.analysis.faq3A') }}</p>
          </el-collapse-item>
          <el-collapse-item :title="t('timeline.analysis.faq4Q')" name="4">
            <p class="faq-answer">{{ t('timeline.analysis.faq4A') }}</p>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.analysis-title {
  font-size: 16px;
  font-weight: 600;
  color: #f0f0f0;
  letter-spacing: 0.5px;
}

.analysis-content {
  min-height: 400px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #888;
  font-size: 14px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.chart-card {
  background: #252528;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 16px;
}

.chart-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.chart-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #ccc;
}

.lmdi-mode-toggle {
  display: flex;
  gap: 0;
  border: 1px solid #444;
  border-radius: 4px;
  overflow: hidden;
}

.lmdi-mode-btn {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  background: transparent;
  color: #888;
  border: none;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  white-space: nowrap;
}

.lmdi-mode-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ccc;
}

.lmdi-mode-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.chart {
  height: 260px;
  width: 100%;
}

.summary-row {
  display: flex;
  gap: 24px;
  align-items: center;
}

.summary-item {
  flex: 1;
  background: #252528;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-label {
  font-size: 13px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
  font-variant-numeric: tabular-nums;
}

.warning-banner {
  background: rgba(255, 171, 64, 0.08);
  border: 1px solid rgba(255, 171, 64, 0.3);
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 24px;
}

.warning-text {
  color: #ffab40;
  font-size: 13px;
  line-height: 1.5;
}

.faq-section {
  margin-top: 24px;
  width: 100%;
}

.faq-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.faq-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #ccc;
}

.faq-collapse {
  --el-collapse-border-color: #333;
  --el-collapse-header-bg-color: #252528;
  --el-collapse-content-bg-color: #1e1e20;
  --el-collapse-header-text-color: #ccc;
  --el-collapse-content-text-color: #aaa;
  --el-collapse-header-font-size: 13px;
  --el-collapse-content-font-size: 13px;
  border-radius: 6px;
  overflow: hidden;
}

.faq-collapse :deep(.el-collapse-item__header) {
  padding-left: 16px;
  padding-right: 16px;
}

.faq-collapse :deep(.el-collapse-item__content) {
  padding: 0;
}

.faq-answer {
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid #333;
  padding: 12px 16px;
}
</style>
