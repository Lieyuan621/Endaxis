import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'LYNX Gauntlets T1',
  icon: '/equipment/item_equip_t4_suit_heal01_hand_03.webp',
  slotType: 'gloves',
  levelRequirement: 70,
  defense: 42,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [65, 71, 78, 84],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
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
        value: [20.5, 22.6, 24.6, 26.7],
      },
    ],
  },
  setSlug: 'lynx',
};

export default sheet;
