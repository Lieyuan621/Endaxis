import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Type 50 Yinglung Heavy Armor',
  icon: '/equipment/atk02/item_equip_t4_suit_atk02_body_01.webp',
  slotType: 'armor',
  levelRequirement: 70,
  defense: 56,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
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
        stat: { modifier: 'dmgBonus', elements: 'physical' },
        target: 'self',
        value: [11.5, 12.65, 13.8, 14.95],
      },
    ],
  },
  setSlug: 'type-50-yinglung',
};

export default sheet;
