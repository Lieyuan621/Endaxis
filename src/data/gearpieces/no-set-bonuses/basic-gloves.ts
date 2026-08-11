import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Basic Gloves',
  icon: '/equipment/tundra01/item_equip_t0_parts_tundra01_hand_02.webp',
  slotType: 'gloves',
  levelRequirement: 10,
  defense: 6,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 11,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 7,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'flatHp' },
        target: 'self',
        value: 77.212286977,
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
