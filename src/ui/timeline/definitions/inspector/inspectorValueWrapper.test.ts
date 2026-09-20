import { describe, expect, it } from 'vitest';
import { createSSRApp, defineComponent, h, provide } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createI18n } from 'vue-i18n';
import InspectorFields from './InspectorFields.vue';
import { createDefinitionEditContext, type DefinitionProperty } from '../definitionEditContext';
import { createInspectorField } from './inspectorFields';
import { extendInspectorEditors, inspectorEditorRegistryKey } from './inspectorEditors';
import { inspectorValueWrapper } from './inspectorValueWrapper';

describe('wrapped inspector binding', () => {
  it.each([['items', 0], ['dictionary', 'entry'], ['variant']] as const)(
    'writes through the current binding without adding a value path: %j',
    async (...path) => {
      let draft = { items: [1], dictionary: { entry: 1 }, variant: 1 };
      const paths: unknown[] = [];
      const context = createDefinitionEditContext({
        read: () => draft,
        commit(next, changedPath) {
          draft = next;
          paths.push(changedPath);
        },
      });
      let binding: DefinitionProperty = context.root;
      for (const key of path) binding = binding.child(key);
      const control = defineComponent({
        props: ['binding'],
        setup(props) {
          props.binding.update((current: number) => current + 1);
          props.binding.update((current: number) => current + 1);
          return () => h('span');
        },
      });
      const app = createSSRApp({
        setup() {
          provide(
            inspectorEditorRegistryKey,
            extendInspectorEditors({
              number: { component: control, props: context => ({ binding: context.binding }) },
            }),
          );
          return () =>
            h(InspectorFields<{ value: unknown }>, {
              value: { value: 1 },
              binding,
              valueAdapter: inspectorValueWrapper,
              fields: [
                createInspectorField<{ value: unknown }>('value', {
                  editor: 'number',
                  labelKey: 'value',
                }),
              ],
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
      expect(binding.read()).toBe(3);
      expect(paths).toEqual([path, path]);
    },
  );
});
