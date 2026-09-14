import type { GearSetSheet } from '../types';

const sheet: GearSetSheet = {
  effects: [
    {
      kind: 'status',
      stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
      target: 'self',
      value: 16,
    },
  ],
  triggers: [
    {
      trigger: {
        kind: 'onStatusApplied',
        status: ['natureBurst', 'cryoBurst'],
        target: 'enemy',
      },
      effects: [
        {
          id: 'deep-rampart-arts-intensity',
          kind: 'status',
          stat: { modifier: 'artsIntensity' },
          target: 'self',
          value: 16,
          stacks: 1,
          maxStacks: 3,
          stackStrategy: 'INDEPENDENT',
          duration: 20,
          icd: 0.1,
          icon: '/equipment/spellburst/item_equip_t4_suit_spellburst_edc_01.webp',
        },
      ],
    },
  ],
};

export default sheet;
