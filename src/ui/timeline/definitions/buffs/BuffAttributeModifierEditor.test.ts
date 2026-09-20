import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it, vi } from 'vitest';
import Editor from './BuffAttributeModifierEditor.vue';
import type { CombatBuffDefinitionAttributeModifier } from '../../../../../packages/game-data-contract/src/buffs';

it('renders deferred attribute selectors without coercing their objects to text', async () => {
  const modifiers: CombatBuffDefinitionAttributeModifier[] = ['main', 'secondary', 'all'].map(
    kind => ({
      attribute: { kind: kind as 'main' | 'secondary' | 'all' },
      slot: 'baseAddition',
      value: 1,
    }),
  );
  const html = await renderToString(createSSRApp({ render: () => h(Editor, { modifiers }) }));
  expect(html).not.toContain('[object Object]');
  expect(html).not.toContain('属性键');
  for (const kind of ['main', 'secondary', 'all'])
    expect(html).toContain(`<select value="${kind}"`);
});

it('changes only the attribute selector and preserves the blackboard, source and target', async () => {
  const modifier: CombatBuffDefinitionAttributeModifier = {
    attribute: 'custom',
    slot: 'finalAddition',
    value: { blackboardKey: 'value' },
    source: 'converted',
    target: 'buffSource',
  };
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
          { modifiers: [modifier], onUpdate: update },
        ),
    }),
  );
  editor.setAttributeSelection(0, modifier, { target: { value: 'specific' } });
  editor.setAttributeSelection(0, modifier, { target: { value: 'invalid' } });
  expect(update).not.toHaveBeenCalled();
  editor.setAttributeSelection(0, modifier, { target: { value: 'main' } });
  expect(update).toHaveBeenLastCalledWith([{ ...modifier, attribute: { kind: 'main' } }]);
  editor.setAttributeSelection(
    0,
    { ...modifier, attribute: { kind: 'main' } },
    { target: { value: 'specific' } },
  );
  expect(update).toHaveBeenLastCalledWith([{ ...modifier, attribute: 'Atk' }]);
  expect(modifier.attribute).toBe('custom');
});
