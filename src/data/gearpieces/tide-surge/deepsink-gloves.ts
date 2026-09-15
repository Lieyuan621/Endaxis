import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Deepsink Gloves',
  icon: '/equipment/burst01/item_equip_t4_suit_burst01_hand_02.webp',
  slotType: 'gloves',
  levelRequirement: 70,
  defense: 42,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [65, 71, 78, 84],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: ['battleSkill', 'comboSkill', 'ultimate'] },
        target: 'self',
        value: [23, 25.3, 27.6, 29.9],
      },
    ],
  },
  setSlug: 'tide-surge',
};

export default sheet;
