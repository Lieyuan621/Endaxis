import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 5,
  type: 'polearm',
  icon: '/weapons/polearm/wpn_polearm_0004.webp',
  baseAtk: [42, 120, 203, 286, 369, 411],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [16, 28, 41, 54, 67, 80, 92, 105, 124],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [
          4.761905, 8.571429, 12.3809524, 16.190477, 20, 23.809524, 27.61905, 31.428573, 37.142858,
        ],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'critRate' },
        target: 'self',
        value: [3, 3.6, 4.2, 4.8, 5.4, 6, 6.6, 7.2, 8.4],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: 'vulnerability',
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'self',
            value: [15, 18, 21, 24, 27, 30, 33, 36, 42],
            duration: 15,
            condition: {
              kind: 'enemyStatus',
              status: 'vulnerability',
              stacks: { compare: 'exact', count: 1 },
            },
          },
        ],
      },
    ],
  },
};

export default sheet;
