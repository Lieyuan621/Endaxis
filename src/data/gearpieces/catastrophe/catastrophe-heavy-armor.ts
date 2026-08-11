import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Catastrophe Heavy Armor',
  icon: '/equipment/usp01/item_equip_t3_suit_usp01_body_01.webp',
  slotType: 'armor',
  levelRequirement: 50,
  defense: 40,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 61,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 41,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'ultimate' },
        target: 'self',
        value: 18.375,
      },
    ],
  },
  setSlug: 'catastrophe',
};

export default sheet;
