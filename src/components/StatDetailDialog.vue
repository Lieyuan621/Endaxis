<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowRight } from '@element-plus/icons-vue';
import { STAT_SOURCE_BASE_LABEL } from '@/data/stats/computeStats';
import { resolveDamageBonusSourceLabel } from '@/utils/damageBonusSourceLabel';

const props = defineProps({
  visible: { type: Boolean, default: false },
  operatorStatus: { type: Object, default: null },
  operatorName: { type: String, default: '' },
});

const emit = defineEmits(['update:visible']);

const { t, te, locale } = useI18n();

const atkOpen = ref(false);
const hpOpen = ref(false);
const critRateOpen = ref(false);
const critDmgOpen = ref(false);
const artsOpen = ref(false);
const ultEffOpen = ref(false);
const comboCdOpen = ref(false);
const attrOpen = ref({
  strength: false,
  agility: false,
  intellect: false,
  will: false,
});

const ATTR_KEYS = ['strength', 'agility', 'intellect', 'will'];

function attrLabel(key) {
  return t(`stats.${key}`);
}

function pct(value) {
  return `${((Number(value) || 0) * 100).toFixed(1)}%`;
}

function num(value) {
  return `${Math.ceil(Number(value) || 0)}`;
}

function attrKey(value) {
  return String(value || '').toLowerCase();
}

function resolveSourceLabel(raw) {
  const label = String(raw || '').trim();
  if (!label || label === STAT_SOURCE_BASE_LABEL) return t('statDetail.baseSource');
  return resolveDamageBonusSourceLabel(label, t, te, locale.value) || label;
}

function formatAttributeSourceValue(src) {
  const value = Number(src.value) || 0;
  if (src.kind === 'percent') return pct(value);
  if (src.kind === 'external') return `×${value.toFixed(3)}`;
  if (src.kind === 'flat') return `+${num(value)}`;
  return num(value);
}

function toggleAttrOpen(key) {
  attrOpen.value[key] = !attrOpen.value[key];
}

function attributeSourcesFor(key) {
  return props.operatorStatus?.attributeSources?.[key] ?? [];
}

function hasAttributeSources(key) {
  return attributeSourcesFor(key).length > 0;
}

const baseAtkTotal = computed(() => {
  const status = props.operatorStatus;
  if (!status) return 0;
  return (Number(status.baseAtk?.operator) || 0) + (Number(status.baseAtk?.weapon) || 0);
});

const basicTotal = computed(() => {
  const status = props.operatorStatus;
  if (!status) return 0;
  return (
    baseAtkTotal.value * (1 + (Number(status.atkPercent) || 0)) + (Number(status.flatAtk) || 0)
  );
});

const attrContribs = computed(() => {
  const status = props.operatorStatus;
  if (!status) return [];
  const mainKey = attrKey(status.mainAttributeName);
  const subKey = attrKey(status.secondaryAttributeName);

  return ATTR_KEYS.map(key => {
    const coeff = Number(status.attrAtkCoeff?.[key]) || 0;
    const value = Number(status.attributes?.[key]) || 0;
    return {
      key,
      name: attrLabel(key),
      coeff,
      value,
      contrib: coeff * value,
      isMain: key === mainKey,
      isSub: key === subKey,
    };
  })
    .filter(row => row.coeff !== 0)
    .sort((a, b) => {
      const rank = row => (row.isMain ? 0 : row.isSub ? 1 : 2);
      return rank(a) - rank(b);
    });
});

const baseHpTotal = computed(() => {
  const status = props.operatorStatus;
  if (!status) return 0;
  return (Number(status.baseHp) || 0) + (Number(status.attributes?.strength) || 0) * 5;
});

/** Displayed combo CDR as (1 − Π(1 − pct/100)) × 100%. */
const comboCdReductionDisplay = computed(() => {
  const mult = Number(props.operatorStatus?.comboCdExternalMult);
  const factor = Number.isFinite(mult) && mult > 0 ? mult : 1;
  return (1 - factor) * 100;
});

const comboCdPercentSources = computed(
  () => props.operatorStatus?.comboCdReductionPercentSources ?? [],
);
const comboCdFlatSources = computed(() => props.operatorStatus?.comboCdReductionFlatSources ?? []);
const hasComboCdSources = computed(
  () => comboCdPercentSources.value.length > 0 || comboCdFlatSources.value.length > 0,
);

function onClose() {
  atkOpen.value = false;
  hpOpen.value = false;
  critRateOpen.value = false;
  critDmgOpen.value = false;
  artsOpen.value = false;
  ultEffOpen.value = false;
  comboCdOpen.value = false;
  attrOpen.value = { strength: false, agility: false, intellect: false, will: false };
  emit('update:visible', false);
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="t('statDetail.title', { name: operatorName })"
    width="420px"
    class="stat-detail-dialog"
    :close-on-click-modal="true"
    append-to-body
    @update:model-value="onClose"
  >
    <div v-if="operatorStatus" class="stat-detail-content">
      <div class="section-label">{{ t('statDetail.attributes') }}</div>
      <table class="stat-table">
        <tbody>
          <template v-for="key in ATTR_KEYS" :key="key">
            <tr
              class="expandable-row"
              :class="{
                'is-main': key === attrKey(operatorStatus.mainAttributeName),
                'is-sub': key === attrKey(operatorStatus.secondaryAttributeName),
                'is-disabled': !hasAttributeSources(key),
              }"
              @click="hasAttributeSources(key) ? toggleAttrOpen(key) : null"
            >
              <td class="label-cell">
                <el-icon
                  v-if="hasAttributeSources(key)"
                  class="expand-icon"
                  :class="{ 'is-open': attrOpen[key] }"
                  ><ArrowRight
                /></el-icon>
                {{ attrLabel(key) }}
                <span
                  v-if="key === attrKey(operatorStatus.mainAttributeName)"
                  class="attr-badge main-badge"
                >
                  {{ t('statDetail.main') }}
                </span>
                <span
                  v-if="key === attrKey(operatorStatus.secondaryAttributeName)"
                  class="attr-badge sub-badge"
                >
                  {{ t('statDetail.sub') }}
                </span>
              </td>
              <td class="value-cell">{{ num(operatorStatus.attributes?.[key]) }}</td>
            </tr>
            <template v-if="attrOpen[key]">
              <tr
                v-for="(src, idx) in attributeSourcesFor(key)"
                :key="`${key}-src-${idx}`"
                class="sub-row dim"
                :class="{
                  'is-main': key === attrKey(operatorStatus.mainAttributeName),
                  'is-sub': key === attrKey(operatorStatus.secondaryAttributeName),
                }"
              >
                <td class="label-cell indent-1">
                  <template v-if="src.kind === 'base'">{{ resolveSourceLabel(src.label) }}</template>
                  <template v-else>{{
                    t('statDetail.fromSource', { name: resolveSourceLabel(src.label) })
                  }}</template>
                </td>
                <td class="value-cell">{{ formatAttributeSourceValue(src) }}</td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>

      <div class="section-label">{{ t('statDetail.stats') }}</div>
      <table class="stat-table">
        <tbody>
          <tr class="expandable-row" @click="atkOpen = !atkOpen">
            <td class="label-cell bold">
              <el-icon class="expand-icon" :class="{ 'is-open': atkOpen }"><ArrowRight /></el-icon>
              {{ t('stats.attack') }}
            </td>
            <td class="value-cell bold">{{ num(operatorStatus.attack) }}</td>
          </tr>
          <template v-if="atkOpen">
            <tr class="sub-row">
              <td class="label-cell indent-1">{{ t('statDetail.basicTotal') }}</td>
              <td class="value-cell">{{ num(basicTotal) }}</td>
            </tr>
            <tr class="sub-row">
              <td class="label-cell indent-2">{{ t('statDetail.baseAtk') }}</td>
              <td class="value-cell">{{ num(baseAtkTotal) }}</td>
            </tr>
            <tr class="sub-row dim">
              <td class="label-cell indent-3">{{ t('statDetail.operatorAtk') }}</td>
              <td class="value-cell">{{ num(operatorStatus.baseAtk?.operator) }}</td>
            </tr>
            <tr class="sub-row dim">
              <td class="label-cell indent-3">{{ t('statDetail.weaponAtk') }}</td>
              <td class="value-cell">{{ num(operatorStatus.baseAtk?.weapon) }}</td>
            </tr>
            <tr class="sub-row">
              <td class="label-cell indent-2">{{ t('statDetail.atkBonus') }}</td>
              <td class="value-cell">
                +{{
                  num(
                    baseAtkTotal * (Number(operatorStatus.atkPercent) || 0) +
                      (Number(operatorStatus.flatAtk) || 0),
                  )
                }}
              </td>
            </tr>
            <tr class="sub-row dim">
              <td class="label-cell indent-3">{{ t('statDetail.flatAtk') }}</td>
              <td class="value-cell">+{{ num(operatorStatus.flatAtk) }}</td>
            </tr>
            <tr class="sub-row dim">
              <td class="label-cell indent-3">{{ t('statDetail.percentageAtk') }}</td>
              <td class="value-cell">{{ pct(operatorStatus.atkPercent) }}</td>
            </tr>
            <tr
              v-for="(src, idx) in operatorStatus.atkPercentSources || []"
              :key="`atk-pct-${idx}`"
              class="sub-row dim"
            >
              <td class="label-cell indent-4">
                {{ t('statDetail.fromSource', { name: resolveSourceLabel(src.label) }) }}
              </td>
              <td class="value-cell">{{ pct(src.value) }}</td>
            </tr>
            <tr class="sub-row">
              <td class="label-cell indent-1">{{ t('statDetail.attributeBonus') }}</td>
              <td class="value-cell">
                +{{ (attrContribs.reduce((sum, row) => sum + row.contrib, 0) * 100).toFixed(1) }}%
              </td>
            </tr>
            <tr
              v-for="row in attrContribs"
              :key="row.key"
              class="sub-row dim"
              :class="{ 'is-main': row.isMain, 'is-sub': row.isSub }"
            >
              <td class="label-cell indent-2">
                {{ t('statDetail.fromSource', { name: row.name }) }}
              </td>
              <td class="value-cell">+{{ (row.contrib * 100).toFixed(1) }}%</td>
            </tr>
          </template>

          <tr class="expandable-row" @click="hpOpen = !hpOpen">
            <td class="label-cell bold">
              <el-icon class="expand-icon" :class="{ 'is-open': hpOpen }"><ArrowRight /></el-icon>
              {{ t('stats.hp') }}
            </td>
            <td class="value-cell bold">{{ num(operatorStatus.health) }}</td>
          </tr>
          <template v-if="hpOpen">
            <tr class="sub-row">
              <td class="label-cell indent-1">{{ t('statDetail.baseHp') }}</td>
              <td class="value-cell">{{ num(baseHpTotal) }}</td>
            </tr>
            <tr class="sub-row dim">
              <td class="label-cell indent-2">{{ t('statDetail.operatorHp') }}</td>
              <td class="value-cell">{{ num(operatorStatus.baseHp) }}</td>
            </tr>
            <tr class="sub-row dim">
              <td class="label-cell indent-2">{{ t('statDetail.hpFromStrength') }}</td>
              <td class="value-cell">
                {{ num((Number(operatorStatus.attributes?.strength) || 0) * 5) }}
              </td>
            </tr>
            <tr
              v-if="operatorStatus.hpPercent !== 0 || operatorStatus.flatHp !== 0"
              class="sub-row dim"
            >
              <td class="label-cell indent-1">{{ t('statDetail.otherHp') }}</td>
              <td class="value-cell">
                <template v-if="operatorStatus.hpPercent !== 0"
                  >{{ t('statDetail.hpPercent') }} {{ pct(operatorStatus.hpPercent) }}</template
                >
                <template v-if="operatorStatus.hpPercent !== 0 && operatorStatus.flatHp !== 0">
                  +
                </template>
                <template v-if="operatorStatus.flatHp !== 0"
                  >{{ t('statDetail.flatHp') }} {{ num(operatorStatus.flatHp) }}</template
                >
              </td>
            </tr>
          </template>

          <tr>
            <td class="label-cell bold">{{ t('statDetail.defense') }}</td>
            <td class="value-cell bold">{{ num(operatorStatus.defense) }}</td>
          </tr>

          <tr class="expandable-row" @click="critRateOpen = !critRateOpen">
            <td class="label-cell">
              <el-icon class="expand-icon" :class="{ 'is-open': critRateOpen }"><ArrowRight /></el-icon>
              {{ t('stats.crit_rate') }}
            </td>
            <td class="value-cell">{{ pct(operatorStatus.critRate) }}</td>
          </tr>
          <template v-if="critRateOpen">
            <tr
              v-for="(src, idx) in operatorStatus.critRateSources || []"
              :key="`crit-rate-${idx}`"
              class="sub-row dim"
            >
              <td class="label-cell indent-1">
                {{ t('statDetail.fromSource', { name: resolveSourceLabel(src.label) }) }}
              </td>
              <td class="value-cell">{{ pct(src.value) }}</td>
            </tr>
          </template>

          <tr class="expandable-row" @click="critDmgOpen = !critDmgOpen">
            <td class="label-cell">
              <el-icon class="expand-icon" :class="{ 'is-open': critDmgOpen }"><ArrowRight /></el-icon>
              {{ t('stats.crit_dmg') }}
            </td>
            <td class="value-cell">{{ pct(operatorStatus.critDmg) }}</td>
          </tr>
          <template v-if="critDmgOpen">
            <tr
              v-for="(src, idx) in operatorStatus.critDmgSources || []"
              :key="`crit-dmg-${idx}`"
              class="sub-row dim"
            >
              <td class="label-cell indent-1">
                {{ t('statDetail.fromSource', { name: resolveSourceLabel(src.label) }) }}
              </td>
              <td class="value-cell">{{ pct(src.value) }}</td>
            </tr>
          </template>

          <tr class="expandable-row" @click="artsOpen = !artsOpen">
            <td class="label-cell">
              <el-icon class="expand-icon" :class="{ 'is-open': artsOpen }"><ArrowRight /></el-icon>
              {{ t('stats.originium_arts_power') }}
            </td>
            <td class="value-cell">{{ num(operatorStatus.artsIntensity) }}</td>
          </tr>
          <template v-if="artsOpen">
            <tr
              v-for="(src, idx) in operatorStatus.artsIntensitySources || []"
              :key="`arts-${idx}`"
              class="sub-row dim"
            >
              <td class="label-cell indent-1">
                {{ t('statDetail.fromSource', { name: resolveSourceLabel(src.label) }) }}
              </td>
              <td class="value-cell">+{{ Number(src.value).toFixed(1) }}</td>
            </tr>
            <tr
              v-if="!(operatorStatus.artsIntensitySources || []).length"
              class="sub-row dim"
            >
              <td class="label-cell indent-1">{{ t('statDetail.noSources') }}</td>
              <td class="value-cell">—</td>
            </tr>
          </template>

          <tr class="expandable-row" @click="ultEffOpen = !ultEffOpen">
            <td class="label-cell">
              <el-icon class="expand-icon" :class="{ 'is-open': ultEffOpen }"><ArrowRight /></el-icon>
              {{ t('stats.ult_charge_eff') }}
            </td>
            <td class="value-cell">
              {{ pct(1 + (Number(operatorStatus.ultimateGainEfficiency) || 0) / 100) }}
            </td>
          </tr>
          <template v-if="ultEffOpen">
            <tr
              v-for="(src, idx) in operatorStatus.ultimateGainEfficiencySources || []"
              :key="`ult-eff-${idx}`"
              class="sub-row dim"
            >
              <td class="label-cell indent-1">
                {{ t('statDetail.fromSource', { name: resolveSourceLabel(src.label) }) }}
              </td>
              <td class="value-cell">+{{ Number(src.value).toFixed(1) }}%</td>
            </tr>
            <tr
              v-if="!(operatorStatus.ultimateGainEfficiencySources || []).length"
              class="sub-row dim"
            >
              <td class="label-cell indent-1">{{ t('statDetail.noSources') }}</td>
              <td class="value-cell">—</td>
            </tr>
          </template>

          <tr class="expandable-row" @click="comboCdOpen = !comboCdOpen">
            <td class="label-cell">
              <el-icon class="expand-icon" :class="{ 'is-open': comboCdOpen }"><ArrowRight /></el-icon>
              {{ t('statDetail.comboCdReduction') }}
            </td>
            <td class="value-cell">{{ comboCdReductionDisplay.toFixed(1) }}%</td>
          </tr>
          <template v-if="comboCdOpen">
            <tr
              v-for="(src, idx) in comboCdPercentSources"
              :key="`combo-cd-pct-${idx}`"
              class="sub-row dim"
            >
              <td class="label-cell indent-1">
                {{ t('statDetail.fromSource', { name: resolveSourceLabel(src.label) }) }}
              </td>
              <td class="value-cell">{{ Number(src.value).toFixed(1) }}%</td>
            </tr>
            <tr
              v-for="(src, idx) in comboCdFlatSources"
              :key="`combo-cd-flat-${idx}`"
              class="sub-row dim"
            >
              <td class="label-cell indent-1">
                {{ t('statDetail.fromSource', { name: resolveSourceLabel(src.label) }) }}
              </td>
              <td class="value-cell">−{{ Number(src.value).toFixed(1) }}s</td>
            </tr>
            <tr v-if="!hasComboCdSources" class="sub-row dim">
              <td class="label-cell indent-1">{{ t('statDetail.noSources') }}</td>
              <td class="value-cell">—</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </el-dialog>
</template>

<style scoped>
.stat-detail-content {
  font-size: 13px;
  color: var(--ea-fg, #f0f0f0);
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ea-fg-muted, #aaa);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 12px 0 6px;
}

.section-label:first-child {
  margin-top: 0;
}

.stat-table {
  width: 100%;
  border-collapse: collapse;
}

.stat-table tr {
  border-bottom: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.06));
}

.stat-table tr:last-child {
  border-bottom: none;
}

.stat-table td {
  padding: 5px 4px;
}

.label-cell {
  color: var(--ea-fg-secondary, #ddd);
}

.value-cell {
  text-align: right;
  font-family: monospace;
  color: var(--ea-fg, #eee);
  white-space: nowrap;
}

.bold {
  font-weight: 600;
}

.dim {
  opacity: 0.72;
  font-size: 12px;
}

.indent-1 {
  padding-left: 16px !important;
}

.indent-2 {
  padding-left: 28px !important;
}

.indent-3 {
  padding-left: 40px !important;
}

.indent-4 {
  padding-left: 52px !important;
}

.expandable-row {
  cursor: pointer;
}

.expandable-row:hover {
  background: var(--ea-hover-fill, rgba(255, 255, 255, 0.05));
}

.expandable-row.is-disabled {
  cursor: default;
}

.expandable-row.is-disabled:hover {
  background: transparent;
}

.expand-icon {
  margin-right: 4px;
  vertical-align: -2px;
  color: var(--ea-fg-muted, #888);
  font-size: 12px;
  transition: transform 0.18s ease, color 0.18s ease;
}

.expand-icon.is-open {
  transform: rotate(90deg);
  color: var(--ea-fg-secondary, #bbb);
}

.expandable-row:hover .expand-icon {
  color: var(--ea-fg-secondary, #bbb);
}

.attr-badge {
  display: inline-block;
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  margin-left: 6px;
  vertical-align: middle;
  line-height: 16px;
}

.main-badge {
  border: 1px solid color-mix(in srgb, var(--ea-gold, #ffc107) 50%, transparent);
  color: var(--ea-gold, #ffc107);
}

.sub-badge {
  border: 1px solid var(--ea-border-strong, rgba(158, 158, 158, 0.5));
  color: var(--ea-fg-muted, #9e9e9e);
}

tr.is-main {
  background: color-mix(in srgb, var(--ea-gold, #ffc107) 10%, transparent);
}

tr.is-sub {
  background: var(--ea-fill-soft, rgba(158, 158, 158, 0.08));
}

.sub-row {
  border-bottom-color: var(--ea-border-soft, rgba(255, 255, 255, 0.03)) !important;
}
</style>
