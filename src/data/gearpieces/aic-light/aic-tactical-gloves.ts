import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Tactical Gloves',
  icon: '/equipment/wisdwill01/item_equip_t1_suit_wisdwill01_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 28,
  defense: 16.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 23,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 23,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'comboSkill' },
        target: 'self',
        value: 13.5,
      },
    ],
  },
  setSlug: 'aic-light',
};

export default sheet;
