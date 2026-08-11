import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Hot Work Exo-Rig',
  icon: '/equipment/fire_natr01/item_equip_t4_suit_fire_natr01_body_02.webp',
  slotType: 'armor',
  levelRequirement: 70,
  defense: 56,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [87, 95, 104, 113],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [58, 63, 69, 75],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'heat' },
        target: 'self',
        value: [11.5, 12.65, 13.8, 14.95],
      },
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'nature' },
        target: 'self',
        value: [11.5, 12.65, 13.8, 14.95],
      },
    ],
  },
  setSlug: 'hot-work',
};

export default sheet;
