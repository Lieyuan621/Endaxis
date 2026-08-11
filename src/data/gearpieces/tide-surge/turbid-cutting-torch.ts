import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Turbid Cutting Torch',
  icon: '/equipment/burst01/item_equip_t4_suit_burst01_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [32, 35, 38, 41],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [21, 23, 25, 27],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'basicAttack' },
        target: 'self',
        value: [27.6, 30.36, 33.12, 35.88],
      },
    ],
  },
  setSlug: 'tide-surge',
};

export default sheet;
