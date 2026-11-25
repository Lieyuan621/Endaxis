import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mountSetup } from '../../../test/componentSetup';
import Selection from './OperatorPresetSelection.vue';
import { createDefaultOperatorInstance } from '../../../application/editor/loadoutBuildFactory';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { perlica, ember } from '../../../data/operators';
it('按当前干员预选，搜索和范围切换不丢失已选项，全选仅作用于当前列表', async () => {
  const presets = [perlica, ember].map((op, i) => ({
    id: String(i),
    name: op.slug,
    build: {
      operator: createDefaultOperatorInstance(op),
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    },
  }));
  const changes: string[][] = [];
  const f = await mountSetup(Selection, {
    presets,
    initialOperatorSlug: perlica.slug,
    gameData: gameDataRepository,
    onChange: (items: typeof presets) => changes.push(items.map(p => p.id)),
  });
  try {
    expect(changes.at(-1)).toEqual(['0']);
    f.state.scope.value = 'all';
    f.state.search.value = 'ember';
    f.state.toggleVisible(true);
    await nextTick();
    expect(changes.at(-1)).toEqual(['0', '1']);
    f.state.toggleVisible(false);
    await nextTick();
    expect(changes.at(-1)).toEqual(['0']);
  } finally {
    f.stop();
  }
});
