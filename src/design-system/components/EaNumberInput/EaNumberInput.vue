<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue';
import { ElInputNumber } from 'element-plus';
import { eaFormFieldKey } from '../fieldContext';
import type { EaControlSize } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    size?: EaControlSize;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    controls?: boolean;
    controlsPosition?: '' | 'right';
    disabled?: boolean;
    invalid?: boolean;
  }>(),
  {
    modelValue: undefined,
    size: 'md',
    min: -Infinity,
    max: Infinity,
    step: 1,
    precision: undefined,
    controls: true,
    controlsPosition: '',
    disabled: false,
    invalid: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
  change: [value: number | undefined];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const attrs = useAttrs();
const field = inject(eaFormFieldKey, undefined);
const inputId = computed(() => String(attrs.id ?? field?.controlId.value ?? ''));
const describedBy = computed(() => attrs['aria-describedby'] ?? field?.describedBy.value);
const isInvalid = computed(() => props.invalid || Boolean(field?.invalid.value));
const elementSize = computed(() =>
  props.size === 'md' ? 'default' : props.size === 'sm' ? 'small' : 'large',
);
</script>

<template>
  <ElInputNumber
    v-bind="attrs"
    :id="inputId || undefined"
    class="ea-number-input"
    :class="[`ea-number-input--${size}`, { 'ea-number-input--invalid': isInvalid }]"
    :model-value="modelValue"
    :size="elementSize"
    :min="min"
    :max="max"
    :step="step"
    :precision="precision"
    :controls="controls"
    :controls-position="controlsPosition || undefined"
    :disabled="disabled"
    :aria-describedby="describedBy"
    :aria-invalid="isInvalid || undefined"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
  />
</template>
