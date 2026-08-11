import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Frontiers Armor T3',
  icon: '/equipment/atb01/item_equip_t4_suit_atb01_body_04.webp',
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
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [58, 63, 69, 75],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributePercent', attribute: 'sub' },
        target: 'self',
        value: [10.350891751, 11.385980926, 12.421070101, 13.456159276],
      },
    ],
  },
  setSlug: 'frontiers',
};

export default sheet;
