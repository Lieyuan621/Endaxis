import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it, vi } from 'vitest';
import Field from './RoutingSkillListField.vue';
async function render(value: readonly string[] | undefined, optional = true) {
  const app = createSSRApp({
    render: () => h(Field, { label: '技能列表', field: 'keys', value, optional }),
  });
  app.use(createI18n({ legacy: false, locale: 'zh-CN', messages: {} }));
  return renderToString(app);
}
it('distinguishes an omitted optional list from an explicit empty list', async () => {
  const absent = await render(undefined);
  const empty = await render([]);
  expect(absent).toContain('未设置此字段');
  expect(absent).not.toContain('inspector-list__add');
  expect(empty).toContain('空列表');
  expect(empty).toContain('inspector-list__add');
  expect(await render([], false)).not.toContain('type="checkbox"');
});
it('preserves separate entries, including commas, duplicates and invalid references', async () => {
  const value = ['missing,with-comma', 'same', 'same'];
  const html = await render(value);
  expect(html).toContain('value="missing,with-comma"');
  expect(html.match(/value="same"/g)).toHaveLength(2);
  expect(value).toEqual(['missing,with-comma', 'same', 'same']);
});

it('selects and reorders without normalizing unknown or repeated entries; cancel does not write', async () => {
  let field: any;
  const update = vi.fn();
  const value = ['unknown,raw', 'same', 'same'];
  await renderToString(
    createSSRApp({
      render: () =>
        h(
          {
            ...(Field as any),
            setup(props: any, context: any) {
              field = (Field as any).setup(props, context);
              return field;
            },
            ssrRender() {},
          },
          {
            label: '技能',
            field: 'keys',
            value,
            skillKeys: ['same', 'same', 'other'],
            onUpdate: update,
          },
        ),
    }),
  );
  expect(field.options.value.map((option: { value: string }) => option.value)).toEqual([
    'same',
    'other',
  ]);
  field.choose({ clientX: 10, clientY: 20 }, 0);
  expect(update).not.toHaveBeenCalled();
  field.picker.value = undefined;
  field.select('other');
  expect(update).not.toHaveBeenCalled();
  field.choose({ clientX: 10, clientY: 20 }, 0);
  field.select('other');
  expect(update).toHaveBeenLastCalledWith(['other', 'same', 'same']);
  field.choose({ clientX: 10, clientY: 20 });
  field.select('same');
  expect(update).toHaveBeenLastCalledWith(['unknown,raw', 'same', 'same', 'same']);
  field.move(0, 1);
  expect(update).toHaveBeenLastCalledWith(['same', 'unknown,raw', 'same']);
  const calls = update.mock.calls.length;
  field.move(0, -1);
  field.move(2, 1);
  expect(update).toHaveBeenCalledTimes(calls);
  expect(value).toEqual(['unknown,raw', 'same', 'same']);
});
