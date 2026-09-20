import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it, vi } from 'vitest';
import Editor from './BuffBlackboardEditor.vue';

it('shows initial values immediately in a root Inspector', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Editor, { blackboard: { number: 8, text: 'sample', empty: null }, alwaysExpanded: true }),
    }),
  );
  expect(html).toContain('value="sample"');
  expect(html).toContain('aria-label="黑板键"');
  expect(html).toContain('aria-label="黑板值"');
  expect(html).not.toContain('▸');
});

it('does not reset a value when its current type is selected again', async () => {
  let editor: any;
  const update = vi.fn();
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
          { blackboard: { value: 8 }, onUpdate: update },
        ),
    }),
  );
  editor.setKind('value', { target: { value: 'number' } });
  editor.setKind('value', { target: { value: 'unknown' } });
  expect(update).not.toHaveBeenCalled();
  editor.addEntry();
  expect(editor.collapsed.value).toBe(false);
});
