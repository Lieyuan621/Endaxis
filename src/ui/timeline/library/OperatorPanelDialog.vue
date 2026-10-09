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
import {
  MAIN_ATTRIBUTE_ATTACK_FACTOR,
  SECONDARY_ATTRIBUTE_ATTACK_FACTOR,
} from '../../../core/game-data/battleConstants';
import { resolveOperatorPanelContributionSourceLabel } from './operatorPanelContributionPresentation';
import type { PublishedBuffSource } from '../results/publishedBuffSource';

const props = defineProps<{
  visible: boolean;
  panel: ResolvedOperatorPanel | null;
  operator: OperatorDefinition | null;
  operatorName: string;
  weapons?: ReadonlyMap<string, PublishedBuffSource>;
}>();

defineEmits<{ 'update:visible': [visible: boolean] }>();
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

function attributeSourceLabel(entry: OperatorPanelContributionReceipt): string {
  return entry.operation === 'base'
    ? sourceLabel(entry)
    : t('statDetail.fromSource', { name: sourceLabel(entry) });
}

function statSourceLabel(entry: OperatorPanelContributionReceipt): string {
  return t('statDetail.fromSource', { name: sourceLabel(entry) });
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

function hasSources(stat: OperatorPanelStat): boolean {
  return (
    (stat === 'attack' && props.panel?.attackDetail !== undefined) ||
    (stat === 'health' && props.panel?.healthDetail !== undefined) ||
    (props.panel?.receipt.some(entry => entry.stat === stat) ?? false)
  );
}

function toggle(stat: OperatorPanelStat): void {
  if (!hasSources(stat)) return;
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

const attackBreakdown = computed(() => {
  const panel = props.panel;
  const detail = panel?.attackDetail;
  if (panel === null || detail === undefined) return null;
  const baseAttackTotal = detail.operatorBaseAttack + detail.weaponBaseAttack;
  const attributeContributions = ATTRIBUTE_KEYS.map(key => {
    const isMain = key === panel.mainAttribute;
    const isSub = key === panel.secondaryAttribute;
    const coefficient =
      (isMain ? MAIN_ATTRIBUTE_ATTACK_FACTOR : 0) + (isSub ? SECONDARY_ATTRIBUTE_ATTACK_FACTOR : 0);
    return {
      key,
      isMain,
      isSub,
      contribution: Math.floor(panel.attributes[key]) * coefficient,
    };
  })
    .filter(row => row.isMain || row.isSub)
    .sort((left, right) => Number(right.isMain) - Number(left.isMain));
  return {
    ...detail,
    baseAttackTotal,
    basicTotal: panel.attackBeforeAttributeScalar,
    attackBonus: baseAttackTotal * detail.attackPercent + detail.flatAttack,
    attributeContributions,
    attributeBonus: attributeContributions.reduce((sum, row) => sum + row.contribution, 0),
  };
});

const attackFlatSources = computed(() =>
  sourcesFor('attack').filter(entry => entry.operation === 'flat'),
);
const attackPercentSources = computed(() =>
  sourcesFor('attack').filter(entry => entry.operation === 'percent'),
);
const healthBreakdown = computed(() => {
  const panel = props.panel;
  const detail = panel?.healthDetail;
  // 升级与装备的生命修正分阶段应用；“其他”只表示最终净差，不把原始百分比相加。
  return panel === null || detail === undefined
    ? null
    : { ...detail, otherHealth: panel.health - Math.floor(detail.baseHealthTotal) };
});
const healthOtherSources = computed(() =>
  sourcesFor('health').filter(entry => entry.operation !== 'base'),
);

function ceilNumber(value: number): string {
  return new Intl.NumberFormat(locale.value).format(Math.ceil(value));
}

function signedNumber(value: number): string {
  return `${value >= 0 ? '+' : ''}${ceilNumber(value)}`;
}

function signedPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
}

function isPrimaryStat(stat: OperatorPanelStat): boolean {
  return stat === 'attack' || stat === 'health' || stat === 'defense';
}

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
      append-to-body
      @update:model-value="$emit('update:visible', $event)"
    >
      <div v-if="panel" class="ea-detail-breakdown">
        <section>
          <div class="section-label">{{ t('statDetail.attributes') }}</div>
          <table class="stat-table">
            <tbody>
              <template v-for="row in attributeRows" :key="row.key">
                <tr
                  class="expandable-row"
                  :class="{
                    'is-disabled': !hasSources(row.key),
                    'is-main': operator?.mainAttribute === row.key,
                    'is-sub': operator?.secondaryAttribute === row.key,
                  }"
                  @click="toggle(row.key)"
                >
                  <td class="label-cell">
                    <el-icon
                      v-if="hasSources(row.key)"
                      class="expand-icon"
                      :class="{ 'is-open': expanded.has(row.key) }"
                    >
                      <ArrowRight />
                    </el-icon>
                    {{ row.label }}
                    <span
                      v-if="operator?.mainAttribute === row.key"
                      class="attr-badge main-badge"
                      >{{ t('statDetail.main') }}</span
                    >
                    <span
                      v-if="operator?.secondaryAttribute === row.key"
                      class="attr-badge sub-badge"
                      >{{ t('statDetail.sub') }}</span
                    >
                  </td>
                  <td class="value-cell">{{ row.value }}</td>
                </tr>
                <tr
                  v-for="(source, index) in expanded.has(row.key) ? sourcesFor(row.key) : []"
                  :key="`${row.key}:${index}`"
                  class="sub-row dim"
                  :class="{
                    'is-main': operator?.mainAttribute === row.key,
                    'is-sub': operator?.secondaryAttribute === row.key,
                  }"
                >
                  <td class="label-cell indent-1 source-label">
                    {{ attributeSourceLabel(source) }}
                  </td>
                  <td class="value-cell">{{ sourceValue(source) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </section>

        <section>
          <div class="section-label">{{ t('statDetail.stats') }}</div>
          <table class="stat-table">
            <tbody>
              <template v-for="row in statRows" :key="row.key">
                <tr
                  class="expandable-row"
                  :class="{ 'is-disabled': !hasSources(row.key) }"
                  @click="toggle(row.key)"
                >
                  <td class="label-cell" :class="{ bold: isPrimaryStat(row.key) }">
                    <el-icon
                      v-if="hasSources(row.key)"
                      class="expand-icon"
                      :class="{ 'is-open': expanded.has(row.key) }"
                    >
                      <ArrowRight />
                    </el-icon>
                    {{ row.label }}
                  </td>
                  <td class="value-cell" :class="{ bold: isPrimaryStat(row.key) }">
                    {{ row.value }}
                  </td>
                </tr>
                <template v-if="row.key === 'attack' && expanded.has(row.key) && attackBreakdown">
                  <tr class="sub-row">
                    <td class="label-cell indent-1">{{ t('statDetail.basicTotal') }}</td>
                    <td class="value-cell">{{ ceilNumber(attackBreakdown.basicTotal) }}</td>
                  </tr>
                  <tr class="sub-row">
                    <td class="label-cell indent-2">{{ t('statDetail.baseAtk') }}</td>
                    <td class="value-cell">{{ ceilNumber(attackBreakdown.baseAttackTotal) }}</td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-3">{{ t('statDetail.operatorAtk') }}</td>
                    <td class="value-cell">{{ ceilNumber(attackBreakdown.operatorBaseAttack) }}</td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-3">{{ t('statDetail.weaponAtk') }}</td>
                    <td class="value-cell">{{ ceilNumber(attackBreakdown.weaponBaseAttack) }}</td>
                  </tr>
                  <tr class="sub-row">
                    <td class="label-cell indent-2">{{ t('statDetail.atkBonus') }}</td>
                    <td class="value-cell">{{ signedNumber(attackBreakdown.attackBonus) }}</td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-3">{{ t('statDetail.flatAtk') }}</td>
                    <td class="value-cell">{{ signedNumber(attackBreakdown.flatAttack) }}</td>
                  </tr>
                  <tr
                    v-for="(source, index) in attackFlatSources"
                    :key="`attack-flat:${index}`"
                    class="sub-row dim"
                  >
                    <td class="label-cell indent-4 source-label">
                      {{ statSourceLabel(source) }}
                    </td>
                    <td class="value-cell">{{ sourceValue(source) }}</td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-3">{{ t('statDetail.percentageAtk') }}</td>
                    <td class="value-cell">{{ formatPercent(attackBreakdown.attackPercent) }}</td>
                  </tr>
                  <tr
                    v-for="(source, index) in attackPercentSources"
                    :key="`attack-percent:${index}`"
                    class="sub-row dim"
                  >
                    <td class="label-cell indent-4 source-label">
                      {{ statSourceLabel(source) }}
                    </td>
                    <td class="value-cell">{{ sourceValue(source) }}</td>
                  </tr>
                  <tr class="sub-row">
                    <td class="label-cell indent-1">{{ t('statDetail.attributeBonus') }}</td>
                    <td class="value-cell">{{ signedPercent(attackBreakdown.attributeBonus) }}</td>
                  </tr>
                  <tr
                    v-for="attribute in attackBreakdown.attributeContributions"
                    :key="attribute.key"
                    class="sub-row dim"
                    :class="{ 'is-main': attribute.isMain, 'is-sub': attribute.isSub }"
                  >
                    <td class="label-cell indent-2">
                      {{ t('statDetail.fromSource', { name: statLabel(attribute.key) }) }}
                    </td>
                    <td class="value-cell">{{ signedPercent(attribute.contribution) }}</td>
                  </tr>
                </template>
                <template v-if="row.key === 'health' && expanded.has(row.key) && healthBreakdown">
                  <tr class="sub-row">
                    <td class="label-cell indent-1">{{ t('statDetail.baseHp') }}</td>
                    <td class="value-cell">{{ ceilNumber(healthBreakdown.baseHealthTotal) }}</td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-2">{{ t('statDetail.operatorHp') }}</td>
                    <td class="value-cell">{{ ceilNumber(healthBreakdown.operatorBaseHealth) }}</td>
                  </tr>
                  <tr class="sub-row dim">
                    <td class="label-cell indent-2">{{ t('statDetail.hpFromStrength') }}</td>
                    <td class="value-cell">{{ ceilNumber(healthBreakdown.strengthHealth) }}</td>
                  </tr>
                  <tr
                    v-if="healthBreakdown.otherHealth !== 0 || healthOtherSources.length > 0"
                    class="sub-row"
                  >
                    <td class="label-cell indent-1">{{ t('statDetail.otherHp') }}</td>
                    <td class="value-cell">{{ signedNumber(healthBreakdown.otherHealth) }}</td>
                  </tr>
                  <tr
                    v-for="(source, index) in healthOtherSources"
                    :key="`health-other:${index}`"
                    class="sub-row dim"
                  >
                    <td class="label-cell indent-2 source-label">{{ statSourceLabel(source) }}</td>
                    <td class="value-cell">{{ sourceValue(source) }}</td>
                  </tr>
                </template>
                <tr
                  v-for="(source, index) in expanded.has(row.key) &&
                  (row.key !== 'attack' || attackBreakdown === null) &&
                  (row.key !== 'health' || healthBreakdown === null)
                    ? sourcesFor(row.key)
                    : []"
                  :key="`${row.key}:${index}`"
                  class="sub-row dim"
                >
                  <td class="label-cell indent-1 source-label">{{ statSourceLabel(source) }}</td>
                  <td class="value-cell">{{ sourceValue(source) }}</td>
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
.ea-detail-breakdown section + section {
  margin-top: 12px;
}

.source-label {
  overflow-wrap: anywhere;
}

tr.is-main {
  background: color-mix(in srgb, var(--ea-gold) 10%, transparent);
}

tr.is-sub {
  background: var(--ea-fill-soft);
}

.attr-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 16px;
  vertical-align: middle;
}

.main-badge {
  border: 1px solid color-mix(in srgb, var(--ea-gold) 50%, transparent);
  color: var(--ea-gold);
}

.sub-badge {
  border: 1px solid var(--ea-border-strong);
  color: var(--ea-fg-muted);
}
</style>
