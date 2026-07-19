<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EFFECT_TARGET_SCOPES, OPERATOR_CLASSES } from '@/data/enums';
import { getGameClassName } from '@/data/gameText';

const props = defineProps({
  modelValue: { default: undefined },
});

const emit = defineEmits(['update:modelValue']);
const { t, locale } = useI18n({ useScope: 'global' });

const NONE = '';

function asTargetObject(value) {
  if (!value) return null;
  if (typeof value === 'string') return { scope: value, classes: [] };
  return {
    scope: value.scope || '',
    classes: Array.isArray(value.classes) ? [...value.classes] : [],
  };
}

const scopeValue = computed({
  get() {
    return asTargetObject(props.modelValue)?.scope || NONE;
  },
  set(next) {
    if (!next) {
      emit('update:modelValue', undefined);
      return;
    }
    const classes = classValues.value;
    emit('update:modelValue', classes.length ? { scope: next, classes } : next);
  },
});

const classValues = computed({
  get() {
    return asTargetObject(props.modelValue)?.classes || [];
  },
  set(next) {
    const scope = scopeValue.value;
    if (!scope) {
      emit('update:modelValue', undefined);
      return;
    }
    const classes = Array.isArray(next) ? next.filter(Boolean) : [];
    emit('update:modelValue', classes.length ? { scope, classes } : scope);
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
        <el-select
          :model-value="scopeValue"
          @update:model-value="value => (scopeValue = value)"
          size="small"
          clearable
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <el-option :value="NONE" :label="t('common.none')" />
          <el-option
            v-for="scope in EFFECT_TARGET_SCOPES"
            :key="scope"
            :value="scope"
            :label="scopeLabel(scope)"
          />
        </el-select>
      </label>
      <label v-if="scopeValue" class="field">
        <span>{{ t('hitEditor.fields.targetClasses') }}</span>
        <el-select
          :model-value="classValues"
          @update:model-value="value => (classValues = value)"
          size="small"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <el-option
            v-for="cls in OPERATOR_CLASSES"
            :key="cls"
            :value="cls"
            :label="getGameClassName(cls, locale)"
          />
        </el-select>
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
  color: #cfd3dc;
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
