import type { GearSetSheet } from '../types';

const sheet: GearSetSheet = {
  effects: [
    {
      kind: 'status',
      stat: { modifier: 'dmgBonus', skillTypes: ['battleSkill', 'comboSkill', 'ultimate'] },
      target: 'self',
      value: 24,
    },
  ],
  triggers: [
    {
      trigger: { kind: 'onActionStart', skillTypes: 'battleSkill' },
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'atkPercent' },
          target: 'self',
          value: 5,
          duration: 15,
          icon: '/equipment/atk01/item_equip_t3_suit_atk01_edc_04.webp',
        },
      ],
    },
    {
      trigger: { kind: 'onActionStart', skillTypes: 'comboSkill' },
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'atkPercent' },
          target: 'self',
          value: 5,
          duration: 15,
          icon: '/equipment/atk01/item_equip_t3_suit_atk01_edc_04.webp',
        },
      ],
    },
    {
      trigger: { kind: 'onActionStart', skillTypes: 'ultimate' },
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'atkPercent' },
          target: 'self',
          value: 5,
          duration: 15,
          icon: '/equipment/atk01/item_equip_t3_suit_atk01_edc_04.webp',
        },
      ],
    },
  ],
};

export default sheet;
