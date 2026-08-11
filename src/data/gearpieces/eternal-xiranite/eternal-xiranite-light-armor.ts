import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Eternal Xiranite Light Armor',
  icon: '/equipment/usp02/item_equip_t4_suit_usp02_body_03.webp',
  slotType: 'armor',
  levelRequirement: 70,
  defense: 56,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [110, 121, 132, 143],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [12.321428571, 13.553571429, 14.785714286, 16.017857143],
      },
    ],
  },
  setSlug: 'eternal-xiranite',
};

export default sheet;
