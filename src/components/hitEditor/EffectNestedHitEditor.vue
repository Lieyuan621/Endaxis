<script setup>
import { EaInput, EaTextarea } from '@/design-system';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CustomNumberInput from '../CustomNumberInput.vue';

const props = defineProps({
  modelValue: { default: undefined },
  label: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);
const { t } = useI18n({ useScope: 'global' });

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function formatLeveled(value) {
  if (value == null) return '';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  return '';
}

function parseLeveled(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return undefined;
  if (text.includes(',')) {
    const parts = text.split(',').map(part => Number(part.trim()));
    if (parts.some(part => !Number.isFinite(part))) return undefined;
    return parts;
  }
  const num = Number(text);
  return Number.isFinite(num) ? num : undefined;
}

const heading = computed(() => props.label || t('hitEditor.fields.hit'));

const hitObject = computed(() => (isPlainObject(props.modelValue) ? props.modelValue : {}));

function commit(patch) {
  const next = { ...hitObject.value, ...patch };
  for (const key of Object.keys(next)) {
    if (next[key] === undefined || next[key] === '') delete next[key];
  }
  emit('update:modelValue', Object.keys(next).length ? next : undefined);
}

const spRecoveryText = computed({
  get: () => formatLeveled(hitObject.value.spRecovery),
  set(raw) {
    commit({ spRecovery: parseLeveled(raw) });
  },
});

const spReturnText = computed({
  get: () => formatLeveled(hitObject.value.spReturn),
  set(raw) {
    commit({ spReturn: parseLeveled(raw) });
  },
});

const staggerText = computed({
  get: () => formatLeveled(hitObject.value.stagger),
  set(raw) {
    commit({ stagger: parseLeveled(raw) });
  },
});

const durationExtensionValue = computed({
  get: () => Number(hitObject.value.durationExtension) || 0,
  set(value) {
    const num = Number(value) || 0;
    commit({ durationExtension: num > 0 ? num : undefined });
  },
});

const effectsJson = computed({
  get() {
    if (hitObject.value.effects === undefined) return '';
    try {
      return JSON.stringify(hitObject.value.effects, null, 2);
    } catch {
      return '';
    }
  },
  set(raw) {
    const text = String(raw ?? '').trim();
    if (!text) {
      commit({ effects: undefined });
      return;
    }
    try {
      commit({ effects: JSON.parse(text) });
    } catch {
      // keep draft invalid text out of model; parent JSON draft pattern avoided for simplicity
    }
  },
});
</script>

<template>
  <div class="structured-block">
    <div class="block-title">{{ heading }}</div>
    <div class="field-grid field-grid--effect-text-row">
      <label class="field">
        <span>{{ t('hitEditor.fields.spRecovery') }}</span>
        <EaInput
          :model-value="spRecoveryText"
          size="sm"
          @change="value => (spRecoveryText = value)"
        />
      </label>
      <label class="field">
        <span>{{ t('hitEditor.fields.spReturn') }}</span>
        <EaInput :model-value="spReturnText" size="sm" @change="value => (spReturnText = value)" />
      </label>
      <label class="field">
        <span>{{ t('hitEditor.fields.stagger') }}</span>
        <EaInput :model-value="staggerText" size="sm" @change="value => (staggerText = value)" />
      </label>
    </div>
    <div class="field-grid field-grid--effect-input-row">
      <label class="field">
        <span>{{ t('hitEditor.durationExtension') }}</span>
        <CustomNumberInput
          :model-value="durationExtensionValue"
          @update:model-value="value => (durationExtensionValue = value)"
          :min="0"
          :activeColor="'var(--ea-gold)'"
        />
      </label>
    </div>
    <label class="json-field">
      <span>{{ t('hitEditor.fields.hitEffects') }}</span>
      <EaTextarea
        :model-value="effectsJson"
        variant="code"
        size="sm"
        :rows="4"
        @change="value => (effectsJson = value)"
        :placeholder="t('hitEditor.hitEffectsPlaceholder')"
      />
    </label>
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

.field-grid {
  display: grid;
  gap: 10px;
}

.field-grid--effect-text-row,
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

.json-field {
  color: var(--ea-fg-secondary, #cfd3dc);
  display: flex;
  flex-direction: column;
  font-size: 11px;
  gap: 5px;
}
</style>
