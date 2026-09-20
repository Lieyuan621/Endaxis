<script setup lang="ts">
import { ElIcon } from 'element-plus';
import { EaDialog } from '../../../design-system/index';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
/**
 * 展示 Next Build Resolver 生成的静态面板及来源回执。
 *
 * 组件只负责本地化和展开交互，不重新计算面板；比率由核心统一以小数提供，在此格式化为百分数。
 */
import { computed, ref, watch } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type {
  OperatorPanelContributionReceipt,
  OperatorPanelStat,
  ResolvedOperatorPanel,
} from '../../../core/compiler/resolveOperatorPanel';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import { resolveOperatorPanelContributionSourceLabel } from './operatorPanelContributionPresentation';
import type { PublishedBuffSource } from '../results/publishedBuffSource';

const props = defineProps<{
  visible: boolean;
  panel: ResolvedOperatorPanel | null;
  operator: OperatorDefinition | null;
  operatorName: string;
  weapons?: ReadonlyMap<string, PublishedBuffSource>;
}>();

const emit = defineEmits<{ 'update:visible': [visible: boolean] }>();
const { t, locale } = useI18n({ useScope: 'global' });
const expanded = ref(new Set<OperatorPanelStat>());

const ATTRIBUTE_KEYS = ['strength', 'agility', 'intellect', 'will'] as const;

interface StatRow {
  readonly key: OperatorPanelStat;
  readonly label: string;
  readonly value: string;
}

watch(
  () => props.visible,
  visible => {
    if (!visible) expanded.value = new Set();
  },
);

function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value: number): string {
  return `${formatNumber(value * 100)}%`;
}

function statLabel(stat: OperatorPanelStat): string {
  if (ATTRIBUTE_KEYS.includes(stat as (typeof ATTRIBUTE_KEYS)[number])) return t(`stats.${stat}`);
  if (stat === 'attack') return t('stats.attack');
  if (stat === 'health') return t('stats.hp');
  if (stat === 'defense') return t('statDetail.defense');
  if (stat === 'criticalRate') return t('stats.crit_rate');
  if (stat === 'criticalDamage') return t('stats.crit_dmg');
  if (stat === 'artsIntensity') return t('stats.originium_arts_power');
  if (stat === 'ultimateEnergyGainEfficiency') return t('stats.ult_charge_eff');
  if (stat === 'skillCooldownReduction') return t('stats.link_cd_reduction');
  return t('timeline.panel.staggerDamage');
}

function sourceLabel(entry: OperatorPanelContributionReceipt): string {
  return resolveOperatorPanelContributionSourceLabel(entry, {
    operator: props.operator,
    weapons: props.weapons,
    locale: locale.value,
    translate: t,
  });
}

function sourceValue(entry: OperatorPanelContributionReceipt): string {
  if (
    entry.operation === 'percent' ||
    entry.stat === 'criticalRate' ||
    entry.stat === 'criticalDamage' ||
    entry.stat === 'ultimateEnergyGainEfficiency' ||
    entry.stat === 'skillCooldownReduction' ||
    entry.stat === 'staggerDamagePercent'
  ) {
    const prefix = entry.operation === 'percent' && entry.value >= 0 ? '+' : '';
    return `${prefix}${formatPercent(entry.value)}`;
  }
  const prefix = entry.operation === 'flat' && entry.value >= 0 ? '+' : '';
  return `${prefix}${formatNumber(entry.value)}`;
}

function sourcesFor(stat: OperatorPanelStat): readonly OperatorPanelContributionReceipt[] {
  return props.panel?.receipt.filter(entry => entry.stat === stat) ?? [];
}

function toggle(stat: OperatorPanelStat): void {
  const next = new Set(expanded.value);
  if (next.has(stat)) next.delete(stat);
  else next.add(stat);
  expanded.value = next;
}

const attributeRows = computed<readonly StatRow[]>(() =>
  ATTRIBUTE_KEYS.map(key => ({
    key,
    label: statLabel(key),
    value: formatNumber(props.panel?.attributes[key] ?? 0),
  })),
);

const statRows = computed<readonly StatRow[]>(() => {
  const panel = props.panel;
  if (panel === null) return [];
  return [
    { key: 'attack', label: statLabel('attack'), value: formatNumber(panel.attack) },
    { key: 'health', label: statLabel('health'), value: formatNumber(panel.health) },
    { key: 'defense', label: statLabel('defense'), value: formatNumber(panel.defense) },
    {
      key: 'criticalRate',
      label: statLabel('criticalRate'),
      value: formatPercent(panel.criticalRate),
    },
    {
      key: 'criticalDamage',
      label: statLabel('criticalDamage'),
      value: formatPercent(panel.criticalDamage),
    },
    {
      key: 'artsIntensity',
      label: statLabel('artsIntensity'),
      value: formatNumber(panel.artsIntensity),
    },
    {
      key: 'ultimateEnergyGainEfficiency',
      label: statLabel('ultimateEnergyGainEfficiency'),
      value: formatPercent(panel.ultimateEnergyGainEfficiency),
    },
    {
      key: 'skillCooldownReduction',
      label: statLabel('skillCooldownReduction'),
      value: formatPercent(panel.skillCooldownReduction),
    },
  ];
});
</script>

<template>
  <InputRegionBoundary label="OperatorPanelDialog" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      :title="t('statDetail.title', { name: operatorName })"
      width="420px"
      class="stat-detail-dialog next-panel-dialog"
      append-to-body
      @update:model-value="$emit('update:visible', $event)"
    >
      <div v-if="panel" class="panel-content">
        <section>
          <h3>{{ t('statDetail.attributes') }}</h3>
          <table>
            <tbody>
              <template v-for="row in attributeRows" :key="row.key">
                <tr class="summary-row" @click="toggle(row.key)">
                  <td>
                    <el-icon class="expand-icon" :class="{ open: expanded.has(row.key) }">
                      <ArrowRight />
                    </el-icon>
                    {{ row.label }}
                    <span v-if="operator?.mainAttribute === row.key" class="badge main">{{
                      t('statDetail.main')
                    }}</span>
                    <span v-if="operator?.secondaryAttribute === row.key" class="badge sub">{{
                      t('statDetail.sub')
                    }}</span>
                  </td>
                  <td>{{ row.value }}</td>
                </tr>
                <tr
                  v-for="(source, index) in expanded.has(row.key) ? sourcesFor(row.key) : []"
                  :key="`${row.key}:${index}`"
                  class="source-row"
                >
                  <td>{{ sourceLabel(source) }}</td>
                  <td>{{ sourceValue(source) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </section>

        <section>
          <h3>{{ t('statDetail.stats') }}</h3>
          <table>
            <tbody>
              <template v-for="row in statRows" :key="row.key">
                <tr class="summary-row" @click="toggle(row.key)">
                  <td>
                    <el-icon class="expand-icon" :class="{ open: expanded.has(row.key) }">
                      <ArrowRight />
                    </el-icon>
                    {{ row.label }}
                  </td>
                  <td>{{ row.value }}</td>
                </tr>
                <tr
                  v-for="(source, index) in expanded.has(row.key) ? sourcesFor(row.key) : []"
                  :key="`${row.key}:${index}`"
                  class="source-row"
                >
                  <td>{{ sourceLabel(source) }}</td>
                  <td>{{ sourceValue(source) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </section>
      </div>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.panel-content {
  display: grid;
  gap: 18px;
}

h3 {
  margin: 0 0 6px;
  color: var(--ea-fg-muted);
  font-size: 11px;
  font-weight: 700;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

td {
  height: 30px;
  border-bottom: 1px solid var(--ea-border-soft);
}

td:last-child {
  width: 84px;
  color: var(--ea-fg);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  text-align: right;
}

.summary-row {
  cursor: pointer;
}

.summary-row:hover {
  background: var(--ea-fill-soft);
}

.source-row td {
  height: 25px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.source-row td:first-child {
  padding-left: 28px;
}

.expand-icon {
  margin-right: 6px;
  color: var(--ea-icon-muted);
  font-size: 11px;
  transition: transform 0.12s ease;
}

.expand-icon.open {
  transform: rotate(90deg);
}

.badge {
  display: inline-block;
  margin-left: 5px;
  padding: 0 4px;
  border: 1px solid currentColor;
  font-size: 9px;
  line-height: 14px;
}

.badge.main {
  color: var(--ea-gold);
}

.badge.sub {
  color: #38bdf8;
}
</style>
