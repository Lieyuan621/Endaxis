import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Catastrophe Gauze Cartridge',
  icon: '/equipment/usp01/item_equip_t3_suit_usp01_edc_01.webp',
  slotType: 'kit',
  levelRequirement: 50,
  defense: 15,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 23,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 15,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'ultimate' },
        target: 'self',
        value: 36.75,
      },
    ],
  },
  setSlug: 'catastrophe',
};

export default sheet;
