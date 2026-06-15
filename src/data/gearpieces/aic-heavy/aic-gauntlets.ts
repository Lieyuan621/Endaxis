import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Gauntlets',
  icon: '/equipment/stragi01/item_equip_t1_suit_stragi01_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 28,
  defense: 16,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 23,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 23,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'protection' },
        target: 'self',
        value: 6.3,
      },
    ],
  },
  setSlug: 'aic-heavy',
};

export default sheet;
