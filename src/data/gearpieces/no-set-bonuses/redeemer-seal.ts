import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Redeemer Seal',
  icon: '/equipment/wuling01/item_equip_t4_parts_wuling01_edc_03.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [25.714285714, 28.285714286, 30.857142857, 33.428571429],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
