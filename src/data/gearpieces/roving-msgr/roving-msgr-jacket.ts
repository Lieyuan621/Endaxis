import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Roving MSGR Jacket',
  icon: '/equipment/agi01/item_equip_t2_suit_agi01_body_01.webp',
  slotType: 'armor',
  levelRequirement: 36,
  defense: 28.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 44,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 29,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'atkFlat' },
        target: 'self',
        value: 16.187704478,
      },
    ],
  },
  setSlug: 'roving-msgr',
};

export default sheet;
