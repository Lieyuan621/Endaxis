import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Assault Gloves',
  icon: '/equipment/wuling00/item_equip_t4_parts_wuling00_hand_04.webp',
  slotType: 'gloves',
  levelRequirement: 60,
  defense: 36,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [55, 60, 66, 71],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'sub' },
        target: 'self',
        value: [37, 40, 44, 48],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [29.5, 32.45, 35.4, 38.35],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
