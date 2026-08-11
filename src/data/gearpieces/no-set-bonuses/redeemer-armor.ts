import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Redeemer Armor',
  icon: '/equipment/wuling01/item_equip_t4_parts_wuling01_body_02.webp',
  slotType: 'armor',
  levelRequirement: 70,
  defense: 56,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [115, 126, 138, 149],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [12.857142857, 14.142857143, 15.428571429, 16.714285714],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
