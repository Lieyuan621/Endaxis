import { createRenderer, h, nextTick, ref, ssrContextKey } from 'vue';
import { createI18n } from 'vue-i18n';
import { expect, it } from 'vitest';
import NodeLevelValues from './NodeLevelValues.vue';

function i18n() {
  return createI18n({
    legacy: false,
    locale: 'zh',
    messages: {
      zh: {
        actionGraphEditor: {
          unset: '未设置',
          singleValue: '单值',
          levelValues: '逐级值',
          levelIndex: '第 {index} 级',
          removeValue: '删除',
          addValue: '添加',
        },
      },
    },
  });
}

it('keeps invalid drafts local and commits valid level values', async () => {
  const text = ref('[2,5]');
  const changes: string[] = [];
  const component: any = NodeLevelValues;
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
          text: text.value,
          required: false,
          label: '技能数值',
          onChange: (next: string) => {
            changes.push(next);
            text.value = next;
          },
        },
      ),
  });
  app.use(i18n());
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  try {
    panel.drafts.value[0] = '';
    panel.update(0, '');
    expect(changes).toEqual([]);
    expect(panel.drafts.value[0]).toBe('2');

    panel.update(0, '3.5');
    await nextTick();
    expect(text.value).toBe('[3.5,5]');
    panel.switchMode('single');
    expect(changes.at(-1)).toBe('3.5');
  } finally {
    app.unmount();
  }
});
