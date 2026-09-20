import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it, vi } from 'vitest';
import Picker from './SearchableOptionPicker.vue';
it('filters shared options and selects the focused value with Enter', async () => {
  let picker: any;
  const select = vi.fn();
  const app = createSSRApp({
    render: () =>
      h(
        {
          ...(Picker as ComponentOptions),
          setup(props: any, ctx: any) {
            picker = (Picker as any).setup(props, ctx);
            return picker;
          },
          ssrRender: () => {},
        },
        {
          anchor: { x: 0, y: 0 },
          title: 'Buff',
          options: [
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ],
          onSelect: select,
        },
      ),
  });
  await renderToString(app);
  picker.query.value = 'BETA';
  expect(picker.filtered.value.map((x: { value: string }) => x.value)).toEqual(['b']);
  picker.keys({ key: 'Enter', preventDefault: vi.fn(), stopPropagation: vi.fn() });
  expect(select).toHaveBeenCalledWith('b');
  picker.query.value = 'no-match';
  picker.keys({ key: 'Enter', preventDefault: vi.fn(), stopPropagation: vi.fn() });
  expect(select).toHaveBeenCalledTimes(1);
});
