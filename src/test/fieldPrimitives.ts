import { defineComponent, h } from 'vue';

// Keep production field setup, templates, watchers and events; replace only visual
// primitives with their public event interfaces. Browser coverage remains separate.
export function createFieldPrimitives() {
  const input = defineComponent({
    props: ['modelValue', 'disabled', 'type'],
    emits: ['input', 'change', 'update:modelValue'],
    setup:
      (props, { attrs, emit }) =>
      () =>
        h('input', {
          ...attrs,
          type: props.type,
          disabled: props.disabled,
          value: props.modelValue,
          onInput: (value: string) => {
            emit('input', value);
            emit('update:modelValue', value);
          },
          onChange: (value: string) => emit('change', value),
        }),
  });
  return {
    EaInput: input,
    EaNumberInput: input,
    EaButton: defineComponent({
      props: ['disabled'],
      emits: ['click'],
      setup:
        (props, { attrs, emit, slots }) =>
        () =>
          h(
            'button',
            {
              ...attrs,
              disabled: props.disabled,
              onClick: () => emit('click'),
            },
            slots.default?.(),
          ),
    }),
    EaSelect: defineComponent({
      props: ['modelValue', 'disabled', 'options'],
      emits: ['change'],
      setup:
        (props, { attrs, emit }) =>
        () =>
          h('select', {
            ...attrs,
            disabled: props.disabled,
            value: props.modelValue,
            options: props.options,
            onChange: (value: unknown) => emit('change', value),
          }),
    }),
    EaCheckbox: defineComponent({
      props: ['modelValue', 'disabled'],
      emits: ['change'],
      setup:
        (props, { attrs, emit, slots }) =>
        () =>
          h('label', {}, [
            h('input', {
              ...attrs,
              type: 'checkbox',
              disabled: props.disabled,
              checked: props.modelValue,
              onChange: (value: boolean) => emit('change', value),
            }),
            slots.default?.(),
          ]),
    }),
    EaTooltip: defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          slots.default?.(),
    }),
  };
}
