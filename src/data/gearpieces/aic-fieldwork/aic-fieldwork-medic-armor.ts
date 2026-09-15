import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Medic Armor',
  icon: '/equipment/wuling00/item_equip_t4_parts_wuling00_body_05.webp',
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
        stat: { modifier: 'heal' },
        target: 'self',
        value: [8.85, 9.735, 10.62, 11.505],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
