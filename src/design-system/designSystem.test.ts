import { createSSRApp, h, type Component } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { expect, test, vi } from 'vitest';

// 浮层只替换容器，用于验证适配器传入的交互状态。
vi.mock('element-plus', async importOriginal => {
  const original = await importOriginal<typeof import('element-plus')>();
  const { defineComponent, h } = await import('vue');
  const surface = defineComponent({
    inheritAttrs: false,
    setup:
      (_, { attrs, slots }) =>
      () =>
        h(
          'section',
          Object.fromEntries(
            Object.entries(attrs).map(([key, value]) => [
              'data-' + key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()),
              String(value),
            ]),
          ),
          slots.default?.(),
        ),
  });
  return { ...original, ElDialog: surface, ElDrawer: surface };
});

const components = import.meta.glob<{ default: Component }>('./components/*/*.vue', {
  eager: true,
});
function component(name: string): Component {
  const found = components[`./components/${name}/${name}.vue`]?.default;
  if (!found) throw new Error(`missing ${name}`);
  return found;
}

async function render(element: ReturnType<typeof h>): Promise<string> {
  const app = createSSRApp({ render: () => element });
  app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 });
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
  return renderToString(app);
}

test('loading button disables repeated input and exposes busy state', async () => {
  const html = await render(h(component('EaButton'), { loading: true }, () => 'Save'));
  expect(html).toMatch(/<button[^>]*disabled/);
  expect(html).toContain('aria-busy="true"');
});

test('form error reaches the nested input and its accessible description', async () => {
  const html = await render(
    h(
      component('EaFormField'),
      { controlId: 'nickname', label: 'Nickname', error: 'Required' },
      { default: () => h(component('EaInput'), { modelValue: '' }) },
    ),
  );
  expect(html).toContain('id="nickname-error"');
  expect(html).toContain('aria-describedby="nickname-error"');
  expect(html).toContain('aria-invalid="true"');
});

test('indeterminate checkbox reports a mixed state', async () => {
  const html = await render(h(component('EaCheckbox'), { indeterminate: true }, () => 'Mixed'));
  expect(html).toContain('aria-checked="mixed"');
});

test('compact number input uses the shared small right-side stepper', async () => {
  const html = await render(h(component('EaNumberInput'), { modelValue: 8, compact: true }));
  expect(html).toContain('ea-number-input--compact');
  expect(html).toContain('el-input-number--small');
  expect(html).toContain('is-controls-right');
});

test('busy dialog blocks every dismissal path', async () => {
  const html = await render(
    h(component('EaDialog'), { modelValue: true, title: 'Export', busy: true }),
  );
  expect(html).toContain('data-close-on-click-modal="false"');
  expect(html).toContain('data-close-on-press-escape="false"');
  expect(html).toContain('data-show-close="false"');
});
