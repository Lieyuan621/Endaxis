import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Redeemer Tag',
  icon: '/equipment/wuling01/item_equip_t4_parts_wuling01_edc_01.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'protection' },
        target: 'self',
        value: [17.763157895, 19.19844861, 20.584498094, 21.923797626],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
