import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Redeemer Seal T1',
  icon: '/equipment/wuling01/item_equip_t4_parts_wuling01_edc_04.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'critRate' },
        target: 'self',
        value: [10.8, 11.88, 12.96, 14.04],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
