import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Aburrey Auditory Chip',
  icon: '/equipment/atk01/item_equip_t3_suit_atk01_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 50,
  defense: 15,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 23,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 15,
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
        value: 29.4,
        condition: { kind: 'enemyStaggered' },
      },
    ],
  },
  setSlug: 'aburreys-legacy',
};

export default sheet;
