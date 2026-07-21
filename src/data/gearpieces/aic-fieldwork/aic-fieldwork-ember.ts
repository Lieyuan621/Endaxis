import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Ember',
  icon: '/equipment/item_equip_t4_parts_wuling00_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 60,
  defense: 18,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [27, 29, 32, 35],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'sub' },
        target: 'self',
        value: [18, 19, 21, 23],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [21.1, 23.2, 25.3, 27.4],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
