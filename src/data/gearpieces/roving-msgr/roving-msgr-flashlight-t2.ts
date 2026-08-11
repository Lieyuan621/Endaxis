import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Roving MSGR Flashlight T2',
  icon: '/equipment/agi01/item_equip_t3_suit_agi01_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 50,
  defense: 15,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 23,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
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
  setSlug: 'roving-msgr',
};

export default sheet;
