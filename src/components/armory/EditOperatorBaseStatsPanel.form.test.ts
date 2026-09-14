import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, test, vi } from 'vitest';

vi.mock('element-plus', async importOriginal => {
  const actual = await importOriginal<typeof import('element-plus')>();
  const NativeNumberInput = defineComponent({
    inheritAttrs: false,
    props: {
      id: String,
      modelValue: Number,
    },
    setup(props, { attrs }) {
      return () => h('input', { ...attrs, id: props.id, type: 'number', value: props.modelValue });
    },
  });

  return {
    ...actual,
    ElInputNumber: NativeNumberInput,
  };
});

vi.mock('@/design-system', async importOriginal => {
  const actual = await importOriginal<typeof import('@/design-system')>();
  return {
    ...actual,
    EaDialog: defineComponent({
      setup(_, { slots }) {
        return () => h('section', [slots.header?.(), slots.default?.(), slots.footer?.()]);
      },
    }),
  };
});

vi.mock('@/stores/operatorStore', () => ({
  useOperatorStore: () => ({
    updateOperator: vi.fn(),
  }),
}));

vi.mock('@/data/stats/baseValues', () => ({
  getBaseStatValues: () => ({
    baseAttrs: { strength: 10, agility: 20, intellect: 30, will: 40 },
    baseAtk: 100,
    baseHp: 1000,
  }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import EditOperatorBaseStatsPanel from './EditOperatorBaseStatsPanel.vue';

describe('EditOperatorBaseStatsPanel form fields', () => {
  test('associates representative attribute and combat stat labels with number inputs', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(EditOperatorBaseStatsPanel, {
            visible: true,
            instance: { id: 'operator-1', operatorSlug: 'demo', level: 90, promoted: true },
          }),
      }),
    );

    for (const id of ['operator-base-strength', 'operator-base-atk', 'operator-base-crit-rate']) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toMatch(new RegExp(`<input[^>]*id="${id}"`));
    }
  });
});
