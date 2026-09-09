<script setup lang="ts">
import { computed, inject, ref, useAttrs } from 'vue';
import { ElInput } from 'element-plus';
import { eaFormFieldKey } from '../fieldContext';
import type { EaControlSize } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    size?: EaControlSize;
    variant?: 'default' | 'inline';
    clearable?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
  }>(),
  {
    modelValue: '',
    size: 'md',
    variant: 'default',
    clearable: false,
    disabled: false,
    readonly: false,
    invalid: false,
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
const inputRef = ref<InstanceType<typeof ElInput>>();

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
});
</script>

<template>
  <ElInput
    ref="inputRef"
    v-bind="attrs"
    :id="inputId || undefined"
    class="ea-input"
    :class="[`ea-input--${size}`, `ea-input--${variant}`, { 'ea-input--invalid': isInvalid }]"
    :model-value="modelValue"
    :size="elementSize"
    :clearable="clearable"
    :disabled="disabled"
    :readonly="readonly"
    :aria-describedby="describedBy"
    :aria-invalid="isInvalid || undefined"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @input="emit('input', $event)"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
  >
    <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="$slots.suffix" #suffix><slot name="suffix" /></template>
    <template v-if="$slots.prepend" #prepend><slot name="prepend" /></template>
    <template v-if="$slots.append" #append><slot name="append" /></template>
  </ElInput>
</template>
