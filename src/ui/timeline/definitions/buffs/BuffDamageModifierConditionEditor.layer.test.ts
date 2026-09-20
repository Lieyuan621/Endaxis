import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it, vi } from 'vitest';
import Editor from './BuffDamageModifierConditionEditor.vue';
import type { DamageModifierCondition } from '../../../../../packages/game-data-contract/src/modifiers';

async function render(condition: DamageModifierCondition, layerOnly = true) {
  const app = createSSRApp({ render: () => h(Editor, { condition, layerOnly }) });
  app.use(
    createI18n({
      legacy: false,
      locale: 'zh-CN',
      messages: {},
      missingWarn: false,
      fallbackWarn: false,
    }),
  );
  return renderToString(app);
}
it('preserves children when changing all/any and leaves same-type selection untouched', async () => {
  const condition: DamageModifierCondition = {
    kind: 'all',
    conditions: [
      {
        kind: 'buffBlackboardCompare',
        left: { blackboardKey: 'damage' },
        operator: 'greater',
        right: 3,
      },
      { kind: 'not', condition: { kind: 'casterControlled' } },
    ],
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
          { condition, layerOnly: true, onUpdate: update },
        ),
    }),
  );
  const choose = (value: string) => editor.setKind({ target: { value } });
  choose('all');
  choose('unknown');
  expect(update).not.toHaveBeenCalled();
  choose('any');
  expect(update).toHaveBeenLastCalledWith({ ...condition, kind: 'any' });
  choose('casterControlled');
  expect(update).toHaveBeenLastCalledWith({ kind: 'casterControlled' });
  expect(condition.conditions).toHaveLength(2);
});
it('keeps recursive children out of the layer Inspector but leaves the standalone editor functional', async () => {
  const condition: DamageModifierCondition = {
    kind: 'not',
    condition: {
      kind: 'all',
      conditions: [{ kind: 'buffBlackboardCompare', left: 1, operator: 'equal', right: 2 }],
    },
  };
  const layer = await render(condition);
  expect(layer).toContain('子条件在节点图中编辑');
  expect(layer).not.toContain('左操作数');
  const standalone = await render(condition, false);
  expect(standalone).toContain('左操作数');
  expect(standalone).not.toContain('子条件在节点图中编辑');
});
it('renders Buff identities as independent entries without splitting commas or discarding duplicates', async () => {
  const html = await render({
    kind: 'buffIdCountCompare',
    target: 'caster',
    operator: 'equal',
    value: 1,
    buffIds: ['a,b', 'a,b', ''],
  });
  expect(html.match(/value="a,b"/g)).toHaveLength(2);
  expect(html).toContain('value=""');
});
