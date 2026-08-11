import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Gloves',
  icon: '/equipment/wuling00/item_equip_t4_parts_wuling00_hand_01.webp',
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
        stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
        target: 'self',
        value: [15.526315789, 17.078947368, 18.631578947, 20.184210526],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
