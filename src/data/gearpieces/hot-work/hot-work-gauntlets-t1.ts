import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Hot Work Gauntlets T1',
  icon: '/equipment/fire_natr01/item_equip_t4_suit_fire_natr01_hand_03.webp',
  slotType: 'gloves',
  levelRequirement: 70,
  defense: 42,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [65, 71, 78, 84],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'heat' },
        target: 'self',
        value: [19.166666667, 21.083333333, 23, 24.916666667],
      },
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'nature' },
        target: 'self',
        value: [19.166666667, 21.083333333, 23, 24.916666667],
      },
    ],
  },
  setSlug: 'hot-work',
};

export default sheet;
