import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Armored MSGR Gloves',
  icon: '/equipment/str01/item_equip_t2_suit_str01_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 36,
  defense: 21.6,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 33,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 22,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'protection' },
        target: 'self',
        value: 8.045977011,
      },
    ],
  },
  setSlug: 'armored-msgr',
};

export default sheet;
