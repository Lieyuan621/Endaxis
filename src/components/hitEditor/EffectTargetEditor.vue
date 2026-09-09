<script setup>
import { EaOption, EaSelect } from '@/design-system';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { DAMAGE_ELEMENTS, EFFECT_TARGET_SCOPES, OPERATOR_CLASSES } from '@/data/enums';
import { getGameClassName, getGameElementName } from '@/data/gameText';

const props = defineProps({
  modelValue: { default: undefined },
});

const emit = defineEmits(['update:modelValue']);
const { t, locale } = useI18n({ useScope: 'global' });

const NONE = '';

function asTargetObject(value) {
  if (!value) return null;
  if (typeof value === 'string') return { scope: value, classes: [], elements: [] };
  return {
    scope: value.scope || '',
    classes: Array.isArray(value.classes) ? [...value.classes] : [],
    elements: Array.isArray(value.elements) ? [...value.elements] : [],
  };
}

/** Collapses to the bare scope string when BOTH filters are empty, else the object form. */
function emitTarget(scope, classes, elements) {
  if (!scope) {
    emit('update:modelValue', undefined);
    return;
  }
  if (!classes.length && !elements.length) {
    emit('update:modelValue', scope);
    return;
  }
  const next = { scope };
  if (classes.length) next.classes = classes;
  if (elements.length) next.elements = elements;
  emit('update:modelValue', next);
}

const scopeValue = computed({
  get() {
    return asTargetObject(props.modelValue)?.scope || NONE;
  },
  set(next) {
    emitTarget(next, classValues.value, elementValues.value);
  },
});

const classValues = computed({
  get() {
    return asTargetObject(props.modelValue)?.classes || [];
  },
  set(next) {
    emitTarget(
      scopeValue.value,
      Array.isArray(next) ? next.filter(Boolean) : [],
      elementValues.value,
    );
  },
});

const elementValues = computed({
  get() {
    return asTargetObject(props.modelValue)?.elements || [];
  },
  set(next) {
    emitTarget(
      scopeValue.value,
      classValues.value,
      Array.isArray(next) ? next.filter(Boolean) : [],
    );
  },
});

function scopeLabel(value) {
  const key = `hitEditor.targetScopes.${value}`;
  const out = t(key);
  return out === key ? value : out;
}
</script>

<template>
  <div class="structured-block">
    <div class="field-grid field-grid--effect-select-row">
      <label class="field">
        <span>{{ t('hitEditor.fields.target') }}</span>
        <EaSelect
          :model-value="scopeValue"
          @update:model-value="value => (scopeValue = value)"
          size="sm"
          clearable
          :empty-values="[null, undefined]"
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <EaOption :value="NONE" :label="t('common.none')" />
          <EaOption
            v-for="scope in EFFECT_TARGET_SCOPES"
            :key="scope"
            :value="scope"
            :label="scopeLabel(scope)"
          />
        </EaSelect>
      </label>
      <label v-if="scopeValue" class="field">
        <span>{{ t('hitEditor.fields.targetClasses') }}</span>
        <EaSelect
          :model-value="classValues"
          @update:model-value="value => (classValues = value)"
          size="sm"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          :placeholder="t('common.default')"
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <EaOption
            v-for="cls in OPERATOR_CLASSES"
            :key="cls"
            :value="cls"
            :label="getGameClassName(cls, locale)"
          />
        </EaSelect>
      </label>
      <label v-if="scopeValue" class="field">
        <span>{{ t('hitEditor.fields.targetElements') }}</span>
        <EaSelect
          :model-value="elementValues"
          @update:model-value="value => (elementValues = value)"
          size="sm"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          :placeholder="t('common.default')"
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <EaOption
            v-for="el in DAMAGE_ELEMENTS"
            :key="el"
            :value="el"
            :label="getGameElementName(el, locale)"
          />
        </EaSelect>
      </label>
    </div>
  </div>
</template>

<style scoped>
.structured-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-grid {
  display: grid;
  gap: 10px;
}

.field-grid--effect-select-row {
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

.effect-select-dark {
  width: 100%;
}
</style>
