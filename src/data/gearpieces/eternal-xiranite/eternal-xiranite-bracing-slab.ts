import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Eternal Xiranite Bracing Slab',
  icon: '/equipment/item_equip_t4_suit_usp02_edc_04.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [41, 45, 49, 53],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributePercent', attribute: 'sub' },
        target: 'self',
        value: [20.7, 22.8, 24.8, 26.9],
      },
    ],
  },
  setSlug: 'eternal-xiranite',
};

export default sheet;
