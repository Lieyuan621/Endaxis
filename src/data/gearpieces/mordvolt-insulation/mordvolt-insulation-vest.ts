import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Mordvolt Insulation Vest',
  icon: '/equipment/wisd01/item_equip_t2_suit_wisd01_body_01.webp',
  slotType: 'armor',
  levelRequirement: 36,
  defense: 28.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 44,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
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
  setSlug: 'mordvolt-insulation',
};

export default sheet;
