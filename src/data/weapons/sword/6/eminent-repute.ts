import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'sword',
  icon: '/weapons/sword/wpn_sword_0013.webp',
  baseAtk: [50, 144, 243, 342, 441, 490],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [17, 30, 44, 57, 71, 85, 98, 112, 132],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'physical' },
        target: 'self',
        value: [
          5.5555556, 10, 14.444445, 18.888889, 23.333333, 27.77778, 32.222223, 36.666667, 43.333334,
        ],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'atkPercent' },
        target: 'self',
        value: [10, 12, 14, 16, 18, 20, 22, 24, 28],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusConsumed',
          status: 'vulnerability',
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'self',
            value: [5, 6, 7, 8, 9, 10, 11, 12, 14],
            scaling: {
              additive: [
                {
                  key: 'vulnerability',
                  target: 'enemy',
                  coefficient: [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7],
                },
              ],
            },
            duration: 20,
          },
          {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'teamExcludeSelf',
            value: [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7],
            scaling: {
              additive: [
                {
                  key: 'vulnerability',
                  target: 'enemy',
                  coefficient: [1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.5],
                },
              ],
            },
            duration: 20,
          },
        ],
      },
    ],
  },
};

export default sheet;
