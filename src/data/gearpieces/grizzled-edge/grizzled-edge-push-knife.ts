import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Grizzled Edge Push Knife',
  icon: '/equipment/crush_fracture/item_equip_t4_suit_crush_fracture_edc_01.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [32, 35, 38, 41],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [21, 23, 25, 27],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'physical' },
        target: 'self',
        value: [23, 25.3, 27.6, 29.9],
      },
    ],
  },
  setSlug: 'grizzled-edge',
};

export default sheet;
