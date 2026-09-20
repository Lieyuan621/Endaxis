import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it, vi } from 'vitest';
import Editor from './BuffShieldEditor.vue';
import Absorption from './BuffShieldAbsorptionInspector.vue';
import { createBuffShield } from './buffShieldGraph';

it('护盾 Inspector 同时编辑公式与可折叠的吸收规则', async () => {
  const shield = {
    ...createBuffShield(),
    value: {
      attribute: 'HpMax',
      attributeSource: 'buffSource' as const,
      multiplier: { blackboardKey: 'shield' },
      addition: 3,
    },
    damageAbsorptions: [{ damageType: 'electric' as const, ratio: 0.5, scale: 2 }],
  };
  const layer = await renderToString(
    createSSRApp({ render: () => h(Editor, { shields: [shield], singleEntry: true }) }),
  );
  expect(layer).toContain('value="HpMax"');
  expect(layer).toContain('value="shield"');
  expect(layer).toContain('分伤害类型吸收');
  expect(layer).toContain('<details');
  expect(layer).toContain('value="0.5"');
  expect(layer).not.toContain('display:none');
  const standalone = await renderToString(
    createSSRApp({ render: () => h(Editor, { shields: [shield] }) }),
  );
  expect(standalone).toContain('分伤害类型吸收');
  const absorption = await renderToString(
    createSSRApp({ render: () => h(Absorption, { absorption: shield.damageAbsorptions[0]! }) }),
  );
  expect(absorption).toContain('value="electric"');
  expect(absorption).toContain('value="0.5"');
  expect(absorption).toContain('value="2"');
});

it('does not reset same-kind shield values and preserves independent shield properties on switching', async () => {
  const shield = { ...createBuffShield(), absorbCount: 3, value: { blackboardKey: 'shield' } };
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
          { shields: [shield], onUpdate: update },
        ),
    }),
  );
  editor.setValueKind(0, shield, { target: { value: 'direct' } });
  editor.setValueKind(0, shield, { target: { value: 'unknown' } });
  expect(update).not.toHaveBeenCalled();
  editor.setValueKind(0, shield, { target: { value: 'attribute' } });
  expect(update).toHaveBeenLastCalledWith(
    [{ ...shield, value: { attribute: 'HpMax', multiplier: 1, addition: 0 } }],
    undefined,
  );
  editor.addAbsorption(0, shield);
  let changed = update.mock.lastCall![0][0];
  expect(changed.damageAbsorptions).toHaveLength(1);
  expect(update.mock.lastCall![1]).toBe('damageAbsorptions');
  editor.replaceAbsorption(0, changed, 0, { ratio: { blackboardKey: 'ratio' } });
  changed = update.mock.lastCall![0][0];
  editor.duplicateAbsorption(0, changed, 0);
  changed = update.mock.lastCall![0][0];
  expect(changed.damageAbsorptions).toHaveLength(2);
  expect(changed.damageAbsorptions[0].ratio).not.toBe(changed.damageAbsorptions[1].ratio);
  editor.replaceAbsorption(0, changed, 1, { damageType: 'electric' });
  changed = update.mock.lastCall![0][0];
  editor.moveAbsorption(0, changed, 1, -1);
  changed = update.mock.lastCall![0][0];
  expect(changed.damageAbsorptions[0].damageType).toBe('electric');
  editor.removeAbsorption(0, changed, 0);
  changed = update.mock.lastCall![0][0];
  expect(changed.damageAbsorptions).toHaveLength(1);
  expect(changed.absorbCount).toBe(3);
  expect(shield.damageAbsorptions).toHaveLength(0);
});
