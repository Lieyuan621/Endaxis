import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Rift Trekker Gloves',
  icon: '/equipment/wuling02/item_equip_t4_parts_wuling02_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 70,
  defense: 42,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [86, 94, 103, 111],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [21.428571429, 23.571428571, 25.714285714, 27.857142857],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
