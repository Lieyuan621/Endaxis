import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Miner Vest',
  icon: '/equipment/tundra01/item_equip_t1_parts_tundra01_body_05.webp',
  slotType: 'armor',
  levelRequirement: 28,
  defense: 22.4,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
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
    effects: [{ kind: 'status', stat: { modifier: 'hpPercent' }, target: 'self', value: 9 }],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
