import { describe, expect, it } from 'vitest';

import { readGameIconReferences } from '../../src/compiler/publication/gameIconReferences.ts';

describe('game icon reference closure', () => {
  it('includes generated enemy icons without accepting unrelated webp strings', () => {
    expect(
      readGameIconReferences(`
        const enemy = '/enemies/eny_0127_bigents.webp';
        const equipment = '/equipment/foo.webp';
        const contract = '/contingency_contract/1/icon_activity_contract_tag_111_2.webp';
        const unrelated = '/screenshots/example.webp';
      `),
    ).toEqual([
      '/contingency_contract/1/icon_activity_contract_tag_111_2.webp',
      '/enemies/eny_0127_bigents.webp',
      '/equipment/foo.webp',
    ]);
  });
});
