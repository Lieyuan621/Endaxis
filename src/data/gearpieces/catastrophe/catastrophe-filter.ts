import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Catastrophe Filter',
  icon: '/equipment/usp01/item_equip_t3_suit_usp01_edc_03.webp',
  slotType: 'kit',
  levelRequirement: 50,
  defense: 15,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
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
    effects: [{ kind: 'status', stat: { modifier: 'artsIntensity' }, target: 'self', value: 29.4 }],
  },
  setSlug: 'catastrophe',
};

export default sheet;
