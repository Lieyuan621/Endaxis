import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Prototype Heavy Armor',
  icon: '/equipment/tundra01/item_equip_t1_parts_tundra01_body_03.webp',
  slotType: 'armor',
  levelRequirement: 28,
  defense: 22.4,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 37,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 25,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'atkFlat' },
        target: 'self',
        value: 11.716709215,
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
