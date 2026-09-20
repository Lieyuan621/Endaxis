import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it, vi } from 'vitest';
import Inspector from './BuffDamageProcessorInspector.vue';
import type { CombatBuffDefinitionDamageProcessor } from '../../../../../packages/game-data-contract/src/buffs';
import { ATTRIBUTE_MODIFIER_SLOTS } from '../../../../../packages/game-data-contract/src/modifiers';

it('edits a single processor without losing its kind, runtime timing or untouched slots', async () => {
  const values = {
    addition: 1,
    multiplier: 2,
    finalAddition: 3,
    finalMultiplier: 4,
    baseAddition: 5,
    baseMultiplier: 6,
    baseFinalAddition: 7,
    baseFinalMultiplier: 8,
  };
  const processor: CombatBuffDefinitionDamageProcessor = {
    kind: 'instantAttribute',
    targetSide: 'attacker',
    attribute: 'Atk',
    attributeTiming: 'runtime',
    values,
  };
  const update = vi.fn();
  let editor: any;
  const app = createSSRApp({
    render: () =>
      h(
        {
          ...(Inspector as ComponentOptions),
          setup(props: any, context: any) {
            editor = (Inspector as any).setup(props, context);
            return editor;
          },
          ssrRender: () => {},
        },
        { processor, onUpdate: update },
      ),
  });
  await renderToString(app);
  editor.setFullValue('addition', { target: { value: '' } });
  expect(update).not.toHaveBeenCalled();
  editor.setFullValue('addition', { target: { value: '12' } });
  expect(update).toHaveBeenCalledWith({ ...processor, values: { ...values, addition: 12 } });
  expect(processor.values).toEqual(values);
  update.mockClear();
  editor.setKind({ target: { value: 'instantAttribute' } });
  editor.setKind({ target: { value: 'unknown' } });
  expect(update).not.toHaveBeenCalled();
  editor.setKind({ target: { value: 'damageScale' } });
  expect(update).toHaveBeenCalledWith({
    kind: 'damageScale',
    side: 'attacker',
    zone: 'normal',
    addition: 0,
  });
});

it('renders both processor kinds and sparse/full attribute values', async () => {
  const render = (processor: CombatBuffDefinitionDamageProcessor) =>
    renderToString(createSSRApp({ render: () => h(Inspector, { processor }) }));
  const scale = await render({
    kind: 'damageScale',
    side: 'defender',
    zone: 'normal',
    addition: 0.2,
  });
  expect(scale).toContain('倍率区间');
  expect(scale).not.toContain('属性键');
  const sparse = await render({
    kind: 'instantAttribute',
    targetSide: 'attacker',
    attribute: 'Atk',
    attributeTiming: 'runtime',
    values: { slot: 'baseAddition', value: { blackboardKey: 'atk' } },
  });
  expect(sparse).toContain('聚合槽位');
  expect(sparse).not.toContain('完整八槽值');
  const full = await render({
    kind: 'instantAttribute',
    targetSide: 'attacker',
    attribute: 'Atk',
    attributeTiming: 'runtime',
    values: {
      addition: 1,
      multiplier: 2,
      finalAddition: 3,
      finalMultiplier: 4,
      baseAddition: 5,
      baseMultiplier: 6,
      baseFinalAddition: 7,
      baseFinalMultiplier: 8,
    },
  });
  for (const slot of ATTRIBUTE_MODIFIER_SLOTS) expect(full).toContain(slot);
  expect(full).toContain('完整八槽值');
});
