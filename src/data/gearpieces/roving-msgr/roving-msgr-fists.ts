import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Roving MSGR Fists',
  icon: '/equipment/agi01/item_equip_t2_suit_agi01_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 36,
  defense: 21.6,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 33,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 22,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'physical' },
        target: 'self',
        value: 9.722222222,
      },
    ],
  },
  setSlug: 'roving-msgr',
};

export default sheet;
