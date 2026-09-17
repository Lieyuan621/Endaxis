import type { GearSetSheet } from '../types';

const sheet: GearSetSheet = {
  effects: [
    {
      kind: 'status',
      stat: { modifier: 'ultimateGainEfficiency' },
      target: 'self',
      value: 20,
    },
  ],
  triggers: [
    {
      trigger: { kind: 'onActionStart', skillTypes: 'battleSkill' },
      effects: [
        {
          kind: 'spReturn',
          value: 50,
          icd: 999,
        },
      ],
    },
  ],
};

export default sheet;
