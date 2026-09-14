import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Turbid Cutting Torch T1',
  icon: '/equipment/burst01/item_equip_t4_suit_burst01_edc_03.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [32, 35, 38, 41],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [21, 23, 25, 27],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: ['heat', 'nature'] },
        target: 'self',
        value: [23, 25.3, 27.6, 29.9],
      },
    ],
  },
  setSlug: 'tide-surge',
};

export default sheet;
