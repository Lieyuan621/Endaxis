import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Miner Fists',
  icon: '/equipment/tundra01/item_equip_t1_parts_tundra01_hand_04.webp',
  slotType: 'gloves',
  levelRequirement: 28,
  defense: 16.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 28,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 18,
      },
    ],
  },
  skill3: {
    effects: [{ kind: 'status', stat: { modifier: 'hpPercent' }, target: 'self', value: 15 }],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
