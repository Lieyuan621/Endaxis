import type { GearSetSheet } from '../types';

const sheet: GearSetSheet = {
  effects: [
    {
      kind: 'status',
      stat: { modifier: 'atkPercent' },
      target: 'self',
      value: 15,
    },
  ],
  triggers: [
    {
      trigger: { kind: 'onActionStart', skillTypes: 'battleSkill', triggerScope: 'global' },
      effects: [
        {
          name: 'yinglungsEdge',
          kind: 'oneTime',
          stat: { modifier: 'dmgBonus', skillTypes: 'comboSkill' },
          skillTypes: 'comboSkill',
          target: 'owner',
          value: 20,
          maxStacks: 3,
          icon: '/equipment/atk02/item_equip_t4_suit_atk02_edc_04.webp',
        },
      ],
    },
  ],
};

export default sheet;
