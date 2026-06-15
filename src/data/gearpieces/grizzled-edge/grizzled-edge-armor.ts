import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Grizzled Edge Armor',
  icon: '/equipment/crush_fracture/item_equip_t4_suit_crush_fracture_body_01.webp',
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
        value: [11.5, 12.7, 13.8, 14.9],
      },
    ],
  },
  setSlug: 'grizzled-edge',
};

export default sheet;
