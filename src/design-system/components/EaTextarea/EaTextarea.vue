<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue';
import { ElInput } from 'element-plus';
import { eaFormFieldKey } from '../fieldContext';
import type { EaControlSize } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    size?: EaControlSize;
    variant?: 'default' | 'code';
    rows?: number;
    maxlength?: number;
    showWordLimit?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  }>(),
  {
    modelValue: '',
    size: 'md',
    variant: 'default',
    rows: 3,
    maxlength: undefined,
    showWordLimit: false,
    disabled: false,
    readonly: false,
    invalid: false,
    resize: 'vertical',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  input: [value: string];
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
  <ElInput
    v-bind="attrs"
    :id="inputId || undefined"
    class="ea-textarea"
    :class="[
      `ea-textarea--${size}`,
      `ea-textarea--${variant}`,
      { 'ea-textarea--invalid': isInvalid },
    ]"
    type="textarea"
    :model-value="modelValue"
    :size="elementSize"
    :rows="rows"
    :maxlength="maxlength"
    :show-word-limit="showWordLimit"
    :disabled="disabled"
    :readonly="readonly"
    :resize="resize"
    :aria-describedby="describedBy"
    :aria-invalid="isInvalid || undefined"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @input="emit('input', $event)"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
  />
</template>
