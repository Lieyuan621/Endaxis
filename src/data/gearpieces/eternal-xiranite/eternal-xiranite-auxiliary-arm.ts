import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Eternal Xiranite Auxiliary Arm',
  icon: '/equipment/usp02/item_equip_t4_suit_usp02_edc_03.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [32, 35, 38, 41],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [21, 23, 25, 27],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [24.642857143, 27.107142857, 29.571428571, 32.035714286],
      },
    ],
  },
  setSlug: 'eternal-xiranite',
};

export default sheet;
