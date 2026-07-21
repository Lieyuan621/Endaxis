import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Plate',
  icon: '/equipment/item_equip_t4_parts_wuling00_body_02.webp',
  slotType: 'armor',
  levelRequirement: 60,
  defense: 48,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [74, 81, 88, 96],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'sub' },
        target: 'self',
        value: [49, 53, 58, 63],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [10.5, 11.6, 12.6, 13.7],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
