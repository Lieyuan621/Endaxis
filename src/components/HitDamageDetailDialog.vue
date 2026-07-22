<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getGameElementName } from '@/data/gameText';
import { translateEffectName } from '@/editor/hits/statusOptions';
import { resolveDamageBonusSourceLabel } from '@/utils/damageBonusSourceLabel';
import { useTimelineStore } from '@/stores/timelineStore';

const props = defineProps({
  visible: { type: Boolean, default: false },
  breakdown: { type: Object, default: null },
  hitData: { type: Object, default: null },
});

const emit = defineEmits(['update:visible']);

const { t, te, locale } = useI18n();
const store = useTimelineStore();

const pct = value => `${((Number(value) || 0) * 100).toFixed(1)}%`;
const mult = value => `x${(Number(value) || 0).toFixed(3)}`;
const num = value => Math.floor(Number(value) || 0).toLocaleString();

function tr(key, fallback) {
  const value = t(key);
  return value === key ? fallback : value;
}

function humanize(value) {
  return String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function skillTypeLabel(value) {
  const map = {
    basicAttack: 'skillType.attack',
    finalStrike: 'skillType.attack',
    dive: 'skillType.dive',
    battleSkill: 'skillType.skill',
    comboSkill: 'skillType.link',
    ultimate: 'skillType.ultimate',
    finisher: 'skillType.execution',
  };
  return value ? tr(map[value] || `skillType.${value}`, humanize(value)) : '';
}

function reactionLabel(value) {
  return translateEffectName(t, te, value);
}

const canForceCrit = computed(
  () =>
    props.hitData?._actionInstanceId != null &&
    props.hitData?._hitIndex != null &&
    !!props.breakdown &&
    props.breakdown.critDmg !== 0 &&
    props.breakdown.critMult !== 1,
);

const isForcedCrit = computed(() =>
  store.isHitForcedCrit(props.hitData?._actionInstanceId, props.hitData?._hitIndex),
);

const headlineDamage = computed(() => {
  if (!props.breakdown) return 0;
  return isForcedCrit.value ? props.breakdown.critDamage : props.breakdown.expectedDamage;
});

function toggleForcedCrit() {
  store.toggleHitForcedCrit(props.hitData?._actionInstanceId, props.hitData?._hitIndex);
}

const displayMultiplier = computed(() => {
  if (!props.breakdown) return 0;
  const scale = props.hitData?._critRateScale;
  if (scale && scale > 0) return props.breakdown.multiplier / scale;
  return props.breakdown.multiplier;
});

const displayBase = computed(() => {
  if (!props.breakdown) return 0;
  const scale = props.hitData?._critRateScale;
  if (scale && scale > 0) return props.breakdown.base / scale;
  return props.breakdown.base;
});

const contextRows = computed(() => {
  if (!props.breakdown) return [];
  const rows = [];
  if (props.breakdown.reactionType) {
    rows.push({
      label: t('hitDetail.reactionType'),
      value: reactionLabel(props.breakdown.reactionType),
    });
  }
  if (props.breakdown.skillType) {
    rows.push({
      label: t('hitDetail.skillType'),
      value: skillTypeLabel(props.breakdown.skillType),
    });
  }
  if (props.breakdown.element) {
    rows.push({
      label: t('hitDetail.element'),
      value: getGameElementName(props.breakdown.element, locale.value),
    });
  }
  if (
    props.hitData?.triggeredBy &&
    !props.breakdown.isReaction &&
    !String(props.hitData.triggeredBy).startsWith('dot:')
  ) {
    rows.push({
      label: t('hitDetail.triggeredBy'),
      value: props.hitData.triggeredBy,
    });
  }
  return rows;
});

const multiplierRows = computed(() => {
  if (!props.breakdown) return [];
  const b = props.breakdown;
  const rows = [];

  if (props.hitData?._critRateScale != null) {
    rows.push({
      label: t('hitDetail.critRateScale'),
      detail: pct(props.hitData._critRateScale),
      value: mult(props.hitData._critRateScale),
      tooltip: t('hitDetail.critRateScaleTooltip'),
    });
  }
  if (b.dmgBonusMult !== 1 || b.dmgBonusExternalMult !== 1 || (b.dmgBonusSources?.length ?? 0) > 0) {
    const sourceLines = (b.dmgBonusSources || []).map(src => {
      const name = resolveDamageBonusSourceLabel(src.label, t, te, locale.value);
      const signed = src.external
        ? `×${(1 + (Number(src.value) || 0)).toFixed(3)}`
        : `+${pct(src.value)}`;
      return `${name} ${signed}`;
    });
    rows.push({
      label: t('hitDetail.dmgBonus'),
      detail:
        b.dmgBonusExternalMult !== 1
          ? `+${pct(b.dmgBonus)} · ×${(Number(b.dmgBonusExternalMult) || 1).toFixed(3)}`
          : `+${pct(b.dmgBonus)}`,
      value: mult(b.dmgBonusMult * (b.dmgBonusExternalMult ?? 1)),
      tooltip: sourceLines.length ? sourceLines.join('\n') : undefined,
    });
  }
  if (b.critMult !== 1) {
    rows.push({
      label: t('hitDetail.critMult'),
      detail: `${pct(b.critRate)} x ${pct(b.critDmg)}`,
      value: mult(b.critMult),
    });
  }
  if (b.ampMult !== 1) {
    const ampLines = (b.ampBonusSources || []).map(src => {
      const name = resolveDamageBonusSourceLabel(src.label, t, te, locale.value);
      return `${name} +${pct(src.value)}`;
    });
    rows.push({
      label: t('hitDetail.ampBonus'),
      detail: `+${pct(b.ampBonus)}`,
      value: mult(b.ampMult),
      tooltip: ampLines.length ? ampLines.join('\n') : undefined,
    });
  }
  if (b.directMultiplier !== 1) {
    rows.push({ label: t('hitDetail.directMult'), detail: '', value: mult(b.directMultiplier) });
  }
  if (b.susceptMult !== 1) {
    const susceptLines = [
      ...(b.susceptibilitySources || []).map(src => {
        const name = resolveDamageBonusSourceLabel(src.label, t, te, locale.value);
        return `${name} +${pct(src.value)}`;
      }),
      ...(b.susceptibilityAmplifySources || []).map(src => {
        const name = resolveDamageBonusSourceLabel(src.label, t, te, locale.value);
        return `${name} ×${(1 + (Number(src.value) || 0)).toFixed(3)}`;
      }),
    ];
    rows.push({
      label: t('hitDetail.susceptibility'),
      detail: `+${pct(b.susceptibility)}`,
      value: mult(b.susceptMult),
      tooltip: susceptLines.length ? susceptLines.join('\n') : undefined,
    });
  }
  if (b.dmgTakenMult !== 1) {
    const dmgTakenLines = (b.increasedDmgTakenSources || []).map(src => {
      const name = resolveDamageBonusSourceLabel(src.label, t, te, locale.value);
      return `${name} +${pct(src.value)}`;
    });
    rows.push({
      label: t('hitDetail.dmgTaken'),
      detail: `+${pct(b.increasedDmgTaken)}`,
      value: mult(b.dmgTakenMult),
      tooltip: dmgTakenLines.length ? dmgTakenLines.join('\n') : undefined,
    });
  }
  if (b.linkMult !== 1) {
    rows.push({
      label: t('hitDetail.link'),
      detail: t('hitDetail.linkDetail', { stacks: b.linkStacks }),
      value: mult(b.linkMult),
    });
  }
  rows.push({
    label: t('hitDetail.defMult'),
    detail: t('hitDetail.defDetail', { def: Math.floor(Number(b.enemyDef) || 0) }),
    value: mult(b.defMult),
  });
  if (b.resMult !== 1) {
    const resLines = [
      ...(b.resistanceIgnoreSources || []).map(src => {
        const name = resolveDamageBonusSourceLabel(src.label, t, te, locale.value);
        return `${name} −${pct(src.value)}`;
      }),
      ...(b.resistanceShredSources || []).map(src => {
        const name = resolveDamageBonusSourceLabel(src.label, t, te, locale.value);
        return `${name} −${pct(src.value)}`;
      }),
    ];
    rows.push({
      label: t('hitDetail.resMult'),
      detail: `${pct(b.enemyResistance)} - ${pct(b.resistanceIgnore)} - ${pct(b.resistanceShred)}`,
      value: mult(b.resMult),
      tooltip: resLines.length ? resLines.join('\n') : undefined,
    });
  }
  if (b.staggerMult != null && b.staggerMult !== 1) {
    rows.push({ label: t('hitDetail.staggerMult'), detail: '', value: mult(b.staggerMult) });
  }
  if (b.finisherMult != null && b.finisherMult !== 1) {
    rows.push({ label: t('hitDetail.finisherMult'), detail: '', value: mult(b.finisherMult) });
  }
  if (b.isReaction) {
    if (b.levelCoefficient != null && b.levelCoefficient !== 1) {
      rows.push({
        label: t('hitDetail.levelCoeff'),
        detail: t('hitDetail.levelCoeffDetail', { level: b.operatorLevel }),
        value: mult(b.levelCoefficient),
      });
    }
    if (b.artsIntensityMult != null && b.artsIntensityMult !== 1) {
      rows.push({
        label: t('hitDetail.artsIntensity'),
        detail: t('hitDetail.artsIntensityDetail', { value: b.artsIntensity }),
        value: mult(b.artsIntensityMult),
      });
    }
    if (b.effectivenessMult != null && b.effectivenessMult !== 1) {
      rows.push({
        label: t('hitDetail.effectiveness'),
        detail: '',
        value: mult(b.effectivenessMult),
      });
    }
  }
  return rows;
});

function onClose() {
  emit('update:visible', false);
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="t('hitDetail.title')"
    width="420px"
    class="hit-damage-detail-dialog"
    :close-on-click-modal="true"
    append-to-body
    @update:model-value="onClose"
  >
    <div v-if="breakdown" class="hit-detail-content">
      <template v-if="contextRows.length">
        <div class="section-label">{{ t('hitDetail.context') }}</div>
        <table class="stat-table">
          <tbody>
            <tr v-for="row in contextRows" :key="row.label">
              <td class="label-cell">{{ row.label }}</td>
              <td class="value-cell">{{ row.value }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <div class="section-label">{{ t('hitDetail.result') }}</div>
      <div class="damage-result">
        <div class="expected-damage">
          <span class="damage-label">{{
            isForcedCrit ? t('hitDetail.forcedDamage') : t('hitDetail.expectedDamage')
          }}</span>
          <span class="damage-value" :class="{ forced: isForcedCrit }">{{
            num(headlineDamage)
          }}</span>
        </div>
        <table class="stat-table">
          <tbody>
            <tr class="dim">
              <td class="label-cell">{{ t('hitDetail.critDamage') }}</td>
              <td class="value-cell">{{ num(breakdown.critDamage) }}</td>
            </tr>
            <tr class="dim">
              <td class="label-cell">{{ t('hitDetail.nonCritDamage') }}</td>
              <td class="value-cell">{{ num(breakdown.nonCritDamage) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section-label">{{ t('hitDetail.base') }}</div>
      <table class="stat-table">
        <tbody>
          <tr>
            <td class="label-cell">{{ t('hitDetail.attack') }}</td>
            <td class="value-cell">{{ num(breakdown.attack) }}</td>
          </tr>
          <tr>
            <td class="label-cell">{{ t('hitDetail.multiplier') }}</td>
            <td class="value-cell">{{ displayMultiplier.toFixed(1) }}%</td>
          </tr>
          <tr class="bold">
            <td class="label-cell">{{ t('hitDetail.baseDamage') }}</td>
            <td class="value-cell">{{ num(displayBase) }}</td>
          </tr>
        </tbody>
      </table>

      <template v-if="multiplierRows.length">
        <div class="section-label">{{ t('hitDetail.multipliers') }}</div>
        <table class="stat-table">
          <tbody>
            <tr v-for="row in multiplierRows" :key="row.label">
              <td class="label-cell">
                {{ row.label }}
                <el-tooltip
                  v-if="row.tooltip"
                  :content="row.tooltip"
                  placement="top"
                  :show-after="80"
                  popper-class="hit-detail-source-tooltip"
                >
                  <span class="hint-icon" aria-hidden="true">ⓘ</span>
                </el-tooltip>
                <span v-if="row.detail" class="mult-detail">{{ row.detail }}</span>
              </td>
              <td class="value-cell mult-value">{{ row.value }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-checkbox
          v-if="canForceCrit"
          class="force-crit-checkbox"
          :model-value="isForcedCrit"
          @change="toggleForcedCrit"
        >
          {{ t('hitDetail.forceCrit') }}
        </el-checkbox>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.hit-detail-content {
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
.damage-result {
  margin-bottom: 4px;
}
.expected-damage {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.damage-label {
  color: #ddd;
  font-weight: 600;
}
.damage-value {
  font-family: monospace;
  font-size: 20px;
  font-weight: 700;
  color: #ff6b6b;
}
.damage-value.forced {
  color: #ffd166;
  text-shadow: 0 0 8px rgba(255, 209, 102, 0.35);
}
.mult-detail {
  margin-left: 6px;
  font-size: 11px;
  color: #888;
}
.mult-value {
  color: #b8d4ff;
}
.hint-icon {
  margin-left: 4px;
  color: inherit;
  opacity: 0.55;
  font-size: 12px;
  line-height: 1;
  cursor: help;
  vertical-align: baseline;
}
.dialog-footer {
  min-height: 22px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.force-crit-checkbox {
  margin-right: auto;
}
</style>

<style>
.hit-detail-source-tooltip {
  max-width: min(320px, calc(100vw - 48px));
  white-space: pre-line;
  line-height: 1.45;
}
</style>
