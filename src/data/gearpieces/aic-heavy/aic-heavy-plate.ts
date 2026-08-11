import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Heavy Plate',
  icon: '/equipment/stragi01/item_equip_t1_suit_stragi01_edc_01.webp',
  slotType: 'kit',
  levelRequirement: 28,
  defense: 8.4,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 16,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'protection' },
        target: 'self',
        value: 7.49306198,
      },
    ],
  },
  setSlug: 'aic-heavy',
};

export default sheet;
