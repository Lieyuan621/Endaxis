import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Plate',
  icon: '/equipment/wuling00/item_equip_t4_parts_wuling00_body_02.webp',
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
        value: [10.535714286, 11.589285714, 12.642857143, 13.696428571],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
