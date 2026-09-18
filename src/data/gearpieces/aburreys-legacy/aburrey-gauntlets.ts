import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Aburrey Gauntlets',
  icon: '/equipment/atk01/item_equip_t3_suit_atk01_hand_01.webp',
  slotType: 'gloves',
  levelRequirement: 50,
  defense: 30,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 46,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 30,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: {
          modifier: 'dmgBonus',
          elements: ['physical', 'heat', 'cryo', 'electric', 'nature'],
        },
        target: 'self',
        value: 24.5,
        condition: { kind: 'enemyStaggered' },
      },
    ],
  },
  setSlug: 'aburreys-legacy',
};

export default sheet;
