import type { GearSetSheet } from '../types';

const sheet: GearSetSheet = {
  effects: [
    {
      kind: 'status',
      stat: { modifier: 'artsIntensity' },
      target: 'self',
      value: 30,
    },
  ],
  triggers: [
    {
      trigger: { kind: 'onStatusApplied', status: 'combustion', target: 'enemy' },
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', elements: 'heat' },
          target: 'self',
          value: 50,
          duration: 10,
          icon: '/equipment/fire_natr01/item_equip_t4_suit_fire_natr01_edc_02.webp',
        },
      ],
    },
    {
      trigger: { kind: 'onStatusApplied', status: 'corrosion', target: 'enemy' },
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', elements: 'nature' },
          target: 'self',
          value: 50,
          duration: 10,
          icon: '/equipment/fire_natr01/item_equip_t4_suit_fire_natr01_edc_02.webp',
        },
      ],
    },
  ],
};

export default sheet;
