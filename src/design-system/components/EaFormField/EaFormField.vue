<script setup lang="ts">
import { computed, provide } from 'vue';
import { eaFormFieldKey } from '../fieldContext';
import type { EaFormFieldLayout } from '../types';

const props = withDefaults(
  defineProps<{
    controlId: string;
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    layout?: EaFormFieldLayout;
  }>(),
  {
    label: '',
    hint: '',
    error: '',
    required: false,
    layout: 'vertical',
  },
);

const controlId = computed(() => props.controlId);
const invalid = computed(() => Boolean(props.error));
const describedBy = computed(() => {
  if (props.error) return `${props.controlId}-error`;
  if (props.hint) return `${props.controlId}-hint`;
  return undefined;
});

provide(eaFormFieldKey, { controlId, describedBy, invalid });
</script>

<template>
  <div class="ea-form-field" :class="`ea-form-field--${layout}`">
    <label v-if="label" class="ea-form-field__label" :for="controlId">
      {{ label }}
      <span v-if="required" class="ea-form-field__required" aria-hidden="true">*</span>
    </label>
    <div class="ea-form-field__control"><slot /></div>
    <p v-if="error" :id="`${controlId}-error`" class="ea-form-field__error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${controlId}-hint`" class="ea-form-field__hint">
      {{ hint }}
    </p>
  </div>
</template>
