import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Æthertech Gloves',
  icon: '/equipment/poise01/item_equip_t4_suit_poise01_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 70,
  defense: 42,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: [65, 71, 78, 84],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [34.5, 37.95, 41.4, 44.85],
      },
    ],
  },
  setSlug: 'aethertech',
};

export default sheet;
