import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('element-plus', async importOriginal => {
  const actual = await importOriginal<typeof import('element-plus')>();
  const NativeInput = defineComponent({
    inheritAttrs: false,
    props: {
      id: String,
      modelValue: [String, Number],
    },
    setup(props, { attrs }) {
      return () => h('input', { ...attrs, id: props.id, value: props.modelValue });
    },
  });

  return {
    ...actual,
    ElInput: NativeInput,
    ElInputNumber: NativeInput,
  };
});

vi.mock('@/design-system', async importOriginal => {
  const actual = await importOriginal<typeof import('@/design-system')>();
  return {
    ...actual,
    EaDialog: defineComponent({
      setup(_, { slots }) {
        return () => h('section', [slots.default?.(), slots.footer?.()]);
      },
    }),
  };
});

vi.mock('@/components/TimelineShareCard.vue', () => ({
  default: defineComponent({
    setup() {
      return () => h('div');
    },
  }),
}));

vi.mock('@/stores/timelineStore.js', () => ({
  useTimelineStore: () => ({
    TOTAL_DURATION: 120,
  }),
}));

vi.mock('@/composables/useAppearance', () => ({
  useAppearance: () => ({ appearance: { value: 'dark' } }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

import SmallImageExportDialog from './SmallImageExportDialog.vue';

function renderDialog() {
  return renderToString(
    createSSRApp({
      render: () =>
        h(SmallImageExportDialog, {
          modelValue: true,
          initialFilename: 'demo',
          initialDuration: 60,
        }),
    }),
  );
}

describe('SmallImageExportDialog form fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('associates filename and duration labels with their rendered controls', async () => {
    const html = await renderDialog();

    expect(html).toContain('for="small-export-filename"');
    expect(html).toContain('id="small-export-filename"');
    expect(html).toContain('for="small-export-duration"');
    expect(html).toContain('id="small-export-duration"');
    expect(html).toContain('aria-describedby="small-export-duration-hint"');
  });

  test('associates each range label with its native slider', async () => {
    const html = await renderDialog();

    for (const id of [
      'small-export-card-width',
      'small-export-block-height',
      'small-export-time-scale',
    ]) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain(`id="${id}"`);
    }
  });
});
