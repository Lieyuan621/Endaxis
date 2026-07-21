import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Rift Trekker Gloves',
  icon: '/equipment/item_equip_t4_parts_wuling02_hand_01.webp',
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
        value: [21.4, 23.6, 25.7, 27.9],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
