import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Basic Armor',
  icon: '/equipment/tundra01/item_equip_t0_parts_tundra01_body_01.webp',
  slotType: 'armor',
  levelRequirement: 10,
  defense: 8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 15,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 10,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'flatHp' },
        target: 'self',
        value: 46.327372186,
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
