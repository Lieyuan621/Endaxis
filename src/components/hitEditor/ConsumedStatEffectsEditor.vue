<script setup>
import { EaButton, EaDeleteIcon, EaInput } from '@/design-system';
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
            <EaInput
              :model-value="row.valueText"
              size="sm"
              @change="value => updateRow(index, { valueText: value })"
            />
          </label>
        </div>
      </div>
      <EaButton
        variant="danger"
        size="sm"
        icon-only
        type="button"
        class="term-remove"
        :title="t('common.delete')"
        :aria-label="t('common.delete')"
        @click="removeRow(index)"
      >
        <EaDeleteIcon />
      </EaButton>
    </div>

    <EaButton type="button" class="add-effect-bar" @click="addRow">
      + {{ t('hitEditor.addConsumedStatEffect') }}
    </EaButton>
  </div>
</template>

<style scoped>
.structured-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.block-title {
  color: var(--ea-gold);
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
  color: var(--ea-fg-secondary, #cfd3dc);
  display: flex;
  flex-direction: column;
  font-size: 11px;
  gap: 5px;
  min-width: 0;
}

.term-remove {
  flex: 0 0 auto;
  margin-top: 22px;
}

.add-effect-bar {
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--ea-gold);
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
  border-color: color-mix(in srgb, var(--ea-gold) 80%, transparent);
}
</style>
