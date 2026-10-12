import { describe, expect, it } from 'vitest';

import { readGameIconReferences } from '../../src/compiler/publication/gameIconReferences.ts';

describe('game icon reference closure', () => {
  it('includes implicit operator icons and named variants under the asset slug', () => {
    expect(
      readGameIconReferences(`
      const operator = { slug: 'custom', weaponType: 'sword', assetSlug: 'arcane',
        skillGroups: [], skills: [{ icon: 'endaxis:operators/arcane/ultimate_03' }], variants: [{ icon: 'endaxis:operators/arcane/battle_02' }] };
    `),
    ).toEqual([
      '/icons/icon_attack_sword.webp',
      '/operators/arcane/battle 01.webp',
      '/operators/arcane/battle 02.webp',
      '/operators/arcane/combo 01.webp',
      '/operators/arcane/ultimate 01.webp',
      '/operators/arcane/ultimate 03.webp',
    ]);
  });
  it('includes generated enemy icons without accepting unrelated webp strings', () => {
    expect(
      readGameIconReferences(`
        const enemy = '/enemies/eny_0127_bigents.webp';
        const equipment = '/equipment/foo.webp';
        const contract = '/contingency_contract/1/icon_activity_contract_tag_111_2.webp';
        const unrelated = '/screenshots/example.webp';
        const native = ${JSON.stringify('<image="/icons/new_icon.webp">')};
      `),
    ).toEqual([
      '/contingency_contract/1/icon_activity_contract_tag_111_2.webp',
      '/enemies/eny_0127_bigents.webp',
      '/equipment/foo.webp',
      '/icons/new_icon.webp',
    ]);
  });
});
