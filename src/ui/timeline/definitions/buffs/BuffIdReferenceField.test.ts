import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import Field from './BuffIdReferenceField.vue';
const render = (value: string) =>
  renderToString(
    createSSRApp({
      render: () =>
        h(Field, {
          label: '状态 Buff',
          value,
          localIds: ['local', 'shared'],
          commonIds: ['common', 'shared'],
        }),
    }),
  );
it('offers both catalogs without duplicates and reveals only local definitions', async () => {
  const local = await render('local');
  expect(local).toContain('查看定义');
  expect(local).toContain('选择状态 Buff');
  const common = await render('common');
  expect(common).toContain('公共 Buff 定义');
  expect(common).not.toContain('查看定义');
});
it('keeps empty and unknown references editable and explains their state', async () => {
  expect(await render('')).toContain('尚未指定引用');
  const unknown = await render('custom-missing');
  expect(unknown).toContain('value="custom-missing"');
  expect(unknown).toContain('保留此引用');
  expect(unknown).not.toContain('disabled');
});
