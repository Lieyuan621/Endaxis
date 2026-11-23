import { afterEach, expect, test } from 'vitest';
import { nextTick } from 'vue';
import Filter from './OperatorPresetOperatorFilter.vue';
import { mountSetup } from '../../../test/componentSetup';
import { createDefaultOperatorInstance } from '../../../application/editor/loadoutBuildFactory';
import {
  perlica,
  ember,
  endministrator,
  gilberta,
  antal,
  operatorDefinitions,
} from '../../../data/operators';
import { gameDataRepository } from '../../../data/gameDataRepository';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  stop = undefined;
});
const preset = (operator: OperatorDefinition) => ({
  id: operator.slug,
  name: operator.slug,
  build: {
    operator: createDefaultOperatorInstance(operator),
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
  },
});

test('preset operators use native directory IDs within rarity groups in both locales', async () => {
  const definitions = [gilberta, antal, ember, endministrator, perlica];
  const mounted = await mountSetup(Filter, {
    presets: definitions.map(operator => preset(operator)),
    gameData: gameDataRepository,
  });
  stop = mounted.stop;
  const initialLocale = mounted.state.locale.value;
  try {
    for (const locale of ['zh-CN', 'en']) {
      mounted.state.locale.value = locale;
      await nextTick();
      expect(
        mounted.state.operators.value.map((operator: { value: string }) => operator.value),
      ).toEqual(
        operatorDefinitions
          .filter(operator => definitions.includes(operator))
          .map(operator => operator.slug),
      );
      expect(
        mounted.state.operatorGroups.value.map(
          (group: { rarity: number; list: { value: string }[] }) => ({
            rarity: group.rarity,
            ids: group.list.map(operator => operator.value),
          }),
        ),
      ).toEqual([
        { rarity: 6, ids: [endministrator.slug, ember.slug, gilberta.slug] },
        { rarity: 5, ids: [perlica.slug] },
        { rarity: 4, ids: [antal.slug] },
      ]);
    }
  } finally {
    mounted.state.locale.value = initialLocale;
  }
});

test('project operators follow built-ins within a rarity group without using their portrait as an ID', async () => {
  const custom: OperatorDefinition = {
    ...endministrator,
    slug: 'project:operator:private-order',
    assetSlug: endministrator.slug,
    displayName: 'A private operator',
  };
  const repository = {
    ...gameDataRepository,
    getOperator: (slug: string) =>
      slug === custom.slug ? custom : gameDataRepository.getOperator(slug),
    getOperators: () => [...gameDataRepository.getOperators(), custom],
  };
  const mounted = await mountSetup(Filter, {
    presets: [preset(custom), preset(ember), preset(endministrator)],
    gameData: repository,
  });
  stop = mounted.stop;
  expect(
    mounted.state.operatorGroups.value[0].list.map((operator: { value: string }) => operator.value),
  ).toEqual([endministrator.slug, ember.slug, custom.slug]);
});

test('zero-count current and selected operators keep directory order after deletion', async () => {
  const mounted = await mountSetup(Filter, {
    presets: [preset(ember)],
    gameData: gameDataRepository,
    currentOperatorSlug: perlica.slug,
  });
  stop = mounted.stop;
  mounted.state.selectOperator(perlica.slug);
  await mounted.update({ presets: [] });
  expect(mounted.state.selectedOperator.value).toMatchObject({ value: perlica.slug, count: 0 });
  expect(
    mounted.state.operatorGroups.value.map((group: { rarity: number }) => group.rarity),
  ).toEqual([perlica.rarity]);
});
