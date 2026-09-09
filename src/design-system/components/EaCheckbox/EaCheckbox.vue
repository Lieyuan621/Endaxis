<script setup lang="ts">
import { computed, inject, ref, useAttrs, watchEffect, type HTMLAttributes } from 'vue';
import { eaFormFieldKey } from '../fieldContext';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
  }>(),
  {
    modelValue: false,
    disabled: false,
    indeterminate: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean, event: Event];
}>();

const attrs = useAttrs();
const field = inject(eaFormFieldKey, undefined);
const inputRef = ref<HTMLInputElement>();
const inputId = computed(() => String(attrs.id ?? field?.controlId.value ?? ''));
const rootClass = computed<HTMLAttributes['class']>(() => attrs.class as HTMLAttributes['class']);
const rootStyle = computed<HTMLAttributes['style']>(() => attrs.style as HTMLAttributes['style']);
const describedBy = computed<string | undefined>(() => {
  const explicit = attrs['aria-describedby'];
  return typeof explicit === 'string' ? explicit : field?.describedBy.value;
});
const isInvalid = computed<boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined>(() => {
  const explicit = attrs['aria-invalid'];
  if (
    typeof explicit === 'boolean' ||
    explicit === 'true' ||
    explicit === 'false' ||
    explicit === 'grammar' ||
    explicit === 'spelling'
  ) {
    return explicit;
  }
  return field?.invalid.value || undefined;
});
const inputAttrs = computed(() => {
  const {
    class: _class,
    style: _style,
    id: _id,
    'aria-describedby': _describedBy,
    'aria-invalid': _invalid,
    ...rest
  } = attrs;
  return rest;
});

watchEffect(() => {
  if (inputRef.value) inputRef.value.indeterminate = props.indeterminate;
});

function handleChange(event: Event) {
  const value = (event.target as HTMLInputElement).checked;
  emit('update:modelValue', value);
  emit('change', value, event);
}
</script>

<template>
  <label
    class="ea-checkbox"
    :class="[rootClass, { 'ea-checkbox--disabled': disabled }]"
    :style="rootStyle"
  >
    <input
      ref="inputRef"
      v-bind="inputAttrs"
      :id="inputId || undefined"
      class="ea-checkbox__input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :aria-checked="indeterminate ? 'mixed' : modelValue"
      :aria-describedby="describedBy"
      :aria-invalid="isInvalid"
      @change="handleChange"
    />
    <span class="ea-checkbox__box" aria-hidden="true" />
    <span class="ea-checkbox__label"><slot /></span>
  </label>
</template>
