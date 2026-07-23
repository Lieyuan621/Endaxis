import type { GearSetSheet } from '../types';

const sheet: GearSetSheet = {
  effects: [
    {
      kind: 'status',
      stat: { modifier: 'flatHp' },
      target: 'self',
      value: 1000,
    },
  ],
  triggers: [
    {
      trigger: {
        kind: 'onStatusApplied',
        status: [{ modifier: 'ampBonus' }, { modifier: 'protection' }],
        target: 'self',
      },
      effects: [
        {
          id: 'eternal-xiranite-set',
          kind: 'status',
          // Element-scoped so reactions/burst get it (unscoped = 所有技能伤害加成 only).
          stat: {
            modifier: 'dmgBonus',
            elements: ['physical', 'heat', 'cryo', 'electric', 'nature'],
          },
          target: 'teamExcludeSelf',
          value: 16,
          duration: 15,
          icon: '/equipment/usp02/item_equip_t4_suit_usp02_edc_01.webp',
        },
      ],
    },
    {
      trigger: {
        kind: 'onStatusApplied',
        status: [{ modifier: 'susceptibility' }, { modifier: 'weaken' }],
        target: 'enemy',
      },
      effects: [
        {
          id: 'eternal-xiranite-set',
          kind: 'status',
          stat: {
            modifier: 'dmgBonus',
            elements: ['physical', 'heat', 'cryo', 'electric', 'nature'],
          },
          target: 'teamExcludeSelf',
          value: 16,
          duration: 15,
          icon: '/equipment/item_equip_t4_suit_usp02_edc_01.webp',
        },
      ],
    },
  ],
};

export default sheet;
