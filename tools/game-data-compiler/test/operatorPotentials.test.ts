import { describe, expect, it } from 'vitest';

import { parseOperatorPotentialSource } from '../src/index.ts';

describe('干员 CharacterPotentialTable 适配', () => {
  it('保留原生潜能等级顺序与效果包引用', () => {
    expect(parseOperatorPotentialSource(table(), 'chr_test')).toEqual({
      sourcePath: 'CharacterPotentialTable.chr_test',
      characterId: 'chr_test',
      firstItemId: 'item_first',
      unlocks: [
        {
          sourcePath: 'CharacterPotentialTable.chr_test.potentialUnlockBundle[0]',
          level: 1,
          effectId: 'chr_test_potential_1',
        },
        {
          sourcePath: 'CharacterPotentialTable.chr_test.potentialUnlockBundle[1]',
          level: 2,
          effectId: 'chr_test_potential_2',
        },
      ],
    });
  });

  it('拒绝重复等级、成本数组错位和未知字段', () => {
    const duplicate = table();
    duplicate.chr_test.potentialUnlockBundle[1]!.level = 1;
    expect(() => parseOperatorPotentialSource(duplicate, 'chr_test')).toThrow(
      'duplicate potential level 1',
    );

    const mismatched = table();
    mismatched.chr_test.potentialUnlockBundle[0]!.itemCnts = [];
    expect(() => parseOperatorPotentialSource(mismatched, 'chr_test')).toThrow('length mismatch');

    const drifted = table();
    Object.assign(drifted.chr_test.potentialUnlockBundle[0]!, { futureField: true });
    expect(() => parseOperatorPotentialSource(drifted, 'chr_test')).toThrow('unexpected fields');
  });
});

function table() {
  return {
    chr_test: {
      firstItemId: 'item_first',
      potentialUnlockBundle: [unlock(1), unlock(2)],
    },
  };
}

function unlock(level: number) {
  return {
    itemCnts: [1],
    itemIds: [`item_${level}`],
    level,
    name: { id: level, text: '' },
    potentialEffectId: `chr_test_potential_${level}`,
    unlockCardTopicItem: '',
    unlockCharPictureItemList: [],
  };
}
