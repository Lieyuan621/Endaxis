import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'greatsword',
  icon: '/weapons/greatsword/wpn_greatsword_0017.webp',
  baseAtk: [52, 149, 252, 355, 458, 510],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [20, 36, 52, 68, 84, 100, 116, 132, 156],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'atkPercent' },
        target: 'self',
        value: [5, 9, 13, 17, 21, 25, 29, 33, 39],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'physical' },
        target: 'self',
        value: [16, 19.2, 22.4, 25.6, 28.8, 32, 35.2, 38.4, 44.8],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: { modifier: 'susceptibility', elements: 'physical' },
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'artsIntensity' },
            target: 'self',
            value: [30, 36, 42, 48, 54, 60, 66, 72, 84],
            duration: 20,
          },
        ],
      },
      {
        trigger: { kind: 'onStatusConsumed', status: 'vulnerability', target: 'enemy' },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: 'physical' },
            target: 'self',
            value: [9, 10.8, 12.6, 14.4, 16.2, 18, 19.8, 21.6, 25.2],
            scaling: {
              additive: [
                {
                  key: 'vulnerability',
                  target: 'enemy',
                  coefficient: [3, 3.6, 4.2, 4.8, 5.4, 6, 6.6, 7.2, 8.4],
                },
              ],
            },
            duration: 30,
          },
        ],
      },
    ],
  },
};

export default sheet;
