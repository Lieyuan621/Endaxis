import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Rift Trekker Armor Slab',
  icon: '/equipment/wuling02/item_equip_t4_parts_wuling02_edc_01.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributePercent', attribute: 'sub' },
        target: 'self',
        value: [21.601861045, 23.762047149, 25.922233254, 28.082419358],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
