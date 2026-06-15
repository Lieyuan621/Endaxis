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
      trigger: { kind: 'onStatusConsumed', status: 'vulnerability', target: 'enemy' },
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', elements: 'physical' },
          target: 'self',
          value: 6,
          stacks: 'fromConsume',
          maxStacks: 4,
          stackStrategy: 'REPLACE',
          duration: 20,
          icon: '/equipment/item_equip_t4_suit_crush_fracture_edc_01.webp',
        },
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', elements: 'physical' },
          target: 'self',
          value: 3,
          stacks: 'fromConsume',
          maxStacks: 4,
          stackStrategy: 'REPLACE',
          duration: 20,
          condition: {
            kind: 'or',
            conditions: [
              { kind: 'enemyStatus', status: { modifier: 'susceptibility', elements: 'physical' } },
              { kind: 'enemyStaggered' },
              { kind: 'enemyStatus', status: 'endministrator-originium-crystals' },
            ],
          },
          hide: true,
        },
      ],
    },
  ],
};

export default sheet;
