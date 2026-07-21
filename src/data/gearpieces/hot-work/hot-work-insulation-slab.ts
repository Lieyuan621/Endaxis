import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Hot Work Insulation Slab',
  icon: '/equipment/fire_natr01/item_equip_t4_suit_fire_natr01_edc_04.webp',
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
        stat: { modifier: 'dmgBonus' },
        target: 'self',
        value: [27.6, 30.4, 33.1, 35.9],
      },
    ],
  },
  setSlug: 'hot-work',
};

export default sheet;
