import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Roving MSGR Flashlight',
  icon: '/equipment/agi01/item_equip_t2_suit_agi01_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 36,
  defense: 10.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 21,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'comboSkill' },
        target: 'self',
        value: 21,
      },
    ],
  },
  setSlug: 'roving-msgr',
};

export default sheet;
