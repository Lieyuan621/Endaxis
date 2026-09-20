import { createSSRApp, defineComponent, h, provide } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import {
  defaultInspectorEditors,
  extendInspectorEditors,
  inspectorEditorRegistryKey,
} from './inspectorEditors';
import { createInspectorField } from './inspectorFields';
import InspectorFields from './InspectorFields.vue';
import { createDefinitionEditContext } from '../definitionEditContext';

describe('属性编辑器注册表', () => {
  it.each([false, true])('复合叶子更新一次送回宿主（直接句柄：%s）', async bound => {
    const received: unknown[][] = [];
    const commits: unknown[][] = [];
    const leaf = defineComponent({
      emits: ['update'],
      setup(_, { emit }) {
        emit('update', 'changed');
        return () => h('span', 'leaf');
      },
    });
    const field = createInspectorField<object>('items', {
      editor: 'array',
      labelKey: 'items',
      element: {
        type: 'dictionary',
        element: {
          type: 'union',
          variants: [
            { type: 'object', properties: { name: { type: 'text' } } },
            { type: 'number' },
          ],
        },
      },
    });
    const original = { items: [{ 'k.dot': { name: 'old' } }] };
    let draft = { parameters: original };
    const context = createDefinitionEditContext({
      read: () => draft,
      commit(next, path) {
        draft = next;
        commits.push([next.parameters, path]);
      },
    });
    const app = createSSRApp({
      setup() {
        provide(
          inspectorEditorRegistryKey,
          extendInspectorEditors({ text: { component: leaf, props: () => ({}) } }),
        );
        return () =>
          h(InspectorFields, {
            value: original,
            binding: bound ? context.root.child('parameters') : undefined,
            fields: [field],
            propertyPath: ['parameters'],
            onUpdate: (...args: unknown[]) => received.push(args),
          });
      },
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'en',
        messages: { en: {} },
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    await renderToString(app);
    expect(bound ? commits : received).toEqual([
      [{ items: [{ 'k.dot': { name: 'changed' } }] }, ['parameters', 'items', 0, 'k.dot', 'name']],
    ]);
    expect(bound ? received : commits).toEqual([]);
    expect(original.items[0]?.['k.dot'].name).toBe('old');
  });

  it('局部覆盖不修改默认表，并沿嵌套参数继承', async () => {
    const custom = defineComponent({
      props: ['value'],
      setup: props => () => h('mark', String(props.value)),
    });
    const editors = extendInspectorEditors({
      text: { component: custom, props: context => ({ value: context.value }) },
    });
    expect(editors.text.component).toBe(custom);
    expect(defaultInspectorEditors.text.component).not.toBe(custom);
    expect(editors.number).toBe(defaultInspectorEditors.number);
    const field = createInspectorField<object>('nested', {
      editor: 'object',
      labelKey: 'nested',
      properties: { name: { type: 'text' } },
    });
    const app = createSSRApp({
      setup() {
        provide(inspectorEditorRegistryKey, editors);
        return () =>
          h(InspectorFields, { value: { nested: { name: 'inherited' } }, fields: [field] });
      },
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'en',
        messages: { en: {} },
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    expect(await renderToString(app)).toMatch(/<mark[^>]*>inherited<\/mark>/);
  });

  it('适配器传递原值及等级，不解析或复制逐级数据', () => {
    const value = [1, 2, 3];
    const props = defaultInspectorEditors.levelValues.props({
      field: { editor: 'levelValues', labelKey: 'value' },
      value,
      currentLevel: 2,
      label: 'value',
      disabled: false,
      translate: key => key,
    });
    expect(props.value).toBe(value);
    expect(props.currentLevel).toBe(2);
  });

  it('布尔默认项与枚举选项由元数据适配，控件不接收整份草稿', () => {
    const props = defaultInspectorEditors.boolean.props({
      field: { editor: 'boolean', labelKey: 'enabled', optional: true },
      value: undefined,
      label: 'enabled',
      disabled: true,
      currentLevel: 1,
      translate: key => key,
    });
    expect(props.optional).toBe(true);
    expect(props.disabled).toBe(true);
    expect(props.value).toBeUndefined();
    expect(props).not.toHaveProperty('write');
    expect(props).not.toHaveProperty('history');
  });
});
