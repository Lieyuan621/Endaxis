import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Type 50 Yinglung Heavy Armor T1',
  icon: '/equipment/atk02/item_equip_t4_suit_atk02_body_02.webp',
  slotType: 'armor',
  levelRequirement: 70,
  defense: 56,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: [87, 95, 104, 113],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [58, 63, 69, 75],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [12.321428571, 13.553571429, 14.785714286, 16.017857143],
      },
    ],
  },
  setSlug: 'type-50-yinglung',
};

export default sheet;
