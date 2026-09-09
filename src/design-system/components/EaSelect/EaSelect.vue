<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue';
import { ElOption, ElSelect } from 'element-plus';
import { eaFormFieldKey } from '../fieldContext';
import type { EaControlSize } from '../types';

export type EaSelectValue = string | number | boolean;

export interface EaSelectOption {
  label: string;
  value: EaSelectValue;
  disabled?: boolean;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: EaSelectValue | EaSelectValue[];
    options?: EaSelectOption[];
    size?: EaControlSize;
    variant?: 'default' | 'inline';
    multiple?: boolean;
    clearable?: boolean;
    filterable?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    popperClass?: string;
  }>(),
  {
    modelValue: '',
    options: () => [],
    size: 'md',
    variant: 'default',
    multiple: false,
    clearable: false,
    filterable: false,
    disabled: false,
    invalid: false,
    popperClass: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: EaSelectValue | EaSelectValue[]];
  change: [value: EaSelectValue | EaSelectValue[]];
  clear: [];
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
const mergedPopperClass = computed(() =>
  ['ea-select-popper', props.popperClass].filter(Boolean).join(' '),
);
</script>

<template>
  <ElSelect
    v-bind="attrs"
    :id="inputId || undefined"
    class="ea-select"
    :class="[`ea-select--${size}`, `ea-select--${variant}`, { 'ea-select--invalid': isInvalid }]"
    :model-value="modelValue"
    :size="elementSize"
    :multiple="multiple"
    :clearable="clearable"
    :filterable="filterable"
    :disabled="disabled"
    :popper-class="mergedPopperClass"
    :aria-describedby="describedBy"
    :aria-invalid="isInvalid || undefined"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @clear="emit('clear')"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
  >
    <slot>
      <ElOption
        v-for="option in options"
        :key="String(option.value)"
        :label="option.label"
        :value="option.value"
        :disabled="option.disabled"
      />
    </slot>
  </ElSelect>
</template>
