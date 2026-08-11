import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Mordvolt Insulation Battery',
  icon: '/equipment/wisd01/item_equip_t2_suit_wisd01_edc_03.webp',
  slotType: 'kit',
  levelRequirement: 36,
  defense: 10.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 21,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'critRate' },
        target: 'self',
        value: 5.25,
      },
    ],
  },
  setSlug: 'mordvolt-insulation',
};

export default sheet;
