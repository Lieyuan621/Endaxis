import { createSSRApp, defineComponent, h, type Component } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { describe, expect, test } from 'vitest';

type ComponentModule = { default: Component };

const componentModules = import.meta.glob<ComponentModule>('./components/*/*.vue', {
  eager: true,
});
const componentSources = import.meta.glob<string>('./components/*/*.vue', {
  eager: true,
  import: 'default',
  query: '?raw',
});

function getComponent(name: string): Component | undefined {
  return componentModules[`./components/${name}/${name}.vue`]?.default;
}

function configureElementPlusSsr(app: ReturnType<typeof createSSRApp>) {
  app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 });
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
  return app;
}

async function renderComponent(name: string, props: Record<string, unknown>, content?: string) {
  const component = getComponent(name);
  expect(component, `${name} must be exported as a design-system component`).toBeDefined();
  if (!component) return '';

  return renderToString(
    configureElementPlusSsr(
      createSSRApp({
        render: () => h(component, props, content ? { default: () => content } : undefined),
      }),
    ),
  );
}

describe('design-system component contracts', () => {
  test('EaButton prevents duplicate actions while loading', async () => {
    const html = await renderComponent('EaButton', { loading: true }, 'Save');

    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('disabled');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('ea-button--loading');
  });

  test('EaButton exposes pressed state for toggle actions', async () => {
    const html = await renderComponent('EaButton', { pressed: true }, 'Display');

    expect(html).toContain('aria-pressed="true"');
  });

  test('EaButton keeps slotted layout items as direct button children', async () => {
    const button = getComponent('EaButton');
    expect(button).toBeDefined();
    if (!button) return;

    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            button,
            {},
            {
              default: () => [
                h('span', { class: 'layout-item-one' }, 'One'),
                h('span', { class: 'layout-item-two' }, 'Two'),
              ],
            },
          ),
      }),
    );

    const normalizedHtml = html.replace(/<!--(?:\[|\])?-->|<!---->/g, '');
    expect(normalizedHtml).toMatch(
      /<button[^>]*><span class="layout-item-one">One<\/span><span class="layout-item-two">Two<\/span><\/button>/,
    );
  });

  test('EaDeleteIcon renders a font-independent decorative trash glyph', async () => {
    const html = await renderComponent('EaDeleteIcon', {});

    expect(html).toContain('<svg');
    expect(html).toContain('class="ea-delete-icon"');
    expect(html).toContain('viewbox="0 0 24 24"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).not.toMatch(/>\s*[x×]\s*</i);
  });

  test('EaFilterChip exposes its selected state to assistive technology', async () => {
    const html = await renderComponent('EaFilterChip', { selected: true }, 'Fire');

    expect(html).toContain('<button');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('ea-filter-chip--selected');
  });

  test('EaFormField connects its label and error to the nested control', async () => {
    const component = getComponent('EaFormField');
    expect(component, 'EaFormField must be exported as a design-system component').toBeDefined();
    if (!component) return;

    const html = await renderToString(
      configureElementPlusSsr(
        createSSRApp({
          render: () =>
            h(
              component,
              { controlId: 'duration', label: 'Duration', error: 'Required' },
              { default: () => h('input', { id: 'duration' }) },
            ),
        }),
      ),
    );

    expect(html).toContain('for="duration"');
    expect(html).toContain('id="duration-error"');
    expect(html).toContain('role="alert"');
  });

  test('EaInput consumes the surrounding field error state', async () => {
    const field = getComponent('EaFormField');
    const input = getComponent('EaInput');
    expect(field).toBeDefined();
    expect(input).toBeDefined();
    if (!field || !input) return;

    const html = await renderToString(
      configureElementPlusSsr(
        createSSRApp({
          render: () =>
            h(
              field,
              { controlId: 'nickname', label: 'Nickname', error: 'Required' },
              { default: () => h(input, { modelValue: '' }) },
            ),
        }),
      ),
    );

    expect(html).toContain('aria-describedby="nickname-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('ea-input--invalid');
  });

  test('EaInput exposes the inline editing variant', async () => {
    const html = await renderComponent('EaInput', { modelValue: 'Scenario', variant: 'inline' });

    expect(html).toContain('ea-input--inline');
  });

  test('EaCheckbox exposes checked and disabled states on the real input', async () => {
    const html = await renderComponent(
      'EaCheckbox',
      { modelValue: true, disabled: true },
      'Keep settings',
    );

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
    expect(html).toContain('disabled');
  });

  test('EaCheckbox keeps layout classes on its public root', async () => {
    const html = await renderComponent(
      'EaCheckbox',
      { class: 'feature-checkbox', modelValue: false },
      'Feature',
    );

    expect(html).toMatch(/<label class="[^"]*feature-checkbox/);
    expect(html).not.toMatch(/<input[^>]*class="[^"]*feature-checkbox/);
  });

  test('EaCheckbox exposes an indeterminate state to assistive technology', async () => {
    const html = await renderComponent('EaCheckbox', { indeterminate: true }, 'Mixed');

    expect(html).toContain('aria-checked="mixed"');
  });

  test('EaSwitch uses switch semantics instead of a visual-only state', async () => {
    const html = await renderComponent('EaSwitch', { modelValue: true }, 'Enabled');

    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
  });

  test('EaDialogActions marks mobile stacking without changing action order', async () => {
    const html = await renderComponent(
      'EaDialogActions',
      { stackOnMobile: true },
      'Dialog actions',
    );

    expect(html).toContain('ea-dialog-actions--stack-mobile');
    expect(html).toContain('Dialog actions');
  });

  test('EaTextarea renders its length contract on the native textarea', async () => {
    const html = await renderComponent('EaTextarea', {
      modelValue: 'note',
      maxlength: 120,
      rows: 4,
    });

    expect(html).toContain('<textarea');
    expect(html).toContain('maxlength="120"');
    expect(html).toContain('rows="4"');
  });

  test('EaTextarea exposes the code editing variant', async () => {
    const html = await renderComponent('EaTextarea', { modelValue: '{}', variant: 'code' });

    expect(html).toContain('ea-textarea--code');
  });

  test('EaNumberInput preserves native numeric range constraints', async () => {
    const html = await renderComponent('EaNumberInput', {
      modelValue: 5,
      min: 1,
      max: 10,
      step: 2,
    });

    expect(html).toContain('type="number"');
    expect(html).toContain('min="1"');
    expect(html).toContain('max="10"');
    expect(html).toContain('step="2"');
  });

  test('EaSelect preserves combobox semantics inside the design-system scope', async () => {
    const html = await renderComponent('EaSelect', {
      modelValue: 'normal',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Hard', value: 'hard' },
      ],
    });

    expect(html).toContain('ea-select');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-haspopup="listbox"');
  });

  test('EaSelect exposes the inline editing variant', async () => {
    const html = await renderComponent('EaSelect', { modelValue: 'left', variant: 'inline' });

    expect(html).toContain('ea-select--inline');
  });

  test('EaOption and EaOptionGroup are available for custom select content', () => {
    const option = getComponent('EaOption');
    const optionGroup = getComponent('EaOptionGroup');
    expect(option).toBeDefined();
    expect(optionGroup).toBeDefined();
    expect(componentSources['./components/EaOption/EaOption.vue']).toContain(
      '<slot>{{ label }}</slot>',
    );
  });

  test('EaDialog locks every dismissal path while busy', async () => {
    const dialog = getComponent('EaDialog');
    expect(dialog).toBeDefined();
    if (!dialog) return;

    const app = configureElementPlusSsr(
      createSSRApp({
        render: () =>
          h(dialog, { modelValue: true, title: 'Export', busy: true }, { default: () => 'Body' }),
      }),
    );
    app.component(
      'ElDialog',
      defineComponent({
        inheritAttrs: false,
        props: {
          closeOnClickModal: Boolean,
          closeOnPressEscape: Boolean,
          showClose: Boolean,
        },
        setup:
          (props, { slots }) =>
          () =>
            h(
              'section',
              {
                'data-close-on-click-modal': String(props.closeOnClickModal),
                'data-close-on-press-escape': String(props.closeOnPressEscape),
                'data-show-close': String(props.showClose),
              },
              slots.default?.(),
            ),
      }),
    );

    const html = await renderToString(app);
    expect(html).toContain('data-close-on-click-modal="false"');
    expect(html).toContain('data-close-on-press-escape="false"');
    expect(html).toContain('data-show-close="false"');
    expect(html).toContain('Body');
  });

  test('EaDialog keeps mask dismissal enabled by default while idle', async () => {
    const dialog = getComponent('EaDialog');
    expect(dialog).toBeDefined();
    if (!dialog) return;

    const app = configureElementPlusSsr(
      createSSRApp({
        render: () => h(dialog, { modelValue: true, title: 'Settings' }),
      }),
    );
    app.component(
      'ElDialog',
      defineComponent({
        inheritAttrs: false,
        props: { closeOnClickModal: Boolean },
        setup: props => () =>
          h('section', { 'data-close-on-click-modal': String(props.closeOnClickModal) }),
      }),
    );

    const html = await renderToString(app);
    expect(html).toContain('data-close-on-click-modal="true"');
  });

  test('EaDialog preserves an explicit width during migration', async () => {
    const dialog = getComponent('EaDialog');
    expect(dialog).toBeDefined();
    if (!dialog) return;

    const app = configureElementPlusSsr(
      createSSRApp({
        render: () => h(dialog, { modelValue: true, width: '560px' }),
      }),
    );
    app.component(
      'ElDialog',
      defineComponent({
        inheritAttrs: false,
        props: { width: [String, Number] },
        setup: props => () => h('section', { 'data-width': String(props.width) }),
      }),
    );

    const html = await renderToString(app);
    expect(html).toContain('data-width="560px"');
  });
});
