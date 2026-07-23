import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Catastrophe Gloves',
  icon: '/equipment/usp01/item_equip_t3_suit_usp01_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 50,
  defense: 30,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 46,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 30,
      },
    ],
  },
  skill3: {
    effects: [{ kind: 'status', stat: { modifier: 'artsIntensity' }, target: 'self', value: 24.5 }],
  },
  setSlug: 'catastrophe',
};

export default sheet;
