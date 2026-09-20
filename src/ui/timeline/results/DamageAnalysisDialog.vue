<script setup lang="ts">
import { ElCollapse, ElCollapseItem } from 'element-plus';
/** 旧版伤害分析面板的展示结构；所有数值只读取新版同一次正式模拟发布的回执汇总。 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import type { ComposeOption } from 'echarts/core';
import type { PieSeriesOption } from 'echarts/charts';
import type { LegendComponentOption, TooltipComponentOption } from 'echarts/components';
import { EaDialog } from '../../../design-system/index';
import { useAppearance } from '../../appearance/useAppearance';
import '../../../utils/echartsSetup';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import type { TimelineDamageAnalysis, TimelineDamageAnalysisEntry } from './timelineDamageAnalysis';

type ChartOption = ComposeOption<PieSeriesOption | TooltipComponentOption | LegendComponentOption>;

const props = defineProps<{
  visible: boolean;
  analysis: TimelineDamageAnalysis;
  locale: string;
  randomMode: 'expected' | 'sampled';
  globalRandomSeed: number;
  labels: {
    title: string;
    warning: string;
    noData: string;
    damageByOperator: string;
    contributionByOperator: string;
    damageByElement: string;
    totalDamage: string;
    expectedTotalDamage: string;
    sampledTotalDamage: string;
    expectedModeDescription: string;
    sampledModeDescription: (seed: string) => string;
    rotationTime: string;
    dps: string;
    unattributedDamage: (value: string) => string;
    damage: string;
    faqTitle: string;
    faq: readonly (readonly [question: string, answer: string])[];
  };
}>();

defineEmits<{ 'update:visible': [visible: boolean] }>();

const { appearance } = useAppearance();
const { t } = useI18n();
const hasData = computed(() => props.analysis.totalDamage > 0);
const numberFormatter = computed(
  () => new Intl.NumberFormat(props.locale, { maximumFractionDigits: 0 }),
);

function formatNumber(value: number): string {
  return numberFormatter.value.format(Math.round(value));
}

function chartData(entries: readonly TimelineDamageAnalysisEntry[]) {
  return entries.map(entry => ({
    name: entry.label,
    value: entry.value,
    itemStyle: { color: entry.color ?? '#888888' },
  }));
}

const chartPaint = computed(() => {
  const light = appearance.value === 'light';
  return {
    tooltip: {
      borderRadius: 0,
      backgroundColor: light ? '#ffffff' : '#2a2a2a',
      borderColor: light ? '#d8dbe0' : '#444444',
      textStyle: { color: light ? '#1a1b1e' : '#f0f0f0', fontSize: 13 },
    },
    legendText: light ? '#3a3d44' : '#cccccc',
    legendInactive: light ? '#9aa3b0' : '#565d66',
    label: light ? '#3a3d44' : '#cccccc',
    sliceBorder: light ? '#ffffff' : '#252528',
  };
});

function pieOption(entries: readonly TimelineDamageAnalysisEntry[]): ChartOption {
  const paint = chartPaint.value;
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', ...paint.tooltip },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      inactiveColor: paint.legendInactive,
      textStyle: { color: paint.legendText, fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['40%', '50%'],
        itemStyle: { borderColor: paint.sliceBorder, borderWidth: 2 },
        label: { color: paint.label, formatter: '{b}\n{d}%', fontSize: 12 },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
        },
        data: chartData(entries),
      },
    ],
  };
}

const operatorChartOption = computed(() => pieOption(props.analysis.byOperator));
const hasNegativeContribution = computed(() =>
  props.analysis.contributionParts.some(entry => entry.value < 0),
);
// 贡献来自发布结果的直接修正；尚未支持的乘区仍计入自身。
const contributionChartOption = computed<ChartOption>(() => {
  const paint = chartPaint.value;
  const data = chartData(props.analysis.byContribution);
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', ...paint.tooltip },
    series: [
      {
        type: 'pie',
        radius: ['0%', '38%'],
        center: ['50%', '50%'],
        itemStyle: { borderColor: paint.sliceBorder, borderWidth: 2 },
        label: { color: paint.label, formatter: '{d}%', fontSize: 11, position: 'inner' },
        data,
      },
      {
        type: 'pie',
        radius: ['48%', '68%'],
        center: ['50%', '50%'],
        itemStyle: { borderColor: paint.sliceBorder, borderWidth: 1 },
        label: { color: paint.label, formatter: '{b}\n{d}%', fontSize: 11 },
        data: props.analysis.byContribution.flatMap(operator =>
          props.analysis.contributionParts
            .filter(part => part.key === operator.key && part.value !== 0)
            .map(part => ({
              name: `${part.label} · ${t(`objectOrigins.contributionParts.${part.kind}`)}`,
              value: part.value,
              itemStyle: {
                color: part.color ?? '#888888',
                opacity: part.kind === 'self' ? 1 : 0.6,
              },
            })),
        ),
      },
    ],
  };
});
const damageTypeChartOption = computed(() => pieOption(props.analysis.byDamageType));
</script>

<template>
  <InputRegionBoundary label="DamageAnalysisDialog" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      width="90vw"
      top="3vh"
      append-to-body
      destroy-on-close
      class="damage-analysis-dialog custom-dialog"
      @update:model-value="$emit('update:visible', $event)"
    >
      <template #header>
        <span class="analysis-title">{{ labels.title }}</span>
      </template>

      <div class="analysis-content">
        <slot name="status" />
        <div class="warning-banner">
          <span class="warning-text">{{ labels.warning }}</span>
        </div>

        <div class="analysis-mode">
          {{
            randomMode === 'expected'
              ? labels.expectedModeDescription
              : labels.sampledModeDescription(String(globalRandomSeed))
          }}
        </div>

        <div v-if="!hasData" class="empty-state">
          <p>{{ labels.noData }}</p>
        </div>

        <template v-else>
          <div class="charts-row">
            <section class="chart-card">
              <h3 class="chart-title">{{ labels.damageByOperator }}</h3>
              <VChart :option="operatorChartOption" autoresize class="chart" />
              <p v-if="analysis.unattributedDamage > 0" class="analysis-note">
                {{ labels.unattributedDamage(formatNumber(analysis.unattributedDamage)) }}
              </p>
            </section>
            <section class="chart-card">
              <h3 class="chart-title">{{ labels.contributionByOperator }}</h3>
              <VChart
                v-if="!hasNegativeContribution"
                :option="contributionChartOption"
                autoresize
                class="chart"
              />
              <table v-else class="contribution-values">
                <tbody>
                  <tr
                    v-for="entry in analysis.contributionParts"
                    :key="`${entry.key}:${entry.kind}`"
                  >
                    <th>
                      {{ entry.label }} · {{ t(`objectOrigins.contributionParts.${entry.kind}`) }}
                    </th>
                    <td>{{ formatNumber(entry.value) }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
            <section class="chart-card">
              <h3 class="chart-title">{{ labels.damageByElement }}</h3>
              <VChart :option="damageTypeChartOption" autoresize class="chart" />
            </section>
          </div>

          <div class="summary-row">
            <div class="summary-item">
              <span class="summary-label">{{
                randomMode === 'expected' ? labels.expectedTotalDamage : labels.sampledTotalDamage
              }}</span>
              <span class="summary-value">{{ formatNumber(analysis.totalDamage) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ labels.rotationTime }}</span>
              <span class="summary-value">{{ analysis.rotationSeconds.toFixed(2) }}s</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ labels.dps }}</span>
              <span class="summary-value">{{ formatNumber(analysis.dps) }}</span>
            </div>
          </div>
        </template>

        <section class="faq-section">
          <h3 class="faq-title">{{ labels.faqTitle }}</h3>
          <el-collapse class="faq-collapse">
            <el-collapse-item
              v-for="([question, answer], index) in labels.faq"
              :key="index"
              :title="question"
              :name="String(index + 1)"
            >
              <p class="faq-answer">{{ answer }}</p>
            </el-collapse-item>
          </el-collapse>
        </section>
      </div>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.analysis-title {
  color: var(--ea-dialog-title);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.analysis-content {
  min-height: 400px;
}

.warning-banner {
  margin-bottom: 24px;
  padding: 10px 16px;
  border: 1px solid color-mix(in srgb, #ffab40 35%, transparent);
  border-radius: var(--ea-control-radius);
  background: color-mix(in srgb, #ffab40 10%, transparent);
}

.warning-text {
  color: #c47a10;
  font-size: 13px;
  line-height: 1.5;
}

.analysis-mode {
  margin: -12px 0 20px;
  color: var(--ea-dialog-text);
  font-size: 13px;
  line-height: 1.5;
}

:global(html[data-theme='dark']) .warning-text {
  color: #ffab40;
}

.empty-state {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ea-dialog-hint);
  font-size: 14px;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.chart-card,
.summary-item {
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-control-radius);
  background: color-mix(in srgb, var(--ea-fg) 5%, var(--ea-dialog-bg));
}

.chart-card {
  min-width: 0;
  padding: 16px;
}

.chart-title,
.faq-title {
  margin: 0;
  color: var(--ea-dialog-body);
  font-size: 14px;
  font-weight: 500;
}

.chart {
  width: 100%;
  height: 260px;
}

.analysis-note {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 12px;
  line-height: 1.6;
}

.contribution-values {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.contribution-values th,
.contribution-values td {
  padding: 8px;
  border-bottom: 1px solid var(--ea-border);
  text-align: left;
}

.contribution-values td {
  text-align: right;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px;
}

.summary-label {
  color: var(--ea-dialog-hint);
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.summary-value {
  color: var(--ea-gold);
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.faq-section {
  width: 100%;
  margin-top: 24px;
}

.faq-title {
  margin-bottom: 12px;
}

.faq-collapse {
  --el-collapse-border-color: var(--ea-border);
  --el-collapse-header-bg-color: color-mix(in srgb, var(--ea-fg) 5%, var(--ea-dialog-bg));
  --el-collapse-content-bg-color: color-mix(in srgb, var(--ea-fg) 3%, var(--ea-dialog-bg));
  --el-collapse-header-text-color: var(--ea-dialog-body);
  --el-collapse-content-text-color: var(--ea-fg-muted);
  --el-collapse-header-font-size: 13px;
  --el-collapse-content-font-size: 13px;

  overflow: hidden;
  border-radius: var(--ea-control-radius);
}

.faq-collapse :deep(.el-collapse-item__header) {
  padding-right: 16px;
  padding-left: 16px;
}

.faq-collapse :deep(.el-collapse-item__content) {
  padding: 0;
}

.faq-answer {
  margin: 0;
  padding: 12px 16px;
  border-top: 1px solid var(--ea-border);
  background: var(--ea-fill-muted);
  color: var(--ea-fg-muted);
  line-height: 1.6;
  white-space: pre-line;
}

@media (max-width: 900px) {
  .charts-row {
    grid-template-columns: 1fr;
  }

  .summary-row {
    flex-direction: column;
  }

  .summary-item {
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
