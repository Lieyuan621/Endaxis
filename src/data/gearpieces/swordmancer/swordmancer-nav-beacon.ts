import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Swordmancer NAV Beacon',
  icon: '/equipment/phy01/item_equip_t4_suit_phy01_edc_01.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [41, 45, 49, 53],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [41.4, 45.54, 49.68, 53.82],
      },
    ],
  },
  setSlug: 'swordmancer',
};

export default sheet;
