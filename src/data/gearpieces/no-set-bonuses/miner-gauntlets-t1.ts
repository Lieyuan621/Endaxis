import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Miner Gauntlets T1',
  icon: '/equipment/tundra01/item_equip_t2_parts_tundra01_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 36,
  defense: 21.6,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 36,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 24,
      },
    ],
  },
  skill3: {
    effects: [{ kind: 'status', stat: { modifier: 'atkPercent' }, target: 'self', value: 9.5 }],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
