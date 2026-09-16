import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it, vi } from 'vitest';

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
        return () =>
          h('section', [
            h('button', { type: 'button', 'data-dialog-close': '' }, 'close'),
            slots.default?.(),
            slots.footer ? h('footer', slots.footer()) : null,
          ]);
      },
    }),
  };
});

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

import ExportDialog from './ExportDialog.vue';
import exportDialogSource from './ExportDialog.vue?raw';

function getRuleBody(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

async function renderDialog() {
  return renderToString(
    createSSRApp({
      render: () =>
        h(ExportDialog, {
          modelValue: true,
          currentScenarioName: '方案 02',
          scenarioCount: 3,
          maxDuration: 120,
        }),
    }),
  );
}

describe('ExportDialog', () => {
  it('separates project data exports from current-scenario image exports', async () => {
    const html = await renderDialog();

    expect(html).toContain('timeline.export.dataSectionTitle');
    expect(html).toContain('timeline.export.imageSectionTitle');
    expect(html).toContain('timeline.export.allScenariosCount:{&quot;count&quot;:3}');
    expect(html).toContain(
      'timeline.export.currentScenarioName:{&quot;name&quot;:&quot;方案 02&quot;}',
    );
    expect(html).not.toContain('timeline.export.dataBadge');
    expect(html).not.toContain('timeline.export.imageBadge');
  });

  it('defaults data export scope to all scenarios and renders it as an exclusive choice', async () => {
    const html = await renderDialog();

    expect(html).toContain('role="radiogroup"');
    expect(html).toMatch(
      /aria-pressed="false"[^>]*>[\s\S]*?timeline\.export\.scopeCurrent[\s\S]*?<\/button>/,
    );
    expect(html).toMatch(
      /aria-pressed="true"[^>]*>[\s\S]*?timeline\.export\.scopeAll[\s\S]*?<\/button>/,
    );
  });

  it('renders export actions without four primary yellow buttons', async () => {
    const html = await renderDialog();

    expect(html).toContain('export-action-card');
    expect(html).not.toContain('ea-button--primary');
  });

  it('uses the dialog close control without a duplicate footer dismissal action', async () => {
    const html = await renderDialog();

    expect(html.match(/data-dialog-close/g)).toHaveLength(1);
    expect(html).not.toContain('common.cancel');
    expect(html).not.toContain('<footer>');
  });

  it('gives action cards the same restrained hover surface as display tools', () => {
    const cardHoverRule = getRuleBody(
      exportDialogSource,
      '.export-action-card.ea-button:hover:not(:disabled)',
    );
    const iconHoverRule = getRuleBody(
      exportDialogSource,
      '.export-action-card.ea-button:hover:not(:disabled) .export-action-card__icon',
    );

    expect(cardHoverRule).toContain('border-color: var(--ea-border-strong);');
    expect(cardHoverRule).toContain('background: var(--ea-hover-fill);');
    expect(cardHoverRule).not.toContain('var(--ea-gold)');
    expect(iconHoverRule).toContain('color: var(--ea-gold);');
  });

  it('keeps the selected export scope transparent while hovered', () => {
    const scopeButtonRule = getRuleBody(exportDialogSource, '.export-scope :deep(.ea-button)');

    expect(scopeButtonRule).toContain('--ea-control-pressed-border-hover: transparent;');
    expect(scopeButtonRule).toContain('--ea-control-pressed-bg-hover: transparent;');
    expect(scopeButtonRule).toContain('--ea-control-pressed-fg-hover: var(--ea-gold);');
  });
});
