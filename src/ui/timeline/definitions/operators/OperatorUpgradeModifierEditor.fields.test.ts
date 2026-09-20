import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it, vi } from 'vitest';
import Page from './OperatorUpgradeModifierEditor.vue';
import { definitionAllLevelsKey } from '../definitionLevelEditing';

it('uses explicit level fields while keeping nested conditions in the graph', async () => {
  const app = createSSRApp({
    render: () =>
      h(Page, {
        modifier: {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'skill',
          blackboardKey: 'damage',
          operation: 'add',
          value: [2, 5],
          condition: {
            kind: 'deckAttributeCompare',
            left: 'strength',
            operator: 'equal',
            right: 'agility',
          },
        },
        skillGroupKeys: ['skill'],
        passiveSkillKeys: [],
        conditionInGraph: true,
      }),
  });
  app.provide(definitionAllLevelsKey, true);
  const html = await renderToString(app);
  expect(html).toContain('level-values-editor');
  expect(html).toContain('value="2"');
  expect(html).toContain('value="5"');
  expect(html).not.toContain('逗号');
  expect(html).not.toContain('class="build-condition"');
  expect(html).toContain('data-property-path="[&quot;value&quot;]"');
});

it('emits property locations and does not silently turn empty numeric fields into zero', async () => {
  let panel: any;
  const update = vi.fn();
  await renderToString(
    createSSRApp({
      render: () =>
        h(
          {
            ...(Page as any),
            setup(props: any, context: any) {
              panel = (Page as any).setup(props, context);
              return panel;
            },
            ssrRender() {},
          },
          {
            modifier: {
              kind: 'multiplySkillCost',
              skillGroupKey: 'x',
              resource: 'sp',
              multiplier: 1,
            },
            skillGroupKeys: [],
            passiveSkillKeys: [],
            onUpdate: update,
          },
        ),
    }),
  );
  panel.numberInput('multiplier', { target: { value: '' } });
  expect(update).not.toHaveBeenCalled();
  panel.numberInput('multiplier', { target: { value: '0.5' } });
  expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ multiplier: 0.5 }), [
    'multiplier',
  ]);
  panel.patch({ value: [3, 9] });
  expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ value: [3, 9] }), ['value']);
});
