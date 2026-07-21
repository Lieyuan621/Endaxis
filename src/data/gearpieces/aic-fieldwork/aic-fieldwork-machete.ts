import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Machete',
  icon: '/equipment/item_equip_t4_parts_wuling00_edc_01.webp',
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
        stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
        target: 'self',
        value: [18.6, 20.5, 22.4, 24.2],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
