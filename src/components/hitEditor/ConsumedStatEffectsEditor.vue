<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import EffectStatEditor from './EffectStatEditor.vue';

const props = defineProps({
  modelValue: { default: undefined },
});

const emit = defineEmits(['update:modelValue']);
const { t } = useI18n({ useScope: 'global' });

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function formatLeveled(value) {
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  return '';
}

function parseLeveled(raw, fallback = 0) {
  const text = String(raw ?? '').trim();
  if (!text) return fallback;
  if (text.includes(',')) {
    const parts = text.split(',').map(part => Number(part.trim()));
    if (parts.some(part => !Number.isFinite(part))) return fallback;
    return parts;
  }
  const num = Number(text);
  return Number.isFinite(num) ? num : fallback;
}

function toEditableRow(entry) {
  if (!isPlainObject(entry)) return null;
  return {
    stat: isPlainObject(entry.stat) ? { ...entry.stat } : undefined,
    valueText: formatLeveled(entry.value),
  };
}

function fromEditableRow(row) {
  const next = {
    value: parseLeveled(row.valueText, 0),
  };
  if (row.stat) next.stat = row.stat;
  return next;
}

const rows = computed(() => {
  const list = Array.isArray(props.modelValue) ? props.modelValue : [];
  return list.map(toEditableRow).filter(Boolean);
});

function commit(nextRows) {
  const list = nextRows.map(fromEditableRow);
  emit('update:modelValue', list.length ? list : undefined);
}

function updateRow(index, patch) {
  const next = rows.value.map((row, i) => (i === index ? { ...row, ...patch } : { ...row }));
  commit(next);
}

function removeRow(index) {
  commit(rows.value.filter((_, i) => i !== index));
}

function addRow() {
  commit([...rows.value, { stat: { modifier: 'dmgBonus' }, valueText: '0' }]);
}
</script>

<template>
  <div class="structured-block">
    <div class="block-title">{{ t('hitEditor.fields.consumedStatEffects') }}</div>

    <div v-for="(row, index) in rows" :key="`cse-${index}`" class="term-row">
      <div class="term-row__fields">
        <EffectStatEditor
          :model-value="row.stat"
          @update:model-value="value => updateRow(index, { stat: value })"
        />
        <div class="field-grid field-grid--effect-input-row">
          <label class="field">
            <span>{{ t('common.value') }}</span>
            <input
              class="simple-input"
              :value="row.valueText"
              @change="event => updateRow(index, { valueText: event.target.value })"
            />
          </label>
        </div>
      </div>
      <button
        type="button"
        class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger term-remove"
        @click="removeRow(index)"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            d="M3 3l10 10M13 3L3 13"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <button type="button" class="add-effect-bar" @click="addRow">
      + {{ t('hitEditor.addConsumedStatEffect') }}
    </button>
  </div>
</template>

<style scoped>
.structured-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.block-title {
  color: #ffd700;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.term-row {
  align-items: flex-start;
  display: flex;
  gap: 8px;
}

.term-row__fields {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.field-grid {
  display: grid;
  gap: 10px;
}

.field-grid--effect-input-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.field {
  color: #cfd3dc;
  display: flex;
  flex-direction: column;
  font-size: 11px;
  gap: 5px;
  min-width: 0;
}

.simple-input {
  appearance: none;
  background: #111;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0;
  box-sizing: border-box;
  color: #f0f0f0;
  font-family: inherit;
  font-size: 12px;
  height: 31px;
  line-height: 1.2;
  min-height: 31px;
  padding: 0 8px;
  width: 100%;
}

.simple-input:focus {
  border-color: rgba(255, 215, 0, 0.72);
  outline: none;
}

.term-remove {
  flex: 0 0 auto;
  margin-top: 22px;
}

.add-effect-bar {
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffd700;
  cursor: pointer;
  display: flex;
  font-size: 11px;
  justify-content: center;
  min-height: 30px;
  padding: 7px 8px;
  width: 100%;
}

.add-effect-bar:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 215, 0, 0.8);
}
</style>
