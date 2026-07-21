import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Rift Trekker Light Armor',
  icon: '/equipment/wuling02/item_equip_t4_parts_wuling02_body_02.webp',
  slotType: 'armor',
  levelRequirement: 70,
  defense: 56,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [115, 126, 138, 149],
      },
    ],
  },
  skill2: {},
  setSlug: 'no-set-bonuses',
};

export default sheet;
