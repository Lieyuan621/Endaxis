import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Mordvolt Insulation Gloves T1',
  icon: '/equipment/wisd01/item_equip_t3_suit_wisd01_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 50,
  defense: 30,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 46,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 30,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'atkPercent' },
        target: 'self',
        value: 12.25,
      },
    ],
  },
  setSlug: 'mordvolt-insulation',
};

export default sheet;
