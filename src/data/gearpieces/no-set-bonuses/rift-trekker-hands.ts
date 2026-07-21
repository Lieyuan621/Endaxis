import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Rift Trekker Hands',
  icon: '/equipment/item_equip_t4_parts_wuling02_hand_02.webp',
  slotType: 'gloves',
  levelRequirement: 70,
  defense: 42,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [86, 94, 103, 111],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'battleSkill' },
        target: 'self',
        value: [36, 39.6, 43.2, 46.8],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
