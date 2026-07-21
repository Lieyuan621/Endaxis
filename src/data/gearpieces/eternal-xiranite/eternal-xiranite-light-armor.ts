import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Eternal Xiranite Light Armor',
  icon: '/equipment/item_equip_t4_suit_usp02_body_03.webp',
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
        value: [12.3, 13.6, 14.8, 16],
      },
    ],
  },
  setSlug: 'eternal-xiranite',
};

export default sheet;
