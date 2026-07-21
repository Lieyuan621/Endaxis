<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import GameRichTextRenderer from '@/components/GameRichTextRenderer.vue';
import { applyForm } from '@/data/forms';
import { resolveLeveled } from '@/data/types';
import {
  getOperatorCombatSkillDescription,
  getOperatorCombatSkillFormKeys,
  getOperatorCombatSkillName,
  getOperatorFormName,
} from '@/data/gameText';
import { skillLevelLabel } from '@/utils/operatorBounds';

const props = defineProps({
  operator: { type: Object, default: null },
  operatorSlug: { type: String, default: '' },
  skillKey: { type: String, required: true },
  skillLevel: { type: Number, default: 1 },
  skillTypeName: { type: String, default: '' },
  activeFormKey: { type: String, default: null },
});

const { t, locale } = useI18n();
const selectedFormKey = ref(null);

const formOptions = computed(() => {
  const forms = props.operator?.forms?.forms;
  if (!Array.isArray(forms)) return [];
  const textFormKeys = new Set(
    getOperatorCombatSkillFormKeys(props.operatorSlug, props.skillKey, locale.value),
  );

  return forms
    .filter(
      form =>
        form?.key &&
        ((form.combatSkills &&
          Object.prototype.hasOwnProperty.call(form.combatSkills, props.skillKey)) ||
          textFormKeys.has(form.key)),
    )
    .map(form => ({
      key: form.key,
      name: getOperatorFormName(props.operatorSlug, form.key, locale.value) || form.key,
    }));
});

const hasFormSwitcher = computed(() => formOptions.value.length > 1);

function pickDefaultFormKey() {
  const active = props.activeFormKey;
  if (active && formOptions.value.some(form => form.key === active)) return active;
  return formOptions.value[0]?.key ?? null;
}

watch(
  () => [
    props.operatorSlug,
    props.skillKey,
    props.activeFormKey,
    formOptions.value.map(form => form.key).join('|'),
  ],
  () => {
    selectedFormKey.value = pickDefaultFormKey();
  },
  { immediate: true },
);

const displayFormKey = computed(() =>
  hasFormSwitcher.value ? selectedFormKey.value : props.activeFormKey,
);

const effectiveOperator = computed(() =>
  props.operator ? applyForm(props.operator, displayFormKey.value) : null,
);

const skillSheet = computed(
  () =>
    effectiveOperator.value?.combatSkills?.[props.skillKey] ||
    props.operator?.combatSkills?.[props.skillKey] ||
    null,
);

const safeSkillLevel = computed(() => Math.max(1, Number(props.skillLevel) || 1));
const skillLevelIndex = computed(() => Math.max(0, Math.min(safeSkillLevel.value - 1, 11)));

const skillName = computed(() =>
  getOperatorCombatSkillName(
    props.operatorSlug,
    props.skillKey,
    locale.value,
    props.skillTypeName,
    displayFormKey.value,
  ),
);

const skillDescription = computed(() =>
  getOperatorCombatSkillDescription(
    props.operatorSlug,
    props.skillKey,
    locale.value,
    displayFormKey.value,
  ),
);

const rankLabel = computed(() =>
  t('armory.operator.skillTooltip.rank', {
    level: skillLevelLabel(safeSkillLevel.value),
  }),
);

const resourceRows = computed(() => {
  const skill = skillSheet.value;
  const levelIndex = skillLevelIndex.value;
  const rows = [];

  const spCost = getFirstSegmentNumber(skill, 'spCost', levelIndex);
  if (spCost != null && spCost > 0) {
    rows.push({
      key: 'spCost',
      label: t('armory.operator.skillTooltip.spCost'),
      value: formatSkillNumber(spCost),
    });
  }

  const ultimateEnergyCost = resolveSkillNumber(skill?.ultimateEnergyCost, levelIndex);
  if (ultimateEnergyCost != null && ultimateEnergyCost > 0) {
    rows.push({
      key: 'ultimateEnergyCost',
      label: t('armory.operator.skillTooltip.ultimateEnergyCost'),
      value: formatSkillNumber(ultimateEnergyCost),
    });
  }

  const cooldown = resolveSkillNumber(skill?.cooldown, levelIndex);
  if (cooldown != null && cooldown > 0) {
    rows.push({
      key: 'cooldown',
      label: t('armory.operator.skillTooltip.cooldown'),
      value: `${formatSkillNumber(cooldown)}${t('armory.operator.skillTooltip.seconds')}`,
    });
  }

  return rows;
});

function setSelectedForm(key) {
  selectedFormKey.value = key;
}

function resolveSkillNumber(value, levelIndex) {
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return resolveLeveled(value, levelIndex);
  return null;
}

function formatSkillNumber(value) {
  const rounded = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(rounded)) return '';
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace(/0+$/, '').replace(/\.$/, '');
}

function getFirstSegmentNumber(skill, field, levelIndex) {
  const segment = (skill?.segments || []).find(item => item && item[field] != null);
  return segment ? resolveSkillNumber(segment[field], levelIndex) : null;
}
</script>

<template>
  <div class="operator-skill-tooltip">
    <div class="operator-skill-tooltip-header">
      <div class="operator-skill-tooltip-title-block">
        <div class="operator-skill-tooltip-title">{{ skillName }}</div>
        <div class="operator-skill-tooltip-rank">{{ rankLabel }}</div>
      </div>
      <div class="operator-skill-tooltip-type">{{ skillTypeName }}</div>
    </div>

    <div v-if="hasFormSwitcher" class="operator-skill-tooltip-forms">
      <button
        v-for="form in formOptions"
        :key="form.key"
        class="operator-skill-tooltip-form"
        :class="{
          selected: displayFormKey === form.key,
          active: activeFormKey === form.key,
        }"
        @click.stop.prevent="setSelectedForm(form.key)"
        @pointerdown.stop
        @mousedown.stop
      >
        <span class="operator-skill-tooltip-form-name">{{ form.name }}</span>
        <span v-if="activeFormKey === form.key" class="operator-skill-tooltip-form-badge">
          {{ t('armory.operator.skillTooltip.active') }}
        </span>
      </button>
    </div>

    <div v-if="skillDescription" class="operator-skill-tooltip-desc">
      <GameRichTextRenderer :text="skillDescription" :locale="locale" />
    </div>

    <div v-if="resourceRows.length" class="operator-skill-tooltip-resources">
      <div v-for="row in resourceRows" :key="row.key" class="operator-skill-tooltip-resource">
        <span>{{ row.label }}</span>
        <span>{{ row.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.operator-skill-tooltip {
  box-sizing: border-box;
  width: min(380px, calc(100vw - 48px));
  max-width: min(440px, calc(100vw - 48px));
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  color: #f1f1f1;
}

.operator-skill-tooltip-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.operator-skill-tooltip-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.operator-skill-tooltip-title {
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
}

.operator-skill-tooltip-rank {
  color: rgba(255, 255, 255, 0.48);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.2;
}

.operator-skill-tooltip-type {
  color: rgba(255, 255, 255, 0.48);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
}

.operator-skill-tooltip-forms {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding-top: 2px;
}

.operator-skill-tooltip-form {
  position: relative;
  min-width: 0;
  min-height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom-color: rgba(255, 255, 255, 0.25);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08));
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  padding: 9px 10px 8px;
  text-align: center;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.1;
}

.operator-skill-tooltip-form.selected {
  color: #fff;
  border-bottom-color: #fff;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.12));
  box-shadow: inset 0 -2px 0 #fff;
}

.operator-skill-tooltip-form.active {
  color: #fff;
}

.operator-skill-tooltip-form-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.operator-skill-tooltip-form-badge {
  position: absolute;
  top: -8px;
  right: 6px;
  border-radius: 999px;
  background: #f4ed32;
  color: #4e4a00;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.1;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.operator-skill-tooltip-desc {
  color: rgba(255, 255, 255, 0.84);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  white-space: pre-wrap;
}

.operator-skill-tooltip-resources {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

.operator-skill-tooltip-resource {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}
</style>
