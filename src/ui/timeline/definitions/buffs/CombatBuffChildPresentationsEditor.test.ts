import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it, vi } from 'vitest';
import Editor from './CombatBuffChildPresentationsEditor.vue';

const children = [
  {
    buffId: 'child-buff-1',
    presentation: { orderPriority: { useDirectoryValue: false, value: 7, category: 'qa' } },
  },
];

it('条目和嵌套折叠区保留真实属性路径，不新增图节点', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Editor, {
          children,
          propertyPath: ['buffDefinitions', 'qa', 'childPresentations'],
        }),
    }),
  );
  expect(html).toContain(
    '[&quot;buffDefinitions&quot;,&quot;qa&quot;,&quot;childPresentations&quot;,0]',
  );
  expect(html).toContain(
    '[&quot;buffDefinitions&quot;,&quot;qa&quot;,&quot;childPresentations&quot;,0,&quot;presentation&quot;]',
  );
  expect(html).toContain('title="复制子表现"');
  expect(html).toContain('value="7"');
});

it('复制深拷贝并分配独立 ID，编辑和排序报告集合内定位', async () => {
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
          { children, onUpdate: update },
        ),
    }),
  );
  editor.duplicate(0);
  const [copied, focus] = update.mock.lastCall!;
  expect(focus).toEqual([1]);
  expect(copied[1].buffId).toBe('child-buff-2');
  expect(copied[1].presentation).toEqual(children[0]!.presentation);
  copied[1].presentation.orderPriority.value = 9;
  expect(children[0]!.presentation.orderPriority.value).toBe(7);
  editor.setPresentation(0, children[0], { visible: false });
  expect(update.mock.lastCall![1]).toEqual([0, 'presentation']);
  editor.setBuffId(0, children[0], { target: { value: 'renamed' } });
  expect(update.mock.lastCall![0][0].buffId).toBe('renamed');
  expect(update.mock.lastCall![1]).toEqual([0, 'buffId']);
  editor.remove(0);
  expect(update).toHaveBeenLastCalledWith([], [0]);
});
