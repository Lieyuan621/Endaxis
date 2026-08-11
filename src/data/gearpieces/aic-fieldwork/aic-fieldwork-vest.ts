import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Vest',
  icon: '/equipment/wuling00/item_equip_t4_parts_wuling00_body_03.webp',
  slotType: 'armor',
  levelRequirement: 60,
  defense: 48,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'sub' },
        target: 'self',
        value: [74, 81, 88, 96],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [49, 53, 58, 63],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributePercent', attribute: 'sub' },
        target: 'self',
        value: [8.850762511, 9.735838762, 10.620915014, 11.505991265],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
