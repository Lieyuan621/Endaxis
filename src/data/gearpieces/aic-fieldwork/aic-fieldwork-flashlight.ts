import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Flashlight',
  icon: '/equipment/wuling00/item_equip_t4_parts_wuling00_edc_03.webp',
  slotType: 'kit',
  levelRequirement: 60,
  defense: 18,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'sub' },
        target: 'self',
        value: [27, 29, 32, 35],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [18, 19, 21, 23],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributePercent', attribute: 'sub' },
        target: 'self',
        value: [17.7, 19.5, 21.2, 23],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
