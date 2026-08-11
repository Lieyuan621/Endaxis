import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Miner Gloves T1',
  icon: '/equipment/tundra01/item_equip_t2_parts_tundra01_hand_02.webp',
  slotType: 'gloves',
  levelRequirement: 36,
  defense: 21.6,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 36,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 24,
      },
    ],
  },
  skill3: {
    effects: [{ kind: 'status', stat: { modifier: 'hpPercent' }, target: 'self', value: 19 }],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
