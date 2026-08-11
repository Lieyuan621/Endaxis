import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Catastrophe Gauze Cartridge T1',
  icon: '/equipment/usp01/item_equip_t3_suit_usp01_edc_02.webp',
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
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 15,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributePercent', attribute: 'sub' },
        target: 'self',
        value: 14.701266544,
      },
    ],
  },
  setSlug: 'catastrophe',
};

export default sheet;
