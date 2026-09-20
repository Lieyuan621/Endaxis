import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it, vi } from 'vitest';
import Editor from './CombatBuffPresentationEditor.vue';

it('表现属性与排序在同一个 Inspector 分区中编辑', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Editor, {
          initiallyCollapsed: false,
          presentation: {
            iconId: 'sample',
            visible: false,
            orderPriority: { useDirectoryValue: false, value: 2, category: 'x' },
          },
        }),
    }),
  );
  expect(html).toContain('value="sample"');
  expect(html).toContain('终结技按钮显示进度');
  expect(html).toContain('排序优先级');
  expect(html).toContain('<summary');
});

it('清空最后一个字段不移除表现定义', async () => {
  const update = vi.fn();
  let editor: any;
  await renderToString(
    createSSRApp({
      render: () =>
        h(
          {
            ...(Editor as ComponentOptions),
            setup(props: any, context: any) {
              editor = (Editor as any).setup(props, context);
              return editor;
            },
            ssrRender: () => {},
          },
          { initiallyCollapsed: false, presentation: { visible: false }, onUpdate: update },
        ),
    }),
  );
  editor.setBoolean('visible', { target: { value: '' } });
  expect(update).toHaveBeenLastCalledWith({});
});
