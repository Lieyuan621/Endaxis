import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Pulser Labs Gloves',
  icon: '/equipment/pulse_cryst01/item_equip_t4_suit_pulse_cryst01_hand_01.webp',
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
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'cryo' },
        target: 'self',
        value: [19.166666667, 21.083333333, 23, 24.916666667],
      },
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'electric' },
        target: 'self',
        value: [19.166666667, 21.083333333, 23, 24.916666667],
      },
    ],
  },
  setSlug: 'pulser-labs',
};

export default sheet;
