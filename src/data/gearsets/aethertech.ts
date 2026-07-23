import type { GearSetSheet } from '../types';

const sheet: GearSetSheet = {
  effects: [
    {
      kind: 'status',
      stat: { modifier: 'atkPercent' },
      target: 'self',
      value: 8,
    },
  ],
  triggers: [
    {
      trigger: { kind: 'onStatusApplied', status: 'vulnerability', target: 'enemy' },
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', elements: 'physical' },
          target: 'self',
          value: 8,
          maxStacks: 4,
          duration: 15,
          icon: '/equipment/poise01/item_equip_t4_suit_poise01_edc_02.webp',
        },
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', elements: 'physical' },
          target: 'self',
          value: 16,
          duration: 10,
          condition: {
            kind: 'enemyStatus',
            status: 'vulnerability',
            stacks: { compare: 'exact', count: 4 },
          },
          icon: '/equipment/poise01/item_equip_t4_suit_poise01_edc_02.webp',
        },
      ],
    },
  ],
};

export default sheet;
