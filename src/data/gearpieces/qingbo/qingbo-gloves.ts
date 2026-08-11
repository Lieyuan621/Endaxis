import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Qingbo Gloves',
  icon: '/equipment/combo_cd01/item_equip_t4_suit_combo_cd01_hand_02.webp',
  slotType: 'gloves',
  levelRequirement: 70,
  defense: 42,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [65, 71, 78, 84],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [20.535714286, 22.589285714, 24.642857143, 26.696428571],
      },
    ],
  },
  setSlug: 'qingbo',
};

export default sheet;
