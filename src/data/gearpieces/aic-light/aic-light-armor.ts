import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Light Armor',
  icon: '/equipment/wisdwill01/item_equip_t1_suit_wisdwill01_body_01.webp',
  slotType: 'armor',
  levelRequirement: 28,
  defense: 22.4,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 30,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 30,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'battleSkill' },
        target: 'self',
        value: 8.1,
      },
    ],
  },
  setSlug: 'aic-light',
};

export default sheet;
