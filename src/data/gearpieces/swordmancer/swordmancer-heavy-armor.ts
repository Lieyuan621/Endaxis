import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Swordmancer Heavy Armor',
  icon: '/equipment/phy01/item_equip_t4_suit_phy01_body_02.webp',
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
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [20.7, 22.77, 24.84, 26.91],
      },
    ],
  },
  setSlug: 'swordmancer',
};

export default sheet;
