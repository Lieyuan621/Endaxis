import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 5,
  type: 'greatsword',
  icon: '/weapons/greatsword/wpn_greatsword_0011.webp',
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
        stat: { modifier: 'attributePercent', attribute: 'main' },
        target: 'self',
        value: [5, 6, 7, 8, 9, 10, 11, 12, 14],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: ['cryoBurst', 'electricBurst', 'natureBurst', 'heatBurst'],
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'self',
            value: [6, 7.2, 8.4, 9.6, 10.8, 12, 13.2, 14.4, 16.8],
            stackStrategy: 'INDEPENDENT',
            maxStacks: 3,
            duration: 30,
            icd: 0.1,
          },
        ],
      },
    ],
  },
};

export default sheet;
