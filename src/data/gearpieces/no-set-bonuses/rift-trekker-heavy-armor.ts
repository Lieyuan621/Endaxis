import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Rift Trekker Heavy Armor',
  icon: '/equipment/wuling02/item_equip_t4_parts_wuling02_body_01.webp',
  slotType: 'armor',
  levelRequirement: 70,
  defense: 56,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [115, 126, 138, 149],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [21, 23, 25, 28],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
