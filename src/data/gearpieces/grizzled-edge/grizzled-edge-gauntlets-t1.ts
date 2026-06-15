import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Grizzled Edge Gauntlets T1',
  icon: '/equipment/crush_fracture/item_equip_t4_suit_crush_fracture_hand_02.webp',
  slotType: 'gloves',
  levelRequirement: 70,
  defense: 42,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: [65, 71, 78, 84],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [34, 37, 41, 44],
      },
    ],
  },
  setSlug: 'grizzled-edge',
};

export default sheet;
