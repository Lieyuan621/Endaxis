import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'polearm',
  icon: '/weapons/polearm/wpn_polearm_0014.webp',
  baseAtk: [51, 146, 247, 348, 449, 500],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [20, 36, 52, 68, 84, 100, 116, 132, 156],
      },
    ],
  },
  skill2: {},
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributePercent', attribute: 'main' },
        target: 'self',
        value: [16, 19.2, 22.4, 25.6, 28.8, 32, 35.2, 38.4, 44.8],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: { modifier: 'heal' },
          target: 'self',
        },
        effects: [
          {
            id: 'bedazzling-night-debut-atk',
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'statusRecipientsExcludeSelf',
            value: [3.5, 4.2, 4.9, 5.6, 6.3, 7, 7.7, 8.4, 9.8],
            maxStacks: 4,
            stackStrategy: 'INDEPENDENT',
            duration: 20,
            icd: 0.1,
          },
        ],
      },
    ],
  },
};

export default sheet;
