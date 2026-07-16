<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  visible: { type: Boolean, default: false },
  operatorStatus: { type: Object, default: null },
  operatorName: { type: String, default: '' },
});

const emit = defineEmits(['update:visible']);

const { t } = useI18n();

const atkOpen = ref(false);
const hpOpen = ref(false);

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

function onClose() {
  atkOpen.value = false;
  hpOpen.value = false;
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
          <tr
            v-for="key in ATTR_KEYS"
            :key="key"
            :class="{
              'is-main': key === attrKey(operatorStatus.mainAttributeName),
              'is-sub': key === attrKey(operatorStatus.secondaryAttributeName),
            }"
          >
            <td class="label-cell">
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
        </tbody>
      </table>

      <div class="section-label">{{ t('statDetail.stats') }}</div>
      <table class="stat-table">
        <tbody>
          <tr class="expandable-row" @click="atkOpen = !atkOpen">
            <td class="label-cell bold">
              ATK
              <span class="expand-icon">{{ atkOpen ? 'v' : '>' }}</span>
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
              HP
              <span class="expand-icon">{{ hpOpen ? 'v' : '>' }}</span>
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
          <tr>
            <td class="label-cell">{{ t('stats.crit_rate') }}</td>
            <td class="value-cell">{{ pct(operatorStatus.critRate) }}</td>
          </tr>
          <tr>
            <td class="label-cell">{{ t('stats.crit_dmg') }}</td>
            <td class="value-cell">{{ pct(operatorStatus.critDmg) }}</td>
          </tr>
          <tr>
            <td class="label-cell">{{ t('stats.originium_arts_power') }}</td>
            <td class="value-cell">{{ num(operatorStatus.artsIntensity) }}</td>
          </tr>
          <tr>
            <td class="label-cell">{{ t('stats.ult_charge_eff') }}</td>
            <td class="value-cell">
              {{ pct(1 + (Number(operatorStatus.ultimateGainEfficiency) || 0) / 100) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </el-dialog>
</template>

<style scoped>
.stat-detail-content {
  font-size: 13px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #aaa;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.stat-table tr:last-child {
  border-bottom: none;
}

.stat-table td {
  padding: 5px 4px;
}

.label-cell {
  color: #ddd;
}

.value-cell {
  text-align: right;
  font-family: monospace;
  color: #eee;
  white-space: nowrap;
}

.bold {
  font-weight: 600;
}

.dim {
  opacity: 0.65;
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

.expandable-row {
  cursor: pointer;
}

.expandable-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.expand-icon {
  font-size: 11px;
  margin-left: 4px;
  color: #888;
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
  border: 1px solid rgba(255, 193, 7, 0.5);
  color: #ffc107;
}

.sub-badge {
  border: 1px solid rgba(158, 158, 158, 0.5);
  color: #9e9e9e;
}

tr.is-main {
  background: rgba(255, 193, 7, 0.08);
}

tr.is-sub {
  background: rgba(158, 158, 158, 0.08);
}

.sub-row {
  border-bottom-color: rgba(255, 255, 255, 0.03) !important;
}
</style>
