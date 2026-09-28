import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { createRenderer, createSSRApp, h, ssrContextKey } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it } from 'vitest';
import NodeInspectorFields from './NodeInspectorFields.vue';
import type { NodeFieldSchema } from './nodeSchema';

const fields: NodeFieldSchema[] = [
  {
    path: ['mode'],
    label: '模式',
    description: '',
    type: 'string',
    required: true,
    control: 'select',
    options: ['hit', 'block'],
  },
  {
    path: ['amount'],
    label: '数值',
    description: '',
    type: 'number',
    required: true,
    control: 'number',
  },
  {
    path: ['flags'],
    label: '标记',
    description: '',
    type: 'string[]',
    required: true,
    control: 'multiselect',
    options: ['dot'],
  },
  {
    path: ['raw'],
    label: '原始值',
    description: '',
    type: 'object',
    required: true,
    control: 'json',
  },
];
const value = { mode: 'hit', amount: 2, flags: ['dot'], raw: { nested: true } };
const i18n = () =>
  createI18n({
    legacy: false,
    locale: 'zh',
    messages: {
      zh: {
        editor: { help: '帮助' },
      },
    },
  });

it('renders the shared field controls in the graph inspector', async () => {
  const app = createSSRApp({
    render: () => h(NodeInspectorFields, { value, kind: 'test', fields, applyValue: () => true }),
  });
  app.use(i18n());
  app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 });
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
  const html = await renderToString(app);
  for (const className of ['ea-select', 'ea-input', 'ea-checkbox', 'ea-textarea']) {
    expect(html).toContain(className);
  }
});

it('commits a selected option through the existing field transaction', () => {
  const applied: unknown[] = [];
  const component: any = NodeInspectorFields;
  let panel: any;
  const app = createRenderer<object, object>({
    insert() {},
    remove() {},
    patchProp() {},
    setText() {},
    setElementText() {},
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    parentNode: () => null,
    nextSibling: () => null,
  }).createApp({
    render: () =>
      h(
        {
          ...component,
          setup(props: any, context: any) {
            panel = component.setup(props, context);
            return panel;
          },
          render: () => null,
        },
        {
          value,
          kind: 'test',
          fields,
          applyValue: (next: unknown) => {
            applied.push(next);
            return true;
          },
        },
      ),
  });
  app.use(i18n());
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  try {
    panel.selectValue('mode', '"block"');
    expect(applied).toEqual([{ ...value, mode: 'block' }]);
    panel.selectValue('mode', ['"hit"']);
    expect(applied).toHaveLength(1);
  } finally {
    app.unmount();
  }
});
